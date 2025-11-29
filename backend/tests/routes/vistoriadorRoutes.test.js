const request = require('supertest');
const { sequelize, Vistoria, Embarcacao, Local, StatusVistoria, TipoFotoChecklist, Foto, Cliente, LotePagamento, VistoriaLotePagamento } = require('../../models');
const vistoriadorRoutes = require('../../routes/vistoriadorRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/vistoriador', router: vistoriadorRoutes });

describe('Rotas de Vistoriador', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;
  let statusPendente, statusEmAndamento, statusConcluida;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('vistoriadorRoute');
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
    admin = setup.admin;
    vistoriador = setup.vistoriador;

    // Buscar ou criar status
    statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } }) ||
      await StatusVistoria.create({ nome: 'PENDENTE' });
    statusEmAndamento = await StatusVistoria.findOne({ where: { nome: 'EM_ANDAMENTO' } }) ||
      await StatusVistoria.create({ nome: 'EM_ANDAMENTO' });
    statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } }) ||
      await StatusVistoria.create({ nome: 'CONCLUIDA' });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/vistoriador/vistorias', () => {
    beforeEach(async () => {
      await Vistoria.destroy({ where: {}, force: true });
    });

    it('deve listar vistorias do vistoriador logado', async () => {
      const cliente = await Cliente.findOne() || await Cliente.create({
        nome: 'Cliente Test',
        cpf: generateTestCPF('vistRt1'),
        tipo_pessoa: 'FISICA'
      });

      const embarcacao = await Embarcacao.create({
        nome: 'Barco Test',
        nr_inscricao_barco: `VISTRT${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        cliente_id: cliente.id
      });

      const local = await Local.create({
        nome_local: 'Local Test',
        tipo: 'MARINA'
      });

      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve retornar apenas vistorias do vistoriador logado', async () => {
      const cliente = await Cliente.findOne() || await Cliente.create({
        nome: 'Cliente Test',
        cpf: generateTestCPF('vistRt2'),
        tipo_pessoa: 'FISICA'
      });

      const embarcacao = await Embarcacao.create({
        nome: 'Barco Test 2',
        nr_inscricao_barco: `VISTRT2${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        cliente_id: cliente.id
      });

      const local = await Local.create({
        nome_local: 'Local Test 2',
        tipo: 'MARINA'
      });

      // Criar vistoria do vistoriador
      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: statusPendente.id
      });

      // Criar vistoria de outro usuário (admin)
      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      // Deve ter apenas a vistoria do vistoriador
      expect(response.body.every(v => v.vistoriador_id === vistoriador.id)).toBe(true);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/vistoriador/vistorias');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/vistoriador/vistorias/:id', () => {
    let vistoria, embarcacao, local;

    beforeEach(async () => {
      const cliente = await Cliente.findOne() || await Cliente.create({
        nome: 'Cliente Det',
        cpf: generateTestCPF('vistRt3'),
        tipo_pessoa: 'FISICA'
      });

      embarcacao = await Embarcacao.create({
        nome: 'Barco Detail',
        nr_inscricao_barco: `VISTDET${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        cliente_id: cliente.id
      });

      local = await Local.create({
        nome_local: 'Local Detail',
        tipo: 'MARINA'
      });

      vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: statusPendente.id
      });
    });

    it('deve retornar vistoria específica do vistoriador', async () => {
      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vistoria.id);
      expect(response.body).toHaveProperty('Embarcacao');
      expect(response.body).toHaveProperty('Local');
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 quando vistoria não pertence ao vistoriador', async () => {
      // Criar vistoria de outro vistoriador
      const outraVistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${outraVistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/vistoriador/tipos-foto-checklist', () => {
    it('deve listar tipos de foto do checklist', async () => {
      const response = await request(app)
        .get('/api/vistoriador/tipos-foto-checklist')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve criar tipos padrão se não existirem', async () => {
      await TipoFotoChecklist.destroy({ where: {} });

      const response = await request(app)
        .get('/api/vistoriador/tipos-foto-checklist')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/vistoriador/tipos-foto-checklist');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/vistoriador/vistorias/:id/iniciar', () => {
    let vistoria, embarcacao, local;

    beforeEach(async () => {
      const cliente = await Cliente.findOne() || await Cliente.create({
        nome: 'Cliente Iniciar',
        cpf: generateTestCPF('vistRt4'),
        tipo_pessoa: 'FISICA'
      });

      embarcacao = await Embarcacao.create({
        nome: 'Barco Iniciar',
        nr_inscricao_barco: `VISTINI${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        cliente_id: cliente.id
      });

      local = await Local.create({
        nome_local: 'Local Iniciar',
        tipo: 'MARINA'
      });

      vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: statusPendente.id
      });
    });

    it('deve iniciar vistoria pendente', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoria.id}/iniciar`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.vistoria.status_id).toBe(statusEmAndamento.id);
      expect(response.body.vistoria.data_inicio).toBeTruthy();
    });

    it('deve retornar erro ao tentar iniciar vistoria já iniciada', async () => {
      await vistoria.update({
        data_inicio: new Date(),
        status_id: statusEmAndamento.id
      });

      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoria.id}/iniciar`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar 403 quando vistoria não pertence ao vistoriador', async () => {
      const outraVistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${outraVistoria.id}/iniciar`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .put('/api/vistoriador/vistorias/99999/iniciar')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/vistoriador/vistorias/:id/status', () => {
    let vistoria, embarcacao, local;

    beforeEach(async () => {
      const cliente = await Cliente.findOne() || await Cliente.create({
        nome: 'Cliente Status',
        cpf: generateTestCPF('vistRt5'),
        tipo_pessoa: 'FISICA'
      });

      embarcacao = await Embarcacao.create({
        nome: 'Barco Status',
        nr_inscricao_barco: `VISTSTAT${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        cliente_id: cliente.id
      });

      local = await Local.create({
        nome_local: 'Local Status',
        tipo: 'MARINA'
      });

      vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: statusEmAndamento.id,
        data_inicio: new Date()
      });
    });

    it('deve atualizar status da vistoria', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoria.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ status_id: statusConcluida.id });

      expect(response.status).toBe(200);
      expect(response.body.status_id).toBe(statusConcluida.id);
    });

    it('deve atualizar dados de rascunho', async () => {
      const rascunho = { observacoes: 'Teste de rascunho' };

      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoria.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ dados_rascunho: rascunho });

      expect(response.status).toBe(200);
    });

    it('deve atualizar dados de contato do acompanhante', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoria.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          contato_acompanhante_tipo: 'PROPRIETARIO',
          contato_acompanhante_nome: 'João Silva',
          contato_acompanhante_telefone_e164: '+5511999999999',
          contato_acompanhante_email: 'joao@email.com'
        });

      expect(response.status).toBe(200);
    });

    it('deve definir data_conclusao ao concluir', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoria.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ status_id: statusConcluida.id });

      expect(response.status).toBe(200);
      expect(response.body.data_conclusao).toBeTruthy();
    });

    it('deve retornar 403 quando não pertence ao vistoriador', async () => {
      const outraVistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: admin.id,
        status_id: statusEmAndamento.id
      });

      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${outraVistoria.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ status_id: statusConcluida.id });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/vistoriador/vistorias/:id/checklist-status', () => {
    let vistoria, embarcacao, local;

    beforeEach(async () => {
      const cliente = await Cliente.findOne() || await Cliente.create({
        nome: 'Cliente Check',
        cpf: generateTestCPF('vistRt6'),
        tipo_pessoa: 'FISICA'
      });

      embarcacao = await Embarcacao.create({
        nome: 'Barco Check',
        nr_inscricao_barco: `VISTCHK${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        cliente_id: cliente.id
      });

      local = await Local.create({
        nome_local: 'Local Check',
        tipo: 'MARINA'
      });

      vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        status_id: statusEmAndamento.id
      });
    });

    it('deve retornar status do checklist', async () => {
      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${vistoria.id}/checklist-status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('checklistStatus');
      expect(response.body).toHaveProperty('resumo');
      expect(response.body.resumo).toHaveProperty('progresso');
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias/99999/checklist-status')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 quando não pertence ao vistoriador', async () => {
      const outraVistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: admin.id,
        status_id: statusEmAndamento.id
      });

      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${outraVistoria.id}/checklist-status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/vistoriador/financeiro', () => {
    it('deve retornar resumo financeiro do vistoriador', async () => {
      const response = await request(app)
        .get('/api/vistoriador/financeiro')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recebido');
      expect(response.body).toHaveProperty('pendente');
      expect(response.body.recebido).toHaveProperty('total');
      expect(response.body.recebido).toHaveProperty('mes');
      expect(response.body.pendente).toHaveProperty('total');
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/vistoriador/financeiro');
      expect(response.status).toBe(401);
    });
  });
});
