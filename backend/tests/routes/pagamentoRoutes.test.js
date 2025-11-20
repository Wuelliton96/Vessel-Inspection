const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize, LotePagamento, VistoriaLotePagamento, Vistoria, Usuario, NivelAcesso, Embarcacao, Local, StatusVistoria } = require('../../models');
const pagamentoRoutes = require('../../routes/pagamentoRoutes');

const app = express();
app.use(express.json());
app.use('/api/pagamentos', pagamentoRoutes);

describe('Rotas de Pagamento', () => {
  let adminToken;
  let admin, vistoriador;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    await NivelAcesso.create({ id: 1, nome: 'ADMINISTRADOR', descricao: 'Admin' });
    await NivelAcesso.create({ id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' });

    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    admin = await Usuario.create({
      cpf: '12345678912',
      nome: 'Admin',
      email: 'admin@pagamento.test',
      senha_hash: senhaHash,
      nivel_acesso_id: 1
    });

    vistoriador = await Usuario.create({
      cpf: '12345678913',
      nome: 'Vistoriador',
      email: 'vist@pagamento.test',
      senha_hash: senhaHash,
      nivel_acesso_id: 2
    });

    adminToken = jwt.sign(
      { userId: admin.id, cpf: admin.cpf, nivelAcessoId: 1 },
      process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/pagamentos', () => {
    it('deve listar lotes de pagamento (admin)', async () => {
      const response = await request(app)
        .get('/api/pagamentos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/pagamentos');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/pagamentos', () => {
    it('deve criar lote de pagamento (admin)', async () => {
      const status = await StatusVistoria.create({ nome: 'CONCLUIDA', descricao: 'Concluída' });
      const embarcacao = await Embarcacao.create({ nome: 'Barco Test', nr_inscricao_barco: 'TEST001' });
      const local = await Local.create({ tipo: 'MARINA', nome_local: 'Marina Test' });
      
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: status.id
      });

      const response = await request(app)
        .post('/api/pagamentos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vistoriador_id: vistoriador.id,
          periodo_tipo: 'MENSAL',
          data_inicio: '2024-01-01',
          data_fim: '2024-01-31',
          vistoria_ids: [vistoria.id]
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/pagamentos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });
});

