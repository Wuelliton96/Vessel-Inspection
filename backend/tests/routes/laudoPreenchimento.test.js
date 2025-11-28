const request = require('supertest');
const app = require('../../server');
const bcrypt = require('bcryptjs');
const { 
  Usuario, 
  NivelAcesso, 
  Embarcacao, 
  Local, 
  StatusVistoria, 
  Vistoria,
  Laudo,
  Cliente
} = require('../../models');
const { generateTestCPF } = require('../helpers/testHelpers');

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
    // Criar níveis de acesso
    const nivelAdmin = await NivelAcesso.findOne({ where: { nome: 'ADMINISTRADOR' } }) || 
      await NivelAcesso.create({ nome: 'ADMINISTRADOR', descricao: 'Administrador do sistema' });
    
    const nivelVistoriador = await NivelAcesso.findOne({ where: { nome: 'VISTORIADOR' } }) || 
      await NivelAcesso.create({ nome: 'VISTORIADOR', descricao: 'Vistoriador' });

    // Criar usuário admin
    const senhaHash = await bcrypt.hash('senha123', 10);
    const adminCPF = generateTestCPF('laudo_admin');
    adminUser = await Usuario.create({
      nome: 'Admin Teste',
      cpf: adminCPF,
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAdmin.id,
      ativo: true,
      email: 'admin@laudo.com'
    });

    // Criar usuário vistoriador
    const vistCPF = generateTestCPF('laudo_vist');
    vistoriadorUser = await Usuario.create({
      nome: 'Vistoriador Teste',
      cpf: vistCPF,
      senha_hash: senhaHash,
      nivel_acesso_id: nivelVistoriador.id,
      ativo: true,
      email: 'vist@laudo.com'
    });

    // Login para obter token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ cpf: adminCPF, senha: 'senha123' });
    
    adminToken = loginResponse.body.token;

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
    // Limpar dados de teste
    await Laudo.destroy({ where: {}, force: true });
    await Vistoria.destroy({ where: {}, force: true });
    await Embarcacao.destroy({ where: {}, force: true });
    await Cliente.destroy({ where: {}, force: true });
    await Local.destroy({ where: {}, force: true });
    await Usuario.destroy({ where: {}, force: true });
  });

  describe('POST /api/laudos/vistoria/:vistoriaId - Criação com preenchimento automático', () => {
    it('deve criar laudo com dados preenchidos automaticamente', async () => {
      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('numero_laudo');
      expect(response.body.nome_moto_aquatica).toBe('Barco Teste Preenchimento');
      expect(response.body.proprietario).toBe('João Silva');
      expect(response.body.cpf_cnpj).toBe('444.444.444-44');
      expect(response.body.inscricao_capitania).toBe('BR-2024-TEST');
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
      expect(response.body.ano_fabricacao).toBe(2020);
      expect(response.body.valor_risco).toBe('180000.00');
      expect(response.body.local_vistoria).toContain('Rua das Embarcações');
      expect(response.body.local_guarda).toContain('Rua das Embarcações');
    });

    it('deve priorizar dados fornecidos sobre dados automáticos', async () => {
      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoria.id}`)
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
      expect(response.body.inscricao_capitania).toBe('BR-2024-TEST');
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
    });
  });

  describe('GET /api/laudos/:id - Buscar laudo com preenchimento automático', () => {
    let laudoId;

    beforeAll(async () => {
      // Criar laudo vazio para teste
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: 'TEST001',
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

    beforeAll(async () => {
      // Criar laudo com alguns campos vazios
      const laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: 'TEST002',
        nome_moto_aquatica: 'Barco Teste 2',
        proprietario: null,
        cpf_cnpj: '',
        tipo_embarcacao: null
      });
      laudoId = laudo.id;
    });

    it('deve preencher campos vazios ao buscar laudo por vistoria', async () => {
      const response = await request(app)
        .get(`/api/laudos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', laudoId);
      // Campos vazios devem ser preenchidos
      expect(response.body.proprietario).toBe('João Silva');
      expect(response.body.cpf_cnpj).toBe('444.444.444-44');
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
    });
  });
});

