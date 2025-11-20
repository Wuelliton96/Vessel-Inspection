const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, Usuario, NivelAcesso, Vistoria, Embarcacao, Local, StatusVistoria } = require('../../models');
const dashboardRoutes = require('../../routes/dashboardRoutes');

const app = express();
app.use(express.json());
app.use('/api/dashboard', dashboardRoutes);

describe('Rotas de Dashboard', () => {
  let adminToken;
  let admin;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await NivelAcesso.create({ id: 1, nome: 'ADMINISTRADOR', descricao: 'Admin' });
    await NivelAcesso.create({ id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' });

    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    admin = await Usuario.create({
      cpf: '12345678911',
      nome: 'Admin',
      email: 'admin@dashboard.test',
      senha_hash: senhaHash,
      nivel_acesso_id: 1
    });

    adminToken = jwt.sign(
      { userId: admin.id, cpf: admin.cpf, nivelAcessoId: 1 },
      process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/dashboard/estatisticas', () => {
    it('deve retornar estatísticas do dashboard (admin)', async () => {
      const response = await request(app)
        .get('/api/dashboard/estatisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('vistoriasPorStatus');
      expect(response.body).toHaveProperty('vistoriasMesAtual');
      expect(response.body).toHaveProperty('vistoriasMesAnterior');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/dashboard/estatisticas');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/dashboard/vistorias-recentes', () => {
    it('deve retornar vistorias recentes (admin)', async () => {
      const response = await request(app)
        .get('/api/dashboard/vistorias-recentes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

