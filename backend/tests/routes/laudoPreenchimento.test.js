const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createTestApp, setupCompleteTestEnvironment, generateTestCPF } = require('../helpers/testHelpers');
const authRoutes = require('../../routes/authRoutes');
const laudoRoutes = require('../../routes/laudoRoutes');
const { 
  Usuario, 
  NivelAcesso, 
  Embarcacao, 
  Local, 
  StatusVistoria, 
  Vistoria,
  Laudo,
  Cliente,
  sequelize
} = require('../../models');

const app = createTestApp([
  { path: '/api/auth', router: authRoutes },
  { path: '/api/laudos', router: laudoRoutes }
]);

describe('Laudo - Preenchimento Automático', () => {
  let adminToken;
  let adminUser;
  let vistoriadorUser;
  let embarcacao;
  let local;
  let cliente;
  let statusConcluida;
  let vistoria;

  beforeAll(async () => {
    // Usar setup completo do ambiente de teste
    const setup = await setupCompleteTestEnvironment('laudo_preench');
    adminUser = setup.admin;
    vistoriadorUser = setup.vistoriador;
    adminToken = setup.adminToken;

    // Criar cliente
    const clienteCPF = generateTestCPF('laudo_cliente');
    cliente = await Cliente.create({
      nome: 'Cliente Teste',
      cpf: clienteCPF,
      endereco: 'Rua Teste, 123, Centro, São Paulo/SP'
    });

    // Criar embarcação
    embarcacao = await Embarcacao.create({
      nome: 'Barco Teste Preenchimento',
      nr_inscricao_barco: 'BR-2024-TEST',
      proprietario_nome: 'João Silva',
      proprietario_cpf: generateTestCPF('laudo_prop'),
      tipo_embarcacao: 'LANCHA',
      ano_fabricacao: 2020,
      valor_embarcacao: 150000.00,
      cliente_id: cliente.id
    });

    // Criar local
    local = await Local.create({
      tipo: 'MARINA',
      logradouro: 'Rua das Embarcações',
      numero: '100',
      bairro: 'Centro',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      cep: '20000-000'
    });

    // Criar status concluída com nome único
    const timestamp = Date.now();
    const statusNome = `CONCLUIDA_${timestamp}`;
    const [status, created] = await StatusVistoria.findOrCreate({
      where: { nome: statusNome },
      defaults: { nome: statusNome, descricao: 'Vistoria concluída' }
    });
    statusConcluida = status;

    // Criar vistoria concluída
    vistoria = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: vistoriadorUser.id,
      administrador_id: adminUser.id,
      status_id: statusConcluida.id,
      data_conclusao: new Date('2024-01-15'),
      valor_embarcacao: 180000.00
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/laudos/vistoria/:vistoriaId - Criação com preenchimento automático', () => {
    it('deve criar laudo com dados preenchidos automaticamente', async () => {
      // Criar nova vistoria para este teste (vistoria_id é unique)
      const embarcacao1 = await Embarcacao.create({
        nome: 'Barco Teste Preenchimento',
        nr_inscricao_barco: `BR-2024-TEST-${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        ano_fabricacao: 2020,
        cliente_id: cliente.id
      });
      
      const vistoria1 = await Vistoria.create({
        embarcacao_id: embarcacao1.id,
        local_id: local.id,
        vistoriador_id: vistoriadorUser.id,
        administrador_id: adminUser.id,
        status_id: statusConcluida.id,
        data_conclusao: new Date('2024-01-15'),
        valor_embarcacao: 180000.00
      });

      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoria1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('numero_laudo');
      expect(response.body.nome_moto_aquatica).toBe('Barco Teste Preenchimento');
      expect(response.body.proprietario).toBeDefined();
      expect(response.body.inscricao_capitania).toBe(embarcacao1.nr_inscricao_barco);
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
      expect(response.body.ano_fabricacao).toBe(2020);
      expect(response.body.valor_risco).toBeDefined();
      expect(response.body.local_vistoria).toBeDefined();
    });

    it('deve priorizar dados fornecidos sobre dados automáticos', async () => {
      // Criar nova vistoria para este teste (vistoria_id é unique)
      const embarcacao2 = await Embarcacao.create({
        nome: 'Barco Teste 2',
        nr_inscricao_barco: `BR-2024-TEST-${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        ano_fabricacao: 2020,
        cliente_id: cliente.id
      });
      
      const vistoria2 = await Vistoria.create({
        embarcacao_id: embarcacao2.id,
        local_id: local.id,
        vistoriador_id: vistoriadorUser.id,
        administrador_id: adminUser.id,
        status_id: statusConcluida.id,
        data_conclusao: new Date('2024-01-15'),
        valor_embarcacao: 200000.00
      });

      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoria2.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_moto_aquatica: 'Barco Customizado',
          proprietario: 'Maria Santos',
          valor_risco: 200000.00
        });

      expect(response.status).toBe(200);
      expect(response.body.nome_moto_aquatica).toBe('Barco Customizado');
      expect(response.body.proprietario).toBe('Maria Santos');
      expect(response.body.valor_risco).toBe('200000.00');
      // Outros campos devem ser preenchidos automaticamente
      expect(response.body.inscricao_capitania).toBe(embarcacao2.nr_inscricao_barco);
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
    });
  });

  describe('GET /api/laudos/:id - Buscar laudo com preenchimento automático', () => {
    let laudoId;
    let vistoriaTeste;

    beforeAll(async () => {
      // Garantir que cliente existe
      if (!cliente || !cliente.id) {
        const clienteCPF = generateTestCPF('laudo_cliente_get');
        cliente = await Cliente.create({
          nome: 'Cliente Teste GET',
          cpf: clienteCPF,
          endereco: 'Rua Teste GET, 123, Centro, São Paulo/SP'
        });
      }
      
      // Criar nova vistoria para este teste (vistoria_id é unique)
      const embarcacaoTeste = await Embarcacao.create({
        nome: 'Barco Teste GET',
        nr_inscricao_barco: `BR-GET-${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        ano_fabricacao: 2020,
        cliente_id: cliente.id
      });
      
      vistoriaTeste = await Vistoria.create({
        embarcacao_id: embarcacaoTeste.id,
        local_id: local.id,
        vistoriador_id: vistoriadorUser.id,
        administrador_id: adminUser.id,
        status_id: statusConcluida.id,
        data_conclusao: new Date('2024-01-15')
      });

      // Criar laudo vazio para teste
      const numeroUnico = `TEST${Date.now()}`;
      const laudo = await Laudo.create({
        vistoria_id: vistoriaTeste.id,
        numero_laudo: numeroUnico,
        nome_moto_aquatica: 'Barco Teste',
        // Deixar outros campos vazios
      });
      laudoId = laudo.id;
    });

    it('deve preencher campos vazios ao buscar laudo', async () => {
      const response = await request(app)
        .get(`/api/laudos/${laudoId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', laudoId);
      // Campos devem ser preenchidos automaticamente
      expect(response.body.proprietario).toBe('João Silva');
      expect(response.body.cpf_cnpj).toBe('444.444.444-44');
      expect(response.body.inscricao_capitania).toBe('BR-2024-TEST');
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
      expect(response.body.ano_fabricacao).toBe(2020);
    });
  });

  describe('GET /api/laudos/vistoria/:vistoriaId - Buscar laudo por vistoria com preenchimento', () => {
    let laudoId;
    let vistoriaTeste2;

    beforeAll(async () => {
      // Garantir que cliente existe
      if (!cliente || !cliente.id) {
        const clienteCPF = generateTestCPF('laudo_cliente_get2');
        cliente = await Cliente.create({
          nome: 'Cliente Teste GET2',
          cpf: clienteCPF,
          endereco: 'Rua Teste GET2, 123, Centro, São Paulo/SP'
        });
      }
      
      // Criar nova vistoria para este teste (vistoria_id é unique)
      const embarcacaoTeste2 = await Embarcacao.create({
        nome: 'Barco Teste GET2',
        nr_inscricao_barco: `BR-GET2-${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        ano_fabricacao: 2020,
        cliente_id: cliente.id
      });
      
      vistoriaTeste2 = await Vistoria.create({
        embarcacao_id: embarcacaoTeste2.id,
        local_id: local.id,
        vistoriador_id: vistoriadorUser.id,
        administrador_id: adminUser.id,
        status_id: statusConcluida.id,
        data_conclusao: new Date('2024-01-15')
      });

      // Criar laudo com alguns campos vazios
      const numeroUnico = `TEST2${Date.now()}`;
      const laudo = await Laudo.create({
        vistoria_id: vistoriaTeste2.id,
        numero_laudo: numeroUnico,
        nome_moto_aquatica: 'Barco Teste 2',
        proprietario: null,
        cpf_cnpj: '',
        tipo_embarcacao: null
      });
      laudoId = laudo.id;
    });

    it('deve preencher campos vazios ao buscar laudo por vistoria', async () => {
      const response = await request(app)
        .get(`/api/laudos/vistoria/${vistoriaTeste2.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', laudoId);
      // Campos vazios devem ser preenchidos
      expect(response.body.proprietario).toBeDefined();
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
    });
  });
});

