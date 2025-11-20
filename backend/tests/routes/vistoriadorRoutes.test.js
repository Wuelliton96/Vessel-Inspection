const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, Vistoria, Embarcacao, Local, StatusVistoria, Usuario, NivelAcesso } = require('../../models');
const vistoriadorRoutes = require('../../routes/vistoriadorRoutes');

const app = express();
app.use(express.json());
app.use('/api/vistoriador', vistoriadorRoutes);

describe('Rotas de Vistoriador', () => {
  let vistoriadorToken;
  let admin, vistoriador;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await NivelAcesso.create({ id: 1, nome: 'ADMINISTRADOR', descricao: 'Admin' });
    await NivelAcesso.create({ id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' });

    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    admin = await Usuario.create({
      cpf: '12345678914',
      nome: 'Admin',
      email: 'admin@vistoriador.test',
      senha_hash: senhaHash,
      nivel_acesso_id: 1
    });

    vistoriador = await Usuario.create({
      cpf: '12345678915',
      nome: 'Vistoriador',
      email: 'vist@vistoriador.test',
      senha_hash: senhaHash,
      nivel_acesso_id: 2
    });

    vistoriadorToken = jwt.sign(
      { userId: vistoriador.id, cpf: vistoriador.cpf, nivelAcessoId: 2 },
      process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/vistoriador/vistorias', () => {
    it('deve listar vistorias do vistoriador', async () => {
      const status = await StatusVistoria.create({ nome: 'EM_ANDAMENTO', descricao: 'Em andamento' });
      const embarcacao = await Embarcacao.create({ nome: 'Barco Test', nr_inscricao_barco: 'TEST001' });
      const local = await Local.create({ tipo: 'MARINA', nome_local: 'Marina Test' });
      
      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: status.id
      });

      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/vistoriador/vistorias');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/vistoriador/vistorias/:id', () => {
    it('deve buscar vistoria específica do vistoriador', async () => {
      const status = await StatusVistoria.create({ nome: 'EM_ANDAMENTO', descricao: 'Em andamento' });
      const embarcacao = await Embarcacao.create({ nome: 'Barco Test', nr_inscricao_barco: 'TEST002' });
      const local = await Local.create({ tipo: 'MARINA', nome_local: 'Marina Test' });
      
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: status.id
      });

      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vistoria.id);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });
});

