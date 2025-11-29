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

describe('Model Associations', () => {
  let nivelAdmin, nivelVistoriador;
  let testUser, testVistoriador;

  beforeAll(async () => {
    const setup = await setupTestEnvironment();
    nivelAdmin = setup.nivelAdmin;
    nivelVistoriador = setup.nivelVistoriador;

    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    testUser = await Usuario.create({
      cpf: generateTestCPF('assoc01'),
      nome: 'Test User',
      email: 'test@assoc.com',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAdmin.id
    });

    testVistoriador = await Usuario.create({
      cpf: generateTestCPF('assoc02'),
      nome: 'Test Vistoriador',
      email: 'vist@assoc.com',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelVistoriador.id
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Usuario - NivelAcesso', () => {
    it('deve carregar NivelAcesso ao buscar Usuario', async () => {
      const usuario = await Usuario.findByPk(testUser.id, {
        include: { model: NivelAcesso }
      });

      expect(usuario).toBeDefined();
      expect(usuario.NivelAcesso).toBeDefined();
      expect(usuario.NivelAcesso.id).toBe(nivelAdmin.id);
    });

    it('deve carregar Usuarios ao buscar NivelAcesso', async () => {
      const nivel = await NivelAcesso.findByPk(nivelAdmin.id, {
        include: { model: Usuario }
      });

      expect(nivel).toBeDefined();
      expect(nivel.Usuarios).toBeDefined();
      expect(Array.isArray(nivel.Usuarios)).toBe(true);
    });
  });

  describe('Vistoria - Usuario (vistoriador)', () => {
    it('deve criar vistoria com vistoriador', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Test Boat',
        nr_inscricao_barco: `ASSOC1${Date.now()}`,
        tipo_embarcacao: 'LANCHA'
      });

      const local = await Local.create({
        nome_local: 'Test Local',
        tipo: 'MARINA'
      });

      const status = await StatusVistoria.findOne();
      if (!status) {
        await StatusVistoria.create({ nome: 'PENDENTE' });
      }

      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: testVistoriador.id,
        status_id: status.id
      });

      const vistoriaComVistoriador = await Vistoria.findByPk(vistoria.id, {
        include: [{ model: Usuario, as: 'vistoriador' }]
      });

      expect(vistoriaComVistoriador).toBeDefined();
      expect(vistoriaComVistoriador.vistoriador).toBeDefined();
      expect(vistoriaComVistoriador.vistoriador.id).toBe(testVistoriador.id);
    });
  });

  describe('Vistoria - Embarcacao', () => {
    it('deve carregar Embarcacao ao buscar Vistoria', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Test Boat 2',
        nr_inscricao_barco: `ASSOC2${Date.now()}`,
        tipo_embarcacao: 'IATE'
      });

      const local = await Local.create({
        nome_local: 'Test Local 2',
        tipo: 'RESIDENCIA'
      });

      const status = await StatusVistoria.findOne();
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: testVistoriador.id,
        status_id: status.id
      });

      const vistoriaComEmbarcacao = await Vistoria.findByPk(vistoria.id, {
        include: [{ model: Embarcacao, as: 'Embarcacao' }]
      });

      expect(vistoriaComEmbarcacao).toBeDefined();
      expect(vistoriaComEmbarcacao.Embarcacao).toBeDefined();
      expect(vistoriaComEmbarcacao.Embarcacao.id).toBe(embarcacao.id);
    });
  });

  describe('Foto - Vistoria', () => {
    it('deve criar foto associada a vistoria', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Test Boat 3',
        nr_inscricao_barco: `ASSOC3${Date.now()}`,
        tipo_embarcacao: 'LANCHA'
      });

      const local = await Local.create({
        nome_local: 'Test Local 3',
        tipo: 'MARINA'
      });

      const status = await StatusVistoria.findOne();
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: testVistoriador.id,
        status_id: status.id
      });

      let tipoFoto = await TipoFotoChecklist.findOne();
      if (!tipoFoto) {
        tipoFoto = await TipoFotoChecklist.create({ 
          codigo: `GERAL${Date.now()}`,
          nome_exibicao: 'Foto Geral'
        });
      }

      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'test.jpg'
      });

      const fotoComVistoria = await Foto.findByPk(foto.id, {
        include: [{ model: Vistoria, as: 'Vistoria' }]
      });

      expect(fotoComVistoria).toBeDefined();
      expect(fotoComVistoria.Vistoria).toBeDefined();
      expect(fotoComVistoria.Vistoria.id).toBe(vistoria.id);
    });
  });

  describe('Laudo - Vistoria', () => {
    it('deve criar laudo associado a vistoria', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Test Boat 4',
        nr_inscricao_barco: `ASSOC4${Date.now()}`,
        tipo_embarcacao: 'IATE'
      });

      const local = await Local.create({
        nome_local: 'Test Local 4',
        tipo: 'RESIDENCIA'
      });

      const status = await StatusVistoria.findOne();
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: testVistoriador.id,
        status_id: status.id
      });

      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: `LAUDO-ASSOC-${Date.now()}`
      });

      const laudoComVistoria = await Laudo.findByPk(laudo.id, {
        include: [{ model: Vistoria, as: 'Vistoria' }]
      });

      expect(laudoComVistoria).toBeDefined();
      expect(laudoComVistoria.Vistoria).toBeDefined();
      expect(laudoComVistoria.Vistoria.id).toBe(vistoria.id);
    });
  });
});

