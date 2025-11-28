const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const tipoFotoChecklistRoutes = require('../../routes/tipoFotoChecklistRoutes');
const { TipoFotoChecklist, Usuario, NivelAcesso, sequelize } = require('../../models');
const bcrypt = require('bcryptjs');
const { generateTestCPF, setupTestEnvironment } = require('../helpers/testHelpers');

const app = express();
app.use(express.json());
app.use('/api/tipos-foto-checklist', tipoFotoChecklistRoutes);

describe('TipoFotoChecklist Routes', () => {
  let testAdmin;
  let adminToken;

  beforeAll(async () => {
    const { nivelAdmin } = await setupTestEnvironment();
    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    testAdmin = await Usuario.create({
      cpf: generateTestCPF('tipo01'),
      nome: 'Test Admin',
      email: 'admin@tipo.com',
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
    await TipoFotoChecklist.destroy({ where: {}, force: true });
  });

  describe('GET /api/tipos-foto-checklist', () => {
    it('deve listar todos os tipos de foto', async () => {
      await TipoFotoChecklist.create({
        codigo: 'TIPO1',
        nome_exibicao: 'Tipo 1',
        obrigatorio: true
      });

      await TipoFotoChecklist.create({
        codigo: 'TIPO2',
        nome_exibicao: 'Tipo 2',
        obrigatorio: false
      });

      const response = await request(app)
        .get('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].codigo).toBe('TIPO1');
    });

    it('deve retornar lista vazia quando não há tipos', async () => {
      const response = await request(app)
        .get('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('deve exigir autenticação', async () => {
      await request(app)
        .get('/api/tipos-foto-checklist')
        .expect(401);
    });

    it('deve exigir permissão de admin', async () => {
      const nonAdmin = await Usuario.create({
        cpf: generateTestCPF('tipo02'),
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
        .get('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .expect(403);
    });
  });

  describe('GET /api/tipos-foto-checklist/:id', () => {
    it('deve retornar tipo por ID', async () => {
      const tipo = await TipoFotoChecklist.create({
        codigo: 'TIPO1',
        nome_exibicao: 'Tipo 1',
        obrigatorio: true
      });

      const response = await request(app)
        .get(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(tipo.id);
      expect(response.body.codigo).toBe('TIPO1');
    });

    it('deve retornar 404 quando tipo não existe', async () => {
      await request(app)
        .get('/api/tipos-foto-checklist/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/tipos-foto-checklist', () => {
    it('deve criar novo tipo de foto', async () => {
      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'TIPO1',
          nome_exibicao: 'Tipo 1',
          descricao: 'Descrição do tipo',
          obrigatorio: true
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.codigo).toBe('TIPO1');
      expect(response.body.nome_exibicao).toBe('Tipo 1');
    });

    it('deve retornar erro quando código e nome não são fornecidos', async () => {
      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          descricao: 'Apenas descrição'
        })
        .expect(400);

      expect(response.body.error).toContain('obrigatórios');
    });

    it('deve usar valores padrão para campos opcionais', async () => {
      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'TIPO2',
          nome_exibicao: 'Tipo 2'
        })
        .expect(201);

      expect(response.body.obrigatorio).toBe(true);
    });

    it('deve retornar erro quando código já existe', async () => {
      await TipoFotoChecklist.create({
        codigo: 'TIPO1',
        nome_exibicao: 'Tipo 1'
      });

      const response = await request(app)
        .post('/api/tipos-foto-checklist')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          codigo: 'TIPO1',
          nome_exibicao: 'Tipo 1 Duplicado'
        })
        .expect(400);

      expect(response.body.error).toContain('já existe');
    });
  });

  describe('PUT /api/tipos-foto-checklist/:id', () => {
    it('deve atualizar tipo existente', async () => {
      const tipo = await TipoFotoChecklist.create({
        codigo: 'TIPO1',
        nome_exibicao: 'Tipo 1',
        obrigatorio: true
      });

      const response = await request(app)
        .put(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_exibicao: 'Tipo 1 Atualizado',
          obrigatorio: false
        })
        .expect(200);

      expect(response.body.nome_exibicao).toBe('Tipo 1 Atualizado');
      expect(response.body.obrigatorio).toBe(false);
    });

    it('deve preservar valores existentes quando não fornecidos', async () => {
      const tipo = await TipoFotoChecklist.create({
        codigo: 'TIPO1',
        nome_exibicao: 'Tipo 1',
        descricao: 'Descrição original',
        obrigatorio: true
      });

      const response = await request(app)
        .put(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_exibicao: 'Tipo 1 Atualizado'
        })
        .expect(200);

      expect(response.body.nome_exibicao).toBe('Tipo 1 Atualizado');
      expect(response.body.descricao).toBe('Descrição original');
    });

    it('deve retornar 404 quando tipo não existe', async () => {
      await request(app)
        .put('/api/tipos-foto-checklist/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_exibicao: 'Test'
        })
        .expect(404);
    });
  });

  describe('DELETE /api/tipos-foto-checklist/:id', () => {
    it('deve excluir tipo existente', async () => {
      const tipo = await TipoFotoChecklist.create({
        codigo: 'TIPO1',
        nome_exibicao: 'Tipo 1'
      });

      const response = await request(app)
        .delete(`/api/tipos-foto-checklist/${tipo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('excluído');

      const deleted = await TipoFotoChecklist.findByPk(tipo.id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 quando tipo não existe', async () => {
      await request(app)
        .delete('/api/tipos-foto-checklist/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});

