const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, Seguradora, Usuario, NivelAcesso } = require('../../models');
const seguradoraRoutes = require('../../routes/seguradoraRoutes');

const app = express();
app.use(express.json());
app.use('/api/seguradoras', seguradoraRoutes);

describe('Rotas de Seguradoras', () => {
  let adminToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await NivelAcesso.create({ id: 1, nome: 'ADMINISTRADOR', descricao: 'Admin' });
    const senhaHash = await bcrypt.hash('Teste@123', 10);
    const admin = await Usuario.create({
      cpf: '12345678906',
      nome: 'Admin', 
      email: 'admin@seg.test', 
      senha_hash: senhaHash, 
      nivel_acesso_id: 1
    });
    adminToken = jwt.sign({ 
      userId: admin.id, 
      cpf: admin.cpf,
      nivelAcessoId: 1 
    }, process.env.JWT_SECRET || 'sua-chave-secreta-jwt');
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/seguradoras', () => {
    it('deve listar todas as seguradoras', async () => {
      await Seguradora.create({ 
        nome: 'Seguradora Teste', 
        cnpj: '12345678000190',
        status: 'ATIVO'
      });
      
      const response = await request(app)
        .get('/api/seguradoras')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar por status', async () => {
      await Seguradora.create({ nome: 'Ativa', cnpj: '11111111111111', status: 'ATIVO' });
      await Seguradora.create({ nome: 'Inativa', cnpj: '22222222222222', status: 'INATIVO' });
      
      const response = await request(app)
        .get('/api/seguradoras?status=ATIVO')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/seguradoras');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/seguradoras', () => {
    it('deve criar seguradora', async () => {
      const response = await request(app)
        .post('/api/seguradoras')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Nova Seguradora',
          cnpj: '33333333333333',
          email: 'contato@seguradora.com',
          telefone: '+5511999998888'
        });

      expect(response.status).toBe(201);
      expect(response.body.nome).toBe('Nova Seguradora');
    });

    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/seguradoras')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cnpj: '44444444444444' });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 com CNPJ duplicado', async () => {
      await Seguradora.create({ nome: 'Seg 1', cnpj: '55555555555555' });
      
      const response = await request(app)
        .post('/api/seguradoras')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Seg 2', cnpj: '55555555555555' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/seguradoras/:id', () => {
    it('deve buscar seguradora por ID', async () => {
      const seg = await Seguradora.create({ nome: 'Buscar', cnpj: '66666666666666' });
      
      const response = await request(app)
        .get(`/api/seguradoras/${seg.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Buscar');
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await request(app)
        .get('/api/seguradoras/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/seguradoras/:id', () => {
    it('deve atualizar seguradora', async () => {
      const seg = await Seguradora.create({ nome: 'Original', cnpj: '77777777777777' });
      
      const response = await request(app)
        .put(`/api/seguradoras/${seg.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Atualizada' });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Atualizada');
    });
  });

  describe('DELETE /api/seguradoras/:id', () => {
    it('deve deletar seguradora', async () => {
      const seg = await Seguradora.create({ nome: 'Deletar', cnpj: '88888888888888' });
      
      const response = await request(app)
        .delete(`/api/seguradoras/${seg.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /api/seguradoras/:id/toggle-status', () => {
    it('deve alternar status da seguradora', async () => {
      const seg = await Seguradora.create({ nome: 'Toggle', cnpj: '99999999999999', status: 'ATIVO' });
      
      const response = await request(app)
        .patch(`/api/seguradoras/${seg.id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('INATIVO');
    });
  });
});

