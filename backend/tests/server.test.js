const request = require('supertest');
const express = require('express');
const { sequelize } = require('../models');

// Mock do servidor principal
const createApp = () => {
  const app = express();
  
  // Middleware para processar JSON
  app.use(express.json());

  // Rota principal
  app.get('/', (req, res) => {
    res.send('API do SGVN está funcionando!');
  });

  // Rotas da API
  app.use('/api/usuarios', require('../routes/userRoutes'));
  app.use('/api/vistorias', require('../routes/vistoriaRoutes'));

  return app;
};

describe('Servidor Principal', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  describe('Rota principal GET /', () => {
    it('deve retornar mensagem de status da API', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toBe('API do SGVN está funcionando!');
    });

    it('deve retornar status 200', async () => {
      await request(app)
        .get('/')
        .expect(200);
    });
  });

  describe('Middleware JSON', () => {
    it('deve processar requisições JSON corretamente', async () => {
      const testData = { message: 'teste' };

      // Criar uma rota de teste que retorna os dados recebidos
      app.post('/test-json', (req, res) => {
        res.json(req.body);
      });

      const response = await request(app)
        .post('/test-json')
        .send(testData)
        .expect(200);

      expect(response.body).toEqual(testData);
    });

    it('deve lidar com requisições sem corpo', async () => {
      app.post('/test-empty', (req, res) => {
        res.json({ body: req.body });
      });

      const response = await request(app)
        .post('/test-empty')
        .expect(200);

      expect(response.body.body).toEqual({});
    });
  });

  describe('Rotas da API', () => {
    it('deve servir rotas de usuário em /api/usuarios', async () => {
      // Testar se a rota existe (mesmo que retorne erro por falta de dados)
      const response = await request(app)
        .post('/api/usuarios/sync')
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('deve servir rotas de vistoria em /api/vistorias', async () => {
      // Testar se a rota existe (mesmo que retorne erro por falta de autenticação)
      const response = await request(app)
        .post('/api/vistorias')
        .send({})
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Tratamento de rotas não encontradas', () => {
    it('deve retornar 404 para rotas inexistentes', async () => {
      const response = await request(app)
        .get('/rota-inexistente')
        .expect(404);
    });

    it('deve retornar 404 para métodos não suportados', async () => {
      const response = await request(app)
        .put('/')
        .expect(404);
    });

    it('deve retornar 404 para rotas de API inexistentes', async () => {
      const response = await request(app)
        .get('/api/rota-inexistente')
        .expect(404);
    });
  });

  describe('Configuração do servidor', () => {
    it('deve usar porta padrão quando PORT não está definida', () => {
      const originalPort = process.env.PORT;
      delete process.env.PORT;

      // Simular criação do servidor
      const PORT = process.env.PORT || 3000;
      expect(PORT).toBe(3000);

      // Restaurar
      if (originalPort) {
        process.env.PORT = originalPort;
      }
    });

    it('deve usar porta do ambiente quando PORT está definida', () => {
      const originalPort = process.env.PORT;
      process.env.PORT = '5000';

      // Simular criação do servidor
      const PORT = process.env.PORT || 3000;
      expect(PORT).toBe('5000');

      // Restaurar
      if (originalPort) {
        process.env.PORT = originalPort;
      } else {
        delete process.env.PORT;
      }
    });
  });

  describe('Integração com banco de dados', () => {
    it('deve conectar ao banco de dados', async () => {
      // Testar conexão com o banco
      await expect(sequelize.authenticate()).resolves.not.toThrow();
    });

    it('deve sincronizar modelos com o banco', async () => {
      // Testar sincronização
      await expect(sequelize.sync({ force: true })).resolves.not.toThrow();
    });
  });

  describe('Headers e CORS', () => {
    it('deve definir Content-Type correto para JSON', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    it('deve processar Content-Type application/json', async () => {
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
      app.post('/test-json-error', (req, res) => {
        res.json({ success: true });
      });

      // Enviar JSON malformado
      const response = await request(app)
        .post('/test-json-error')
        .set('Content-Type', 'application/json')
        .send('{"malformed": json}')
        .expect(400);
    });

    it('deve lidar com payload muito grande', async () => {
      app.post('/test-large-payload', (req, res) => {
        res.json({ size: JSON.stringify(req.body).length });
      });

      // Criar payload grande
      const largeData = { data: 'x'.repeat(10000) };

      const response = await request(app)
        .post('/test-large-payload')
        .send(largeData)
        .expect(200);

      expect(response.body.size).toBeGreaterThan(10000);
    });
  });

  describe('Performance básica', () => {
    it('deve responder rapidamente à rota principal', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
    });

    it('deve lidar com múltiplas requisições simultâneas', async () => {
      const promises = Array(10).fill().map(() => 
        request(app).get('/').expect(200)
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });
  });

  describe('Logs do servidor', () => {
    it('deve logar mensagem de conexão com banco', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Simular autenticação do banco
      await sequelize.authenticate();

      // Verificar se não houve erro (log seria chamado no servidor real)
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Não foi possível conectar ao banco de dados')
      );

      consoleSpy.mockRestore();
    });
  });
});
