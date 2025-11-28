const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const auditoriaRoutes = require('../../routes/auditoriaRoutes');
const { AuditoriaLog, Usuario, NivelAcesso, sequelize } = require('../../models');
const bcrypt = require('bcryptjs');
const { generateTestCPF, setupTestEnvironment } = require('../helpers/testHelpers');

const app = express();
app.use(express.json());
app.use('/api/auditoria', auditoriaRoutes);

describe('Auditoria Routes', () => {
  let testAdmin;
  let adminToken;

  beforeAll(async () => {
    const { nivelAdmin } = await setupTestEnvironment();
    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    testAdmin = await Usuario.create({
      cpf: generateTestCPF('aud01'),
      nome: 'Test Admin',
      email: 'admin@auditoria.com',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAdmin.id
    });

    adminToken = jwt.sign(
      {
        userId: testAdmin.id,
        cpf: testAdmin.cpf,
        email: testAdmin.email,
        nome: testAdmin.nome,
        nivelAcesso: 'ADMINISTRADOR',
        nivelAcessoId: nivelAdmin.id
      },
      process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await AuditoriaLog.destroy({ where: {}, force: true });
  });

  describe('GET /api/auditoria/test', () => {
    it('deve retornar resposta de teste sem autenticação', async () => {
      const response = await request(app)
        .get('/api/auditoria/test')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Rota de auditoria funcionando!'
      });
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/auditoria', () => {
    it('deve listar logs de auditoria', async () => {
      await AuditoriaLog.create({
        usuario_id: testAdmin.id,
        usuario_email: testAdmin.email,
        usuario_nome: testAdmin.nome,
        acao: 'CREATE',
        entidade: 'Test',
        ip_address: '127.0.0.1'
      });

      const response = await request(app)
        .get('/api/auditoria')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.logs)).toBe(true);
    });

    it('deve retornar lista vazia quando não há logs', async () => {
      const response = await request(app)
        .get('/api/auditoria')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.logs).toEqual([]);
    });

    it('deve exigir autenticação', async () => {
      await request(app)
        .get('/api/auditoria')
        .expect(401);
    });

    it('deve exigir permissão de admin', async () => {
      const nonAdmin = await Usuario.create({
        cpf: generateTestCPF('aud02'),
        nome: 'Non Admin',
        email: 'nonadmin@test.com',
        senha_hash: await bcrypt.hash('Teste@123', 10),
        nivel_acesso_id: 2
      });

      const nonAdminToken = jwt.sign(
        {
          userId: nonAdmin.id,
          cpf: nonAdmin.cpf,
          nivelAcessoId: 2
        },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      await request(app)
        .get('/api/auditoria')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(403);
    });
  });

  describe('GET /api/auditoria/estatisticas', () => {
    it('deve retornar estatísticas de auditoria', async () => {
      await AuditoriaLog.create({
        usuario_id: testAdmin.id,
        usuario_email: testAdmin.email,
        usuario_nome: testAdmin.nome,
        acao: 'CREATE',
        entidade: 'Test',
        ip_address: '127.0.0.1'
      });

      const response = await request(app)
        .get('/api/auditoria/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalAcoes');
      expect(response.body).toHaveProperty('acoesPorTipo');
      expect(response.body).toHaveProperty('acoesCriticas');
      expect(response.body.totalAcoes).toBeGreaterThanOrEqual(1);
    });

    it('deve exigir autenticação', async () => {
      await request(app)
        .get('/api/auditoria/estatisticas')
        .expect(401);
    });

    it('deve exigir permissão de admin', async () => {
      const nonAdmin = await Usuario.create({
        cpf: generateTestCPF('aud03'),
        nome: 'Non Admin',
        email: 'nonadmin2@test.com',
        senha_hash: await bcrypt.hash('Teste@123', 10),
        nivel_acesso_id: 2
      });

      const nonAdminToken = jwt.sign(
        {
          userId: nonAdmin.id,
          cpf: nonAdmin.cpf,
          nivelAcessoId: 2
        },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      await request(app)
        .get('/api/auditoria/estatisticas')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(403);
    });
  });
});

