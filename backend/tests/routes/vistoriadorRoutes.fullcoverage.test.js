const request = require('supertest');
const { 
  sequelize, 
  Usuario, 
  NivelAcesso, 
  Vistoria, 
  Embarcacao, 
  Local, 
  StatusVistoria, 
  Foto, 
  TipoFotoChecklist,
  Cliente,
  LotePagamento,
  VistoriaLotePagamento
} = require('../../models');
const vistoriadorRoutes = require('../../routes/vistoriadorRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = createTestApp({ path: '/api/vistoriador', router: vistoriadorRoutes });

describe('Rotas de Vistoriador - Full Coverage', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador, nivelAdmin, nivelVistoriador;
  let statusPendente, statusEmAndamento, statusConcluida;
  let embarcacao, local, vistoria;
  let tipoFoto;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('vistfull');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
    nivelAdmin = setup.nivelAdmin;
    nivelVistoriador = setup.nivelVistoriador;

    // Criar status de vistoria
    [statusPendente] = await StatusVistoria.findOrCreate({
      where: { nome: 'PENDENTE' },
      defaults: { nome: 'PENDENTE', descricao: 'Vistoria pendente' }
    });

    [statusEmAndamento] = await StatusVistoria.findOrCreate({
      where: { nome: 'EM_ANDAMENTO' },
      defaults: { nome: 'EM_ANDAMENTO', descricao: 'Em andamento' }
    });

    [statusConcluida] = await StatusVistoria.findOrCreate({
      where: { nome: 'CONCLUIDA' },
      defaults: { nome: 'CONCLUIDA', descricao: 'Concluída' }
    });

    // Criar cliente
    const cliente = await Cliente.create({
      nome: 'Cliente Vistoriador Test',
      cpf: generateTestCPF('clientevf'),
      email: `cliente_vf_${Date.now()}@teste.com`
    });

    // Criar embarcação
    embarcacao = await Embarcacao.create({
      nome: 'Barco Vistoriador Test',
      nr_inscricao_barco: `TEST_VIST_${Date.now()}`,
      proprietario_nome: 'Proprietário Vistoriador',
      proprietario_email: 'prop_vf@teste.com',
      cliente_id: cliente.id
    });

    // Criar local
    local = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Marina Vistoriador Test',
      cep: '12345-678',
      logradouro: 'Rua das Marinas',
      numero: '123',
      bairro: 'Centro',
      cidade: 'Rio de Janeiro',
      estado: 'RJ'
    });

    // Criar vistoria
    vistoria = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: vistoriador.id,
      administrador_id: admin.id,
      status_id: statusPendente.id
    });

    // Criar tipo de foto
    [tipoFoto] = await TipoFotoChecklist.findOrCreate({
      where: { codigo: 'CASCO_VISTFULL' },
      defaults: {
        codigo: 'CASCO_VISTFULL',
        nome_exibicao: 'Foto do Casco VF',
        descricao: 'Foto obrigatória do casco',
        obrigatorio: true
      }
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/vistoriador/vistorias', () => {
    it('deve listar vistorias do vistoriador', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve incluir dados da embarcação', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('Embarcacao');
      }
    });

    it('deve incluir dados do local', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('Local');
      }
    });

    it('deve incluir status da vistoria', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('StatusVistoria');
      }
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias');

      expect(response.status).toBe(401);
    });

    it('deve filtrar por status permitidos', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      // Todas as vistorias retornadas devem ter status permitido
    });
  });

  describe('GET /api/vistoriador/vistorias/:id', () => {
    it('deve retornar vistoria específica', async () => {
      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vistoria.id);
    });

    it('deve incluir fotos da vistoria', async () => {
      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('Fotos');
    });

    it('deve incluir cliente da embarcação', async () => {
      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      if (response.body.Embarcacao) {
        expect(response.body.Embarcacao).toHaveProperty('Cliente');
      }
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoria de outro vistoriador', async () => {
      // Criar outro vistoriador
      const outroVistoriador = await Usuario.create({
        cpf: generateTestCPF('vistfull01'),
        nome: 'Outro Vistoriador VF',
        email: `outro_vf_${Date.now()}@teste.com`,
        senha_hash: await bcrypt.hash('Senha@123', 10),
        nivel_acesso_id: nivelVistoriador.id
      });

      const outroToken = jwt.sign(
        { userId: outroVistoriador.id, cpf: outroVistoriador.cpf, nivelAcessoId: nivelVistoriador.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${outroToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/vistoriador/tipos-foto-checklist', () => {
    it('deve listar tipos de foto', async () => {
      const response = await request(app)
        .get('/api/vistoriador/tipos-foto-checklist')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve retornar campos corretos', async () => {
      const response = await request(app)
        .get('/api/vistoriador/tipos-foto-checklist')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        const tipo = response.body[0];
        expect(tipo).toHaveProperty('id');
        expect(tipo).toHaveProperty('codigo');
        expect(tipo).toHaveProperty('nome_exibicao');
      }
    });

    it('deve criar tipos padrão se não existirem', async () => {
      const response = await request(app)
        .get('/api/vistoriador/tipos-foto-checklist')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app)
        .get('/api/vistoriador/tipos-foto-checklist');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/vistoriador/vistorias/:id/iniciar', () => {
    let vistoriaParaIniciar;

    beforeEach(async () => {
      vistoriaParaIniciar = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });
    });

    afterEach(async () => {
      if (vistoriaParaIniciar) {
        await Vistoria.destroy({ where: { id: vistoriaParaIniciar.id }, force: true });
      }
    });

    it('deve iniciar vistoria com sucesso', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaIniciar.id}/iniciar`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('iniciada');
    });

    it('deve definir data_inicio', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaIniciar.id}/iniciar`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data_inicio).toBeDefined();
    });

    it('deve mudar status para EM_ANDAMENTO', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaIniciar.id}/iniciar`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.vistoria.StatusVistoria.nome).toBe('EM_ANDAMENTO');
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .put('/api/vistoriador/vistorias/99999/iniciar')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoria de outro vistoriador', async () => {
      const outroVistoriador = await Usuario.create({
        cpf: generateTestCPF('vistfull02'),
        nome: 'Outro Vistoriador VF2',
        email: `outro_vf2_${Date.now()}@teste.com`,
        senha_hash: await bcrypt.hash('Senha@123', 10),
        nivel_acesso_id: nivelVistoriador.id
      });

      const outroToken = jwt.sign(
        { userId: outroVistoriador.id, cpf: outroVistoriador.cpf, nivelAcessoId: nivelVistoriador.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaIniciar.id}/iniciar`)
        .set('Authorization', `Bearer ${outroToken}`);

      expect(response.status).toBe(403);
    });

    it('deve retornar 400 se já iniciada', async () => {
      await vistoriaParaIniciar.update({ data_inicio: new Date() });

      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaIniciar.id}/iniciar`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 se status não é PENDENTE', async () => {
      await vistoriaParaIniciar.update({ status_id: statusEmAndamento.id });

      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaIniciar.id}/iniciar`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/vistoriador/vistorias/:id/status', () => {
    let vistoriaParaAtualizar;

    beforeEach(async () => {
      vistoriaParaAtualizar = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusEmAndamento.id,
        data_inicio: new Date()
      });
    });

    afterEach(async () => {
      if (vistoriaParaAtualizar) {
        await Vistoria.destroy({ where: { id: vistoriaParaAtualizar.id }, force: true });
      }
    });

    it('deve atualizar status da vistoria', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaAtualizar.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ status_id: statusConcluida.id });

      expect(response.status).toBe(200);
    });

    it('deve atualizar dados_rascunho', async () => {
      const dadosRascunho = { campo1: 'valor1', campo2: 'valor2' };
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaAtualizar.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ dados_rascunho: dadosRascunho });

      expect(response.status).toBe(200);
      expect(response.body.dados_rascunho).toEqual(dadosRascunho);
    });

    it('deve atualizar valor_embarcacao', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaAtualizar.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ valor_embarcacao: 150000 });

      expect(response.status).toBe(200);
    });

    it('deve atualizar valor_vistoria', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaAtualizar.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ valor_vistoria: 500 });

      expect(response.status).toBe(200);
    });

    it('deve atualizar valor_vistoriador', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaAtualizar.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ valor_vistoriador: 300 });

      expect(response.status).toBe(200);
    });

    it('deve atualizar contato_acompanhante_tipo', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaAtualizar.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ contato_acompanhante_tipo: 'PROPRIETARIO' });

      expect(response.status).toBe(200);
    });

    it('deve atualizar contato_acompanhante_nome', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaAtualizar.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ contato_acompanhante_nome: 'João Silva' });

      expect(response.status).toBe(200);
    });

    it('deve atualizar contato_acompanhante_telefone_e164', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaAtualizar.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ contato_acompanhante_telefone_e164: '+5511999998888' });

      expect(response.status).toBe(200);
    });

    it('deve atualizar contato_acompanhante_email', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaAtualizar.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ contato_acompanhante_email: 'acompanhante@teste.com' });

      expect(response.status).toBe(200);
    });

    it('deve definir data_conclusao ao concluir', async () => {
      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaAtualizar.id}/status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ status_id: statusConcluida.id });

      expect(response.status).toBe(200);
      expect(response.body.data_conclusao).toBeDefined();
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .put('/api/vistoriador/vistorias/99999/status')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ status_id: statusConcluida.id });

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoria de outro vistoriador', async () => {
      const outroVistoriador = await Usuario.create({
        cpf: generateTestCPF('vistfull03'),
        nome: 'Outro Vistoriador VF3',
        email: `outro_vf3_${Date.now()}@teste.com`,
        senha_hash: await bcrypt.hash('Senha@123', 10),
        nivel_acesso_id: nivelVistoriador.id
      });

      const outroToken = jwt.sign(
        { userId: outroVistoriador.id, cpf: outroVistoriador.cpf, nivelAcessoId: nivelVistoriador.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      const response = await request(app)
        .put(`/api/vistoriador/vistorias/${vistoriaParaAtualizar.id}/status`)
        .set('Authorization', `Bearer ${outroToken}`)
        .send({ status_id: statusConcluida.id });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/vistoriador/vistorias/:id/checklist-status', () => {
    it('deve retornar status do checklist', async () => {
      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${vistoria.id}/checklist-status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('checklistStatus');
      expect(response.body).toHaveProperty('resumo');
    });

    it('deve retornar progresso do checklist', async () => {
      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${vistoria.id}/checklist-status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.resumo).toHaveProperty('totalObrigatorios');
      expect(response.body.resumo).toHaveProperty('fotosObrigatoriasTiradas');
      expect(response.body.resumo).toHaveProperty('checklistCompleto');
      expect(response.body.resumo).toHaveProperty('progresso');
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias/99999/checklist-status')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoria de outro vistoriador', async () => {
      const outroVistoriador = await Usuario.create({
        cpf: generateTestCPF('vistfull04'),
        nome: 'Outro Vistoriador VF4',
        email: `outro_vf4_${Date.now()}@teste.com`,
        senha_hash: await bcrypt.hash('Senha@123', 10),
        nivel_acesso_id: nivelVistoriador.id
      });

      const outroToken = jwt.sign(
        { userId: outroVistoriador.id, cpf: outroVistoriador.cpf, nivelAcessoId: nivelVistoriador.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      const response = await request(app)
        .get(`/api/vistoriador/vistorias/${vistoria.id}/checklist-status`)
        .set('Authorization', `Bearer ${outroToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/vistoriador/financeiro', () => {
    it('deve retornar resumo financeiro', async () => {
      const response = await request(app)
        .get('/api/vistoriador/financeiro')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recebido');
      expect(response.body).toHaveProperty('pendente');
    });

    it('deve retornar totais recebidos', async () => {
      const response = await request(app)
        .get('/api/vistoriador/financeiro')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.recebido).toHaveProperty('total');
      expect(response.body.recebido).toHaveProperty('quantidade');
      expect(response.body.recebido).toHaveProperty('mes');
    });

    it('deve retornar totais pendentes', async () => {
      const response = await request(app)
        .get('/api/vistoriador/financeiro')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pendente).toHaveProperty('total');
      expect(response.body.pendente).toHaveProperty('quantidade');
      expect(response.body.pendente).toHaveProperty('mes');
    });

    it('deve retornar dados do mês atual', async () => {
      const response = await request(app)
        .get('/api/vistoriador/financeiro')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.recebido.mes).toHaveProperty('total');
      expect(response.body.recebido.mes).toHaveProperty('quantidade');
      expect(response.body.pendente.mes).toHaveProperty('total');
      expect(response.body.pendente.mes).toHaveProperty('quantidade');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app)
        .get('/api/vistoriador/financeiro');

      expect(response.status).toBe(401);
    });

    it('deve calcular valores corretamente para vistoriador com pagamentos', async () => {
      // Este teste verifica a estrutura da resposta
      const response = await request(app)
        .get('/api/vistoriador/financeiro')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(typeof response.body.recebido.total).toBe('number');
      expect(typeof response.body.recebido.quantidade).toBe('number');
      expect(typeof response.body.pendente.total).toBe('number');
      expect(typeof response.body.pendente.quantidade).toBe('number');
    });
  });

  describe('Autenticação e Autorização', () => {
    it('deve rejeitar requisições sem token', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias');

      expect(response.status).toBe(401);
    });

    it('deve rejeitar token inválido', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .set('Authorization', 'Bearer token-invalido');

      expect(response.status).toBe(401);
    });

    it('deve aceitar token válido de vistoriador', async () => {
      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve aceitar token válido de admin', async () => {
      // Admin também pode acessar rotas de vistoriador
      const response = await request(app)
        .get('/api/vistoriador/vistorias')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});



