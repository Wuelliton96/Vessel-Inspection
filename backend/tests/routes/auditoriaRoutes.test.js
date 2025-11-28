const request = require('supertest');
const { sequelize, AuditoriaLog, Usuario } = require('../../models');
const auditoriaRoutes = require('../../routes/auditoriaRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/auditoria', router: auditoriaRoutes });

describe('Rotas de Auditoria - Testes Adicionais', () => {
  let adminToken;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('auditoria');
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await AuditoriaLog.destroy({ where: {}, force: true });
  });

  describe('GET /api/auditoria', () => {
    it('deve listar logs de auditoria (admin)', async () => {
      await AuditoriaLog.create({
        usuario_id: 1,
        usuario_email: 'test@test.com',
        usuario_nome: 'Test User',
        acao: 'CREATE',
        entidade: 'Usuario'
      });

      const response = await request(app)
        .get('/api/auditoria')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar por entidade', async () => {
      await AuditoriaLog.create({
        usuario_id: 1,
        usuario_email: 'test@test.com',
        usuario_nome: 'Test User',
        acao: 'CREATE',
        entidade: 'Usuario'
      });

      await AuditoriaLog.create({
        usuario_id: 1,
        usuario_email: 'test@test.com',
        usuario_nome: 'Test User',
        acao: 'UPDATE',
        entidade: 'Vistoria'
      });

      const response = await request(app)
        .get('/api/auditoria?entidade=Usuario')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(log => log.entidade === 'Usuario')).toBe(true);
    });

    it('deve filtrar por ação', async () => {
      await AuditoriaLog.create({
        usuario_id: 1,
        usuario_email: 'test@test.com',
        usuario_nome: 'Test User',
        acao: 'CREATE',
        entidade: 'Usuario'
      });

      await AuditoriaLog.create({
        usuario_id: 1,
        usuario_email: 'test@test.com',
        usuario_nome: 'Test User',
        acao: 'DELETE',
        entidade: 'Usuario'
      });

      const response = await request(app)
        .get('/api/auditoria?acao=CREATE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(log => log.acao === 'CREATE')).toBe(true);
    });

    it('deve filtrar por usuário', async () => {
      const usuario = await Usuario.findOne();
      if (usuario) {
        await AuditoriaLog.create({
          usuario_id: usuario.id,
          usuario_email: usuario.email,
          usuario_nome: usuario.nome,
          acao: 'CREATE',
          entidade: 'Usuario'
        });

        const response = await request(app)
          .get(`/api/auditoria?usuario_id=${usuario.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.every(log => log.usuario_id === usuario.id)).toBe(true);
      }
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/auditoria');
      expect(response.status).toBe(401);
    });

    it('deve exigir permissão de admin', async () => {
      const { vistoriadorToken } = await setupCompleteTestEnvironment('auditoria2');
      
      const response = await request(app)
        .get('/api/auditoria')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/auditoria/:id', () => {
    it('deve retornar log por id', async () => {
      const log = await AuditoriaLog.create({
        usuario_id: 1,
        usuario_email: 'test@test.com',
        usuario_nome: 'Test User',
        acao: 'CREATE',
        entidade: 'Usuario'
      });

      const response = await request(app)
        .get(`/api/auditoria/${log.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(log.id);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/auditoria/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
