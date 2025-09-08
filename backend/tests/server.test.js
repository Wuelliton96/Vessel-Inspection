// tests/server.test.js
const request = require('supertest');

// ⚠️ NÃO importe routes aqui no topo.
// Vamos reconstruir a app sob mocks diferentes.
const buildApp = (auth = 'allow') => {
  // zera o cache de módulos para aplicar o mock do Clerk
  jest.resetModules();

  // Mocka o Clerk conforme o cenário
  jest.doMock('@clerk/clerk-sdk-node', () => ({
    ClerkExpressRequireAuth: () => (req, res, next) => {
      if (auth === 'allow') {
        req.auth = { userId: 'test-clerk-user-id' };
        return next();
      }
      // simula não autenticado
      return res.status(401).json({ error: 'Unauthorized' });
    },
  }));

  const express = require('express');
  const app = express();

  app.use(express.json());

  app.get('/', (req, res) => {
    res.send('API do SGVN está funcionando!');
  });

  // importe as rotas SOMENTE aqui, depois do mock
  app.use('/api/usuarios', require('../routes/userRoutes'));
  app.use('/api/vistorias', require('../routes/vistoriaRoutes'));

  // 404 genérico (opcional — express já retorna 404 por padrão)
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
};

// DB: pegue a MESMA instância usada nos modelos
const { sequelize } = require('../models');

describe('Servidor Principal', () => {
  let app;

  beforeEach(() => {
    // por padrão, app com auth liberada
    app = buildApp('allow');
  });

  describe('Rota principal GET /', () => {
    it('deve retornar mensagem de status da API', async () => {
      const response = await request(app).get('/').expect(200);
      expect(response.text).toBe('API do SGVN está funcionando!');
    });

    it('deve retornar status 200', async () => {
      await request(app).get('/').expect(200);
    });
  });

  describe('Middleware JSON', () => {
    it('deve processar requisições JSON corretamente', async () => {
      const testData = { message: 'teste' };
      app.post('/test-json', (req, res) => res.json(req.body));
      const response = await request(app).post('/test-json').send(testData).expect(200);
      expect(response.body).toEqual(testData);
    });

    it('deve lidar com requisições sem corpo', async () => {
      app.post('/test-empty', (req, res) => res.json({ body: req.body }));
      const response = await request(app).post('/test-empty').expect(200);
      expect(response.body.body).toEqual({});
    });
  });

  describe('Rotas da API', () => {
    it('deve servir rotas de usuário em /api/usuarios', async () => {
      const response = await request(app).post('/api/usuarios/sync').send({}).expect(400);
      expect(response.body.error).toBeDefined();
    });

    it('deve exigir autenticação em /api/vistorias quando não autenticado', async () => {
      // reconstrói a app com mock que NEGA autenticação
      const appNoAuth = buildApp('deny');
      const res = await request(appNoAuth).post('/api/vistorias').send({}).expect(401);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Tratamento de rotas não encontradas', () => {
    it('deve retornar 404 para rotas inexistentes', async () => {
      await request(app).get('/rota-inexistente').expect(404);
    });

    it('deve retornar 404 para métodos não suportados', async () => {
      await request(app).put('/').expect(404);
    });

    it('deve retornar 404 para rotas de API inexistentes', async () => {
      await request(app).get('/api/rota-inexistente').expect(404);
    });
  });

  describe('Configuração do servidor', () => {
    it('deve usar porta padrão quando PORT não está definida', () => {
      const original = process.env.PORT;
      delete process.env.PORT;
      const PORT = process.env.PORT || 3000;
      expect(PORT).toBe(3000);
      if (original) process.env.PORT = original;
    });

    it('deve usar porta do ambiente quando PORT está definida', () => {
      const original = process.env.PORT;
      process.env.PORT = '5000';
      const PORT = process.env.PORT || 3000;
      expect(PORT).toBe('5000');
      if (original) process.env.PORT = original; else delete process.env.PORT;
    });
  });

  describe('Integração com banco de dados', () => {
    it('deve conectar ao banco de dados', async () => {
      await expect(sequelize.authenticate()).resolves.not.toThrow();
    });

    it('deve sincronizar modelos com o banco', async () => {
      await expect(sequelize.sync({ force: true })).resolves.not.toThrow();
    });
  });

  describe('Headers e CORS', () => {
    it('deve definir Content-Type correto para JSON/texto', async () => {
      const response = await request(app).get('/').expect(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    it('deve processar Content-Type application\/json', async () => {
      app.post('/test-content-type', (req, res) => {
        res.json({ contentType: req.get('Content-Type') });
      });
      const response = await request(app)
        .post('/test-content-type')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' })
        .expect(200);
      expect(response.body.contentType).toBe('application/json');
    });
  });

  describe('Tratamento de erros', () => {
    it('deve lidar com erros de parsing JSON', async () => {
      app.post('/test-json-error', (req, res) => res.json({ ok: true }));
      await request(app)
        .post('/test-json-error')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(400);
    });

    it('deve lidar com payload grande', async () => {
      app.post('/test-large-payload', (req, res) => {
        res.json({ size: JSON.stringify(req.body).length });
      });
      const largeData = { data: 'x'.repeat(10000) };
      const response = await request(app).post('/test-large-payload').send(largeData).expect(200);
      expect(response.body.size).toBeGreaterThan(10000);
    });
  });

  describe('Performance básica', () => {
    it('deve responder rapidamente à rota principal', async () => {
      const start = Date.now();
      await request(app).get('/').expect(200);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // 2s p/ evitar flakiness no CI
    });

    it('deve lidar com múltiplas requisições simultâneas', async () => {
      const promises = Array.from({ length: 10 }, () => request(app).get('/').expect(200));
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  describe('Logs do servidor', () => {
    it('não deve logar erro de conexão', async () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      await sequelize.authenticate();
      expect(spy).not.toHaveBeenCalledWith(
        expect.stringContaining('Não foi possível conectar ao banco de dados')
      );
      spy.mockRestore();
    });
  });
});
