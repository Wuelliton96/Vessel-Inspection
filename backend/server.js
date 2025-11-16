if (process.env.NODE_ENV === 'production' && process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

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

// Rate Limiting - Prevencao contra brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisicoes por IP
  message: 'Muitas requisicoes deste IP, tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas de login
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

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
    
    // Permitir requisições sem origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Origem bloqueada pelo CORS:', origin);
      callback(null, true); // Temporariamente permitir todas para debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

sequelize.authenticate()
  .then(() => {
    console.log('Conexão com o banco de dados bem-sucedida!');
    logger.info('Database connected successfully');
  })
  .catch(err => {
    console.error('Não foi possível conectar ao banco de dados:', err);
    logger.error('Database connection failed', { error: err.message });
  });

app.get('/', (req, res) => {
  res.send('API do SGVN está funcionando!');
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

app.listen(PORT, () => {
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
});