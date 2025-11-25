if (process.env.NODE_ENV === 'production' && process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

// IMPORTANTE: Desabilitar console.log em produção ANTES de qualquer outra coisa
require('./utils/disableConsole');

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { sequelize } = require('./models');

const userRoutes = require('./routes/userRoutes');
const vistoriaRoutes = require('./routes/vistoriaRoutes');
const authRoutes = require('./routes/authRoutes');
const embarcacaoRoutes = require('./routes/embarcacaoRoutes');
const localRoutes = require('./routes/localRoutes');
const fotoRoutes = require('./routes/fotoRoutes');
const tipoFotoChecklistRoutes = require('./routes/tipoFotoChecklistRoutes');
const vistoriadorRoutes = require('./routes/vistoriadorRoutes');
const pagamentoRoutes = require('./routes/pagamentoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const seguradoraRoutes = require('./routes/seguradoraRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const checklistRoutes = require('./routes/checklistRoutes');
const laudoRoutes = require('./routes/laudoRoutes');
const cepRoutes = require('./routes/cepRoutes');
const auditoriaRoutes = require('./routes/auditoriaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Seguranca HTTP Headers
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitar apenas se necessario para desenvolvimento
  crossOriginEmbedderPolicy: false
}));

// Configuração CORS - DEVE VIR ANTES DO RATE LIMITING
// Permitir origens do Vercel e localhost
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    
    // Adicionar origens do Vercel se configuradas
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    if (process.env.VERCEL_URL) {
      allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
    }
    
    // Permitir requisições sem origin (mobile apps, curl, Postman, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar se a origem está na lista permitida
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Em produção, permitir todas as origens do Vercel (vercel.app, vercel.com)
      if (process.env.NODE_ENV === 'production') {
        // Permitir qualquer subdomínio do Vercel
        if (origin.includes('.vercel.app') || origin.includes('.vercel.com')) {
          return callback(null, true);
        }
        // Permitir domínios customizados configurados
        if (process.env.ALLOWED_ORIGINS) {
          const customOrigins = process.env.ALLOWED_ORIGINS.split(',');
          if (customOrigins.includes(origin)) {
            return callback(null, true);
          }
        }
      }
      
      // Em desenvolvimento, logar e permitir para debug
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('Origem não permitida pelo CORS:', origin);
        callback(null, true); // Permitir em desenvolvimento
      } else {
        // Em produção, bloquear origens não permitidas
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // Cache preflight por 24 horas
}));

// Handler explícito para OPTIONS (preflight) - garantir que sempre funcione
// DEVE VIR ANTES DO RATE LIMITING
// Usar middleware ao invés de rota específica para evitar conflito com path-to-regexp
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // Cache por 24 horas
    return res.sendStatus(200);
  }
  next();
});

// Rate Limiting - Prevencao contra brute force
// IMPORTANTE: Ignorar requisições OPTIONS (preflight CORS) para não bloquear
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisicoes por IP
  message: 'Muitas requisicoes deste IP, tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Ignorar requisições OPTIONS (preflight CORS)
    return req.method === 'OPTIONS';
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas de login
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true,
  skip: (req) => {
    // Ignorar requisições OPTIONS (preflight CORS)
    return req.method === 'OPTIONS';
  }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

// Configurar limites para JSON e URL encoded (importante para uploads)
app.use(express.json({ limit: '50mb' })); // Aumentar limite para uploads grandes
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Timeout para requisições longas (30 segundos)
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' });
    }
  });
  next();
});

app.use('/uploads', express.static('uploads'));

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

sequelize.authenticate()
  .then(() => {
    logger.info('Database connected successfully');
  })
  .catch(err => {
    logger.error('Database connection failed', { error: err.message });
  });

app.get('/', (req, res) => {
  res.send('API do SGVN está funcionando!!!');
});

app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/vistorias', vistoriaRoutes);
app.use('/api/embarcacoes', embarcacaoRoutes);
app.use('/api/locais', localRoutes);
app.use('/api/fotos', fotoRoutes);
app.use('/api/tipos-foto-checklist', tipoFotoChecklistRoutes);
app.use('/api/vistoriador', vistoriadorRoutes);
app.use('/api/pagamentos', pagamentoRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/seguradoras', seguradoraRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/laudos', laudoRoutes);
app.use('/api/cep', cepRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// Middleware de tratamento de erro centralizado (deve ser o último)
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Tratamento de erros não capturados para evitar crash do servidor
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { 
    error: error.message, 
    stack: error.stack 
  });
  // Não encerrar o processo imediatamente, permitir que o servidor continue
  // Em produção, considere usar um processo manager como PM2
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { 
    reason: reason?.message || reason,
    stack: reason?.stack 
  });
  // Não encerrar o processo, apenas logar o erro
});

app.listen(PORT, () => {
  // Em produção, não exibir informações de inicialização no console
  if (process.env.NODE_ENV !== 'production') {
    const localIP = getLocalIPAddress();
    console.log('='.repeat(60));
    console.log('BACKEND - Sistema de Gestao de Vistorias Nauticas');
    console.log('='.repeat(60));
    console.log(`Porta: ${PORT}`);
    console.log(`IP Local: ${localIP}`);
    console.log(`URL Local: http://localhost:${PORT}`);
    console.log(`URL Rede: http://${localIP}:${PORT}`);
    console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(60));
  }
  logger.info(`Server started on port ${PORT}`, { 
    environment: process.env.NODE_ENV || 'development',
    port: PORT 
  });
});