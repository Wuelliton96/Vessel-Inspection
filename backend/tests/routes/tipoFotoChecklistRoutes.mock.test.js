/**
 * Testes unitários para tipoFotoChecklistRoutes
 * Usa mocks para evitar dependência do banco de dados
 */

const express = require('express');
const request = require('supertest');

// Mock data
const mockTipoFoto = {
  id: 1,
  codigo: 'PROA',
  nome_exibicao: 'Proa (frente)',
  descricao: 'Foto da parte frontal da embarcação',
  obrigatorio: true,
  ativo: true,
  save: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true)
};

// Mock models
jest.mock('../../models', () => ({
  TipoFotoChecklist: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, nome: 'Admin', NivelAcesso: { id: 1, nome: 'ADMIN' } };
    next();
  },
  requireAdmin: (req, res, next) => next()
}));

describe('tipoFotoChecklistRoutes - Testes Unitários', () => {
  let app;
  let models;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    jest.resetModules();
    models = require('../../models');
    
    const tipoFotoRoutes = require('../../routes/tipoFotoChecklistRoutes');
    app.use('/api/tipos-foto-checklist', tipoFotoRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/tipos-foto-checklist', () => {
    it('deve retornar lista de tipos de foto', async () => {
      models.TipoFotoChecklist.findAll.mockResolvedValue([mockTipoFoto]);

      const response = await request(app)
        .get('/api/tipos-foto-checklist')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].codigo).toBe('PROA');
    });

    it('deve filtrar apenas ativos', async () => {
      models.TipoFotoChecklist.findAll.mockResolvedValue([mockTipoFoto]);

      await request(app)
        .get('/api/tipos-foto-checklist?ativo=true')
        .expect(200);

      expect(models.TipoFotoChecklist.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ativo: true
          })
        })
      );
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.TipoFotoChecklist.findAll.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .get('/api/tipos-foto-checklist')
        .expect(500);
    });
  });

  describe('GET /api/tipos-foto-checklist/:id', () => {
    it('deve retornar tipo de foto por ID', async () => {
      models.TipoFotoChecklist.findByPk.mockResolvedValue(mockTipoFoto);

      const response = await request(app)
        .get('/api/tipos-foto-checklist/1')
        .expect(200);

      expect(response.body.codigo).toBe('PROA');
    });

    it('deve retornar 404 se não encontrar', async () => {
      models.TipoFotoChecklist.findByPk.mockResolvedValue(null);

      await request(app)
        .get('/api/tipos-foto-checklist/999')
        .expect(404);
    });
  });

  describe('POST /api/tipos-foto-checklist', () => {
    it('deve criar tipo de foto com sucesso', async () => {
      models.TipoFotoChecklist.findOne.mockResolvedValue(null);
      models.TipoFotoChecklist.create.mockResolvedValue(mockTipoFoto);

      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .send({
          codigo: 'POPA',
          nome_exibicao: 'Popa (traseira)',
          descricao: 'Foto da parte traseira',
          obrigatorio: true
        })
        .expect(201);

      expect(response.body.codigo).toBe('PROA');
    });

    it('deve retornar 400 se código não fornecido', async () => {
      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .send({
          nome_exibicao: 'Test'
        })
        .expect(400);

      expect(response.body.error).toContain('obrigatório');
    });

    it('deve retornar 400 se código já existir', async () => {
      models.TipoFotoChecklist.findOne.mockResolvedValue(mockTipoFoto);

      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .send({
          codigo: 'PROA',
          nome_exibicao: 'Duplicate'
        })
        .expect(400);

      expect(response.body.error).toContain('já existe');
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.TipoFotoChecklist.findOne.mockResolvedValue(null);
      models.TipoFotoChecklist.create.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .post('/api/tipos-foto-checklist')
        .send({
          codigo: 'TEST',
          nome_exibicao: 'Test'
        })
        .expect(500);
    });
  });

  describe('PUT /api/tipos-foto-checklist/:id', () => {
    it('deve atualizar tipo de foto com sucesso', async () => {
      const tipo = { ...mockTipoFoto, save: jest.fn().mockResolvedValue(true) };
      models.TipoFotoChecklist.findByPk.mockResolvedValue(tipo);

      const response = await request(app)
        .put('/api/tipos-foto-checklist/1')
        .send({ nome_exibicao: 'Nome Atualizado' })
        .expect(200);

      expect(tipo.save).toHaveBeenCalled();
    });

    it('deve atualizar todos os campos', async () => {
      const tipo = { ...mockTipoFoto, save: jest.fn().mockResolvedValue(true) };
      models.TipoFotoChecklist.findByPk.mockResolvedValue(tipo);

      await request(app)
        .put('/api/tipos-foto-checklist/1')
        .send({
          nome_exibicao: 'Novo Nome',
          descricao: 'Nova Descrição',
          obrigatorio: false,
          ativo: false
        })
        .expect(200);

      expect(tipo.nome_exibicao).toBe('Novo Nome');
      expect(tipo.descricao).toBe('Nova Descrição');
      expect(tipo.obrigatorio).toBe(false);
      expect(tipo.ativo).toBe(false);
    });

    it('deve retornar 404 se não encontrar', async () => {
      models.TipoFotoChecklist.findByPk.mockResolvedValue(null);

      await request(app)
        .put('/api/tipos-foto-checklist/999')
        .send({ nome_exibicao: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/tipos-foto-checklist/:id', () => {
    it('deve excluir tipo de foto com sucesso', async () => {
      const tipo = { ...mockTipoFoto, destroy: jest.fn().mockResolvedValue(true) };
      models.TipoFotoChecklist.findByPk.mockResolvedValue(tipo);

      const response = await request(app)
        .delete('/api/tipos-foto-checklist/1')
        .expect(200);

      expect(response.body.message).toContain('excluído');
    });

    it('deve retornar 404 se não encontrar', async () => {
      models.TipoFotoChecklist.findByPk.mockResolvedValue(null);

      await request(app)
        .delete('/api/tipos-foto-checklist/999')
        .expect(404);
    });
  });

  describe('PATCH /api/tipos-foto-checklist/:id/toggle-status', () => {
    it('deve alternar status de ativo para inativo', async () => {
      const tipo = { 
        ...mockTipoFoto, 
        ativo: true, 
        save: jest.fn().mockResolvedValue(true) 
      };
      models.TipoFotoChecklist.findByPk.mockResolvedValue(tipo);

      await request(app)
        .patch('/api/tipos-foto-checklist/1/toggle-status')
        .expect(200);

      expect(tipo.ativo).toBe(false);
      expect(tipo.save).toHaveBeenCalled();
    });

    it('deve alternar status de inativo para ativo', async () => {
      const tipo = { 
        ...mockTipoFoto, 
        ativo: false, 
        save: jest.fn().mockResolvedValue(true) 
      };
      models.TipoFotoChecklist.findByPk.mockResolvedValue(tipo);

      await request(app)
        .patch('/api/tipos-foto-checklist/1/toggle-status')
        .expect(200);

      expect(tipo.ativo).toBe(true);
    });

    it('deve retornar 404 se não encontrar', async () => {
      models.TipoFotoChecklist.findByPk.mockResolvedValue(null);

      await request(app)
        .patch('/api/tipos-foto-checklist/999/toggle-status')
        .expect(404);
    });
  });
});

