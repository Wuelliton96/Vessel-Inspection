const request = require('supertest');
const { sequelize, Usuario, NivelAcesso, Auditoria } = require('../../models');
const userRoutes = require('../../routes/userRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');
const bcrypt = require('bcryptjs');

const app = createTestApp({ path: '/api/usuarios', router: userRoutes });

describe('Rotas de Usuarios - Testes Completos', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;
  let nivelAdmin, nivelVistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('user');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;
    nivelAdmin = setup.nivelAdmin;
    nivelVistoriador = setup.nivelVistoriador;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/usuarios', () => {
    it('deve listar todos os usuários para admin', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/usuarios');
      expect(response.status).toBe(401);
    });

    it('deve incluir NivelAcesso na resposta', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('nivelAcesso');
      }
    });

    it('deve retornar campos corretos', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        const usuario = response.body[0];
        expect(usuario).toHaveProperty('id');
        expect(usuario).toHaveProperty('nome');
        expect(usuario).toHaveProperty('email');
        expect(usuario).toHaveProperty('cpf');
        expect(usuario).toHaveProperty('ativo');
      }
    });
  });

  describe('GET /api/usuarios/:id', () => {
    it('deve retornar usuário por id para admin', async () => {
      const response = await request(app)
        .get(`/api/usuarios/${vistoriador.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vistoriador.id);
      expect(response.body).toHaveProperty('nivelAcesso');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/usuarios/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get(`/api/usuarios/${vistoriador.id}`);
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .get(`/api/usuarios/${admin.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/usuarios', () => {
    it('deve criar usuário com sucesso', async () => {
      const cpf = generateTestCPF('create1');
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Novo Usuario',
          cpf: cpf,
          email: `novo_${Date.now()}@test.com`,
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('Novo Usuario');
    });

    it('deve criar usuário sem email', async () => {
      const cpf = generateTestCPF('create2');
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Sem Email',
          cpf: cpf,
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(201);
    });

    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cpf: generateTestCPF('create3'),
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatório');
    });

    it('deve retornar 400 sem CPF', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Sem CPF',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para CPF inválido', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario CPF Invalido',
          cpf: '11111111111',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('inválido');
    });

    it('deve retornar 400 para CPF já cadastrado', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Duplicado',
          cpf: admin.cpf,
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('cadastrado');
    });

    it('deve retornar 400 para email já cadastrado', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Email Duplicado',
          cpf: generateTestCPF('create4'),
          email: admin.email,
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para email inválido', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Email Invalido',
          cpf: generateTestCPF('create5'),
          email: 'emailinvalido',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email');
    });

    it('deve retornar 400 para nível de acesso inexistente', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Nivel Inexistente',
          cpf: generateTestCPF('create6'),
          nivelAcessoId: 99999
        });

      expect(response.status).toBe(400);
    });

    it('deve criar usuário com telefone', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Com Telefone',
          cpf: generateTestCPF('create7'),
          telefone_e164: '+5511999998888',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(201);
      expect(response.body.telefone_e164).toBe('+5511999998888');
    });

    it('deve retornar 400 para telefone inválido', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Telefone Invalido',
          cpf: generateTestCPF('create8'),
          telefone_e164: '123',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
    });

    it('deve criar usuário com estado', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Com Estado',
          cpf: generateTestCPF('create9'),
          estado: 'SP',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(201);
      expect(response.body.estado).toBe('SP');
    });

    it('deve retornar 400 para estado inválido', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Estado Invalido',
          cpf: generateTestCPF('create10'),
          estado: 'XX',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          nome: 'Usuario Criado Por Vistoriador',
          cpf: generateTestCPF('create11'),
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/usuarios/:id', () => {
    let usuarioTeste;

    beforeEach(async () => {
      usuarioTeste = await Usuario.create({
        cpf: generateTestCPF('update'),
        nome: 'Usuario Para Atualizar',
        email: `update_${Date.now()}@test.com`,
        senha_hash: await bcrypt.hash('Teste@123', 10),
        nivel_acesso_id: nivelVistoriador.id
      });
    });

    afterEach(async () => {
      if (usuarioTeste) {
        await Usuario.destroy({ where: { id: usuarioTeste.id }, force: true });
      }
    });

    it('deve atualizar usuário com sucesso', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Nome Atualizado'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Nome Atualizado');
    });

    it('deve atualizar email', async () => {
      const novoEmail = `atualizado_${Date.now()}@test.com`;
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: novoEmail
        });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(novoEmail);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const response = await request(app)
        .put('/api/usuarios/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Teste' });

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para CPF vazio', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf: '' });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para CPF inválido', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf: '11111111111' });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para CPF já cadastrado em outro usuário', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf: admin.cpf });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para email inválido', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'emailinvalido' });

      expect(response.status).toBe(400);
    });

    it('deve atualizar status ativo', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ativo: false });

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(false);
    });

    it('deve atualizar telefone', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ telefone_e164: '+5521999998888' });

      expect(response.status).toBe(200);
      expect(response.body.telefone_e164).toBe('+5521999998888');
    });

    it('deve limpar telefone', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ telefone_e164: '' });

      expect(response.status).toBe(200);
      expect(response.body.telefone_e164).toBeNull();
    });

    it('deve atualizar nível de acesso', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nivelAcessoId: nivelAdmin.id });

      expect(response.status).toBe(200);
      expect(response.body.nivelAcessoId).toBe(nivelAdmin.id);
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome: 'Tentativa' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/usuarios/:id', () => {
    let usuarioParaDeletar;

    beforeEach(async () => {
      usuarioParaDeletar = await Usuario.create({
        cpf: generateTestCPF('delete'),
        nome: 'Usuario Para Deletar',
        email: `delete_${Date.now()}@test.com`,
        senha_hash: await bcrypt.hash('Teste@123', 10),
        nivel_acesso_id: nivelVistoriador.id
      });
    });

    it('deve deletar usuário com sucesso', async () => {
      const response = await request(app)
        .delete(`/api/usuarios/${usuarioParaDeletar.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const response = await request(app)
        .delete('/api/usuarios/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .delete(`/api/usuarios/${usuarioParaDeletar.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve retornar 403 ao tentar deletar a si mesmo', async () => {
      const response = await request(app)
        .delete(`/api/usuarios/${admin.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('não permitida');
    });

    it('deve retornar 403 ao tentar deletar admin principal (ID 1)', async () => {
      const adminPrincipal = await Usuario.findByPk(1);
      if (adminPrincipal) {
        const response = await request(app)
          .delete('/api/usuarios/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(403);
      }
    });
  });

  describe('POST /api/usuarios/:id/reset-password', () => {
    let usuarioTeste;

    beforeEach(async () => {
      usuarioTeste = await Usuario.create({
        cpf: generateTestCPF('reset'),
        nome: 'Usuario Para Reset',
        email: `reset_${Date.now()}@test.com`,
        senha_hash: await bcrypt.hash('Teste@123', 10),
        nivel_acesso_id: nivelVistoriador.id
      });
    });

    afterEach(async () => {
      if (usuarioTeste) {
        await Usuario.destroy({ where: { id: usuarioTeste.id }, force: true });
      }
    });

    it('deve redefinir senha com sucesso', async () => {
      const response = await request(app)
        .post(`/api/usuarios/${usuarioTeste.id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ novaSenha: 'NovaSenha@123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('sucesso');
    });

    it('deve retornar 400 sem nova senha', async () => {
      const response = await request(app)
        .post(`/api/usuarios/${usuarioTeste.id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para senha fraca', async () => {
      const response = await request(app)
        .post(`/api/usuarios/${usuarioTeste.id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ novaSenha: '123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('critérios');
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const response = await request(app)
        .post('/api/usuarios/99999/reset-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ novaSenha: 'NovaSenha@123' });

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .post(`/api/usuarios/${usuarioTeste.id}/reset-password`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ novaSenha: 'NovaSenha@123' });

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/usuarios/:id/toggle-status', () => {
    let usuarioTeste;

    beforeEach(async () => {
      usuarioTeste = await Usuario.create({
        cpf: generateTestCPF('toggle'),
        nome: 'Usuario Para Toggle',
        email: `toggle_${Date.now()}@test.com`,
        senha_hash: await bcrypt.hash('Teste@123', 10),
        nivel_acesso_id: nivelVistoriador.id,
        ativo: true
      });
    });

    afterEach(async () => {
      if (usuarioTeste) {
        await Usuario.destroy({ where: { id: usuarioTeste.id }, force: true });
      }
    });

    it('deve alternar status de ativo para inativo', async () => {
      const response = await request(app)
        .patch(`/api/usuarios/${usuarioTeste.id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(false);
    });

    it('deve alternar status de inativo para ativo', async () => {
      await usuarioTeste.update({ ativo: false });

      const response = await request(app)
        .patch(`/api/usuarios/${usuarioTeste.id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(true);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const response = await request(app)
        .patch('/api/usuarios/99999/toggle-status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .patch(`/api/usuarios/${usuarioTeste.id}/toggle-status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });
});
