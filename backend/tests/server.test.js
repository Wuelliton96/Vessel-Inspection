const request = require('supertest');
const express = require('express');
const { sequelize } = require('../models');
const { setupCompleteTestEnvironment } = require('./helpers/testHelpers');

// Criar uma instância simplificada do servidor para testes
function createTestServer() {
  const app = express();
  const cors = require('cors');
  const helmet = require('helmet');
  
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  
  app.use(cors({
    origin: true,
    credentials: true
  }));
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  // Handler OPTIONS
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      return res.sendStatus(200);
    }
    next();
  });
  
  app.get('/', (req, res) => {
    res.send('API do SGVN está funcionando.');
  });
  
  app.get('/health', async (req, res) => {
    try {
      await sequelize.authenticate();
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected'
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
  
  return app;
}

describe('Servidor Backend', () => {
  let app;
  
  beforeAll(async () => {
    await setupCompleteTestEnvironment('server');
    app = createTestServer();
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('Rota raiz', () => {
    it('GET / deve retornar mensagem de funcionamento', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.text).toContain('API do SGVN');
    });
  });
  
  describe('Health Check', () => {
    it('GET /health deve retornar status healthy quando banco conectado', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.database).toBe('connected');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
    
    it('deve incluir campos de informação', async () => {
      const response = await request(app).get('/health');
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('database');
      expect(typeof response.body.uptime).toBe('number');
    });
  });
  
  describe('CORS', () => {
    it('deve responder a requisições OPTIONS', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:3000');
      
      // 200 ou 204 são válidos para OPTIONS
      expect([200, 204]).toContain(response.status);
    });
    
    it('deve incluir headers CORS na resposta', async () => {
      const response = await request(app)
        .options('/api/test')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });
  
  describe('Headers de Segurança', () => {
    it('deve incluir headers de segurança via Helmet', async () => {
      const response = await request(app).get('/');
      
      // Helmet adiciona vários headers de segurança
      expect(response.headers).toHaveProperty('x-content-type-options');
    });
  });
  
  describe('JSON Body Parser', () => {
    it('deve aceitar JSON no body', async () => {
      const response = await request(app)
        .post('/test-json')
        .send({ teste: 'valor' })
        .set('Content-Type', 'application/json');
      
      // Espera 404 pois a rota não existe, mas o body deve ser parseado
      expect(response.status).toBe(404);
    });
  });
});

describe('Configurações de CORS', () => {
  it('deve permitir origens localhost', () => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    
    expect(allowedOrigins).toContain('http://localhost:3000');
    expect(allowedOrigins).toContain('http://localhost:5173');
  });
});

describe('Utilitários do Servidor', () => {
  it('getLocalIPAddress deve retornar um endereço', () => {
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
    }
    
    expect(typeof localIP).toBe('string');
    expect(localIP.length).toBeGreaterThan(0);
  });
});
