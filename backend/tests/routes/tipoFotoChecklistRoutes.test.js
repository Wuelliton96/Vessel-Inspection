const request = require('supertest');
const { sequelize, TipoFotoChecklist } = require('../../models');
const tipoFotoChecklistRoutes = require('../../routes/tipoFotoChecklistRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/tipos-foto-checklist', router: tipoFotoChecklistRoutes });

describe('Rotas de Tipo Foto Checklist', () => {
  let adminToken, vistoriadorToken;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('tipoFoto');
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await TipoFotoChecklist.destroy({ where: {} });
  });

  describe('GET /api/tipos-foto-checklist', () => {
    it('admin deve listar todos os tipos', async () => {
      await TipoFotoChecklist.create({
        codigo: 'TESTE1',
        nome_exibicao: 'Teste 1',
        obrigatorio: true
      });

      const response = await request(app)
        .get('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve ordenar por código', async () => {
      await TipoFotoChecklist.create({ codigo: 'ZZZ', nome_exibicao: 'Último' });
      await TipoFotoChecklist.create({ codigo: 'AAA', nome_exibicao: 'Primeiro' });

      const response = await request(app)
        .get('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0].codigo).toBe('AAA');
    });

    it('vistoriador não deve ter acesso', async () => {
      const response = await request(app)
        .get('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/tipos-foto-checklist');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/tipos-foto-checklist/:id', () => {
    let tipo;

    beforeEach(async () => {
      tipo = await TipoFotoChecklist.create({
        codigo: 'BUSCA_ID',
        nome_exibicao: 'Tipo para Busca',
        descricao: 'Descrição do tipo'
      });
    });

    it('deve buscar tipo por ID', async () => {
      const response = await request(app)
        .get(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.codigo).toBe('BUSCA_ID');
      expect(response.body.nome_exibicao).toBe('Tipo para Busca');
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await request(app)
        .get('/api/tipos-foto-checklist/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/tipos-foto-checklist', () => {
    it('admin deve criar novo tipo', async () => {
      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'NOVO_TIPO',
          nome_exibicao: 'Novo Tipo',
          descricao: 'Descrição do novo tipo',
          obrigatorio: true
        });

      expect(response.status).toBe(201);
      expect(response.body.codigo).toBe('NOVO_TIPO');
      expect(response.body.nome_exibicao).toBe('Novo Tipo');
      expect(response.body.obrigatorio).toBe(true);
    });

    it('deve retornar 400 sem código', async () => {
      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_exibicao: 'Sem Código'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem nome_exibicao', async () => {
      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'SEM_NOME'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para código duplicado', async () => {
      await TipoFotoChecklist.create({
        codigo: 'DUPLICADO',
        nome_exibicao: 'Original'
      });

      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'DUPLICADO',
          nome_exibicao: 'Duplicado'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('existe');
    });

    it('deve definir obrigatorio como true por padrão', async () => {
      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'DEFAULT_OBRIG',
          nome_exibicao: 'Obrigatório por Padrão'
        });

      expect(response.status).toBe(201);
      expect(response.body.obrigatorio).toBe(true);
    });

    it('vistoriador não deve criar tipo', async () => {
      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          codigo: 'VIST_TIPO',
          nome_exibicao: 'Tipo Vistoriador'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/tipos-foto-checklist/:id', () => {
    let tipo;

    beforeEach(async () => {
      tipo = await TipoFotoChecklist.create({
        codigo: 'ORIGINAL',
        nome_exibicao: 'Nome Original',
        descricao: 'Descrição original',
        obrigatorio: true
      });
    });

    it('admin deve atualizar tipo', async () => {
      const response = await request(app)
        .put(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_exibicao: 'Nome Atualizado',
          descricao: 'Nova descrição'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome_exibicao).toBe('Nome Atualizado');
      expect(response.body.descricao).toBe('Nova descrição');
    });

    it('deve atualizar apenas campos enviados', async () => {
      const response = await request(app)
        .put(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_exibicao: 'Apenas Nome'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome_exibicao).toBe('Apenas Nome');
      expect(response.body.codigo).toBe('ORIGINAL');
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await request(app)
        .put('/api/tipos-foto-checklist/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome_exibicao: 'Atualizado' });

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para código duplicado', async () => {
      await TipoFotoChecklist.create({
        codigo: 'EXISTENTE',
        nome_exibicao: 'Já Existe'
      });

      const response = await request(app)
        .put(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ codigo: 'EXISTENTE' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/tipos-foto-checklist/:id', () => {
    let tipo;

    beforeEach(async () => {
      tipo = await TipoFotoChecklist.create({
        codigo: 'DELETAR',
        nome_exibicao: 'Para Deletar'
      });
    });

    it('admin deve excluir tipo', async () => {
      const response = await request(app)
        .delete(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('excluído');

      const deletado = await TipoFotoChecklist.findByPk(tipo.id);
      expect(deletado).toBeNull();
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await request(app)
        .delete('/api/tipos-foto-checklist/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('vistoriador não deve excluir tipo', async () => {
      const response = await request(app)
        .delete(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });
});
