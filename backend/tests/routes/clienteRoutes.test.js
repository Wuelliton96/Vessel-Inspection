const request = require('supertest');
const { sequelize, Cliente, Embarcacao } = require('../../models');
const clienteRoutes = require('../../routes/clienteRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/clientes', router: clienteRoutes });

describe('Rotas de Clientes - Testes Adicionais', () => {
  let adminToken, vistoriadorToken;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('cliente');
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Cliente.destroy({ where: {}, force: true });
  });

  describe('GET /api/clientes - Filtros', () => {
    it('deve filtrar por ativo=true', async () => {
      await Cliente.create({ nome: 'Cliente Ativo', cpf: generateTestCPF('c1'), ativo: true });
      await Cliente.create({ nome: 'Cliente Inativo', cpf: generateTestCPF('c2'), ativo: false });

      const response = await request(app)
        .get('/api/clientes?ativo=true')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(c => c.ativo === true)).toBe(true);
    });

    it('deve filtrar por tipo_pessoa', async () => {
      await Cliente.create({ nome: 'PF', cpf: generateTestCPF('c3'), tipo_pessoa: 'FISICA' });
      await Cliente.create({ nome: 'PJ', cnpj: '12345678901234', tipo_pessoa: 'JURIDICA' });

      const response = await request(app)
        .get('/api/clientes?tipo_pessoa=FISICA')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(c => c.tipo_pessoa === 'FISICA')).toBe(true);
    });

    it('deve filtrar por CPF', async () => {
      const cpf = generateTestCPF('c4');
      await Cliente.create({ nome: 'Cliente CPF', cpf, tipo_pessoa: 'FISICA' });

      const response = await request(app)
        .get(`/api/clientes?cpf=${cpf}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].cpf).toBe(cpf);
    });

    it('deve incluir embarcacoes na resposta', async () => {
      const cliente = await Cliente.create({
        nome: 'Cliente com Embarcacao',
        cpf: generateTestCPF('c5'),
        tipo_pessoa: 'FISICA'
      });

      await Embarcacao.create({
        nome: 'Boat 1',
        tipo: 'LANCHA',
        cliente_id: cliente.id
      });

      const response = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      const clienteComEmbarcacao = response.body.find(c => c.id === cliente.id);
      expect(clienteComEmbarcacao).toBeDefined();
      expect(clienteComEmbarcacao.embarcacoes).toBeDefined();
    });
  });

  describe('GET /api/clientes/buscar/:documento', () => {
    it('deve buscar cliente por CPF', async () => {
      const cpf = generateTestCPF('c6');
      const cliente = await Cliente.create({
        nome: 'Cliente CPF',
        cpf,
        tipo_pessoa: 'FISICA'
      });

      const response = await request(app)
        .get(`/api/clientes/buscar/${cpf}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(cliente.id);
      expect(response.body.cpf).toBe(cpf);
    });

    it('deve buscar cliente por CPF formatado', async () => {
      const cpf = generateTestCPF('c7');
      const cpfFormatado = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      const cliente = await Cliente.create({
        nome: 'Cliente CPF Formatado',
        cpf,
        tipo_pessoa: 'FISICA'
      });

      const response = await request(app)
        .get(`/api/clientes/buscar/${cpfFormatado}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(cliente.id);
    });

    it('deve buscar cliente por CNPJ', async () => {
      const cnpj = '12345678901234';
      const cliente = await Cliente.create({
        nome: 'Cliente CNPJ',
        cnpj,
        tipo_pessoa: 'JURIDICA'
      });

      const response = await request(app)
        .get(`/api/clientes/buscar/${cnpj}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(cliente.id);
      expect(response.body.cnpj).toBe(cnpj);
    });

    it('deve retornar 400 para documento inválido', async () => {
      const response = await request(app)
        .get('/api/clientes/buscar/123')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Documento inválido');
    });

    it('deve retornar 404 para cliente não encontrado', async () => {
      const cpf = generateTestCPF('c8');
      const response = await request(app)
        .get(`/api/clientes/buscar/${cpf}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/clientes', () => {
    it('deve criar cliente pessoa física', async () => {
      const cpf = generateTestCPF('c9');
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          nome: 'Novo Cliente PF',
          cpf,
          tipo_pessoa: 'FISICA',
          email: 'cliente@test.com'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('Novo Cliente PF');
      expect(response.body.cpf).toBe(cpf);
    });

    it('deve criar cliente pessoa jurídica', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          nome: 'Nova Empresa',
          cnpj: '98765432109876',
          tipo_pessoa: 'JURIDICA',
          email: 'empresa@test.com'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.tipo_pessoa).toBe('JURIDICA');
    });

    it('deve retornar 400 sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/clientes/:id', () => {
    it('deve atualizar cliente', async () => {
      const cpf = generateTestCPF('c10');
      const cliente = await Cliente.create({
        nome: 'Cliente Original',
        cpf,
        tipo_pessoa: 'FISICA'
      });

      const response = await request(app)
        .put(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          nome: 'Cliente Atualizado',
          email: 'novo@email.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Cliente Atualizado');
      expect(response.body.email).toBe('novo@email.com');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .put('/api/clientes/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/clientes/:id', () => {
    it('deve deletar cliente', async () => {
      const cpf = generateTestCPF('c11');
      const cliente = await Cliente.create({
        nome: 'Cliente para Deletar',
        cpf,
        tipo_pessoa: 'FISICA'
      });

      const response = await request(app)
        .delete(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);

      const deleted = await Cliente.findByPk(cliente.id);
      expect(deleted).toBeNull();
    });
  });
});
