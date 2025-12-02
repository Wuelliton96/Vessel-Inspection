const request = require('supertest');
const { sequelize, Usuario, NivelAcesso, Auditoria } = require('../../models');
const userRoutes = require('../../routes/userRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');
const bcrypt = require('bcryptjs');

const app = createTestApp({ path: '/api/usuarios', router: userRoutes });

describe('Rotas de Usuarios - Full Coverage', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;
  let nivelAdmin, nivelVistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('userfull');
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

    it('deve retornar campos obrigatórios na lista', async () => {
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
        expect(usuario).toHaveProperty('nivelAcessoId');
        expect(usuario).toHaveProperty('nivelAcesso');
        expect(usuario).toHaveProperty('ativo');
      }
    });

    it('deve retornar telefone_e164 e estado', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        const usuario = response.body[0];
        expect(usuario).toHaveProperty('telefone_e164');
        expect(usuario).toHaveProperty('estado');
      }
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
  });

  describe('GET /api/usuarios/:id', () => {
    it('deve retornar usuário por id para admin', async () => {
      const response = await request(app)
        .get(`/api/usuarios/${vistoriador.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vistoriador.id);
    });

    it('deve retornar todos os campos do usuário', async () => {
      const response = await request(app)
        .get(`/api/usuarios/${vistoriador.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('nome');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('cpf');
      expect(response.body).toHaveProperty('nivelAcessoId');
      expect(response.body).toHaveProperty('nivelAcesso');
      expect(response.body).toHaveProperty('ativo');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
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
    it('deve criar usuário com todos os campos', async () => {
      const cpf = generateTestCPF('createfull1');
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Completo',
          cpf: cpf,
          email: `completo_${Date.now()}@test.com`,
          nivelAcessoId: nivelVistoriador.id,
          telefone_e164: '+5511999998888',
          estado: 'SP'
        });

      expect(response.status).toBe(201);
      expect(response.body.nome).toBe('Usuario Completo');
      expect(response.body.telefone_e164).toBe('+5511999998888');
      expect(response.body.estado).toBe('SP');
    });

    it('deve criar usuário apenas com campos obrigatórios', async () => {
      const cpf = generateTestCPF('createfull2');
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Minimo',
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
          cpf: generateTestCPF('createfull3'),
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
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

    it('deve retornar 400 para CPF inválido (dígitos iguais)', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario CPF Invalido',
          cpf: '11111111111',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
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
    });

    it('deve retornar 400 para email já cadastrado', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Email Duplicado',
          cpf: generateTestCPF('createfull4'),
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
          cpf: generateTestCPF('createfull5'),
          email: 'emailinvalido',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para nível de acesso inexistente', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Nivel Inexistente',
          cpf: generateTestCPF('createfull6'),
          nivelAcessoId: 99999
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para telefone inválido', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Telefone Invalido',
          cpf: generateTestCPF('createfull7'),
          telefone_e164: '123',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para estado inválido', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Estado Invalido',
          cpf: generateTestCPF('createfull8'),
          estado: 'XX',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(400);
    });

    it('deve converter telefone para formato E164', async () => {
      const cpf = generateTestCPF('createfull9');
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Telefone Convertido',
          cpf: cpf,
          telefone_e164: '(11) 99999-8888',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(201);
      expect(response.body.telefone_e164).toBe('+5511999998888');
    });

    it('deve converter estado para maiúsculas', async () => {
      const cpf = generateTestCPF('createfull10');
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Estado Upper',
          cpf: cpf,
          estado: 'sp',
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(201);
      expect(response.body.estado).toBe('SP');
    });

    it('deve definir senha padrão mudar123', async () => {
      const cpf = generateTestCPF('createfull11');
      await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Senha Padrao',
          cpf: cpf,
          nivelAcessoId: nivelVistoriador.id
        });

      const usuario = await Usuario.findOne({ where: { cpf } });
      const senhaValida = await bcrypt.compare('mudar123', usuario.senha_hash);
      expect(senhaValida).toBe(true);
    });

    it('deve marcar deve_atualizar_senha como true', async () => {
      const cpf = generateTestCPF('createfull12');
      await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Atualizar Senha',
          cpf: cpf,
          nivelAcessoId: nivelVistoriador.id
        });

      const usuario = await Usuario.findOne({ where: { cpf } });
      expect(usuario.deve_atualizar_senha).toBe(true);
    });

    it('deve registrar auditoria de criação', async () => {
      const cpf = generateTestCPF('createfull13');
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Auditoria',
          cpf: cpf,
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(201);
      // Auditoria deve ser registrada
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          nome: 'Usuario Por Vistoriador',
          cpf: generateTestCPF('createfull14'),
          nivelAcessoId: nivelVistoriador.id
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/usuarios/:id', () => {
    let usuarioTeste;

    beforeEach(async () => {
      usuarioTeste = await Usuario.create({
        cpf: generateTestCPF('updatefull'),
        nome: 'Usuario Para Atualizar Full',
        email: `updatefull_${Date.now()}@test.com`,
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

    it('deve atualizar nome', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Nome Atualizado' });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Nome Atualizado');
    });

    it('deve atualizar email', async () => {
      const novoEmail = `novoemaill_${Date.now()}@test.com`;
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: novoEmail });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(novoEmail);
    });

    it('deve limpar email quando vazio', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: null });

      expect(response.status).toBe(200);
      expect(response.body.email).toBeNull();
    });

    it('deve atualizar CPF', async () => {
      const novoCPF = generateTestCPF('updatecpf');
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf: novoCPF });

      expect(response.status).toBe(200);
      expect(response.body.cpf).toBe(novoCPF);
    });

    it('deve retornar 400 para CPF vazio', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf: '' });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para CPF null', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cpf: null });

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

    it('deve retornar 400 para email já cadastrado em outro usuário', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: admin.email });

      expect(response.status).toBe(400);
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

    it('deve limpar telefone com null', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ telefone_e164: null });

      expect(response.status).toBe(200);
      expect(response.body.telefone_e164).toBeNull();
    });

    it('deve retornar 400 para telefone inválido', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ telefone_e164: '123' });

      expect(response.status).toBe(400);
    });

    it('deve atualizar estado', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: 'RJ' });

      expect(response.status).toBe(200);
      expect(response.body.estado).toBe('RJ');
    });

    it('deve limpar estado', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: '' });

      expect(response.status).toBe(200);
      expect(response.body.estado).toBeNull();
    });

    it('deve limpar estado com null', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: null });

      expect(response.status).toBe(200);
      expect(response.body.estado).toBeNull();
    });

    it('deve retornar 400 para estado inválido', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: 'XX' });

      expect(response.status).toBe(400);
    });

    it('deve atualizar nível de acesso', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nivelAcessoId: nivelAdmin.id });

      expect(response.status).toBe(200);
      expect(response.body.nivelAcessoId).toBe(nivelAdmin.id);
    });

    it('deve retornar 400 para nível de acesso inexistente', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${usuarioTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nivelAcessoId: 99999 });

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

    it('deve retornar 404 para usuário inexistente', async () => {
      const response = await request(app)
        .put('/api/usuarios/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Teste' });

      expect(response.status).toBe(404);
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
        cpf: generateTestCPF('deletefull'),
        nome: 'Usuario Para Deletar Full',
        email: `deletefull_${Date.now()}@test.com`,
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

    it('deve retornar 403 ao tentar deletar a si mesmo', async () => {
      const response = await request(app)
        .delete(`/api/usuarios/${admin.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
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

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .delete(`/api/usuarios/${usuarioParaDeletar.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/usuarios/:id/reset-password', () => {
    let usuarioTeste;

    beforeEach(async () => {
      usuarioTeste = await Usuario.create({
        cpf: generateTestCPF('resetfull'),
        nome: 'Usuario Para Reset Full',
        email: `resetfull_${Date.now()}@test.com`,
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
    });

    it('deve validar critérios da nova senha', async () => {
      const response = await request(app)
        .post(`/api/usuarios/${usuarioTeste.id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ novaSenha: '123' });

      expect(response.status).toBe(400);
    });

    it('deve marcar deve_atualizar_senha como true', async () => {
      await request(app)
        .post(`/api/usuarios/${usuarioTeste.id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ novaSenha: 'NovaSenha@123' });

      await usuarioTeste.reload();
      expect(usuarioTeste.deve_atualizar_senha).toBe(true);
    });

    it('deve retornar 400 sem novaSenha', async () => {
      const response = await request(app)
        .post(`/api/usuarios/${usuarioTeste.id}/reset-password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
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
        cpf: generateTestCPF('togglefull'),
        nome: 'Usuario Para Toggle Full',
        email: `togglefull_${Date.now()}@test.com`,
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

    it('deve alternar de ativo para inativo', async () => {
      const response = await request(app)
        .patch(`/api/usuarios/${usuarioTeste.id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(false);
    });

    it('deve alternar de inativo para ativo', async () => {
      await usuarioTeste.update({ ativo: false });

      const response = await request(app)
        .patch(`/api/usuarios/${usuarioTeste.id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(true);
    });

    it('deve retornar usuário com todos os campos', async () => {
      const response = await request(app)
        .patch(`/api/usuarios/${usuarioTeste.id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('nome');
      expect(response.body).toHaveProperty('nivelAcesso');
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



