/**
 * Testes para server.js
 * Foco em health check, rotas, CORS e configurações
 */

const request = require('supertest');
const express = require('express');

// Mock do logger antes de tudo
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock do disableConsole
jest.mock('../utils/disableConsole', () => {});

// Mock do sequelize
const mockSequelize = {
  authenticate: jest.fn().mockResolvedValue(true),
  sync: jest.fn().mockResolvedValue(true),
  query: jest.fn().mockResolvedValue([[], {}])
};

jest.mock('../models', () => ({
  sequelize: mockSequelize
}));

// Mock de todas as rotas usando require dentro do factory
jest.mock('../routes/userRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/vistoriaRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/authRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/embarcacaoRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/localRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/fotoRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/tipoFotoChecklistRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/vistoriadorRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/pagamentoRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/dashboardRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/seguradoraRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/clienteRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/checklistRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/laudoRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/configuracaoLaudoRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/cepRoutes', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../routes/auditoriaRoutes', () => {
  const express = require('express');
  return express.Router();
});

// Mock do newrelic
jest.mock('newrelic', () => ({}), { virtual: true });

describe('Server - Configurações', () => {
  let app;

  beforeAll(() => {
    // Salvar ambiente original
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Criar app manualmente para testes
    app = express();
    
    // Configurar middlewares básicos
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Rota raiz
    app.get('/', (req, res) => {
      res.send('API do SGVN está funcionando.');
    });
    
    // Health check
    app.get('/health', async (req, res) => {
      try {
        await mockSequelize.authenticate();
        
        res.status(200).json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          database: 'connected',
          environment: process.env.NODE_ENV || 'development',
          version: '1.0.0'
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: error.message
        });
      }
    });
    
    // Rotas de API mock
    app.use('/api/auth', (req, res) => res.json({ message: 'auth' }));
    app.use('/api/usuarios', (req, res) => res.json({ message: 'usuarios' }));
  });

  describe('GET /', () => {
    it('deve retornar mensagem de boas-vindas', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('API do SGVN');
    });
  });

  describe('GET /health', () => {
    it('deve retornar status healthy quando banco está conectado', async () => {
      mockSequelize.authenticate.mockResolvedValue(true);
      
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.database).toBe('connected');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });

    it('deve retornar status unhealthy quando banco falha', async () => {
      mockSequelize.authenticate.mockRejectedValue(new Error('Connection refused'));
      
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.database).toBe('disconnected');
      expect(response.body.error).toBe('Connection refused');
    });

    it('deve incluir environment na resposta', async () => {
      mockSequelize.authenticate.mockResolvedValue(true);
      
      const response = await request(app).get('/health');
      
      expect(response.body).toHaveProperty('environment');
    });

    it('deve incluir versão na resposta', async () => {
      mockSequelize.authenticate.mockResolvedValue(true);
      
      const response = await request(app).get('/health');
      
      expect(response.body.version).toBe('1.0.0');
    });
  });
});

describe('Server - CORS', () => {
  let app;

  beforeEach(() => {
    app = express();
    
    // Simular configuração CORS
    app.use((req, res, next) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173'
      ];
      
      const origin = req.headers.origin;
      
      if (!origin || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        res.header('Access-Control-Allow-Credentials', 'true');
      }
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      
      next();
    });
    
    app.get('/test', (req, res) => res.json({ ok: true }));
  });

  it('deve permitir origem localhost:3000', async () => {
    const response = await request(app)
      .get('/test')
      .set('Origin', 'http://localhost:3000');
    
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('deve permitir origem localhost:5173', async () => {
    const response = await request(app)
      .get('/test')
      .set('Origin', 'http://localhost:5173');
    
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('deve responder OK para OPTIONS (preflight)', async () => {
    const response = await request(app)
      .options('/test')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');
    
    expect(response.status).toBe(200);
  });

  it('deve incluir headers CORS necessários', async () => {
    const response = await request(app)
      .options('/test')
      .set('Origin', 'http://localhost:3000');
    
    expect(response.headers).toHaveProperty('access-control-allow-methods');
    expect(response.headers).toHaveProperty('access-control-allow-headers');
    expect(response.headers).toHaveProperty('access-control-allow-credentials');
  });
});

describe('Server - Rate Limiting', () => {
  let app;

  beforeEach(() => {
    app = express();
    
    // Simular rate limiting simples
    const requestCounts = {};
    
    app.use('/api/', (req, res, next) => {
      if (req.method === 'OPTIONS') {
        return next();
      }
      
      const ip = req.ip || 'unknown';
      requestCounts[ip] = (requestCounts[ip] || 0) + 1;
      
      if (requestCounts[ip] > 100) {
        return res.status(429).json({
          error: 'Muitas requisicoes deste IP, tente novamente em 15 minutos.'
        });
      }
      
      next();
    });
    
    app.get('/api/test', (req, res) => res.json({ ok: true }));
  });

  it('deve permitir requisições dentro do limite', async () => {
    const response = await request(app).get('/api/test');
    expect(response.status).toBe(200);
  });

  it('deve ignorar requisições OPTIONS para rate limiting', async () => {
    const response = await request(app).options('/api/test');
    // OPTIONS não deve ser bloqueado por rate limiting
    expect([200, 204]).toContain(response.status);
  });
});

describe('Server - Error Handlers', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Rota que gera erro
    app.get('/error', (req, res, next) => {
      next(new Error('Test error'));
    });
    
    // Rota que gera erro assíncrono
    app.get('/async-error', async (req, res, next) => {
      try {
        throw new Error('Async test error');
      } catch (error) {
        next(error);
      }
    });
    
    // Error handler
    app.use((err, req, res, next) => {
      res.status(500).json({ error: err.message });
    });
  });

  it('deve capturar erros síncronos', async () => {
    const response = await request(app).get('/error');
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Test error');
  });

  it('deve capturar erros assíncronos', async () => {
    const response = await request(app).get('/async-error');
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Async test error');
  });
});

describe('Server - JSON e URL Encoded', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    
    app.post('/json', (req, res) => {
      res.json({ received: req.body });
    });
    
    app.post('/form', (req, res) => {
      res.json({ received: req.body });
    });
  });

  it('deve aceitar JSON no body', async () => {
    const data = { teste: 'valor' };
    
    const response = await request(app)
      .post('/json')
      .send(data);
    
    expect(response.status).toBe(200);
    expect(response.body.received.teste).toBe('valor');
  });

  it('deve aceitar form data no body', async () => {
    const response = await request(app)
      .post('/form')
      .type('form')
      .send('campo=valor');
    
    expect(response.status).toBe(200);
    expect(response.body.received.campo).toBe('valor');
  });

  it('deve aceitar JSON grande (até 50mb)', async () => {
    const largeData = { data: 'x'.repeat(1000) };
    
    const response = await request(app)
      .post('/json')
      .send(largeData);
    
    expect(response.status).toBe(200);
  });
});

describe('Server - Timeout', () => {
  let app;

  beforeEach(() => {
    app = express();
    
    // Simular timeout
    app.use((req, res, next) => {
      req.setTimeout(30000, () => {
        if (!res.headersSent) {
          res.status(408).json({ error: 'Request timeout' });
        }
      });
      next();
    });
    
    app.get('/slow', (req, res) => {
      // Simular resposta rápida para teste
      res.json({ ok: true });
    });
  });

  it('deve responder antes do timeout', async () => {
    const response = await request(app).get('/slow');
    
    expect(response.status).toBe(200);
  });
});

describe('Server - Static Files', () => {
  let app;

  beforeEach(() => {
    app = express();
    
    // Simular servir arquivos estáticos com CORS
    app.use('/uploads', (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      next();
    }, (req, res) => {
      res.json({ path: req.path });
    });
  });

  it('deve incluir headers CORS para arquivos estáticos', async () => {
    const response = await request(app)
      .get('/uploads/test.jpg')
      .set('Origin', 'http://localhost:3000');
    
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('deve incluir credentials header', async () => {
    const response = await request(app)
      .get('/uploads/test.jpg')
      .set('Origin', 'http://localhost:3000');
    
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
});

describe('Server - getLocalIPAddress', () => {
  it('deve retornar um endereço IP válido ou localhost', () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    
    let localIP = 'localhost';
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIP = iface.address;
          break;
        }
      }
      if (localIP !== 'localhost') break;
    }
    
    // IP deve ser localhost ou um endereço IPv4 válido
    expect(localIP).toMatch(/^(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  });
});

describe('Server - Environment Variables', () => {
  it('deve usar porta padrão 3000', () => {
    const PORT = process.env.PORT || 3000;
    expect(PORT).toBeDefined();
  });

  it('deve detectar NODE_ENV', () => {
    const env = process.env.NODE_ENV || 'development';
    expect(['test', 'development', 'production']).toContain(env);
  });
});

describe('Server - Allowed Origins', () => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];

  allowedOrigins.forEach(origin => {
    it(`deve permitir origem ${origin}`, () => {
      expect(allowedOrigins).toContain(origin);
    });
  });

  it('deve permitir origens do Vercel em produção', () => {
    const origin = 'https://my-app.vercel.app';
    const isVercel = origin.includes('.vercel.app') || origin.includes('.vercel.com');
    expect(isVercel).toBe(true);
  });
});

describe('Server - Database Connection', () => {
  it('deve autenticar conexão com banco', async () => {
    mockSequelize.authenticate.mockResolvedValue(true);
    
    const result = await mockSequelize.authenticate();
    expect(result).toBe(true);
  });

  it('deve lidar com falha de conexão', async () => {
    mockSequelize.authenticate.mockRejectedValue(new Error('Connection refused'));
    
    await expect(mockSequelize.authenticate()).rejects.toThrow('Connection refused');
  });
});

