const request = require('supertest');
const { sequelize, ConfiguracaoLaudo } = require('../../models');
const configuracaoLaudoRoutes = require('../../routes/configuracaoLaudoRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/configuracoes-laudo', router: configuracaoLaudoRoutes });

describe('Rotas de Configuração de Laudo', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('configLaudo');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await ConfiguracaoLaudo.destroy({ where: {} });
  });

  describe('GET /api/configuracoes-laudo', () => {
    it('deve retornar configuração padrão existente', async () => {
      await ConfiguracaoLaudo.create({
        nome_empresa: 'Empresa Test',
        logo_empresa_url: 'http://example.com/logo.png',
        nota_rodape: 'Nota de rodapé',
        padrao: true,
        usuario_id: admin.id
      });

      const response = await request(app)
        .get('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.nome_empresa).toBe('Empresa Test');
    });

    it('deve criar configuração padrão se não existir', async () => {
      const response = await request(app)
        .get('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.padrao).toBe(true);
    });

    it('vistoriador deve poder acessar configuração', async () => {
      const response = await request(app)
        .get('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/configuracoes-laudo');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/configuracoes-laudo', () => {
    it('admin deve atualizar configuração existente', async () => {
      await ConfiguracaoLaudo.create({
        nome_empresa: 'Empresa Original',
        padrao: true,
        usuario_id: admin.id
      });

      const response = await request(app)
        .put('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_empresa: 'Empresa Atualizada',
          logo_empresa_url: 'http://example.com/novo-logo.png',
          nota_rodape: 'Nova nota',
          empresa_prestadora: 'Prestadora XYZ'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome_empresa).toBe('Empresa Atualizada');
      expect(response.body.empresa_prestadora).toBe('Prestadora XYZ');
    });

    it('admin deve criar configuração se não existir', async () => {
      const response = await request(app)
        .put('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_empresa: 'Nova Empresa',
          nota_rodape: 'Nota inicial'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome_empresa).toBe('Nova Empresa');
      expect(response.body.padrao).toBe(true);
    });

    it('deve preservar campos não enviados', async () => {
      await ConfiguracaoLaudo.create({
        nome_empresa: 'Empresa',
        nota_rodape: 'Nota original',
        padrao: true,
        usuario_id: admin.id
      });

      const response = await request(app)
        .put('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_empresa: 'Empresa Modificada'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome_empresa).toBe('Empresa Modificada');
      expect(response.body.nota_rodape).toBe('Nota original');
    });

    it('vistoriador não deve poder atualizar configuração', async () => {
      const response = await request(app)
        .put('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          nome_empresa: 'Tentativa'
        });

      expect(response.status).toBe(403);
    });

    it('deve atualizar usuario_id ao modificar', async () => {
      await ConfiguracaoLaudo.create({
        nome_empresa: 'Empresa',
        padrao: true,
        usuario_id: vistoriador.id
      });

      const response = await request(app)
        .put('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_empresa: 'Empresa Modificada'
        });

      expect(response.status).toBe(200);
      expect(response.body.usuario_id).toBe(admin.id);
    });
  });

  describe('Cenários de borda', () => {
    it('deve lidar com campos vazios', async () => {
      const response = await request(app)
        .put('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_empresa: '',
          nota_rodape: ''
        });

      expect(response.status).toBe(200);
    });

    it('deve aceitar URL de logo válida', async () => {
      const response = await request(app)
        .put('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          logo_empresa_url: 'https://empresa.com/images/logo.png'
        });

      expect(response.status).toBe(200);
      expect(response.body.logo_empresa_url).toBe('https://empresa.com/images/logo.png');
    });
  });
});
