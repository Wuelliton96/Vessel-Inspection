const request = require('supertest');
const express = require('express');
const { sequelize, Embarcacao, Usuario, NivelAcesso, Seguradora, Cliente } = require('../../models');
const embarcacaoRoutes = require('../../routes/embarcacaoRoutes');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/embarcacoes', embarcacaoRoutes);

describe('Rotas de Embarcações', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await NivelAcesso.create({ id: 1, nome: 'ADMINISTRADOR', descricao: 'Admin' });
    await NivelAcesso.create({ id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' });

    admin = await Usuario.create({
      nome: 'Admin', email: 'admin@emb.test', senha_hash: 'hash', nivel_acesso_id: 1
    });

    vistoriador = await Usuario.create({
      nome: 'Vistoriador', email: 'vist@emb.test', senha_hash: 'hash', nivel_acesso_id: 2
    });

    adminToken = jwt.sign({ userId: admin.id, nivelAcessoId: 1 }, process.env.JWT_SECRET || 'test-secret');
    vistoriadorToken = jwt.sign({ userId: vistoriador.id, nivelAcessoId: 2 }, process.env.JWT_SECRET || 'test-secret');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/embarcacoes', () => {
    it('deve listar embarcações (autenticado)', async () => {
      await Embarcacao.create({ nome: 'Barco 1', nr_inscricao_barco: 'B001' });
      
      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/embarcacoes');
      expect(response.status).toBe(401);
    });

    it('deve filtrar por CPF do proprietário', async () => {
      await Embarcacao.create({ nome: 'Barco CPF', nr_inscricao_barco: 'B002', proprietario_cpf: '12345678900' });
      
      const response = await request(app)
        .get('/api/embarcacoes?proprietario_cpf=12345678900')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/embarcacoes/:id', () => {
    it('deve buscar embarcação por ID', async () => {
      const emb = await Embarcacao.create({ nome: 'Barco Get', nr_inscricao_barco: 'B003' });
      
      const response = await request(app)
        .get(`/api/embarcacoes/${emb.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Barco Get');
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await request(app)
        .get('/api/embarcacoes/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/embarcacoes', () => {
    it('deve criar embarcação', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome: 'Nova Embarcação', nr_inscricao_barco: 'B004' });

      expect(response.status).toBe(201);
      expect(response.body.nome).toBe('Nova Embarcação');
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome: 'Sem NR' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/embarcacoes/:id', () => {
    it('deve atualizar embarcação', async () => {
      const emb = await Embarcacao.create({ nome: 'Original', nr_inscricao_barco: 'B005' });
      
      const response = await request(app)
        .put(`/api/embarcacoes/${emb.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome: 'Atualizado' });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Atualizado');
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await request(app)
        .put('/api/embarcacoes/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome: 'Teste' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/embarcacoes/:id', () => {
    it('deve deletar embarcação', async () => {
      const emb = await Embarcacao.create({ nome: 'Deletar', nr_inscricao_barco: 'B006' });
      
      const response = await request(app)
        .delete(`/api/embarcacoes/${emb.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });
  });
});

