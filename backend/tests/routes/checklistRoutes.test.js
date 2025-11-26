const request = require('supertest');
const { sequelize, ChecklistTemplate, ChecklistTemplateItem, VistoriaChecklistItem, Vistoria, Embarcacao, Local, StatusVistoria } = require('../../models');
const checklistRoutes = require('../../routes/checklistRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/checklists', router: checklistRoutes });

describe('Rotas de Checklist', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;
  let template, templateItem;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('checklist');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;

    template = await ChecklistTemplate.create({
      tipo_embarcacao: 'JET_SKI',
      nome: 'Checklist Jet Ski',
      descricao: 'Checklist para vistoria de Jet Ski',
      ativo: true
    });

    templateItem = await ChecklistTemplateItem.create({
      checklist_template_id: template.id,
      ordem: 1,
      nome: 'Casco',
      descricao: 'Verificar estado do casco',
      obrigatorio: true,
      permite_video: false,
      ativo: true
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/checklists/templates', () => {
    it('deve listar templates (vistoriador)', async () => {
      const response = await request(app)
        .get('/api/checklists/templates')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/checklists/templates');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/checklists/templates/:tipo_embarcacao', () => {
    it('deve buscar template por tipo de embarcação', async () => {
      const response = await request(app)
        .get('/api/checklists/templates/JET_SKI')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tipo_embarcacao).toBe('JET_SKI');
    });

    it('deve retornar 404 para tipo inexistente', async () => {
      const response = await request(app)
        .get('/api/checklists/templates/TIPO_INEXISTENTE')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/checklists/vistoria/:vistoria_id', () => {
    it('deve buscar checklist de uma vistoria', async () => {
      const status = await StatusVistoria.create({ nome: 'EM_ANDAMENTO', descricao: 'Em andamento' });
      const embarcacao = await Embarcacao.create({ nome: 'Barco Test', nr_inscricao_barco: 'TEST001' });
      const local = await Local.create({ tipo: 'MARINA', nome_local: 'Marina Test' });
      
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: status.id
      });

      const response = await request(app)
        .get(`/api/checklists/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .get('/api/checklists/vistoria/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });
});

