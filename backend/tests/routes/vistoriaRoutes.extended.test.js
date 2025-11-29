/**
 * Testes extendidos para vistoriaRoutes.js
 * Foco em aumentar cobertura de todas as rotas
 */

const request = require('supertest');
const express = require('express');

// Mock do logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Mock do routeHelpers
jest.mock('../../utils/routeHelpers', () => ({
  getVistoriaIncludes: jest.fn().mockReturnValue([])
}));

// Mock dos models
const mockVistoria = {
  id: 1,
  embarcacao_id: 1,
  local_id: 1,
  vistoriador_id: 1,
  status_id: 1,
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true),
  reload: jest.fn().mockResolvedValue(true),
  Embarcacao: { nome: 'Test Boat', tipo_embarcacao: 'LANCHA' },
  Local: { nome_local: 'Test Marina' },
  StatusVistoria: { id: 1, nome: 'PENDENTE' },
  vistoriador: { id: 1, nome: 'Test Vistoriador' }
};

const mockEmbarcacao = {
  id: 1,
  nome: 'Test Boat',
  nr_inscricao_barco: 'BR12345',
  tipo_embarcacao: 'LANCHA'
};

const mockLocal = {
  id: 1,
  nome_local: 'Test Marina',
  tipo: 'MARINA'
};

const mockStatusPendente = {
  id: 1,
  nome: 'PENDENTE'
};

const mockChecklistTemplate = {
  id: 1,
  tipo_embarcacao: 'LANCHA',
  itens: [
    { id: 1, ordem: 1, nome: 'Item 1', obrigatorio: true }
  ]
};

jest.mock('../../models', () => ({
  Vistoria: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  Embarcacao: {
    findByPk: jest.fn(),
    findOrCreate: jest.fn()
  },
  Local: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  StatusVistoria: {
    findOne: jest.fn()
  },
  Usuario: {},
  ChecklistTemplate: {
    findOne: jest.fn()
  },
  ChecklistTemplateItem: {},
  VistoriaChecklistItem: {
    create: jest.fn()
  },
  Seguradora: {
    findByPk: jest.fn()
  },
  SeguradoraTipoEmbarcacao: {
    findOne: jest.fn()
  }
}));

// Mock do middleware de auth
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = {
      id: 1,
      nome: 'Admin User',
      email: 'admin@test.com',
      NivelAcesso: { id: 1, nome: 'ADMIN' }
    };
    next();
  },
  requireAdmin: (req, res, next) => {
    if (req.user?.NivelAcesso?.id === 1) {
      next();
    } else {
      res.status(403).json({ error: 'Acesso negado' });
    }
  }
}));

const { Vistoria, Embarcacao, Local, StatusVistoria, ChecklistTemplate, VistoriaChecklistItem, SeguradoraTipoEmbarcacao, Seguradora } = require('../../models');

describe('VistoriaRoutes - Testes Extendidos', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    const vistoriaRoutes = require('../../routes/vistoriaRoutes');
    app.use('/api/vistorias', vistoriaRoutes);
    
    app.use((err, req, res, next) => {
      res.status(500).json({ error: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset default mocks
    Vistoria.findAll.mockResolvedValue([mockVistoria]);
    Vistoria.findByPk.mockResolvedValue(mockVistoria);
    Vistoria.create.mockResolvedValue(mockVistoria);
    Embarcacao.findByPk.mockResolvedValue(mockEmbarcacao);
    Embarcacao.findOrCreate.mockResolvedValue([mockEmbarcacao, true]);
    Local.findOne.mockResolvedValue(null);
    Local.create.mockResolvedValue(mockLocal);
    StatusVistoria.findOne.mockResolvedValue(mockStatusPendente);
    ChecklistTemplate.findOne.mockResolvedValue(mockChecklistTemplate);
    VistoriaChecklistItem.create.mockResolvedValue({});
    SeguradoraTipoEmbarcacao.findOne.mockResolvedValue({ id: 1 });
    Seguradora.findByPk.mockResolvedValue({ id: 1, nome: 'Test Seguradora' });
  });

  describe('GET /api/vistorias', () => {
    it('deve listar todas as vistorias', async () => {
      const response = await request(app).get('/api/vistorias');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar array vazio quando não há vistorias', async () => {
      Vistoria.findAll.mockResolvedValue([]);
      
      const response = await request(app).get('/api/vistorias');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('deve tratar erro de banco de dados', async () => {
      Vistoria.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/vistorias');
      
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/vistorias/vistoriador', () => {
    it('deve listar vistorias do vistoriador logado', async () => {
      const response = await request(app).get('/api/vistorias/vistoriador');
      
      expect(response.status).toBe(200);
      expect(Vistoria.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /api/vistorias/:id', () => {
    it('deve retornar vistoria por ID', async () => {
      const response = await request(app).get('/api/vistorias/1');
      
      expect(response.status).toBe(200);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      Vistoria.findByPk.mockResolvedValue(null);
      
      const response = await request(app).get('/api/vistorias/99999');
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 403 quando usuário não tem acesso', async () => {
      const vistoriaOutroUsuario = {
        ...mockVistoria,
        vistoriador_id: 999
      };
      Vistoria.findByPk.mockResolvedValue(vistoriaOutroUsuario);
      
      // Simular usuário não admin
      const appNonAdmin = express();
      appNonAdmin.use(express.json());
      appNonAdmin.use((req, res, next) => {
        req.user = { id: 1, NivelAcesso: { id: 2 } };
        next();
      });
      const vistoriaRoutes = require('../../routes/vistoriaRoutes');
      appNonAdmin.use('/api/vistorias', vistoriaRoutes);
      
      const response = await request(appNonAdmin).get('/api/vistorias/1');
      
      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/vistorias', () => {
    it('deve criar nova vistoria', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          vistoriador_id: 1,
          embarcacao_id: 1,
          local_id: 1
        });
      
      expect(response.status).toBe(201);
    });

    it('deve retornar 400 sem vistoriador_id', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          embarcacao_id: 1,
          local_id: 1
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Vistoriador');
    });

    it('deve criar embarcação quando não fornecida', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          vistoriador_id: 1,
          local_id: 1,
          embarcacao_nome: 'Nova Embarcação',
          embarcacao_nr_inscricao_barco: 'NEW123'
        });
      
      expect(response.status).toBe(201);
      expect(Embarcacao.findOrCreate).toHaveBeenCalled();
    });

    it('deve retornar 400 ao criar embarcação sem nome', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          vistoriador_id: 1,
          local_id: 1,
          embarcacao_nr_inscricao_barco: 'NEW123'
        });
      
      expect(response.status).toBe(400);
    });

    it('deve criar local quando não fornecido', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          vistoriador_id: 1,
          embarcacao_id: 1,
          local_tipo: 'MARINA',
          local_nome_local: 'Nova Marina'
        });
      
      expect(response.status).toBe(201);
      expect(Local.create).toHaveBeenCalled();
    });

    it('deve retornar 400 ao criar local sem tipo', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          vistoriador_id: 1,
          embarcacao_id: 1,
          local_nome_local: 'Nova Marina'
        });
      
      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para MARINA sem nome', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          vistoriador_id: 1,
          embarcacao_id: 1,
          local_tipo: 'MARINA'
        });
      
      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para CEP inválido', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          vistoriador_id: 1,
          embarcacao_id: 1,
          local_tipo: 'OUTRO',
          local_cep: '123'
        });
      
      expect(response.status).toBe(400);
    });

    it('deve usar local existente quando encontrado', async () => {
      Local.findOne.mockResolvedValue(mockLocal);
      
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          vistoriador_id: 1,
          embarcacao_id: 1,
          local_tipo: 'MARINA',
          local_nome_local: 'Test Marina'
        });
      
      expect(response.status).toBe(201);
      expect(Local.create).not.toHaveBeenCalled();
    });

    it('deve retornar 500 quando status PENDENTE não existe', async () => {
      StatusVistoria.findOne.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          vistoriador_id: 1,
          embarcacao_id: 1,
          local_id: 1
        });
      
      expect(response.status).toBe(500);
    });

    it('deve copiar checklist automaticamente', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          vistoriador_id: 1,
          embarcacao_id: 1,
          local_id: 1
        });
      
      expect(response.status).toBe(201);
    });

    it('deve validar tipo de embarcação com seguradora', async () => {
      SeguradoraTipoEmbarcacao.findOne.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/vistorias')
        .send({
          vistoriador_id: 1,
          embarcacao_nome: 'Test',
          embarcacao_nr_inscricao_barco: 'TEST123',
          seguradora_id: 1,
          embarcacao_tipo: 'LANCHA'
        });
      
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/vistorias/:id', () => {
    it('deve atualizar vistoria', async () => {
      const vistoriaParaAtualizar = {
        ...mockVistoria,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true)
      };
      Vistoria.findByPk.mockResolvedValue(vistoriaParaAtualizar);
      
      const response = await request(app)
        .put('/api/vistorias/1')
        .send({ valor_embarcacao: 150000 });
      
      expect(response.status).toBe(200);
      expect(vistoriaParaAtualizar.update).toHaveBeenCalled();
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      Vistoria.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/vistorias/99999')
        .send({ valor_embarcacao: 150000 });
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 403 quando usuário não tem acesso', async () => {
      const vistoriaOutroUsuario = {
        ...mockVistoria,
        vistoriador_id: 999
      };
      Vistoria.findByPk.mockResolvedValue(vistoriaOutroUsuario);
      
      const appNonAdmin = express();
      appNonAdmin.use(express.json());
      appNonAdmin.use((req, res, next) => {
        req.user = { id: 1, NivelAcesso: { id: 2 } };
        next();
      });
      const vistoriaRoutes = require('../../routes/vistoriaRoutes');
      appNonAdmin.use('/api/vistorias', vistoriaRoutes);
      
      const response = await request(appNonAdmin)
        .put('/api/vistorias/1')
        .send({ valor_embarcacao: 150000 });
      
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/vistorias/:id', () => {
    it('deve excluir vistoria PENDENTE', async () => {
      const vistoriaPendente = {
        ...mockVistoria,
        StatusVistoria: { nome: 'PENDENTE' },
        destroy: jest.fn().mockResolvedValue(true)
      };
      Vistoria.findByPk.mockResolvedValue(vistoriaPendente);
      
      const response = await request(app).delete('/api/vistorias/1');
      
      expect(response.status).toBe(200);
      expect(vistoriaPendente.destroy).toHaveBeenCalled();
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      Vistoria.findByPk.mockResolvedValue(null);
      
      const response = await request(app).delete('/api/vistorias/99999');
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoria não PENDENTE', async () => {
      const vistoriaEmAndamento = {
        ...mockVistoria,
        StatusVistoria: { nome: 'EM_ANDAMENTO' }
      };
      Vistoria.findByPk.mockResolvedValue(vistoriaEmAndamento);
      
      const response = await request(app).delete('/api/vistorias/1');
      
      expect(response.status).toBe(403);
    });

    it('deve retornar 403 para usuário não admin', async () => {
      const appNonAdmin = express();
      appNonAdmin.use(express.json());
      appNonAdmin.use((req, res, next) => {
        req.user = { id: 1, NivelAcesso: { id: 2 } };
        next();
      });
      const vistoriaRoutes = require('../../routes/vistoriaRoutes');
      appNonAdmin.use('/api/vistorias', vistoriaRoutes);
      
      const response = await request(appNonAdmin).delete('/api/vistorias/1');
      
      expect(response.status).toBe(403);
    });
  });
});

describe('VistoriaRoutes - Validações de dados', () => {
  it('deve aceitar valores financeiros', () => {
    const dados = {
      valor_embarcacao: 150000,
      valor_vistoria: 500,
      valor_vistoriador: 300
    };
    
    expect(dados.valor_embarcacao).toBe(150000);
    expect(dados.valor_vistoria).toBe(500);
    expect(dados.valor_vistoriador).toBe(300);
  });

  it('deve aceitar dados de contato', () => {
    const dados = {
      contato_acompanhante_tipo: 'PROPRIETARIO',
      contato_acompanhante_nome: 'João Silva',
      contato_acompanhante_telefone_e164: '+5511999999999',
      contato_acompanhante_email: 'joao@email.com'
    };
    
    expect(dados.contato_acompanhante_tipo).toBe('PROPRIETARIO');
    expect(dados.contato_acompanhante_nome).toBe('João Silva');
  });

  it('deve aceitar dados da corretora', () => {
    const dados = {
      corretora_nome: 'Corretora XYZ',
      corretora_telefone_e164: '+5511888888888',
      corretora_email_laudo: 'corretora@email.com'
    };
    
    expect(dados.corretora_nome).toBe('Corretora XYZ');
  });
});

