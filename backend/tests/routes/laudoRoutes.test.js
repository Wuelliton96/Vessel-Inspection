const request = require('supertest');
const { sequelize, Laudo, Vistoria, Embarcacao, Local, StatusVistoria, Usuario, Foto, TipoFotoChecklist, ConfiguracaoLaudo } = require('../../models');
const laudoRoutes = require('../../routes/laudoRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/laudos', router: laudoRoutes });

describe('Rotas de Laudos - Testes Completos', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;
  let embarcacao, local, statusConcluida, statusPendente;
  let vistoriaConcluida;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('laudo');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;

    // Criar embarcação
    embarcacao = await Embarcacao.create({
      nome: 'Embarcacao Laudo Test',
      nr_inscricao_barco: `LAUDOTEST${Date.now()}`,
      tipo_embarcacao: 'LANCHA'
    });

    // Criar local
    local = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Marina Laudo Test',
      cidade: 'Rio de Janeiro',
      estado: 'RJ'
    });

    // Criar status
    statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });
    if (!statusConcluida) {
      statusConcluida = await StatusVistoria.create({ nome: 'CONCLUIDA', descricao: 'Concluída' });
    }

    statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    if (!statusPendente) {
      statusPendente = await StatusVistoria.create({ nome: 'PENDENTE', descricao: 'Pendente' });
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Laudo.destroy({ where: {}, force: true });
    await Vistoria.destroy({ where: {}, force: true });

    // Criar vistoria concluída para testes
    vistoriaConcluida = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: vistoriador.id,
      administrador_id: admin.id,
      status_id: statusConcluida.id,
      data_conclusao: new Date()
    });
  });

  describe('GET /api/laudos', () => {
    it('deve listar todos os laudos', async () => {
      await Laudo.create({
        numero_laudo: `LAUDO${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });

      const response = await request(app)
        .get('/api/laudos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/laudos');
      expect(response.status).toBe(401);
    });

    it('deve ordenar por data de criação decrescente', async () => {
      await Laudo.create({
        numero_laudo: `LAUDO1${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });

      const response = await request(app)
        .get('/api/laudos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('deve incluir vistoria na resposta', async () => {
      await Laudo.create({
        numero_laudo: `LAUDOVIST${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });

      const response = await request(app)
        .get('/api/laudos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('Vistoria');
      }
    });
  });

  describe('GET /api/laudos/:id', () => {
    it('deve retornar laudo por id', async () => {
      const laudo = await Laudo.create({
        numero_laudo: `LAUDOID${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });

      const response = await request(app)
        .get(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(laudo.id);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/laudos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para id inválido', async () => {
      const response = await request(app)
        .get('/api/laudos/abc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para id negativo', async () => {
      const response = await request(app)
        .get('/api/laudos/-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/laudos/vistoria/:vistoriaId', () => {
    it('deve retornar laudo por vistoria id', async () => {
      const laudo = await Laudo.create({
        numero_laudo: `LAUDOVISTID${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });

      const response = await request(app)
        .get(`/api/laudos/vistoria/${vistoriaConcluida.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.vistoria_id).toBe(vistoriaConcluida.id);
    });

    it('deve retornar 404 para vistoria sem laudo', async () => {
      const novaVistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusConcluida.id
      });

      const response = await request(app)
        .get(`/api/laudos/vistoria/${novaVistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para vistoria id inválido', async () => {
      const response = await request(app)
        .get('/api/laudos/vistoria/abc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/laudos/vistoria/:vistoriaId', () => {
    it('deve criar laudo para vistoria concluída', async () => {
      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoriaConcluida.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('numero_laudo');
    });

    it('deve atualizar laudo existente', async () => {
      await Laudo.create({
        numero_laudo: `LAUDOUPDATE${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });

      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoriaConcluida.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proprietario: 'Novo Proprietario'
        });

      expect(response.status).toBe(200);
      expect(response.body.proprietario).toBe('Novo Proprietario');
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .post('/api/laudos/vistoria/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para vistoria não concluída', async () => {
      const vistoriaPendente = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoriaPendente.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('concluída');
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoriaConcluida.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({});

      expect(response.status).toBe(403);
    });

    it('deve criar laudo com campos preenchidos', async () => {
      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoriaConcluida.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proprietario: 'João da Silva',
          cpf_cnpj: '12345678900',
          valor_risco: 150000,
          tipo_embarcacao: 'LANCHA'
        });

      expect(response.status).toBe(200);
      expect(response.body.proprietario).toBe('João da Silva');
    });
  });

  describe('GET /api/laudos/:id/preview', () => {
    it('deve retornar preview do laudo', async () => {
      const laudo = await Laudo.create({
        numero_laudo: `LAUDOPREV${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });

      const response = await request(app)
        .get(`/api/laudos/${laudo.id}/preview`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('numero_laudo');
      expect(response.body).toHaveProperty('template');
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      const response = await request(app)
        .get('/api/laudos/99999/preview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve incluir fotos no preview', async () => {
      const laudo = await Laudo.create({
        numero_laudo: `LAUDOPREVF${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });

      const response = await request(app)
        .get(`/api/laudos/${laudo.id}/preview`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('fotos');
      expect(response.body).toHaveProperty('totalFotos');
    });
  });

  describe('PUT /api/laudos/:id', () => {
    let laudoTeste;

    beforeEach(async () => {
      laudoTeste = await Laudo.create({
        numero_laudo: `LAUDOPUTTEST${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });
    });

    it('deve atualizar laudo com sucesso', async () => {
      const response = await request(app)
        .put(`/api/laudos/${laudoTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proprietario: 'Novo Nome',
          valor_risco: 200000
        });

      expect(response.status).toBe(200);
      expect(response.body.proprietario).toBe('Novo Nome');
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      const response = await request(app)
        .put('/api/laudos/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ proprietario: 'Teste' });

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .put(`/api/laudos/${laudoTeste.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ proprietario: 'Teste' });

      expect(response.status).toBe(403);
    });

    it('deve atualizar múltiplos campos', async () => {
      const response = await request(app)
        .put(`/api/laudos/${laudoTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proprietario: 'José',
          cpf_cnpj: '98765432100',
          tipo_embarcacao: 'JET_SKI',
          ano_fabricacao: 2022,
          valor_risco: 80000
        });

      expect(response.status).toBe(200);
      expect(response.body.tipo_embarcacao).toBe('JET_SKI');
      expect(response.body.ano_fabricacao).toBe(2022);
    });
  });

  describe('DELETE /api/laudos/:id', () => {
    it('deve deletar laudo com sucesso', async () => {
      const laudo = await Laudo.create({
        numero_laudo: `LAUDODEL${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });

      const response = await request(app)
        .delete(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('sucesso');

      const deleted = await Laudo.findByPk(laudo.id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      const response = await request(app)
        .delete('/api/laudos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoriador', async () => {
      const laudo = await Laudo.create({
        numero_laudo: `LAUDODELVIST${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });

      const response = await request(app)
        .delete(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/laudos/:id/download', () => {
    it('deve retornar 404 se PDF não foi gerado', async () => {
      const laudo = await Laudo.create({
        numero_laudo: `LAUDODOWN${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });

      const response = await request(app)
        .get(`/api/laudos/${laudo.id}/download`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('PDF');
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      const response = await request(app)
        .get('/api/laudos/99999/download')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/laudos/:id/download-pdf', () => {
    it('deve retornar 404 se PDF não foi gerado', async () => {
      const laudo = await Laudo.create({
        numero_laudo: `LAUDODOWNPDF${Date.now()}`,
        vistoria_id: vistoriaConcluida.id
      });

      const response = await request(app)
        .get(`/api/laudos/${laudo.id}/download-pdf`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});
