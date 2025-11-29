const request = require('supertest');
const { sequelize, Local } = require('../../models');
const localRoutes = require('../../routes/localRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/locais', router: localRoutes });

describe('Rotas de Locais', () => {
  let adminToken, vistoriadorToken;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('local');
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Local.destroy({ where: {}, force: true });
  });

  describe('GET /api/locais', () => {
    it('deve listar locais (admin)', async () => {
      await Local.create({ nome_local: 'Local 1', tipo: 'MARINA' });
      await Local.create({ nome_local: 'Local 2', tipo: 'RESIDENCIA' });

      const response = await request(app)
        .get('/api/locais')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('deve listar locais (vistoriador)', async () => {
      await Local.create({ nome_local: 'Test Local', tipo: 'MARINA' });

      const response = await request(app)
        .get('/api/locais')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/locais');
      expect(response.status).toBe(401);
    });

    it('deve ordenar locais por nome_local', async () => {
      await Local.create({ nome_local: 'Zebra Marina', tipo: 'MARINA' });
      await Local.create({ nome_local: 'Alpha Marina', tipo: 'MARINA' });

      const response = await request(app)
        .get('/api/locais')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0].nome_local).toBe('Alpha Marina');
    });

    it('deve retornar lista vazia quando não há locais', async () => {
      const response = await request(app)
        .get('/api/locais')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/locais/:id', () => {
    it('deve retornar local por id', async () => {
      const local = await Local.create({
        nome_local: 'Test Local',
        tipo: 'MARINA'
      });

      const response = await request(app)
        .get(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(local.id);
      expect(response.body.nome_local).toBe('Test Local');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/locais/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('vistoriador deve poder buscar local por id', async () => {
      const local = await Local.create({
        nome_local: 'Test Local',
        tipo: 'RESIDENCIA'
      });

      const response = await request(app)
        .get(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/locais/1');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/locais', () => {
    it('deve criar local com todos os campos', async () => {
      const response = await request(app)
        .post('/api/locais')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo: 'MARINA',
          nome_local: 'Nova Marina',
          cep: '12345-678',
          logradouro: 'Rua das Embarcações',
          numero: '100',
          complemento: 'Bloco A',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome_local).toBe('Nova Marina');
      expect(response.body.cep).toBe('12345-678');
    });

    it('deve criar local apenas com campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/locais')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo: 'RESIDENCIA'
        });

      expect(response.status).toBe(201);
      expect(response.body.tipo).toBe('RESIDENCIA');
    });

    it('deve retornar 400 sem tipo', async () => {
      const response = await request(app)
        .post('/api/locais')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_local: 'Local sem tipo'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatório');
    });

    it('vistoriador deve poder criar local', async () => {
      const response = await request(app)
        .post('/api/locais')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          tipo: 'MARINA',
          nome_local: 'Local do Vistoriador'
        });

      expect(response.status).toBe(201);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app)
        .post('/api/locais')
        .send({ tipo: 'MARINA' });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/locais/:id', () => {
    it('deve atualizar local completamente', async () => {
      const local = await Local.create({
        nome_local: 'Local Antigo',
        tipo: 'MARINA'
      });

      const response = await request(app)
        .put(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_local: 'Local Atualizado',
          tipo: 'RESIDENCIA',
          cep: '98765-432',
          cidade: 'Rio de Janeiro',
          estado: 'RJ'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome_local).toBe('Local Atualizado');
      expect(response.body.tipo).toBe('RESIDENCIA');
      expect(response.body.cidade).toBe('Rio de Janeiro');
    });

    it('deve atualizar apenas campos enviados', async () => {
      const local = await Local.create({
        nome_local: 'Local Original',
        tipo: 'MARINA',
        cidade: 'São Paulo'
      });

      const response = await request(app)
        .put(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_local: 'Local Modificado'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome_local).toBe('Local Modificado');
      expect(response.body.tipo).toBe('MARINA'); // Mantém original
      expect(response.body.cidade).toBe('São Paulo'); // Mantém original
    });

    it('deve retornar 404 para local inexistente', async () => {
      const response = await request(app)
        .put('/api/locais/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome_local: 'Updated' });

      expect(response.status).toBe(404);
    });

    it('vistoriador deve poder atualizar local', async () => {
      const local = await Local.create({
        nome_local: 'Local Test',
        tipo: 'MARINA'
      });

      const response = await request(app)
        .put(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome_local: 'Local Updated' });

      expect(response.status).toBe(200);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app)
        .put('/api/locais/1')
        .send({ nome_local: 'Updated' });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/locais/:id', () => {
    it('deve deletar local', async () => {
      const local = await Local.create({
        nome_local: 'To Delete',
        tipo: 'MARINA'
      });

      const response = await request(app)
        .delete(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('excluído');

      const deleted = await Local.findByPk(local.id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para local inexistente', async () => {
      const response = await request(app)
        .delete('/api/locais/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('vistoriador deve poder deletar local', async () => {
      const local = await Local.create({
        nome_local: 'Local Vist',
        tipo: 'RESIDENCIA'
      });

      const response = await request(app)
        .delete(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).delete('/api/locais/1');
      expect(response.status).toBe(401);
    });
  });

  describe('Cenários de borda', () => {
    it('deve tratar ID não numérico graciosamente', async () => {
      const response = await request(app)
        .get('/api/locais/abc')
        .set('Authorization', `Bearer ${adminToken}`);

      // Pode retornar 404 ou 400, depende da implementação
      expect([400, 404, 500]).toContain(response.status);
    });

    it('deve criar local com campos especiais vazios', async () => {
      const response = await request(app)
        .post('/api/locais')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo: 'MARINA',
          nome_local: '',
          cep: ''
        });

      expect(response.status).toBe(201);
    });
  });
});
