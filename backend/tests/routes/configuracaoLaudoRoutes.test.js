const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const configuracaoLaudoRoutes = require('../../routes/configuracaoLaudoRoutes');
const { ConfiguracaoLaudo, Usuario, NivelAcesso, sequelize } = require('../../models');
const bcrypt = require('bcryptjs');
const { generateTestCPF, setupTestEnvironment } = require('../helpers/testHelpers');

const app = express();
app.use(express.json());
app.use('/api/configuracoes-laudo', configuracaoLaudoRoutes);

describe('ConfiguracaoLaudo Routes', () => {
  let testUser, testAdmin;
  let authToken, adminToken;

  beforeAll(async () => {
    const { nivelAdmin } = await setupTestEnvironment();
    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    testUser = await Usuario.create({
      cpf: generateTestCPF('conf01'),
      nome: 'Test User',
      email: 'test@config.com',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAdmin.id
    });

    testAdmin = await Usuario.create({
      cpf: generateTestCPF('conf02'),
      nome: 'Test Admin',
      email: 'admin@config.com',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAdmin.id
    });

    authToken = jwt.sign(
      {
        userId: testUser.id,
        cpf: testUser.cpf,
        email: testUser.email,
        nome: testUser.nome,
        nivelAcesso: 'ADMINISTRADOR',
        nivelAcessoId: nivelAdmin.id
      },
      process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
    );

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
    await ConfiguracaoLaudo.destroy({ where: {}, force: true });
    await sequelize.close();
  });

  beforeEach(async () => {
    await ConfiguracaoLaudo.destroy({ where: {}, force: true });
  });

  describe('GET /api/configuracoes-laudo', () => {
    it('deve retornar configuração padrão existente', async () => {
      const config = await ConfiguracaoLaudo.create({
        padrao: true,
        nome_empresa: 'Test Company',
        usuario_id: testUser.id
      });

      const response = await request(app)
        .get('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(config.id);
      expect(response.body.nome_empresa).toBe('Test Company');
    });

    it('deve criar configuração padrão se não existir', async () => {
      const response = await request(app)
        .get('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.padrao).toBe(true);
    });

    it('deve exigir autenticação', async () => {
      await request(app)
        .get('/api/configuracoes-laudo')
        .expect(401);
    });
  });

  describe('PUT /api/configuracoes-laudo', () => {
    it('deve atualizar configuração existente', async () => {
      const config = await ConfiguracaoLaudo.create({
        padrao: true,
        nome_empresa: 'Old Company',
        usuario_id: testUser.id
      });

      const response = await request(app)
        .put('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_empresa: 'New Company',
          nota_rodape: 'Test note'
        })
        .expect(200);

      expect(response.body.nome_empresa).toBe('New Company');
      expect(response.body.nota_rodape).toBe('Test note');
    });

    it('deve criar configuração se não existir', async () => {
      const response = await request(app)
        .put('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_empresa: 'New Company',
          logo_empresa_url: 'http://example.com/logo.png'
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.nome_empresa).toBe('New Company');
      expect(response.body.padrao).toBe(true);
    });

    it('deve preservar valores existentes quando não fornecidos', async () => {
      const config = await ConfiguracaoLaudo.create({
        padrao: true,
        nome_empresa: 'Old Company',
        nota_rodape: 'Old note',
        usuario_id: testUser.id
      });

      const response = await request(app)
        .put('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_empresa: 'New Company'
        })
        .expect(200);

      expect(response.body.nome_empresa).toBe('New Company');
      expect(response.body.nota_rodape).toBe('Old note');
    });

    it('deve exigir autenticação', async () => {
      await request(app)
        .put('/api/configuracoes-laudo')
        .send({ nome_empresa: 'Test' })
        .expect(401);
    });

    it('deve exigir permissão de admin', async () => {
      // Criar usuário não-admin
      const nonAdmin = await Usuario.create({
        cpf: generateTestCPF('conf03'),
        nome: 'Non Admin',
        email: 'nonadmin@test.com',
        senha_hash: await bcrypt.hash('Teste@123', 10),
        nivel_acesso_id: 2 // Vistoriador
      });

      const nonAdminToken = jwt.sign(
        {
          userId: nonAdmin.id,
          cpf: nonAdmin.cpf,
          email: nonAdmin.email,
          nivelAcessoId: 2
        },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      await request(app)
        .put('/api/configuracoes-laudo')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ nome_empresa: 'Test' })
        .expect(403);
    });
  });
});

