const request = require('supertest');
const { sequelize, Laudo, Vistoria, Embarcacao, Local, StatusVistoria } = require('../../models');
const laudoRoutes = require('../../routes/laudoRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/laudos', router: laudoRoutes });

describe('Rotas de Laudos', () => {
  let adminToken;
  let vistoriadorToken;
  let admin;
  let vistoriador;
  let vistoriaConcluida;
  let laudoCriado;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    const setup = await setupCompleteTestEnvironment('laudo');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;

    const embarcacao = await Embarcacao.create({
      nome: 'Embarcação Teste',
      nr_inscricao_barco: 'EMB-TEST-001'
    });

    const local = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Marina Teste'
    });

    const statusConcluida = await StatusVistoria.create({
      nome: 'CONCLUIDA',
      descricao: 'Concluída'
    });

    vistoriaConcluida = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: vistoriador.id,
      administrador_id: admin.id,
      status_id: statusConcluida.id,
      data_conclusao: new Date()
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/laudos', () => {
    it('deve listar todos os laudos (autenticado)', async () => {
      const response = await request(app)
        .get('/api/laudos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app)
        .get('/api/laudos');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/laudos/vistoria/:vistoriaId', () => {
    it('deve criar laudo para vistoria concluída (admin)', async () => {
      const dadosLaudo = {
        nome_moto_aquatica: 'Sea Doo RXT',
        proprietario: 'João Silva',
        cpf_cnpj: '123.456.789-00',
        valor_risco: 150000
      };

      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoriaConcluida.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dadosLaudo);

      expect(response.status).toBe(200);
      expect(response.body.numero_laudo).toBeDefined();
      expect(response.body.nome_moto_aquatica).toBe('Sea Doo RXT');
      
      laudoCriado = response.body;
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoriaConcluida.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome_moto_aquatica: 'Teste' });

      expect(response.status).toBe(403);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .post('/api/laudos/vistoria/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome_moto_aquatica: 'Teste' });

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para vistoria não concluída', async () => {
      const statusPendente = await StatusVistoria.create({
        nome: 'PENDENTE',
        descricao: 'Pendente'
      });

      const vistoriaPendente = await Vistoria.create({
        embarcacao_id: vistoriaConcluida.embarcacao_id,
        local_id: vistoriaConcluida.local_id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoriaPendente.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome_moto_aquatica: 'Teste' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('não concluída');
    });
  });

  describe('GET /api/laudos/:id', () => {
    it('deve buscar laudo por ID', async () => {
      if (!laudoCriado) {
        laudoCriado = await Laudo.create({
          vistoria_id: vistoriaConcluida.id,
          numero_laudo: 'TEMP001'
        });
      }

      const response = await request(app)
        .get(`/api/laudos/${laudoCriado.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(laudoCriado.id);
    });

    it('deve retornar 404 para ID inexistente', async () => {
      const response = await request(app)
        .get('/api/laudos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/laudos/vistoria/:vistoriaId', () => {
    it('deve buscar laudo por vistoria', async () => {
      if (!laudoCriado) {
        laudoCriado = await Laudo.create({
          vistoria_id: vistoriaConcluida.id,
          numero_laudo: 'TEMP002'
        });
      }

      const response = await request(app)
        .get(`/api/laudos/vistoria/${vistoriaConcluida.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.vistoria_id).toBe(vistoriaConcluida.id);
    });
  });

  describe('PUT /api/laudos/:id', () => {
    it('deve atualizar laudo (admin)', async () => {
      if (!laudoCriado) {
        laudoCriado = await Laudo.create({
          vistoria_id: vistoriaConcluida.id,
          numero_laudo: 'TEMP003'
        });
      }

      const response = await request(app)
        .put(`/api/laudos/${laudoCriado.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proprietario: 'Proprietário Atualizado',
          observacoes_vistoria: 'Observações atualizadas'
        });

      expect(response.status).toBe(200);
      expect(response.body.proprietario).toBe('Proprietário Atualizado');
    });

    it('deve retornar 403 para vistoriador', async () => {
      if (!laudoCriado) {
        laudoCriado = await Laudo.create({
          vistoria_id: vistoriaConcluida.id,
          numero_laudo: 'TEMP004'
        });
      }

      const response = await request(app)
        .put(`/api/laudos/${laudoCriado.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ proprietario: 'Teste' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/laudos/:id', () => {
    it('deve deletar laudo (admin)', async () => {
      const laudo = await Laudo.create({
        vistoria_id: vistoriaConcluida.id,
        numero_laudo: 'TEMP005'
      });

      const response = await request(app)
        .delete(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('sucesso');

      const laudoDeletado = await Laudo.findByPk(laudo.id);
      expect(laudoDeletado).toBeNull();
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      const response = await request(app)
        .delete('/api/laudos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});

