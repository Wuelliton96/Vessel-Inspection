/**
 * Testes unitários para seguradoraRoutes
 * Usa mocks para evitar dependência do banco de dados
 */

const express = require('express');
const request = require('supertest');

// Mocks
const mockSeguradora = {
  id: 1,
  nome: 'Seguradora Test',
  ativo: true,
  tiposPermitidos: [{ id: 1, tipo_embarcacao: 'LANCHA' }],
  save: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true)
};

const mockSeguradoraTipo = {
  id: 1,
  seguradora_id: 1,
  tipo_embarcacao: 'LANCHA'
};

// Mock models
jest.mock('../../models', () => ({
  Seguradora: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  SeguradoraTipoEmbarcacao: {
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
    destroy: jest.fn()
  }
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, nome: 'Admin User', NivelAcesso: { id: 1, nome: 'ADMIN' } };
    next();
  },
  requireAdmin: (req, res, next) => next()
}));

describe('seguradoraRoutes - Testes Unitários', () => {
  let app;
  let models;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    jest.resetModules();
    models = require('../../models');
    
    const seguradoraRoutes = require('../../routes/seguradoraRoutes');
    app.use('/api/seguradoras', seguradoraRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/seguradoras', () => {
    it('deve retornar lista de seguradoras', async () => {
      models.Seguradora.findAll.mockResolvedValue([mockSeguradora]);

      const response = await request(app)
        .get('/api/seguradoras')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].nome).toBe('Seguradora Test');
    });

    it('deve filtrar por status ativo', async () => {
      models.Seguradora.findAll.mockResolvedValue([mockSeguradora]);

      await request(app)
        .get('/api/seguradoras?ativo=true')
        .expect(200);

      expect(models.Seguradora.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ativo: true }
        })
      );
    });

    it('deve filtrar por status inativo', async () => {
      models.Seguradora.findAll.mockResolvedValue([]);

      await request(app)
        .get('/api/seguradoras?ativo=false')
        .expect(200);

      expect(models.Seguradora.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { ativo: false }
        })
      );
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Seguradora.findAll.mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .get('/api/seguradoras')
        .expect(500);

      expect(response.body.error).toBe('Erro interno do servidor');
    });
  });

  describe('GET /api/seguradoras/:id', () => {
    it('deve retornar seguradora por ID', async () => {
      models.Seguradora.findByPk.mockResolvedValue(mockSeguradora);

      const response = await request(app)
        .get('/api/seguradoras/1')
        .expect(200);

      expect(response.body.nome).toBe('Seguradora Test');
    });

    it('deve retornar 404 se não encontrar', async () => {
      models.Seguradora.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/seguradoras/999')
        .expect(404);

      expect(response.body.error).toBe('Seguradora não encontrada');
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Seguradora.findByPk.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .get('/api/seguradoras/1')
        .expect(500);
    });
  });

  describe('GET /api/seguradoras/:id/tipos-permitidos', () => {
    it('deve retornar tipos permitidos', async () => {
      models.SeguradoraTipoEmbarcacao.findAll.mockResolvedValue([
        { tipo_embarcacao: 'LANCHA' },
        { tipo_embarcacao: 'JET_SKI' }
      ]);

      const response = await request(app)
        .get('/api/seguradoras/1/tipos-permitidos')
        .expect(200);

      expect(response.body).toContain('LANCHA');
      expect(response.body).toContain('JET_SKI');
    });

    it('deve retornar array vazio se não houver tipos', async () => {
      models.SeguradoraTipoEmbarcacao.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/seguradoras/1/tipos-permitidos')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.SeguradoraTipoEmbarcacao.findAll.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .get('/api/seguradoras/1/tipos-permitidos')
        .expect(500);
    });
  });

  describe('POST /api/seguradoras', () => {
    it('deve criar seguradora com sucesso', async () => {
      models.Seguradora.create.mockResolvedValue({ id: 1, ...mockSeguradora });
      models.Seguradora.findByPk.mockResolvedValue(mockSeguradora);
      models.SeguradoraTipoEmbarcacao.bulkCreate.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/seguradoras')
        .send({
          nome: 'Nova Seguradora',
          tipos_permitidos: ['LANCHA', 'JET_SKI']
        })
        .expect(201);

      expect(response.body.nome).toBe('Seguradora Test');
    });

    it('deve criar seguradora sem tipos', async () => {
      models.Seguradora.create.mockResolvedValue({ id: 1, ...mockSeguradora });
      models.Seguradora.findByPk.mockResolvedValue(mockSeguradora);

      await request(app)
        .post('/api/seguradoras')
        .send({ nome: 'Nova Seguradora' })
        .expect(201);

      expect(models.SeguradoraTipoEmbarcacao.bulkCreate).not.toHaveBeenCalled();
    });

    it('deve retornar 400 se nome não fornecido', async () => {
      const response = await request(app)
        .post('/api/seguradoras')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Nome é obrigatório');
    });

    it('deve retornar 400 se nome já existir', async () => {
      const error = new Error('Unique constraint');
      error.name = 'SequelizeUniqueConstraintError';
      models.Seguradora.create.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/seguradoras')
        .send({ nome: 'Seguradora Existente' })
        .expect(400);

      expect(response.body.error).toBe('Já existe uma seguradora com este nome');
    });

    it('deve retornar 500 em caso de erro genérico', async () => {
      models.Seguradora.create.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .post('/api/seguradoras')
        .send({ nome: 'Nova Seguradora' })
        .expect(500);
    });
  });

  describe('PUT /api/seguradoras/:id', () => {
    it('deve atualizar seguradora com sucesso', async () => {
      const seguradora = { ...mockSeguradora, save: jest.fn().mockResolvedValue(true) };
      models.Seguradora.findByPk
        .mockResolvedValueOnce(seguradora)
        .mockResolvedValueOnce({ ...seguradora, nome: 'Seguradora Atualizada' });
      models.SeguradoraTipoEmbarcacao.destroy.mockResolvedValue(1);
      models.SeguradoraTipoEmbarcacao.bulkCreate.mockResolvedValue([]);

      const response = await request(app)
        .put('/api/seguradoras/1')
        .send({
          nome: 'Seguradora Atualizada',
          tipos_permitidos: ['LANCHA']
        })
        .expect(200);

      expect(seguradora.save).toHaveBeenCalled();
    });

    it('deve atualizar apenas status ativo', async () => {
      const seguradora = { ...mockSeguradora, save: jest.fn().mockResolvedValue(true) };
      models.Seguradora.findByPk
        .mockResolvedValueOnce(seguradora)
        .mockResolvedValueOnce({ ...seguradora, ativo: false });

      await request(app)
        .put('/api/seguradoras/1')
        .send({ ativo: false })
        .expect(200);

      expect(seguradora.ativo).toBe(false);
    });

    it('deve retornar 404 se não encontrar', async () => {
      models.Seguradora.findByPk.mockResolvedValue(null);

      await request(app)
        .put('/api/seguradoras/999')
        .send({ nome: 'Test' })
        .expect(404);
    });

    it('deve retornar 400 se nome já existir', async () => {
      const seguradora = { ...mockSeguradora, save: jest.fn() };
      seguradora.save.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      models.Seguradora.findByPk.mockResolvedValue(seguradora);

      const response = await request(app)
        .put('/api/seguradoras/1')
        .send({ nome: 'Seguradora Existente' })
        .expect(400);

      expect(response.body.error).toBe('Já existe uma seguradora com este nome');
    });
  });

  describe('DELETE /api/seguradoras/:id', () => {
    it('deve excluir seguradora com sucesso', async () => {
      const seguradora = { ...mockSeguradora, destroy: jest.fn().mockResolvedValue(true) };
      models.Seguradora.findByPk.mockResolvedValue(seguradora);

      const response = await request(app)
        .delete('/api/seguradoras/1')
        .expect(200);

      expect(response.body.message).toBe('Seguradora excluída com sucesso');
      expect(seguradora.destroy).toHaveBeenCalled();
    });

    it('deve retornar 404 se não encontrar', async () => {
      models.Seguradora.findByPk.mockResolvedValue(null);

      await request(app)
        .delete('/api/seguradoras/999')
        .expect(404);
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Seguradora.findByPk.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .delete('/api/seguradoras/1')
        .expect(500);
    });
  });

  describe('PATCH /api/seguradoras/:id/toggle-status', () => {
    it('deve alternar status de ativo para inativo', async () => {
      const seguradora = { 
        ...mockSeguradora, 
        ativo: true, 
        save: jest.fn().mockResolvedValue(true) 
      };
      models.Seguradora.findByPk.mockResolvedValue(seguradora);

      const response = await request(app)
        .patch('/api/seguradoras/1/toggle-status')
        .expect(200);

      expect(seguradora.ativo).toBe(false);
      expect(seguradora.save).toHaveBeenCalled();
    });

    it('deve alternar status de inativo para ativo', async () => {
      const seguradora = { 
        ...mockSeguradora, 
        ativo: false, 
        save: jest.fn().mockResolvedValue(true) 
      };
      models.Seguradora.findByPk.mockResolvedValue(seguradora);

      await request(app)
        .patch('/api/seguradoras/1/toggle-status')
        .expect(200);

      expect(seguradora.ativo).toBe(true);
    });

    it('deve retornar 404 se não encontrar', async () => {
      models.Seguradora.findByPk.mockResolvedValue(null);

      await request(app)
        .patch('/api/seguradoras/999/toggle-status')
        .expect(404);
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Seguradora.findByPk.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .patch('/api/seguradoras/1/toggle-status')
        .expect(500);
    });
  });
});



