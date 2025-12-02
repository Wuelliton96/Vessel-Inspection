const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, Usuario, NivelAcesso } = require('../../models');
const authRoutes = require('../../routes/authRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/auth', router: authRoutes });

describe('Rotas de Autenticação - Full Coverage', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador, nivelAdmin, nivelVistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('authfull');
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

  describe('POST /api/auth/register - Casos adicionais', () => {
    it('deve registrar usuário com nível de acesso específico', async () => {
      const cpf = generateTestCPF('regfull01');
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Usuario Com Nivel',
          email: `comNivel${Date.now()}@teste.com`,
          senha: 'Senha@123',
          cpf: cpf,
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(201);
      expect(response.body.user.nivelAcessoId).toBe(nivelVistoriador.id);
    });

    it('deve tratar SequelizeValidationError', async () => {
      // Email muito longo para causar erro de validação
      const emailMuitoLongo = 'a'.repeat(300) + '@teste.com';
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Usuario Email Longo',
          email: emailMuitoLongo,
          senha: 'Senha@123',
          cpf: generateTestCPF('regfull02')
        });

      expect([400, 201]).toContain(response.status);
    });

    it('deve converter email para minúsculas', async () => {
      const cpf = generateTestCPF('regfull03');
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Usuario Email Upper',
          email: `EMAILUPPER${Date.now()}@TESTE.COM`,
          senha: 'Senha@123',
          cpf: cpf
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toMatch(/^[a-z]/);
    });

    it('deve retornar erro para CPF já cadastrado na validação', async () => {
      const cpf = generateTestCPF('regfull04');
      
      // Primeiro registro
      await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Primeiro Registro',
          email: `primeiro${Date.now()}@teste.com`,
          senha: 'Senha@123',
          cpf: cpf
        });

      // Segundo registro com mesmo CPF
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Segundo Registro',
          email: `segundo${Date.now()}@teste.com`,
          senha: 'Senha@123',
          cpf: cpf
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login - Casos adicionais', () => {
    let testUser;
    let testUserCPF;

    beforeAll(async () => {
      testUserCPF = generateTestCPF('loginfull01');
      const senhaHash = await bcrypt.hash('Senha@123', 10);
      
      testUser = await Usuario.create({
        cpf: testUserCPF,
        nome: 'Usuario Login Full Test',
        email: `loginfull${Date.now()}@teste.com`,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelVistoriador.id
      });
    });

    it('deve fazer login com CPF formatado', async () => {
      // CPF formatado com pontos e traço
      const cpfFormatado = `${testUserCPF.slice(0,3)}.${testUserCPF.slice(3,6)}.${testUserCPF.slice(6,9)}-${testUserCPF.slice(9)}`;
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: cpfFormatado,
          senha: 'Senha@123'
        });

      expect(response.status).toBe(200);
    });

    it('deve retornar campos obrigatórios na resposta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: testUserCPF,
          senha: 'Senha@123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('nome');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('cpf');
      expect(response.body.user).toHaveProperty('nivelAcesso');
    });

    it('deve registrar tentativa de login falhada por CPF não encontrado', async () => {
      const cpfInexistente = generateTestCPF('loginfull99');
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: cpfInexistente,
          senha: 'Senha@123'
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('CPF_NAO_ENCONTRADO');
    });

    it('deve registrar tentativa de login falhada por senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          cpf: testUserCPF,
          senha: 'SenhaErrada@123'
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('SENHA_INCORRETA');
    });
  });

  describe('PUT /api/auth/force-password-update', () => {
    let forceUpdateUser;
    let forceUpdateToken;

    beforeEach(async () => {
      const senhaHash = await bcrypt.hash('Senha@123', 10);
      forceUpdateUser = await Usuario.create({
        cpf: generateTestCPF(`force${Date.now().toString().slice(-6)}`),
        nome: 'Force Update User',
        email: `force${Date.now()}@teste.com`,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelVistoriador.id,
        deve_atualizar_senha: true
      });

      forceUpdateToken = jwt.sign(
        { userId: forceUpdateUser.id, cpf: forceUpdateUser.cpf, nivelAcessoId: nivelVistoriador.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt',
        { expiresIn: '24h' }
      );
    });

    it('deve atualizar senha obrigatória com sucesso', async () => {
      const response = await request(app)
        .put('/api/auth/force-password-update')
        .send({
          token: forceUpdateToken,
          novaSenha: 'NovaSenha@789'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.deveAtualizarSenha).toBe(false);
    });

    it('deve retornar 400 sem token', async () => {
      const response = await request(app)
        .put('/api/auth/force-password-update')
        .send({
          novaSenha: 'NovaSenha@789'
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem nova senha', async () => {
      const response = await request(app)
        .put('/api/auth/force-password-update')
        .send({
          token: forceUpdateToken
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 se nova senha não atende critérios', async () => {
      const response = await request(app)
        .put('/api/auth/force-password-update')
        .send({
          token: forceUpdateToken,
          novaSenha: '123' // Muito curta
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('details');
    });

    it('deve retornar 401 para token inválido', async () => {
      const response = await request(app)
        .put('/api/auth/force-password-update')
        .send({
          token: 'token-invalido',
          novaSenha: 'NovaSenha@789'
        });

      expect(response.status).toBe(401);
    });

    it('deve retornar 404 para usuário não encontrado', async () => {
      const tokenInexistente = jwt.sign(
        { userId: 99999, cpf: '12345678900', nivelAcessoId: 2 },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt',
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .put('/api/auth/force-password-update')
        .send({
          token: tokenInexistente,
          novaSenha: 'NovaSenha@789'
        });

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 se usuário não precisa atualizar senha', async () => {
      // Desmarcar flag
      await forceUpdateUser.update({ deve_atualizar_senha: false });

      const response = await request(app)
        .put('/api/auth/force-password-update')
        .send({
          token: forceUpdateToken,
          novaSenha: 'NovaSenha@789'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/auth/change-password - Casos adicionais', () => {
    let passwordUser;
    let passwordUserToken;

    beforeEach(async () => {
      const senhaHash = await bcrypt.hash('Senha@123', 10);
      passwordUser = await Usuario.create({
        cpf: generateTestCPF(`chgpwd${Date.now().toString().slice(-6)}`),
        nome: 'Change Password User',
        email: `chgpwd${Date.now()}@teste.com`,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelVistoriador.id
      });

      passwordUserToken = jwt.sign(
        { userId: passwordUser.id, cpf: passwordUser.cpf, nivelAcessoId: nivelVistoriador.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt',
        { expiresIn: '24h' }
      );
    });

    it('deve validar critério: mínimo 8 caracteres', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${passwordUserToken}`)
        .send({
          senhaAtual: 'Senha@123',
          novaSenha: 'Ab@12' // Menos de 8 caracteres
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('8 caracteres');
    });

    it('deve validar critério: letra maiúscula', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${passwordUserToken}`)
        .send({
          senhaAtual: 'Senha@123',
          novaSenha: 'senha@12345' // Sem maiúscula
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('maiúscula');
    });

    it('deve validar critério: letra minúscula', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${passwordUserToken}`)
        .send({
          senhaAtual: 'Senha@123',
          novaSenha: 'SENHA@12345' // Sem minúscula
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('minúscula');
    });

    it('deve validar critério: número', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${passwordUserToken}`)
        .send({
          senhaAtual: 'Senha@123',
          novaSenha: 'SenhaSegura@' // Sem número
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('número');
    });

    it('deve validar critério: caractere especial', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${passwordUserToken}`)
        .send({
          senhaAtual: 'Senha@123',
          novaSenha: 'SenhaSegura123' // Sem especial
        });

      expect(response.status).toBe(400);
      expect(response.body.details).toContain('especial');
    });

    it('deve remover flag deve_atualizar_senha após trocar senha', async () => {
      await passwordUser.update({ deve_atualizar_senha: true });

      await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${passwordUserToken}`)
        .send({
          senhaAtual: 'Senha@123',
          novaSenha: 'NovaSenha@456'
        });

      await passwordUser.reload();
      expect(passwordUser.deve_atualizar_senha).toBe(false);
    });
  });

  describe('PUT /api/auth/user/:id/password - Casos adicionais', () => {
    let targetUser;

    beforeEach(async () => {
      const senhaHash = await bcrypt.hash('Senha@123', 10);
      targetUser = await Usuario.create({
        cpf: generateTestCPF(`admpwd${Date.now().toString().slice(-6)}`),
        nome: 'Admin Password Target',
        email: `admtgt${Date.now()}@teste.com`,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelVistoriador.id
      });
    });

    it('deve retornar 400 sem novaSenha', async () => {
      const response = await request(app)
        .put(`/api/auth/user/${targetUser.id}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para senha fraca', async () => {
      const response = await request(app)
        .put(`/api/auth/user/${targetUser.id}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ novaSenha: '123' });

      expect(response.status).toBe(400);
    });

    it('deve marcar usuário para atualizar senha no próximo login', async () => {
      await request(app)
        .put(`/api/auth/user/${targetUser.id}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ novaSenha: 'NovaSenha@789' });

      await targetUser.reload();
      expect(targetUser.deve_atualizar_senha).toBe(true);
    });
  });

  describe('POST /api/auth/user/:id/temp-password - Casos adicionais', () => {
    let tempUser;

    beforeEach(async () => {
      const senhaHash = await bcrypt.hash('Senha@123', 10);
      tempUser = await Usuario.create({
        cpf: generateTestCPF(`temp${Date.now().toString().slice(-6)}`),
        nome: 'Temp Password User',
        email: `temp${Date.now()}@teste.com`,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelVistoriador.id
      });
    });

    it('deve marcar usuário para atualizar senha', async () => {
      await request(app)
        .post(`/api/auth/user/${tempUser.id}/temp-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ senhaTemporaria: 'Temp@123' });

      await tempUser.reload();
      expect(tempUser.deve_atualizar_senha).toBe(true);
    });

    it('deve retornar a senha temporária na resposta', async () => {
      const response = await request(app)
        .post(`/api/auth/user/${tempUser.id}/temp-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ senhaTemporaria: 'Temp@123' });

      expect(response.status).toBe(200);
      expect(response.body.senhaTemporaria).toBe('Temp@123');
    });
  });

  describe('GET /api/auth/password-status - Casos adicionais', () => {
    let statusUser;
    let statusUserToken;

    beforeEach(async () => {
      const senhaHash = await bcrypt.hash('Senha@123', 10);
      statusUser = await Usuario.create({
        cpf: generateTestCPF(`status${Date.now().toString().slice(-6)}`),
        nome: 'Status User',
        email: `status${Date.now()}@teste.com`,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelVistoriador.id,
        deve_atualizar_senha: false
      });

      statusUserToken = jwt.sign(
        { userId: statusUser.id, cpf: statusUser.cpf, nivelAcessoId: nivelVistoriador.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt',
        { expiresIn: '24h' }
      );
    });

    it('deve retornar deveAtualizarSenha false quando não precisa', async () => {
      const response = await request(app)
        .get('/api/auth/password-status')
        .set('Authorization', `Bearer ${statusUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.deveAtualizarSenha).toBe(false);
    });

    it('deve retornar deveAtualizarSenha true quando precisa', async () => {
      await statusUser.update({ deve_atualizar_senha: true });

      const response = await request(app)
        .get('/api/auth/password-status')
        .set('Authorization', `Bearer ${statusUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.deveAtualizarSenha).toBe(true);
    });

    it('deve retornar mensagem apropriada', async () => {
      const response = await request(app)
        .get('/api/auth/password-status')
        .set('Authorization', `Bearer ${statusUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/auth/me - Casos adicionais', () => {
    it('deve retornar nivelAcessoDescricao', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('nivelAcessoDescricao');
    });

    it('deve retornar 401 com token expirado', async () => {
      const expiredToken = jwt.sign(
        { userId: admin.id, cpf: admin.cpf, nivelAcessoId: 1 },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt',
        { expiresIn: '-1h' } // Token já expirado
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/auth/user/:id/role - Casos adicionais', () => {
    let roleUser;

    beforeAll(async () => {
      const senhaHash = await bcrypt.hash('Senha@123', 10);
      roleUser = await Usuario.create({
        cpf: generateTestCPF('rolefull01'),
        nome: 'Role Full User',
        email: `rolefull${Date.now()}@teste.com`,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelVistoriador.id
      });
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app)
        .put(`/api/auth/user/${roleUser.id}/role`)
        .send({ nivelAcessoId: nivelAdmin.id });

      expect(response.status).toBe(401);
    });

    it('deve retornar usuário com novos dados após atualização', async () => {
      const response = await request(app)
        .put(`/api/auth/user/${roleUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nivelAcessoId: nivelAdmin.id });

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('nome');
      expect(response.body.user).toHaveProperty('email');
    });
  });

  describe('GET /api/auth/users - Casos adicionais', () => {
    it('deve retornar lista com campos corretos', async () => {
      const response = await request(app)
        .get('/api/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.users)).toBe(true);
      
      if (response.body.users.length > 0) {
        const user = response.body.users[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('nome');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('nivelAcesso');
        expect(user).toHaveProperty('createdAt');
      }
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app)
        .get('/api/auth/users');

      expect(response.status).toBe(401);
    });
  });
});



