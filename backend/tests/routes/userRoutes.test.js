const request = require('supertest');
const express = require('express');
const userRoutes = require('../../routes/userRoutes');
const { Usuario, NivelAcesso } = require('../../models');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');
const { sequelize } = require('../../models');

const app = createTestApp({ path: '/api/usuarios', router: userRoutes });

describe('Rotas de Usuário', () => {
  let adminToken;
  let admin, vistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('user');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/usuarios', () => {
    it('deve listar usuários (admin)', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/usuarios');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/usuarios/:id', () => {
    it('deve buscar usuário por ID (admin)', async () => {
      const response = await request(app)
        .get(`/api/usuarios/${admin.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(admin.id);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      const response = await request(app)
        .get('/api/usuarios/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
