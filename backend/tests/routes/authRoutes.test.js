const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const { sequelize, Usuario, NivelAcesso } = require('../../models');
const authRoutes = require('../../routes/authRoutes');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Rotas de Autenticação', () => {
  let admin, vistoriador;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    
    await NivelAcesso.create({ id: 1, nome: 'ADMINISTRADOR', descricao: 'Admin' });
    await NivelAcesso.create({ id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' });

    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    admin = await Usuario.create({
      nome: 'Admin Test',
      email: 'admin@auth.test',
      senha_hash: senhaHash,
      nivel_acesso_id: 1
    });

    vistoriador = await Usuario.create({
      nome: 'Vistoriador Test',
      email: 'vist@auth.test',
      senha_hash: senhaHash,
      nivel_acesso_id: 2
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@auth.test',
          senha: 'Teste@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('admin@auth.test');
    });

    it('deve retornar 400 sem email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ senha: 'Teste@123' });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem senha', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@auth.test' });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 com email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'email-invalido',
          senha: 'Teste@123'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 401 com email não cadastrado', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inexistente@test.com',
          senha: 'Teste@123'
        });

      expect(response.status).toBe(401);
    });

    it('deve retornar 401 com senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@auth.test',
          senha: 'SenhaErrada@123'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar novo usuário', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Novo Usuário',
          email: 'novo@auth.test',
          senha: 'Senha@123'
        });

      expect(response.status).toBe(201);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('novo@auth.test');
    });

    it('deve retornar 400 com email duplicado', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Usuario',
          email: 'duplicado@auth.test',
          senha: 'Senha@123'
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Usuario 2',
          email: 'duplicado@auth.test',
          senha: 'Senha@123'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ nome: 'Sem Email' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const token = jwt.sign(
        { userId: admin.id, email: admin.email },
        process.env.JWT_SECRET || 'test-secret'
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('admin@auth.test');
    });

    it('deve retornar 401 sem token', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('deve fazer logout', async () => {
      const response = await request(app).post('/api/auth/logout');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

