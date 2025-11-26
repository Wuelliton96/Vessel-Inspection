const request = require('supertest');
const { sequelize, Usuario } = require('../../models');
const bcrypt = require('bcryptjs');
const authRoutes = require('../../routes/authRoutes');
const { setupCompleteTestEnvironment, createTestApp, createTestToken } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/auth', router: authRoutes });

describe('Rotas de Autenticação', () => {
  let admin, vistoriador;

  beforeAll(async () => {
    // IMPORTANTE: force: true apaga e recria todas as tabelas
    // Isso é SEGURO porque NODE_ENV=test garante uso de banco de teste (TEST_DATABASE_URL)
    // NUNCA apagará dados de produção quando configurado corretamente
    const setup = await setupCompleteTestEnvironment('auth');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com CPF e senha válidos', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: '12345678901',
          senha: 'Teste@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.cpf).toBe('12345678901');
      expect(response.body.user.email).toBe('admin@auth.test');
    });

    it('deve fazer login com CPF formatado', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: '123.456.789-01',
          senha: 'Teste@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('deve retornar 400 sem CPF', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ senha: 'Teste@123' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('CAMPOS_OBRIGATORIOS');
    });

    it('deve retornar 400 sem senha', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ cpf: '12345678901' });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('CAMPOS_OBRIGATORIOS');
    });

    it('deve retornar 400 com CPF inválido', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: '123',
          senha: 'Teste@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('CPF_INVALIDO');
    });

    it('deve retornar 401 com CPF não cadastrado', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: '99999999999',
          senha: 'Teste@123'
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('CPF_NAO_ENCONTRADO');
    });

    it('deve retornar 401 com senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: '12345678901',
          senha: 'SenhaErrada@123'
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('SENHA_INCORRETA');
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
      expect(response.body.success).toBe(true);
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
      expect(response.body.error).toContain('Email já cadastrado');
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ nome: 'Sem Email' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatórios');
    });

    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'teste@test.com',
          senha: 'Senha@123'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const token = createTestToken(admin);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('admin@auth.test');
      expect(response.body.user.cpf).toBe('12345678901');
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

  describe('PUT /api/auth/change-password', () => {
    it('deve atualizar senha quando senha atual é correta', async () => {
      const token = createTestToken(admin);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          senhaAtual: 'Teste@123',
          novaSenha: 'NovaSenha@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('deve retornar 400 quando senha atual está incorreta', async () => {
      const token = createTestToken(admin);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          senhaAtual: 'SenhaErrada@123',
          novaSenha: 'NovaSenha@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Senha atual incorreta');
    });

    it('deve retornar 400 quando nova senha não atende aos critérios', async () => {
      const token = createTestToken(admin);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          senhaAtual: 'Teste@123',
          novaSenha: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('critérios');
    });
  });

  describe('PUT /api/auth/force-password-update', () => {
    it('deve atualizar senha obrigatória com token válido', async () => {
      const senhaHash = await bcrypt.hash('Temp@123', 10);
      const usuarioTemp = await Usuario.create({
        cpf: '12345678908',
        nome: 'Usuario Temp',
        email: 'temp@auth.test',
        senha_hash: senhaHash,
        nivel_acesso_id: 2,
        deve_atualizar_senha: true
      });

      const token = createTestToken(usuarioTemp, 'VISTORIADOR', 2);

      const response = await request(app)
        .put('/api/auth/force-password-update')
        .send({
          token: token,
          novaSenha: 'NovaSenha@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.deveAtualizarSenha).toBe(false);
    });

    it('deve retornar 400 quando token não é fornecido', async () => {
      const response = await request(app)
        .put('/api/auth/force-password-update')
        .send({ novaSenha: 'NovaSenha@123' });

      expect(response.status).toBe(400);
    });

    it('deve retornar 401 quando token é inválido', async () => {
      const response = await request(app)
        .put('/api/auth/force-password-update')
        .send({ 
          token: 'token-invalido', 
          novaSenha: 'NovaSenha@123' 
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/auth/user/:id/role', () => {
    it('deve atualizar nível de acesso do usuário (admin)', async () => {
      const token = createTestToken(admin);

      const response = await request(app)
        .put(`/api/auth/user/${vistoriador.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nivelAcessoId: 1 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('deve retornar 400 quando nível de acesso não existe', async () => {
      const token = createTestToken(admin);

      const response = await request(app)
        .put(`/api/auth/user/${vistoriador.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ nivelAcessoId: 999 });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/users', () => {
    it('deve listar todos os usuários (admin)', async () => {
      const token = createTestToken(admin);

      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
    });
  });
});

