const {
  Usuario,
  NivelAcesso,
  Vistoria,
  Embarcacao,
  Local,
  StatusVistoria,
  Foto,
  TipoFotoChecklist,
  Laudo,
  LotePagamento,
  Cliente,
  Seguradora,
  ChecklistTemplate,
  ChecklistTemplateItem,
  VistoriaChecklistItem,
  AuditoriaLog,
  ConfiguracaoLaudo,
  sequelize
} = require('../../models');
const { setupTestEnvironment, generateTestCPF } = require('../helpers/testHelpers');
const bcrypt = require('bcryptjs');

describe('Models Index - Associações Completas', () => {
  let nivelAdmin, nivelVistoriador;
  let testUser, testVistoriador;
  let embarcacao, local, status, cliente;

  beforeAll(async () => {
    const setup = await setupTestEnvironment();
    nivelAdmin = setup.nivelAdmin;
    nivelVistoriador = setup.nivelVistoriador;

    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    testUser = await Usuario.create({
      cpf: generateTestCPF('model01'),
      nome: 'Test User',
      email: 'user@model.com',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAdmin.id
    });

    testVistoriador = await Usuario.create({
      cpf: generateTestCPF('model02'),
      nome: 'Test Vistoriador',
      email: 'vist@model.com',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelVistoriador.id
    });

    cliente = await Cliente.create({
      nome: 'Cliente Test',
      cpf: generateTestCPF('model03'),
      tipo_pessoa: 'FISICA'
    });

    embarcacao = await Embarcacao.create({
      nome: 'Boat Test',
      tipo: 'LANCHA',
      cliente_id: cliente.id
    });

    local = await Local.create({
      nome: 'Local Test',
      tipo: 'MARINA'
    });

    status = await StatusVistoria.findOne();
    if (!status) {
      status = await StatusVistoria.create({ nome: 'PENDENTE' });
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Associações Vistoria', () => {
    it('deve criar vistoria com todas as associações', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: testVistoriador.id,
        status_id: status.id
      });

      const vistoriaCompleta = await Vistoria.findByPk(vistoria.id, {
        include: [
          { model: Embarcacao, as: 'Embarcacao' },
          { model: Local, as: 'Local' },
          { model: StatusVistoria, as: 'StatusVistoria' },
          { model: Usuario, as: 'vistoriador' }
        ]
      });

      expect(vistoriaCompleta).toBeDefined();
      expect(vistoriaCompleta.Embarcacao).toBeDefined();
      expect(vistoriaCompleta.Local).toBeDefined();
      expect(vistoriaCompleta.StatusVistoria).toBeDefined();
      expect(vistoriaCompleta.vistoriador).toBeDefined();
    });

    it('deve carregar fotos da vistoria', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: testVistoriador.id,
        status_id: status.id
      });

      const tipoFoto = await TipoFotoChecklist.findOne();
      if (!tipoFoto) {
        await TipoFotoChecklist.create({ nome: 'GERAL' });
      }

      await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'test.jpg'
      });

      const vistoriaComFotos = await Vistoria.findByPk(vistoria.id, {
        include: [{ model: Foto, as: 'Fotos' }]
      });

      expect(vistoriaComFotos.Fotos).toBeDefined();
      expect(vistoriaComFotos.Fotos.length).toBeGreaterThan(0);
    });
  });

  describe('Associações Embarcacao', () => {
    it('deve carregar cliente da embarcação', async () => {
      const embarcacaoComCliente = await Embarcacao.findByPk(embarcacao.id, {
        include: [{ model: Cliente, as: 'Cliente' }]
      });

      expect(embarcacaoComCliente.Cliente).toBeDefined();
      expect(embarcacaoComCliente.Cliente.id).toBe(cliente.id);
    });

    it('deve carregar vistorias da embarcação', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: testVistoriador.id,
        status_id: status.id
      });

      const embarcacaoComVistorias = await Embarcacao.findByPk(embarcacao.id, {
        include: [{ model: Vistoria, as: 'Vistorias' }]
      });

      expect(embarcacaoComVistorias.Vistorias).toBeDefined();
      expect(embarcacaoComVistorias.Vistorias.length).toBeGreaterThan(0);
    });
  });

  describe('Associações Cliente', () => {
    it('deve carregar embarcações do cliente', async () => {
      const clienteComEmbarcacoes = await Cliente.findByPk(cliente.id, {
        include: [{ model: Embarcacao, as: 'embarcacoes' }]
      });

      expect(clienteComEmbarcacoes.embarcacoes).toBeDefined();
      expect(Array.isArray(clienteComEmbarcacoes.embarcacoes)).toBe(true);
    });
  });

  describe('Associações Laudo', () => {
    it('deve criar laudo associado a vistoria', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: testVistoriador.id,
        status_id: status.id
      });

      const laudo = await Laudo.create({
        vistoria_id: vistoria.id
      });

      const laudoComVistoria = await Laudo.findByPk(laudo.id, {
        include: [{ model: Vistoria, as: 'Vistoria' }]
      });

      expect(laudoComVistoria.Vistoria).toBeDefined();
      expect(laudoComVistoria.Vistoria.id).toBe(vistoria.id);
    });
  });

  describe('Associações LotePagamento', () => {
    it('deve criar lote de pagamento com vistoriador', async () => {
      const lote = await LotePagamento.create({
        vistoriador_id: testVistoriador.id,
        status: 'PENDENTE',
        valor_total: 1000,
        periodo_tipo: 'MENSAL'
      });

      const loteComVistoriador = await LotePagamento.findByPk(lote.id, {
        include: [{ model: Usuario, as: 'vistoriador' }]
      });

      expect(loteComVistoriador.vistoriador).toBeDefined();
      expect(loteComVistoriador.vistoriador.id).toBe(testVistoriador.id);
    });
  });

  describe('Associações ChecklistTemplate', () => {
    it('deve criar template com itens', async () => {
      const template = await ChecklistTemplate.create({
        tipo_embarcacao: 'LANCHA',
        nome: 'Template Test',
        ativo: true
      });

      const item = await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        nome: 'Item Test',
        ordem: 1,
        ativo: true
      });

      const templateComItens = await ChecklistTemplate.findByPk(template.id, {
        include: [{ model: ChecklistTemplateItem, as: 'itens' }]
      });

      expect(templateComItens.itens).toBeDefined();
      expect(templateComItens.itens.length).toBeGreaterThan(0);
    });
  });
});

