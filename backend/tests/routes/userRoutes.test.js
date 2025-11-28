const request = require('supertest');
const { sequelize, Usuario, NivelAcesso } = require('../../models');
const userRoutes = require('../../routes/userRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');
const bcrypt = require('bcryptjs');

const app = createTestApp({ path: '/api/usuarios', router: userRoutes });

describe('Rotas de Usuarios - Testes Adicionais', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('user');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/usuarios/:id', () => {
    it('deve retornar usuário por id (admin)', async () => {
      const response = await request(app)
        .get(`/api/usuarios/${vistoriador.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vistoriador.id);
      expect(response.body).toHaveProperty('NivelAcesso');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/usuarios/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/usuarios/1');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/usuarios/:id', () => {
    it('deve atualizar usuário (admin)', async () => {
      const novoUsuario = await Usuario.create({
        cpf: generateTestCPF('user01'),
        nome: 'Usuario Original',
        email: 'original@test.com',
        senha_hash: await bcrypt.hash('Teste@123', 10),
        nivel_acesso_id: 2
      });

      const response = await request(app)
        .put(`/api/usuarios/${novoUsuario.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Usuario Atualizado',
          email: 'atualizado@test.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Usuario Atualizado');
      expect(response.body.email).toBe('atualizado@test.com');
    });

    it('deve atualizar próprio perfil', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${vistoriador.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          nome: 'Meu Nome Atualizado'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Meu Nome Atualizado');
    });

    it('deve retornar 403 ao tentar atualizar outro usuário sem permissão', async () => {
      const response = await request(app)
        .put(`/api/usuarios/${admin.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          nome: 'Tentativa de Alteração'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/usuarios/:id', () => {
    it('deve deletar usuário (admin)', async () => {
      const usuarioParaDeletar = await Usuario.create({
        cpf: generateTestCPF('user02'),
        nome: 'Usuario Para Deletar',
        email: 'deletar@test.com',
        senha_hash: await bcrypt.hash('Teste@123', 10),
        nivel_acesso_id: 2
      });

      const response = await request(app)
        .delete(`/api/usuarios/${usuarioParaDeletar.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Usuario.findByPk(usuarioParaDeletar.id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 403 ao tentar deletar sem permissão', async () => {
      const response = await request(app)
        .delete(`/api/usuarios/${admin.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/usuarios', () => {
    it('deve listar usuários com filtros', async () => {
      const response = await request(app)
        .get('/api/usuarios?nivel_acesso_id=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve incluir NivelAcesso na resposta', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('NivelAcesso');
      }
    });
  });
});
