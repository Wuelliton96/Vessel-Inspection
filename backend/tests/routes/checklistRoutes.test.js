const request = require('supertest');
const { sequelize, ChecklistTemplate, ChecklistTemplateItem, VistoriaChecklistItem, Vistoria } = require('../../models');
const checklistRoutes = require('../../routes/checklistRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/checklists', router: checklistRoutes });

describe('Rotas de Checklists - Testes Adicionais', () => {
  let adminToken, vistoriadorToken;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('checklist');
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await VistoriaChecklistItem.destroy({ where: {}, force: true });
    await ChecklistTemplateItem.destroy({ where: {}, force: true });
    await ChecklistTemplate.destroy({ where: {}, force: true });
  });

  describe('GET /api/checklists/templates', () => {
    it('deve listar templates com itens', async () => {
      const template = await ChecklistTemplate.create({
        tipo_embarcacao: 'LANCHA',
        nome: 'Template Lancha',
        ativo: true
      });

      await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        nome: 'Item 1',
        ordem: 1,
        ativo: true
      });

      const response = await request(app)
        .get('/api/checklists/templates')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      const foundTemplate = response.body.find(t => t.id === template.id);
      expect(foundTemplate).toBeDefined();
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/checklists/templates');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/checklists/templates/:tipo_embarcacao', () => {
    it('deve retornar template por tipo', async () => {
      const template = await ChecklistTemplate.create({
        tipo_embarcacao: 'IATE',
        nome: 'Template Iate',
        ativo: true
      });

      await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        nome: 'Item Iate',
        ordem: 1,
        ativo: true
      });

      const response = await request(app)
        .get('/api/checklists/templates/IATE')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tipo_embarcacao).toBe('IATE');
      expect(response.body.itens).toBeDefined();
    });

    it('deve retornar 404 para tipo não encontrado', async () => {
      const response = await request(app)
        .get('/api/checklists/templates/TIPO_INEXISTENTE')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/checklists/templates', () => {
    it('deve criar template com itens (admin)', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_embarcacao: 'LANCHA',
          nome: 'Novo Template',
          descricao: 'Descrição do template',
          itens: [
            { nome: 'Item 1', ordem: 1 },
            { nome: 'Item 2', ordem: 2 }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('Novo Template');
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('deve exigir permissão de admin', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          tipo_embarcacao: 'LANCHA',
          nome: 'Test'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/checklists/templates/:id', () => {
    it('deve atualizar template (admin)', async () => {
      const template = await ChecklistTemplate.create({
        tipo_embarcacao: 'LANCHA',
        nome: 'Template Original',
        ativo: true
      });

      const response = await request(app)
        .put(`/api/checklists/templates/${template.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Template Atualizado',
          descricao: 'Nova descrição'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Template Atualizado');
    });
  });

  describe('GET /api/checklists/vistoria/:vistoriaId', () => {
    it('deve retornar checklist de vistoria', async () => {
      const { createTestVistoriaPadrao } = require('../helpers/testHelpers');
      const vistoria = await createTestVistoriaPadrao();

      const template = await ChecklistTemplate.create({
        tipo_embarcacao: 'LANCHA',
        nome: 'Template',
        ativo: true
      });

      const item = await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        nome: 'Item',
        ordem: 1,
        ativo: true
      });

      await VistoriaChecklistItem.create({
        vistoria_id: vistoria.id,
        checklist_template_item_id: item.id,
        resposta: 'OK'
      });

      const response = await request(app)
        .get(`/api/checklists/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .get('/api/checklists/vistoria/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/checklists/vistoria/:vistoriaId', () => {
    it('deve salvar checklist de vistoria', async () => {
      const { createTestVistoriaPadrao } = require('../helpers/testHelpers');
      const vistoria = await createTestVistoriaPadrao();

      const template = await ChecklistTemplate.create({
        tipo_embarcacao: 'LANCHA',
        nome: 'Template',
        ativo: true
      });

      const item = await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        nome: 'Item',
        ordem: 1,
        ativo: true
      });

      const response = await request(app)
        .post(`/api/checklists/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          itens: [
            {
              checklist_template_item_id: item.id,
              resposta: 'OK',
              observacoes: 'Tudo certo'
            }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });
});
