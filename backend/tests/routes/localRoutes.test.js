const request = require('supertest');
const express = require('express');
const { sequelize, Local, Usuario, NivelAcesso } = require('../../models');
const localRoutes = require('../../routes/localRoutes');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/locais', localRoutes);

describe('Rotas de Locais', () => {
  let vistoriadorToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await NivelAcesso.create({ id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' });
    const vistoriador = await Usuario.create({
      nome: 'Vistoriador', email: 'vist@local.test', senha_hash: 'hash', nivel_acesso_id: 2
    });
    vistoriadorToken = jwt.sign({ userId: vistoriador.id, nivelAcessoId: 2 }, process.env.JWT_SECRET || 'test-secret');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/locais', () => {
    it('deve listar todos os locais', async () => {
      await Local.create({ tipo: 'MARINA', nome_local: 'Marina Teste' });
      
      const response = await request(app)
        .get('/api/locais')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/locais');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/locais', () => {
    it('deve criar local', async () => {
      const response = await request(app)
        .post('/api/locais')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          tipo: 'MARINA',
          nome_local: 'Nova Marina',
          cidade: 'Santos',
          estado: 'SP'
        });

      expect(response.status).toBe(201);
      expect(response.body.nome_local).toBe('Nova Marina');
    });

    it('deve retornar 400 sem tipo', async () => {
      const response = await request(app)
        .post('/api/locais')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome_local: 'Sem Tipo' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/locais/:id', () => {
    it('deve atualizar local', async () => {
      const local = await Local.create({ tipo: 'MARINA', nome_local: 'Original' });
      
      const response = await request(app)
        .put(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome_local: 'Atualizado' });

      expect(response.status).toBe(200);
      expect(response.body.nome_local).toBe('Atualizado');
    });
  });

  describe('DELETE /api/locais/:id', () => {
    it('deve deletar local', async () => {
      const local = await Local.create({ tipo: 'RESIDENCIA' });
      
      const response = await request(app)
        .delete(`/api/locais/${local.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });
  });
});

