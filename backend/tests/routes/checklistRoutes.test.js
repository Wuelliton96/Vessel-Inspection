const request = require('supertest');
const { sequelize, ChecklistTemplate, ChecklistTemplateItem, VistoriaChecklistItem, Vistoria, Embarcacao, Local, StatusVistoria, Cliente } = require('../../models');
const checklistRoutes = require('../../routes/checklistRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/checklists', router: checklistRoutes });

describe('Rotas de Checklist', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;
  let statusVistoria;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('checklist');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;

    statusVistoria = await StatusVistoria.findOne({ where: { nome: 'EM_ANDAMENTO' } }) ||
      await StatusVistoria.create({ nome: 'EM_ANDAMENTO' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // ROTAS DE TEMPLATES
  // ==========================================

  describe('GET /api/checklists/templates', () => {
    it('deve listar templates (admin)', async () => {
      const response = await request(app)
        .get('/api/checklists/templates')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve listar templates (vistoriador)', async () => {
      const response = await request(app)
        .get('/api/checklists/templates')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/checklists/templates');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/checklists/templates/:tipo_embarcacao', () => {
    beforeEach(async () => {
      await ChecklistTemplateItem.destroy({ where: {} });
      await ChecklistTemplate.destroy({ where: {} });
    });

    it('deve buscar template por tipo de embarcação', async () => {
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
        .get('/api/checklists/templates/LANCHA')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
      expect(response.body.itens).toBeDefined();
    });

    it('deve retornar 404 para tipo inexistente', async () => {
      const response = await request(app)
        .get('/api/checklists/templates/INEXISTENTE')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/checklists/templates', () => {
    beforeEach(async () => {
      await ChecklistTemplateItem.destroy({ where: {} });
      await ChecklistTemplate.destroy({ where: {} });
    });

    it('admin deve criar template', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_embarcacao: 'IATE',
          nome: 'Template Iate',
          descricao: 'Template para iates',
          itens: [
            { ordem: 1, nome: 'Item 1', obrigatorio: true },
            { ordem: 2, nome: 'Item 2', obrigatorio: false }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.nome).toBe('Template Iate');
      expect(response.body.itens.length).toBe(2);
    });

    it('deve retornar 400 sem tipo_embarcacao', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Template Sem Tipo'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_embarcacao: 'LANCHA'
        });

      expect(response.status).toBe(400);
    });

    it('vistoriador não deve criar template', async () => {
      const response = await request(app)
        .post('/api/checklists/templates')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          tipo_embarcacao: 'LANCHA',
          nome: 'Template Vistoriador'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/checklists/templates/:id', () => {
    let template;

    beforeEach(async () => {
      await ChecklistTemplateItem.destroy({ where: {} });
      await ChecklistTemplate.destroy({ where: {} });
      
      template = await ChecklistTemplate.create({
        tipo_embarcacao: 'JETSKI',
        nome: 'Template Original',
        ativo: true
      });
    });

    it('admin deve atualizar template', async () => {
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

    it('deve retornar 404 para template inexistente', async () => {
      const response = await request(app)
        .put('/api/checklists/templates/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Novo Nome' });

      expect(response.status).toBe(404);
    });

    it('vistoriador não deve atualizar template', async () => {
      const response = await request(app)
        .put(`/api/checklists/templates/${template.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome: 'Tentativa' });

      expect(response.status).toBe(403);
    });
  });

  // ==========================================
  // ROTAS DE ITENS DE TEMPLATE
  // ==========================================

  describe('POST /api/checklists/templates/:id/itens', () => {
    let template;

    beforeEach(async () => {
      await ChecklistTemplateItem.destroy({ where: {} });
      await ChecklistTemplate.destroy({ where: {} });
      
      template = await ChecklistTemplate.create({
        tipo_embarcacao: 'VELEIRO',
        nome: 'Template Veleiro',
        ativo: true
      });
    });

    it('admin deve adicionar item ao template', async () => {
      const response = await request(app)
        .post(`/api/checklists/templates/${template.id}/itens`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ordem: 1,
          nome: 'Novo Item',
          descricao: 'Descrição do item',
          obrigatorio: true
        });

      expect(response.status).toBe(201);
      expect(response.body.nome).toBe('Novo Item');
    });

    it('vistoriador não deve adicionar item', async () => {
      const response = await request(app)
        .post(`/api/checklists/templates/${template.id}/itens`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          ordem: 1,
          nome: 'Item Vistoriador'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/checklists/itens/:id', () => {
    let template, item;

    beforeEach(async () => {
      await ChecklistTemplateItem.destroy({ where: {} });
      await ChecklistTemplate.destroy({ where: {} });
      
      template = await ChecklistTemplate.create({
        tipo_embarcacao: 'BARCO',
        nome: 'Template Barco',
        ativo: true
      });

      item = await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        nome: 'Item Original',
        ordem: 1,
        ativo: true
      });
    });

    it('admin deve atualizar item', async () => {
      const response = await request(app)
        .put(`/api/checklists/itens/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Item Atualizado',
          obrigatorio: false
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Item Atualizado');
    });

    it('deve retornar 404 para item inexistente', async () => {
      const response = await request(app)
        .put('/api/checklists/itens/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Novo Nome' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/checklists/itens/:id', () => {
    let template, item;

    beforeEach(async () => {
      await ChecklistTemplateItem.destroy({ where: {} });
      await ChecklistTemplate.destroy({ where: {} });
      
      template = await ChecklistTemplate.create({
        tipo_embarcacao: 'TESTE',
        nome: 'Template Teste',
        ativo: true
      });

      item = await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        nome: 'Item para Deletar',
        ordem: 1,
        ativo: true
      });
    });

    it('admin deve deletar item', async () => {
      const response = await request(app)
        .delete(`/api/checklists/itens/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deletado = await ChecklistTemplateItem.findByPk(item.id);
      expect(deletado).toBeNull();
    });

    it('deve retornar 404 para item inexistente', async () => {
      const response = await request(app)
        .delete('/api/checklists/itens/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ==========================================
  // ROTAS DE CHECKLIST DE VISTORIA
  // ==========================================

  describe('Rotas de Checklist de Vistoria', () => {
    let vistoria, embarcacao, local, template;

    beforeEach(async () => {
      await VistoriaChecklistItem.destroy({ where: {} });
      await Vistoria.destroy({ where: {}, force: true });
      await ChecklistTemplateItem.destroy({ where: {} });
      await ChecklistTemplate.destroy({ where: {} });

      const cliente = await Cliente.create({
        nome: `Cliente Check ${Date.now()}`,
        cpf: generateTestCPF(`chk${Date.now().toString().slice(-6)}`),
        tipo_pessoa: 'FISICA'
      });

      embarcacao = await Embarcacao.create({
        nome: 'Barco Checklist',
        nr_inscricao_barco: `CHK${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        cliente_id: cliente.id
      });

      local = await Local.create({
        nome_local: 'Local Checklist',
        tipo: 'MARINA'
      });

      vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: statusVistoria.id
      });

      template = await ChecklistTemplate.create({
        tipo_embarcacao: 'LANCHA',
        nome: 'Template Lancha Vistoria',
        ativo: true
      });

      await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        nome: 'Item Template 1',
        ordem: 1,
        ativo: true,
        obrigatorio: true
      });
    });

    describe('POST /api/checklists/vistoria/:vistoria_id/copiar-template', () => {
      it('deve copiar template para vistoria', async () => {
        const response = await request(app)
          .post(`/api/checklists/vistoria/${vistoria.id}/copiar-template`)
          .set('Authorization', `Bearer ${vistoriadorToken}`);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('itens');
        expect(response.body.itens.length).toBeGreaterThan(0);
      });

      it('deve retornar 404 para vistoria inexistente', async () => {
        const response = await request(app)
          .post('/api/checklists/vistoria/99999/copiar-template')
          .set('Authorization', `Bearer ${vistoriadorToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe('GET /api/checklists/vistoria/:vistoria_id', () => {
      beforeEach(async () => {
        await VistoriaChecklistItem.create({
          vistoria_id: vistoria.id,
          nome: 'Item Vistoria 1',
          ordem: 1,
          status: 'PENDENTE'
        });
      });

      it('deve listar checklist da vistoria', async () => {
        const response = await request(app)
          .get(`/api/checklists/vistoria/${vistoria.id}`)
          .set('Authorization', `Bearer ${vistoriadorToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('PATCH /api/checklists/vistoria/item/:id/status', () => {
      let checklistItem;

      beforeEach(async () => {
        checklistItem = await VistoriaChecklistItem.create({
          vistoria_id: vistoria.id,
          nome: 'Item para Atualizar',
          ordem: 1,
          status: 'PENDENTE'
        });
      });

      it('deve atualizar status do item', async () => {
        const response = await request(app)
          .patch(`/api/checklists/vistoria/item/${checklistItem.id}/status`)
          .set('Authorization', `Bearer ${vistoriadorToken}`)
          .send({ status: 'CONCLUIDO' });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('CONCLUIDO');
      });

      it('deve definir concluido_em ao concluir', async () => {
        const response = await request(app)
          .patch(`/api/checklists/vistoria/item/${checklistItem.id}/status`)
          .set('Authorization', `Bearer ${vistoriadorToken}`)
          .send({ status: 'CONCLUIDO' });

        expect(response.status).toBe(200);
        expect(response.body.concluido_em).toBeTruthy();
      });

      it('deve retornar 404 para item inexistente', async () => {
        const response = await request(app)
          .patch('/api/checklists/vistoria/item/99999/status')
          .set('Authorization', `Bearer ${vistoriadorToken}`)
          .send({ status: 'CONCLUIDO' });

        expect(response.status).toBe(404);
      });
    });

    describe('POST /api/checklists/vistoria/:vistoria_id/itens', () => {
      it('deve adicionar item customizado', async () => {
        const response = await request(app)
          .post(`/api/checklists/vistoria/${vistoria.id}/itens`)
          .set('Authorization', `Bearer ${vistoriadorToken}`)
          .send({
            nome: 'Item Customizado',
            ordem: 99,
            descricao: 'Item adicionado manualmente'
          });

        expect(response.status).toBe(201);
        expect(response.body.nome).toBe('Item Customizado');
        expect(response.body.status).toBe('PENDENTE');
      });
    });

    describe('GET /api/checklists/vistoria/:vistoria_id/progresso', () => {
      beforeEach(async () => {
        await VistoriaChecklistItem.create({
          vistoria_id: vistoria.id,
          nome: 'Item 1',
          ordem: 1,
          status: 'CONCLUIDO',
          obrigatorio: true
        });

        await VistoriaChecklistItem.create({
          vistoria_id: vistoria.id,
          nome: 'Item 2',
          ordem: 2,
          status: 'PENDENTE',
          obrigatorio: false
        });
      });

      it('deve retornar progresso do checklist', async () => {
        const response = await request(app)
          .get(`/api/checklists/vistoria/${vistoria.id}/progresso`)
          .set('Authorization', `Bearer ${vistoriadorToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('concluidos');
        expect(response.body).toHaveProperty('pendentes');
        expect(response.body).toHaveProperty('percentual');
        expect(response.body).toHaveProperty('podeAprovar');
      });
    });
  });
});
