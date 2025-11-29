/**
 * Testes extendidos para checklistRoutes.js
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

// Mock do uploadService
jest.mock('../../services/uploadService', () => ({
  getFullPath: jest.fn((filename, vistoriaId) => `/uploads/fotos/vistoria-${vistoriaId}/${filename}`)
}));

// Mock dos models
const mockTemplate = {
  id: 1,
  tipo_embarcacao: 'LANCHA',
  nome: 'Template Lancha',
  descricao: 'Template para lanchas',
  ativo: true,
  itens: [
    { id: 1, ordem: 1, nome: 'Item 1', obrigatorio: true, ativo: true }
  ],
  update: jest.fn().mockResolvedValue(true)
};

const mockTemplateItem = {
  id: 1,
  checklist_template_id: 1,
  ordem: 1,
  nome: 'Item 1',
  descricao: 'Descrição do item',
  obrigatorio: true,
  permite_video: false,
  ativo: true,
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true)
};

const mockVistoriaChecklistItem = {
  id: 1,
  vistoria_id: 1,
  nome: 'Item 1',
  status: 'PENDENTE',
  obrigatorio: true,
  foto_id: null,
  foto: null,
  vistoria: { id: 1, vistoriador_id: 1 },
  update: jest.fn().mockResolvedValue(true),
  reload: jest.fn().mockResolvedValue(true),
  toJSON: function() { return { ...this, toJSON: undefined, update: undefined, reload: undefined }; }
};

const mockVistoria = {
  id: 1,
  vistoriador_id: 1,
  Embarcacao: { tipo_embarcacao: 'LANCHA' }
};

jest.mock('../../models', () => ({
  ChecklistTemplate: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  ChecklistTemplateItem: {
    findByPk: jest.fn(),
    create: jest.fn()
  },
  VistoriaChecklistItem: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  Vistoria: {
    findByPk: jest.fn()
  },
  Embarcacao: {},
  Foto: {}
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
  },
  requireVistoriador: (req, res, next) => next()
}));

const { ChecklistTemplate, ChecklistTemplateItem, VistoriaChecklistItem, Vistoria } = require('../../models');

describe('ChecklistRoutes - Testes Extendidos', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    const checklistRoutes = require('../../routes/checklistRoutes');
    app.use('/api/checklists', checklistRoutes);
    
    app.use((err, req, res, next) => {
      res.status(500).json({ error: err.message });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset default mocks
    ChecklistTemplate.findAll.mockResolvedValue([mockTemplate]);
    ChecklistTemplate.findOne.mockResolvedValue(mockTemplate);
    ChecklistTemplate.findByPk.mockResolvedValue(mockTemplate);
    ChecklistTemplate.create.mockResolvedValue(mockTemplate);
    ChecklistTemplateItem.findByPk.mockResolvedValue(mockTemplateItem);
    ChecklistTemplateItem.create.mockResolvedValue(mockTemplateItem);
    VistoriaChecklistItem.findAll.mockResolvedValue([mockVistoriaChecklistItem]);
    VistoriaChecklistItem.findByPk.mockResolvedValue(mockVistoriaChecklistItem);
    VistoriaChecklistItem.create.mockResolvedValue(mockVistoriaChecklistItem);
    Vistoria.findByPk.mockResolvedValue(mockVistoria);
  });

  // ==========================================
  // ROTAS DE TEMPLATES
  // ==========================================

  describe('GET /api/checklists/templates', () => {
    it('deve listar todos os templates', async () => {
      const response = await request(app).get('/api/checklists/templates');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar array vazio quando não há templates', async () => {
      ChecklistTemplate.findAll.mockResolvedValue([]);
      
      const response = await request(app).get('/api/checklists/templates');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('deve tratar erro de banco de dados', async () => {
      ChecklistTemplate.findAll.mockRejectedValue(new Error('Database error'));
      
      const response = await request(app).get('/api/checklists/templates');
      
      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/checklists/templates/:tipo_embarcacao', () => {
    it('deve retornar template por tipo', async () => {
      const response = await request(app).get('/api/checklists/templates/LANCHA');
      
      expect(response.status).toBe(200);
      expect(ChecklistTemplate.findOne).toHaveBeenCalled();
    });

    it('deve retornar 404 para template inexistente', async () => {
      ChecklistTemplate.findOne.mockResolvedValue(null);
      
      const response = await request(app).get('/api/checklists/templates/INEXISTENTE');
      
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/checklists/templates', () => {
    it('deve criar novo template', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .send({
          tipo_embarcacao: 'NOVO_TIPO',
          nome: 'Novo Template',
          descricao: 'Descrição',
          itens: [
            { ordem: 1, nome: 'Item 1', obrigatorio: true }
          ]
        });
      
      expect(response.status).toBe(201);
    });

    it('deve retornar 400 sem tipo_embarcacao', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .send({
          nome: 'Novo Template'
        });
      
      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .send({
          tipo_embarcacao: 'NOVO_TIPO'
        });
      
      expect(response.status).toBe(400);
    });

    it('deve criar template sem itens', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .send({
          tipo_embarcacao: 'NOVO_TIPO',
          nome: 'Template Sem Itens'
        });
      
      expect(response.status).toBe(201);
    });
  });

  describe('PUT /api/checklists/templates/:id', () => {
    it('deve atualizar template', async () => {
      const templateParaAtualizar = {
        ...mockTemplate,
        update: jest.fn().mockResolvedValue(true)
      };
      ChecklistTemplate.findByPk.mockResolvedValue(templateParaAtualizar);
      
      const response = await request(app)
        .put('/api/checklists/templates/1')
        .send({ nome: 'Template Atualizado' });
      
      expect(response.status).toBe(200);
      expect(templateParaAtualizar.update).toHaveBeenCalled();
    });

    it('deve retornar 404 para template inexistente', async () => {
      ChecklistTemplate.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/checklists/templates/99999')
        .send({ nome: 'Template Atualizado' });
      
      expect(response.status).toBe(404);
    });

    it('deve atualizar campo ativo', async () => {
      const templateParaAtualizar = {
        ...mockTemplate,
        update: jest.fn().mockResolvedValue(true)
      };
      ChecklistTemplate.findByPk.mockResolvedValue(templateParaAtualizar);
      
      const response = await request(app)
        .put('/api/checklists/templates/1')
        .send({ ativo: false });
      
      expect(response.status).toBe(200);
    });
  });

  // ==========================================
  // ROTAS DE ITENS DE TEMPLATE
  // ==========================================

  describe('POST /api/checklists/templates/:id/itens', () => {
    it('deve adicionar item ao template', async () => {
      const response = await request(app)
        .post('/api/checklists/templates/1/itens')
        .send({
          ordem: 2,
          nome: 'Novo Item',
          descricao: 'Descrição do novo item',
          obrigatorio: true
        });
      
      expect(response.status).toBe(201);
    });

    it('deve criar item com permite_video', async () => {
      const response = await request(app)
        .post('/api/checklists/templates/1/itens')
        .send({
          ordem: 2,
          nome: 'Item com Vídeo',
          permite_video: true
        });
      
      expect(response.status).toBe(201);
    });
  });

  describe('PUT /api/checklists/itens/:id', () => {
    it('deve atualizar item do template', async () => {
      const itemParaAtualizar = {
        ...mockTemplateItem,
        update: jest.fn().mockResolvedValue(true)
      };
      ChecklistTemplateItem.findByPk.mockResolvedValue(itemParaAtualizar);
      
      const response = await request(app)
        .put('/api/checklists/itens/1')
        .send({ nome: 'Item Atualizado' });
      
      expect(response.status).toBe(200);
      expect(itemParaAtualizar.update).toHaveBeenCalled();
    });

    it('deve retornar 404 para item inexistente', async () => {
      ChecklistTemplateItem.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/checklists/itens/99999')
        .send({ nome: 'Item Atualizado' });
      
      expect(response.status).toBe(404);
    });

    it('deve atualizar múltiplos campos', async () => {
      const itemParaAtualizar = {
        ...mockTemplateItem,
        update: jest.fn().mockResolvedValue(true)
      };
      ChecklistTemplateItem.findByPk.mockResolvedValue(itemParaAtualizar);
      
      const response = await request(app)
        .put('/api/checklists/itens/1')
        .send({
          ordem: 5,
          nome: 'Novo Nome',
          descricao: 'Nova Descrição',
          obrigatorio: false,
          permite_video: true,
          ativo: false
        });
      
      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/checklists/itens/:id', () => {
    it('deve excluir item do template', async () => {
      const itemParaExcluir = {
        ...mockTemplateItem,
        destroy: jest.fn().mockResolvedValue(true)
      };
      ChecklistTemplateItem.findByPk.mockResolvedValue(itemParaExcluir);
      
      const response = await request(app).delete('/api/checklists/itens/1');
      
      expect(response.status).toBe(200);
      expect(itemParaExcluir.destroy).toHaveBeenCalled();
    });

    it('deve retornar 404 para item inexistente', async () => {
      ChecklistTemplateItem.findByPk.mockResolvedValue(null);
      
      const response = await request(app).delete('/api/checklists/itens/99999');
      
      expect(response.status).toBe(404);
    });
  });

  // ==========================================
  // ROTAS DE CHECKLIST DE VISTORIA
  // ==========================================

  describe('POST /api/checklists/vistoria/:vistoria_id/copiar-template', () => {
    it('deve copiar template para vistoria', async () => {
      const response = await request(app)
        .post('/api/checklists/vistoria/1/copiar-template');
      
      expect(response.status).toBe(201);
      expect(VistoriaChecklistItem.create).toHaveBeenCalled();
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      Vistoria.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/checklists/vistoria/99999/copiar-template');
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 400 quando tipo de embarcação não definido', async () => {
      const vistoriaSemTipo = {
        id: 1,
        Embarcacao: { tipo_embarcacao: null }
      };
      Vistoria.findByPk.mockResolvedValue(vistoriaSemTipo);
      
      const response = await request(app)
        .post('/api/checklists/vistoria/1/copiar-template');
      
      expect(response.status).toBe(400);
    });

    it('deve retornar 404 quando template não encontrado', async () => {
      ChecklistTemplate.findOne.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/checklists/vistoria/1/copiar-template');
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 404 quando template não tem itens', async () => {
      const templateSemItens = { ...mockTemplate, itens: [] };
      ChecklistTemplate.findOne.mockResolvedValue(templateSemItens);
      
      const response = await request(app)
        .post('/api/checklists/vistoria/1/copiar-template');
      
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/checklists/vistoria/:vistoria_id', () => {
    it('deve listar checklist da vistoria', async () => {
      const response = await request(app)
        .get('/api/checklists/vistoria/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve incluir url_completa para fotos', async () => {
      const itemComFoto = {
        ...mockVistoriaChecklistItem,
        foto: { id: 1, url_arquivo: 'foto.jpg' },
        toJSON: function() { return { ...this, toJSON: undefined }; }
      };
      VistoriaChecklistItem.findAll.mockResolvedValue([itemComFoto]);
      
      const response = await request(app)
        .get('/api/checklists/vistoria/1');
      
      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /api/checklists/vistoria/item/:id/status', () => {
    it('deve atualizar status do item', async () => {
      const itemParaAtualizar = {
        ...mockVistoriaChecklistItem,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true)
      };
      VistoriaChecklistItem.findByPk.mockResolvedValue(itemParaAtualizar);
      
      const response = await request(app)
        .patch('/api/checklists/vistoria/item/1/status')
        .send({ status: 'CONCLUIDO' });
      
      expect(response.status).toBe(200);
    });

    it('deve retornar 404 para item inexistente', async () => {
      VistoriaChecklistItem.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .patch('/api/checklists/vistoria/item/99999/status')
        .send({ status: 'CONCLUIDO' });
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 403 quando usuário não tem acesso', async () => {
      const itemOutroUsuario = {
        ...mockVistoriaChecklistItem,
        vistoria: { id: 1, vistoriador_id: 999 }
      };
      VistoriaChecklistItem.findByPk.mockResolvedValue(itemOutroUsuario);
      
      const appNonAdmin = express();
      appNonAdmin.use(express.json());
      appNonAdmin.use((req, res, next) => {
        req.user = { id: 1, NivelAcesso: { id: 2 } };
        next();
      });
      const checklistRoutes = require('../../routes/checklistRoutes');
      appNonAdmin.use('/api/checklists', checklistRoutes);
      
      const response = await request(appNonAdmin)
        .patch('/api/checklists/vistoria/item/1/status')
        .send({ status: 'CONCLUIDO' });
      
      expect(response.status).toBe(403);
    });

    it('deve definir concluido_em ao marcar como CONCLUIDO', async () => {
      const itemParaAtualizar = {
        ...mockVistoriaChecklistItem,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true)
      };
      VistoriaChecklistItem.findByPk.mockResolvedValue(itemParaAtualizar);
      
      await request(app)
        .patch('/api/checklists/vistoria/item/1/status')
        .send({ status: 'CONCLUIDO' });
      
      expect(itemParaAtualizar.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'CONCLUIDO',
          concluido_em: expect.any(Date)
        })
      );
    });

    it('deve limpar concluido_em ao voltar para PENDENTE', async () => {
      const itemParaAtualizar = {
        ...mockVistoriaChecklistItem,
        status: 'CONCLUIDO',
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true)
      };
      VistoriaChecklistItem.findByPk.mockResolvedValue(itemParaAtualizar);
      
      await request(app)
        .patch('/api/checklists/vistoria/item/1/status')
        .send({ status: 'PENDENTE' });
      
      expect(itemParaAtualizar.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDENTE',
          concluido_em: null
        })
      );
    });

    it('deve atualizar foto_id', async () => {
      const itemParaAtualizar = {
        ...mockVistoriaChecklistItem,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true)
      };
      VistoriaChecklistItem.findByPk.mockResolvedValue(itemParaAtualizar);
      
      await request(app)
        .patch('/api/checklists/vistoria/item/1/status')
        .send({ status: 'CONCLUIDO', foto_id: 123 });
      
      expect(itemParaAtualizar.update).toHaveBeenCalledWith(
        expect.objectContaining({ foto_id: 123 })
      );
    });

    it('deve atualizar observacao', async () => {
      const itemParaAtualizar = {
        ...mockVistoriaChecklistItem,
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true)
      };
      VistoriaChecklistItem.findByPk.mockResolvedValue(itemParaAtualizar);
      
      await request(app)
        .patch('/api/checklists/vistoria/item/1/status')
        .send({ observacao: 'Nova observação' });
      
      expect(itemParaAtualizar.update).toHaveBeenCalledWith(
        expect.objectContaining({ observacao: 'Nova observação' })
      );
    });
  });

  describe('POST /api/checklists/vistoria/:vistoria_id/itens', () => {
    it('deve adicionar item customizado', async () => {
      const response = await request(app)
        .post('/api/checklists/vistoria/1/itens')
        .send({
          ordem: 10,
          nome: 'Item Customizado',
          descricao: 'Descrição',
          obrigatorio: false
        });
      
      expect(response.status).toBe(201);
    });
  });

  describe('GET /api/checklists/vistoria/:vistoria_id/progresso', () => {
    it('deve retornar progresso do checklist', async () => {
      const itens = [
        { status: 'CONCLUIDO', obrigatorio: true },
        { status: 'PENDENTE', obrigatorio: true },
        { status: 'NAO_APLICAVEL', obrigatorio: false }
      ];
      VistoriaChecklistItem.findAll.mockResolvedValue(itens);
      
      const response = await request(app)
        .get('/api/checklists/vistoria/1/progresso');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total', 3);
      expect(response.body).toHaveProperty('concluidos', 1);
      expect(response.body).toHaveProperty('pendentes', 1);
      expect(response.body).toHaveProperty('naoAplicaveis', 1);
      expect(response.body).toHaveProperty('percentual');
      expect(response.body).toHaveProperty('podeAprovar');
    });

    it('deve calcular percentual corretamente', async () => {
      const itens = [
        { status: 'CONCLUIDO', obrigatorio: true },
        { status: 'CONCLUIDO', obrigatorio: true }
      ];
      VistoriaChecklistItem.findAll.mockResolvedValue(itens);
      
      const response = await request(app)
        .get('/api/checklists/vistoria/1/progresso');
      
      expect(response.body.percentual).toBe(100);
      expect(response.body.podeAprovar).toBe(true);
    });

    it('deve retornar 0% quando vazio', async () => {
      VistoriaChecklistItem.findAll.mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/checklists/vistoria/1/progresso');
      
      expect(response.body.percentual).toBe(0);
    });
  });
});

