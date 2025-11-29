/**
 * Testes unitários para checklistRoutes - sem dependência de banco de dados
 */

const express = require('express');
const request = require('supertest');

// Mock dos modelos
jest.mock('../../models', () => ({
  ChecklistTemplate: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  ChecklistTemplateItem: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  VistoriaChecklistItem: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  Vistoria: {
    findByPk: jest.fn()
  },
  Embarcacao: {},
  Foto: {},
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true)
  }
}));

// Mock do serviço de upload
jest.mock('../../services/uploadService', () => ({
  getFullPath: jest.fn().mockReturnValue('http://localhost/uploads/test.jpg')
}));

// Mock do middleware de autenticação
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, NivelAcesso: { id: 1, nome: 'ADMINISTRADOR' } };
    req.userInfo = { userId: 1 };
    next();
  },
  requireAdmin: (req, res, next) => next(),
  requireVistoriador: (req, res, next) => next()
}));

const { ChecklistTemplate, ChecklistTemplateItem, VistoriaChecklistItem, Vistoria } = require('../../models');

describe('Checklist Routes - Unit Tests', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    const checklistRoutes = require('../../routes/checklistRoutes');
    app.use('/api/checklists', checklistRoutes);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // ==========================================
  // ROTAS DE TEMPLATES
  // ==========================================
  
  describe('GET /api/checklists/templates', () => {
    it('deve listar templates com sucesso', async () => {
      const mockTemplates = [
        { id: 1, tipo_embarcacao: 'LANCHA', nome: 'Template Lancha' },
        { id: 2, tipo_embarcacao: 'IATE', nome: 'Template Iate' }
      ];
      
      ChecklistTemplate.findAll.mockResolvedValue(mockTemplates);
      
      const response = await request(app).get('/api/checklists/templates');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('deve retornar erro 500 em caso de falha', async () => {
      ChecklistTemplate.findAll.mockRejectedValue(new Error('DB Error'));
      
      const response = await request(app).get('/api/checklists/templates');
      
      expect(response.status).toBe(500);
    });
  });
  
  describe('GET /api/checklists/templates/:tipo_embarcacao', () => {
    it('deve retornar template por tipo de embarcação', async () => {
      const mockTemplate = {
        id: 1,
        tipo_embarcacao: 'LANCHA',
        nome: 'Template Lancha',
        itens: []
      };
      
      ChecklistTemplate.findOne.mockResolvedValue(mockTemplate);
      
      const response = await request(app).get('/api/checklists/templates/LANCHA');
      
      expect(response.status).toBe(200);
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
    });
    
    it('deve retornar 404 para tipo inexistente', async () => {
      ChecklistTemplate.findOne.mockResolvedValue(null);
      
      const response = await request(app).get('/api/checklists/templates/INEXISTENTE');
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('POST /api/checklists/templates', () => {
    it('deve criar template com sucesso', async () => {
      const mockTemplate = {
        id: 1,
        tipo_embarcacao: 'JET_SKI',
        nome: 'Template Jet Ski'
      };
      
      ChecklistTemplate.create.mockResolvedValue(mockTemplate);
      ChecklistTemplate.findByPk.mockResolvedValue({ ...mockTemplate, itens: [] });
      
      const response = await request(app)
        .post('/api/checklists/templates')
        .send({
          tipo_embarcacao: 'JET_SKI',
          nome: 'Template Jet Ski'
        });
      
      expect(response.status).toBe(201);
    });
    
    it('deve retornar 400 sem tipo_embarcacao', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .send({
          nome: 'Template Sem Tipo'
        });
      
      expect(response.status).toBe(400);
    });
    
    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .send({
          tipo_embarcacao: 'LANCHA'
        });
      
      expect(response.status).toBe(400);
    });
    
    it('deve criar template com itens', async () => {
      const mockTemplate = { id: 1, tipo_embarcacao: 'VELEIRO', nome: 'Template Veleiro' };
      
      ChecklistTemplate.create.mockResolvedValue(mockTemplate);
      ChecklistTemplateItem.create.mockResolvedValue({ id: 1 });
      ChecklistTemplate.findByPk.mockResolvedValue({ ...mockTemplate, itens: [{ id: 1 }] });
      
      const response = await request(app)
        .post('/api/checklists/templates')
        .send({
          tipo_embarcacao: 'VELEIRO',
          nome: 'Template Veleiro',
          itens: [
            { ordem: 1, nome: 'Item 1', obrigatorio: true }
          ]
        });
      
      expect(response.status).toBe(201);
    });
  });
  
  describe('PUT /api/checklists/templates/:id', () => {
    it('deve atualizar template existente', async () => {
      const mockTemplate = {
        id: 1,
        nome: 'Template Original',
        update: jest.fn().mockResolvedValue(true)
      };
      
      ChecklistTemplate.findByPk.mockResolvedValue(mockTemplate);
      
      const response = await request(app)
        .put('/api/checklists/templates/1')
        .send({ nome: 'Template Atualizado' });
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 404 para template inexistente', async () => {
      ChecklistTemplate.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/checklists/templates/999')
        .send({ nome: 'Teste' });
      
      expect(response.status).toBe(404);
    });
  });
  
  // ==========================================
  // ROTAS DE ITENS DE TEMPLATE
  // ==========================================
  
  describe('POST /api/checklists/templates/:id/itens', () => {
    it('deve adicionar item ao template', async () => {
      const mockItem = { id: 1, nome: 'Novo Item', ordem: 1 };
      
      ChecklistTemplateItem.create.mockResolvedValue(mockItem);
      
      const response = await request(app)
        .post('/api/checklists/templates/1/itens')
        .send({
          ordem: 1,
          nome: 'Novo Item',
          obrigatorio: true
        });
      
      expect(response.status).toBe(201);
    });
  });
  
  describe('PUT /api/checklists/itens/:id', () => {
    it('deve atualizar item do template', async () => {
      const mockItem = {
        id: 1,
        nome: 'Item Original',
        update: jest.fn().mockResolvedValue(true)
      };
      
      ChecklistTemplateItem.findByPk.mockResolvedValue(mockItem);
      
      const response = await request(app)
        .put('/api/checklists/itens/1')
        .send({ nome: 'Item Atualizado' });
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 404 para item inexistente', async () => {
      ChecklistTemplateItem.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/checklists/itens/999')
        .send({ nome: 'Teste' });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('DELETE /api/checklists/itens/:id', () => {
    it('deve deletar item do template', async () => {
      const mockItem = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };
      
      ChecklistTemplateItem.findByPk.mockResolvedValue(mockItem);
      
      const response = await request(app).delete('/api/checklists/itens/1');
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 404 para item inexistente', async () => {
      ChecklistTemplateItem.findByPk.mockResolvedValue(null);
      
      const response = await request(app).delete('/api/checklists/itens/999');
      
      expect(response.status).toBe(404);
    });
  });
  
  // ==========================================
  // ROTAS DE CHECKLIST DE VISTORIA
  // ==========================================
  
  describe('GET /api/checklists/vistoria/:vistoria_id', () => {
    it('deve listar checklist da vistoria', async () => {
      const mockItens = [
        { id: 1, nome: 'Item 1', status: 'PENDENTE', toJSON: () => ({ id: 1, nome: 'Item 1' }) },
        { id: 2, nome: 'Item 2', status: 'CONCLUIDO', toJSON: () => ({ id: 2, nome: 'Item 2' }) }
      ];
      
      VistoriaChecklistItem.findAll.mockResolvedValue(mockItens);
      
      const response = await request(app).get('/api/checklists/vistoria/1');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  describe('PATCH /api/checklists/vistoria/item/:id/status', () => {
    it('deve atualizar status do item', async () => {
      const mockItem = {
        id: 1,
        status: 'PENDENTE',
        vistoria: { id: 1, vistoriador_id: 1 },
        update: jest.fn().mockResolvedValue(true),
        reload: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1, status: 'CONCLUIDO' })
      };
      
      VistoriaChecklistItem.findByPk.mockResolvedValue(mockItem);
      
      const response = await request(app)
        .patch('/api/checklists/vistoria/item/1/status')
        .send({ status: 'CONCLUIDO' });
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 404 para item inexistente', async () => {
      VistoriaChecklistItem.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .patch('/api/checklists/vistoria/item/999/status')
        .send({ status: 'CONCLUIDO' });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('POST /api/checklists/vistoria/:vistoria_id/itens', () => {
    it('deve adicionar item customizado', async () => {
      const mockItem = { id: 1, nome: 'Item Customizado', status: 'PENDENTE' };
      
      VistoriaChecklistItem.create.mockResolvedValue(mockItem);
      
      const response = await request(app)
        .post('/api/checklists/vistoria/1/itens')
        .send({
          nome: 'Item Customizado',
          ordem: 99
        });
      
      expect(response.status).toBe(201);
    });
  });
  
  describe('GET /api/checklists/vistoria/:vistoria_id/progresso', () => {
    it('deve retornar progresso do checklist', async () => {
      const mockItens = [
        { status: 'CONCLUIDO', obrigatorio: true },
        { status: 'PENDENTE', obrigatorio: false },
        { status: 'NAO_APLICAVEL', obrigatorio: false }
      ];
      
      VistoriaChecklistItem.findAll.mockResolvedValue(mockItens);
      
      const response = await request(app).get('/api/checklists/vistoria/1/progresso');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('concluidos');
      expect(response.body).toHaveProperty('percentual');
    });
  });
  
  describe('POST /api/checklists/vistoria/:vistoria_id/copiar-template', () => {
    it('deve copiar template para vistoria', async () => {
      const mockVistoria = {
        id: 1,
        Embarcacao: { tipo_embarcacao: 'LANCHA' }
      };
      
      const mockTemplate = {
        id: 1,
        tipo_embarcacao: 'LANCHA',
        itens: [
          { id: 1, nome: 'Item 1', ordem: 1, descricao: 'Desc', obrigatorio: true, permite_video: false }
        ]
      };
      
      Vistoria.findByPk.mockResolvedValue(mockVistoria);
      ChecklistTemplate.findOne.mockResolvedValue(mockTemplate);
      VistoriaChecklistItem.create.mockResolvedValue({ id: 1 });
      
      const response = await request(app)
        .post('/api/checklists/vistoria/1/copiar-template');
      
      expect(response.status).toBe(201);
    });
    
    it('deve retornar 404 para vistoria inexistente', async () => {
      Vistoria.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/api/checklists/vistoria/999/copiar-template');
      
      expect(response.status).toBe(404);
    });
  });
});

