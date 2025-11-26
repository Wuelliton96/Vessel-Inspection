const request = require('supertest');
const { sequelize } = require('../../models');
const checklistRoutes = require('../../routes/checklistRoutes');
const { setupCompleteTestEnvironment, createTestApp, createTestVistoriaPadrao, createTestChecklistTemplate } = require('../helpers/testHelpers');

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

    const templateData = await createTestChecklistTemplate('JET_SKI');
    template = templateData.template;
    templateItem = templateData.templateItem;
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
      const { vistoria } = await createTestVistoriaPadrao(vistoriador, admin);

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

