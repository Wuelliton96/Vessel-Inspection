/**
 * Testes unitários para vistoriadorRoutes
 * Usa mocks para evitar dependência do banco de dados
 */

const express = require('express');
const request = require('supertest');

// Mocks
const mockVistoria = {
  id: 1,
  vistoriador_id: 1,
  status_id: 1,
  data_inicio: null,
  data_conclusao: null,
  Embarcacao: { id: 1, nome: 'Barco Test' },
  Local: { id: 1, logradouro: 'Rua Test' },
  StatusVistoria: { id: 1, nome: 'PENDENTE' },
  vistoriador: { id: 1, nome: 'Test User', email: 'test@test.com' },
  Fotos: [],
  update: jest.fn().mockResolvedValue(true),
  reload: jest.fn().mockResolvedValue(true),
  toJSON: () => mockVistoria
};

const mockStatusPendente = { id: 1, nome: 'PENDENTE' };
const mockStatusEmAndamento = { id: 2, nome: 'EM_ANDAMENTO' };
const mockStatusConcluida = { id: 3, nome: 'CONCLUIDA' };

const mockTipoFoto = {
  id: 1,
  codigo: 'PROA',
  nome_exibicao: 'Proa',
  descricao: 'Foto da proa',
  obrigatorio: true
};

const mockLotePagamento = {
  id: 1,
  vistoriador_id: 1,
  status: 'PAGO',
  valor_total: 500,
  vistoriasLote: [{ vistoria: { id: 1 } }]
};

// Mock models
jest.mock('../../models', () => ({
  Vistoria: {
    findAll: jest.fn(),
    findByPk: jest.fn()
  },
  Embarcacao: {},
  Local: {},
  StatusVistoria: {
    findOne: jest.fn()
  },
  Usuario: {},
  Foto: {
    findAll: jest.fn()
  },
  TipoFotoChecklist: {
    findAll: jest.fn(),
    create: jest.fn()
  },
  Cliente: {},
  LotePagamento: {
    findAll: jest.fn()
  },
  VistoriaLotePagamento: {
    findAll: jest.fn()
  }
}));

// Mock auth middleware
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, nome: 'Test User', NivelAcesso: { id: 2, nome: 'VISTORIADOR' } };
    next();
  },
  requireVistoriador: (req, res, next) => next()
}));

describe('vistoriadorRoutes - Testes Unitários', () => {
  let app;
  let models;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Reset modules to get fresh mocks
    jest.resetModules();
    models = require('../../models');
    
    const vistoriadorRoutes = require('../../routes/vistoriadorRoutes');
    app.use('/api/vistoriador', vistoriadorRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/vistoriador/vistorias', () => {
    it('deve retornar lista de vistorias do vistoriador', async () => {
      models.StatusVistoria.findOne
        .mockResolvedValueOnce(mockStatusPendente)
        .mockResolvedValueOnce(mockStatusEmAndamento)
        .mockResolvedValueOnce(mockStatusConcluida);
      
      models.Vistoria.findAll.mockResolvedValue([mockVistoria]);

      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar array vazio se não houver status cadastrados', async () => {
      models.StatusVistoria.findOne.mockResolvedValue(null);
      models.Vistoria.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.StatusVistoria.findOne.mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .expect(500);

      expect(response.body.error).toBe('Erro interno do servidor');
    });
  });

  describe('GET /api/vistoriador/vistorias/:id', () => {
    it('deve retornar vistoria específica', async () => {
      models.Vistoria.findByPk.mockResolvedValue(mockVistoria);

      const response = await request(app)
        .get('/api/vistoriador/vistorias/1')
        .expect(200);

      expect(response.body.id).toBe(1);
    });

    it('deve retornar 404 se vistoria não existir', async () => {
      models.Vistoria.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/vistoriador/vistorias/999')
        .expect(404);

      expect(response.body.error).toBe('Vistoria não encontrada');
    });

    it('deve retornar 403 se vistoriador não for dono', async () => {
      const outraVistoria = { ...mockVistoria, vistoriador_id: 999 };
      models.Vistoria.findByPk.mockResolvedValue(outraVistoria);

      const response = await request(app)
        .get('/api/vistoriador/vistorias/1')
        .expect(403);

      expect(response.body.error).toBe('Acesso negado');
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Vistoria.findByPk.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .get('/api/vistoriador/vistorias/1')
        .expect(500);
    });
  });

  describe('GET /api/vistoriador/tipos-foto-checklist', () => {
    it('deve retornar lista de tipos de foto', async () => {
      models.TipoFotoChecklist.findAll.mockResolvedValue([mockTipoFoto]);

      const response = await request(app)
        .get('/api/vistoriador/tipos-foto-checklist')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve criar tipos padrão se não existirem', async () => {
      // Primeira chamada retorna vazio, segunda retorna tipos criados
      models.TipoFotoChecklist.findAll
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockTipoFoto]);
      models.TipoFotoChecklist.create.mockResolvedValue(mockTipoFoto);

      const response = await request(app)
        .get('/api/vistoriador/tipos-foto-checklist')
        .expect(200);

      expect(models.TipoFotoChecklist.create).toHaveBeenCalled();
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.TipoFotoChecklist.findAll.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .get('/api/vistoriador/tipos-foto-checklist')
        .expect(500);
    });
  });

  describe('PUT /api/vistoriador/vistorias/:id/iniciar', () => {
    it('deve iniciar vistoria com sucesso', async () => {
      const vistoria = {
        ...mockVistoria,
        status_id: 1,
        data_inicio: null,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue({
          ...mockVistoria,
          data_inicio: new Date(),
          status_id: 2
        })
      };
      
      models.Vistoria.findByPk.mockResolvedValue(vistoria);
      models.StatusVistoria.findOne
        .mockResolvedValueOnce(mockStatusPendente)
        .mockResolvedValueOnce(mockStatusEmAndamento);

      const response = await request(app)
        .put('/api/vistoriador/vistorias/1/iniciar')
        .expect(200);

      expect(response.body.message).toBe('Vistoria iniciada com sucesso');
    });

    it('deve retornar 404 se vistoria não existir', async () => {
      models.Vistoria.findByPk.mockResolvedValue(null);

      await request(app)
        .put('/api/vistoriador/vistorias/999/iniciar')
        .expect(404);
    });

    it('deve retornar 403 se não for dono da vistoria', async () => {
      models.Vistoria.findByPk.mockResolvedValue({ ...mockVistoria, vistoriador_id: 999 });

      await request(app)
        .put('/api/vistoriador/vistorias/1/iniciar')
        .expect(403);
    });

    it('deve retornar 400 se vistoria já foi iniciada', async () => {
      models.Vistoria.findByPk.mockResolvedValue({ 
        ...mockVistoria, 
        data_inicio: new Date() 
      });

      const response = await request(app)
        .put('/api/vistoriador/vistorias/1/iniciar')
        .expect(400);

      expect(response.body.error).toBe('Esta vistoria já foi iniciada');
    });

    it('deve retornar 500 se status não existirem', async () => {
      models.Vistoria.findByPk.mockResolvedValue(mockVistoria);
      models.StatusVistoria.findOne.mockResolvedValue(null);

      await request(app)
        .put('/api/vistoriador/vistorias/1/iniciar')
        .expect(500);
    });

    it('deve retornar 400 se status não for PENDENTE', async () => {
      models.Vistoria.findByPk.mockResolvedValue({ ...mockVistoria, status_id: 2 });
      models.StatusVistoria.findOne
        .mockResolvedValueOnce(mockStatusPendente)
        .mockResolvedValueOnce(mockStatusEmAndamento);

      const response = await request(app)
        .put('/api/vistoriador/vistorias/1/iniciar')
        .expect(400);

      expect(response.body.error).toBe('Esta vistoria não pode ser iniciada no status atual');
    });
  });

  describe('PUT /api/vistoriador/vistorias/:id/status', () => {
    it('deve atualizar status da vistoria', async () => {
      const vistoria = {
        ...mockVistoria,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(mockVistoria)
      };
      
      models.Vistoria.findByPk.mockResolvedValue(vistoria);
      models.StatusVistoria.findOne.mockResolvedValue(mockStatusConcluida);

      const response = await request(app)
        .put('/api/vistoriador/vistorias/1/status')
        .send({ status_id: 3 })
        .expect(200);

      expect(vistoria.update).toHaveBeenCalled();
    });

    it('deve atualizar dados de rascunho', async () => {
      const vistoria = {
        ...mockVistoria,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(mockVistoria)
      };
      
      models.Vistoria.findByPk.mockResolvedValue(vistoria);

      await request(app)
        .put('/api/vistoriador/vistorias/1/status')
        .send({ dados_rascunho: { observacao: 'Teste' } })
        .expect(200);

      expect(vistoria.update).toHaveBeenCalledWith(
        expect.objectContaining({ dados_rascunho: { observacao: 'Teste' } })
      );
    });

    it('deve definir data_conclusao ao marcar como CONCLUIDA', async () => {
      const vistoria = {
        ...mockVistoria,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(mockVistoria)
      };
      
      models.Vistoria.findByPk.mockResolvedValue(vistoria);
      models.StatusVistoria.findOne.mockResolvedValue(mockStatusConcluida);

      await request(app)
        .put('/api/vistoriador/vistorias/1/status')
        .send({ status_id: 3 })
        .expect(200);

      expect(vistoria.update).toHaveBeenCalledWith(
        expect.objectContaining({ data_conclusao: expect.any(Date) })
      );
    });

    it('deve retornar 404 se vistoria não existir', async () => {
      models.Vistoria.findByPk.mockResolvedValue(null);

      await request(app)
        .put('/api/vistoriador/vistorias/999/status')
        .send({ status_id: 2 })
        .expect(404);
    });

    it('deve retornar 403 se não for dono', async () => {
      models.Vistoria.findByPk.mockResolvedValue({ ...mockVistoria, vistoriador_id: 999 });

      await request(app)
        .put('/api/vistoriador/vistorias/1/status')
        .send({ status_id: 2 })
        .expect(403);
    });
  });

  describe('GET /api/vistoriador/vistorias/:id/checklist-status', () => {
    it('deve retornar status do checklist', async () => {
      models.Vistoria.findByPk.mockResolvedValue(mockVistoria);
      models.TipoFotoChecklist.findAll.mockResolvedValue([mockTipoFoto]);
      models.Foto.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/vistoriador/vistorias/1/checklist-status')
        .expect(200);

      expect(response.body).toHaveProperty('checklistStatus');
      expect(response.body).toHaveProperty('resumo');
      expect(response.body.resumo).toHaveProperty('checklistCompleto');
    });

    it('deve calcular progresso corretamente', async () => {
      models.Vistoria.findByPk.mockResolvedValue(mockVistoria);
      models.TipoFotoChecklist.findAll.mockResolvedValue([mockTipoFoto, { ...mockTipoFoto, id: 2 }]);
      models.Foto.findAll.mockResolvedValue([{ tipo_foto_id: 1 }]);

      const response = await request(app)
        .get('/api/vistoriador/vistorias/1/checklist-status')
        .expect(200);

      expect(response.body.resumo.totalObrigatorios).toBe(2);
      expect(response.body.resumo.fotosObrigatoriasTiradas).toBe(1);
      expect(response.body.resumo.progresso).toBe(50);
    });

    it('deve retornar 404 se vistoria não existir', async () => {
      models.Vistoria.findByPk.mockResolvedValue(null);

      await request(app)
        .get('/api/vistoriador/vistorias/999/checklist-status')
        .expect(404);
    });

    it('deve retornar 403 se não for dono', async () => {
      models.Vistoria.findByPk.mockResolvedValue({ ...mockVistoria, vistoriador_id: 999 });

      await request(app)
        .get('/api/vistoriador/vistorias/1/checklist-status')
        .expect(403);
    });
  });

  describe('GET /api/vistoriador/financeiro', () => {
    it('deve retornar resumo financeiro', async () => {
      models.LotePagamento.findAll.mockResolvedValue([mockLotePagamento]);
      models.StatusVistoria.findOne.mockResolvedValue(mockStatusConcluida);
      models.Vistoria.findAll.mockResolvedValue([{ id: 1, valor_vistoriador: 100, data_conclusao: new Date() }]);
      models.VistoriaLotePagamento.findAll.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/vistoriador/financeiro')
        .expect(200);

      expect(response.body).toHaveProperty('recebido');
      expect(response.body).toHaveProperty('pendente');
    });

    it('deve retornar valores zerados se não houver status CONCLUIDA', async () => {
      models.LotePagamento.findAll.mockResolvedValue([]);
      models.StatusVistoria.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/vistoriador/financeiro')
        .expect(200);

      expect(response.body.recebido.total).toBe(0);
      expect(response.body.pendente.total).toBe(0);
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.LotePagamento.findAll.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .get('/api/vistoriador/financeiro')
        .expect(500);
    });
  });
});



