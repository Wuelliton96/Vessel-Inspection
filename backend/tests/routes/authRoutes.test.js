const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, Usuario, NivelAcesso } = require('../../models');
const authRoutes = require('../../routes/authRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/auth', router: authRoutes });

describe('Rotas de Autenticação', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador, nivelAdmin, nivelVistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('auth');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
    nivelAdmin = setup.nivelAdmin;
    nivelVistoriador = setup.nivelVistoriador;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/register', () => {
    it('deve registrar novo usuário com sucesso', async () => {
      const cpf = generateTestCPF('reg001');
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Novo Usuario',
          email: `novo${Date.now()}@teste.com`,
          senha: 'Senha@123',
          cpf: cpf
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.nome).toBe('Novo Usuario');
    });

    it('deve atribuir nível vistoriador por padrão', async () => {
      const cpf = generateTestCPF('reg002');
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Usuario Default',
          email: `default${Date.now()}@teste.com`,
          senha: 'Senha@123',
          cpf: cpf
        });

      expect(response.status).toBe(201);
      expect(response.body.user.nivelAcessoId).toBe(2); // Vistoriador
    });

    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'sem-nome@teste.com',
          senha: 'Senha@123'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Sem Email',
          senha: 'Senha@123'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem senha', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Sem Senha',
          email: 'sem-senha@teste.com'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para email duplicado', async () => {
      const cpf1 = generateTestCPF('reg003');
      const cpf2 = generateTestCPF('reg004');
      const email = `duplicado${Date.now()}@teste.com`;

      await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Primeiro',
          email: email,
          senha: 'Senha@123',
          cpf: cpf1
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Segundo',
          email: email,
          senha: 'Senha@123',
          cpf: cpf2
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Email');
    });

    it('deve retornar 400 para CPF inválido', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'CPF Invalido',
          email: `cpf-invalid${Date.now()}@teste.com`,
          senha: 'Senha@123',
          cpf: '11111111111'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('CPF');
    });

    it('deve retornar 400 para CPF duplicado', async () => {
      const cpf = generateTestCPF('reg005');
      
      await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Primeiro CPF',
          email: `cpf1${Date.now()}@teste.com`,
          senha: 'Senha@123',
          cpf: cpf
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Segundo CPF',
          email: `cpf2${Date.now()}@teste.com`,
          senha: 'Senha@123',
          cpf: cpf
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('CPF');
    });

    it('deve retornar 400 se campo ID for enviado', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          id: 999,
          nome: 'Com ID',
          email: `comid${Date.now()}@teste.com`,
          senha: 'Senha@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('ID');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUserCPF;
    let testUser;

    beforeAll(async () => {
      testUserCPF = generateTestCPF('login01');
      const senhaHash = await bcrypt.hash('Senha@123', 10);
      
      testUser = await Usuario.create({
        cpf: testUserCPF,
        nome: 'Usuario Login Test',
        email: `login${Date.now()}@teste.com`,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelVistoriador.id
      });
    });

    it('deve fazer login com CPF e senha válidos', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: testUserCPF,
          senha: 'Senha@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.cpf).toBe(testUserCPF);
    });

    it('deve retornar 400 sem CPF', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          senha: 'Senha@123'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem senha', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: testUserCPF
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para CPF inválido', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: '12345',
          senha: 'Senha@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('CPF_INVALIDO');
    });

    it('deve retornar 401 para CPF não cadastrado', async () => {
      const cpfInexistente = generateTestCPF('login99');
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: cpfInexistente,
          senha: 'Senha@123'
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('CPF_NAO_ENCONTRADO');
    });

    it('deve retornar 401 para senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: testUserCPF,
          senha: 'SenhaErrada@123'
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('SENHA_INCORRETA');
    });

    it('deve retornar deveAtualizarSenha quando necessário', async () => {
      // Atualizar usuário para exigir atualização de senha
      await testUser.update({ deve_atualizar_senha: true });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: testUserCPF,
          senha: 'Senha@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.deveAtualizarSenha).toBe(true);

      // Restaurar
      await testUser.update({ deve_atualizar_senha: false });
    });
  });

  describe('GET /api/auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('nome');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('nivelAcesso');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).toBe(401);
    });

    it('deve retornar 401 com token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('deve fazer logout com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('deve funcionar mesmo sem autenticação', async () => {
      const response = await request(app).post('/api/auth/logout');
      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/auth/user/:id/role', () => {
    let targetUser;

    beforeAll(async () => {
      const senhaHash = await bcrypt.hash('Senha@123', 10);
      targetUser = await Usuario.create({
        cpf: generateTestCPF('role01'),
        nome: 'Target User',
        email: `target${Date.now()}@teste.com`,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelVistoriador.id
      });
    });

    it('admin deve poder atualizar nível de acesso', async () => {
      const response = await request(app)
        .put(`/api/auth/user/${targetUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nivelAcessoId: nivelAdmin.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.nivelAcessoId).toBe(nivelAdmin.id);
    });

    it('deve retornar 400 para nível de acesso inexistente', async () => {
      const response = await request(app)
        .put(`/api/auth/user/${targetUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nivelAcessoId: 99999 });

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const response = await request(app)
        .put('/api/auth/user/99999/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nivelAcessoId: nivelVistoriador.id });

      expect(response.status).toBe(404);
    });

    it('vistoriador não deve poder atualizar nível de acesso', async () => {
      const response = await request(app)
        .put(`/api/auth/user/${targetUser.id}/role`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nivelAcessoId: nivelAdmin.id });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/auth/users', () => {
    it('admin deve poder listar usuários', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('vistoriador não deve poder listar usuários', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let passwordUser;
    let passwordUserToken;

    beforeEach(async () => {
      const senhaHash = await bcrypt.hash('Senha@123', 10);
      passwordUser = await Usuario.create({
        cpf: generateTestCPF(`pwd${Date.now().toString().slice(-6)}`),
        nome: 'Password User',
        email: `pwd${Date.now()}@teste.com`,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelVistoriador.id
      });

      passwordUserToken = jwt.sign(
        { userId: passwordUser.id, cpf: passwordUser.cpf, nivelAcessoId: nivelVistoriador.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt',
        { expiresIn: '24h' }
      );
    });

    it('deve alterar senha com sucesso', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${passwordUserToken}`)
        .send({
          senhaAtual: 'Senha@123',
          novaSenha: 'NovaSenha@456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('deve retornar 400 se senha atual incorreta', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${passwordUserToken}`)
        .send({
          senhaAtual: 'SenhaErrada@123',
          novaSenha: 'NovaSenha@456'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 se nova senha não atende critérios', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${passwordUserToken}`)
        .send({
          senhaAtual: 'Senha@123',
          novaSenha: '123' // Muito curta e sem requisitos
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('details');
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${passwordUserToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/auth/user/:id/password', () => {
    let targetUser;

    beforeEach(async () => {
      const senhaHash = await bcrypt.hash('Senha@123', 10);
      targetUser = await Usuario.create({
        cpf: generateTestCPF(`admpwd${Date.now().toString().slice(-6)}`),
        nome: 'Admin Target User',
        email: `admtarget${Date.now()}@teste.com`,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelVistoriador.id
      });
    });

    it('admin deve poder redefinir senha de usuário', async () => {
      const response = await request(app)
        .put(`/api/auth/user/${targetUser.id}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ novaSenha: 'NovaSenha@789' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('deve marcar usuário para atualizar senha', async () => {
      await request(app)
        .put(`/api/auth/user/${targetUser.id}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ novaSenha: 'NovaSenha@789' });

      await targetUser.reload();
      expect(targetUser.deve_atualizar_senha).toBe(true);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const response = await request(app)
        .put('/api/auth/user/99999/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ novaSenha: 'NovaSenha@789' });

      expect(response.status).toBe(404);
    });

    it('vistoriador não deve poder redefinir senha', async () => {
      const response = await request(app)
        .put(`/api/auth/user/${targetUser.id}/password`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ novaSenha: 'NovaSenha@789' });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/auth/user/:id/temp-password', () => {
    let targetUser;

    beforeEach(async () => {
      const senhaHash = await bcrypt.hash('Senha@123', 10);
      targetUser = await Usuario.create({
        cpf: generateTestCPF(`temp${Date.now().toString().slice(-6)}`),
        nome: 'Temp Password User',
        email: `temp${Date.now()}@teste.com`,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelVistoriador.id
      });
    });

    it('admin deve poder definir senha temporária', async () => {
      const response = await request(app)
        .post(`/api/auth/user/${targetUser.id}/temp-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ senhaTemporaria: 'Temp@123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.senhaTemporaria).toBe('Temp@123');
    });

    it('deve retornar 400 sem senha temporária', async () => {
      const response = await request(app)
        .post(`/api/auth/user/${targetUser.id}/temp-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/user/99999/temp-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ senhaTemporaria: 'Temp@123' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/auth/password-status', () => {
    it('deve retornar status de senha', async () => {
      const response = await request(app)
        .get('/api/auth/password-status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('deveAtualizarSenha');
    });
  });
});
