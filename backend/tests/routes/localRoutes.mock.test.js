/**
 * Testes unitários para localRoutes
 * Usa mocks para evitar dependência do banco de dados
 */

const express = require('express');
const request = require('supertest');

// Mock data
const mockLocal = {
  id: 1,
  cep: '01310-100',
  logradouro: 'Avenida Paulista',
  numero: '1000',
  complemento: 'Sala 101',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  uf: 'SP',
  marina_nome: 'Marina São Paulo',
  marina_telefone: '11999998888',
  save: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true)
};

// Mock models
jest.mock('../../models', () => ({
  Local: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  Vistoria: {}
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, nome: 'Admin', NivelAcesso: { id: 1, nome: 'ADMIN' } };
    next();
  },
  requireAdmin: (req, res, next) => next(),
  requireVistoriador: (req, res, next) => next()
}));

describe('localRoutes - Testes Unitários', () => {
  let app;
  let models;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    jest.resetModules();
    models = require('../../models');
    
    const localRoutes = require('../../routes/localRoutes');
    app.use('/api/locais', localRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/locais', () => {
    it('deve retornar lista de locais', async () => {
      models.Local.findAll.mockResolvedValue([mockLocal]);

      const response = await request(app)
        .get('/api/locais')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].logradouro).toBe('Avenida Paulista');
    });

    it('deve filtrar por cidade', async () => {
      models.Local.findAll.mockResolvedValue([mockLocal]);

      await request(app)
        .get('/api/locais?cidade=São Paulo')
        .expect(200);

      expect(models.Local.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cidade: expect.anything()
          })
        })
      );
    });

    it('deve filtrar por UF', async () => {
      models.Local.findAll.mockResolvedValue([mockLocal]);

      await request(app)
        .get('/api/locais?uf=SP')
        .expect(200);

      expect(models.Local.findAll).toHaveBeenCalled();
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Local.findAll.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .get('/api/locais')
        .expect(500);
    });
  });

  describe('GET /api/locais/:id', () => {
    it('deve retornar local por ID', async () => {
      models.Local.findByPk.mockResolvedValue(mockLocal);

      const response = await request(app)
        .get('/api/locais/1')
        .expect(200);

      expect(response.body.id).toBe(1);
    });

    it('deve retornar 404 se não encontrar', async () => {
      models.Local.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/locais/999')
        .expect(404);

      expect(response.body.error).toContain('não encontrado');
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Local.findByPk.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .get('/api/locais/1')
        .expect(500);
    });
  });

  describe('POST /api/locais', () => {
    it('deve criar local com sucesso', async () => {
      models.Local.create.mockResolvedValue(mockLocal);

      const response = await request(app)
        .post('/api/locais')
        .send({
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          numero: '1000',
          cidade: 'São Paulo',
          uf: 'SP'
        })
        .expect(201);

      expect(response.body.id).toBe(1);
    });

    it('deve criar local sem campos opcionais', async () => {
      models.Local.create.mockResolvedValue(mockLocal);

      await request(app)
        .post('/api/locais')
        .send({
          logradouro: 'Rua Test',
          cidade: 'Test',
          uf: 'SP'
        })
        .expect(201);
    });

    it('deve retornar 400 se logradouro não fornecido', async () => {
      const response = await request(app)
        .post('/api/locais')
        .send({
          cidade: 'São Paulo',
          uf: 'SP'
        })
        .expect(400);

      expect(response.body.error).toContain('obrigatório');
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Local.create.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .post('/api/locais')
        .send({
          logradouro: 'Test',
          cidade: 'Test',
          uf: 'SP'
        })
        .expect(500);
    });
  });

  describe('PUT /api/locais/:id', () => {
    it('deve atualizar local com sucesso', async () => {
      const local = { ...mockLocal, save: jest.fn().mockResolvedValue(true) };
      models.Local.findByPk.mockResolvedValue(local);

      const response = await request(app)
        .put('/api/locais/1')
        .send({ numero: '2000' })
        .expect(200);

      expect(local.save).toHaveBeenCalled();
    });

    it('deve atualizar todos os campos', async () => {
      const local = { ...mockLocal, save: jest.fn().mockResolvedValue(true) };
      models.Local.findByPk.mockResolvedValue(local);

      await request(app)
        .put('/api/locais/1')
        .send({
          cep: '01320-000',
          logradouro: 'Nova Rua',
          numero: '500',
          complemento: 'Apto 1',
          bairro: 'Centro',
          cidade: 'Rio de Janeiro',
          uf: 'RJ',
          marina_nome: 'Nova Marina',
          marina_telefone: '21999998888'
        })
        .expect(200);

      expect(local.cep).toBe('01320-000');
      expect(local.logradouro).toBe('Nova Rua');
    });

    it('deve retornar 404 se não encontrar', async () => {
      models.Local.findByPk.mockResolvedValue(null);

      await request(app)
        .put('/api/locais/999')
        .send({ numero: '2000' })
        .expect(404);
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Local.findByPk.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .put('/api/locais/1')
        .send({ numero: '2000' })
        .expect(500);
    });
  });

  describe('DELETE /api/locais/:id', () => {
    it('deve excluir local com sucesso', async () => {
      const local = { ...mockLocal, destroy: jest.fn().mockResolvedValue(true) };
      models.Local.findByPk.mockResolvedValue(local);

      const response = await request(app)
        .delete('/api/locais/1')
        .expect(200);

      expect(response.body.message).toContain('excluído');
      expect(local.destroy).toHaveBeenCalled();
    });

    it('deve retornar 404 se não encontrar', async () => {
      models.Local.findByPk.mockResolvedValue(null);

      await request(app)
        .delete('/api/locais/999')
        .expect(404);
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Local.findByPk.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .delete('/api/locais/1')
        .expect(500);
    });
  });
});

