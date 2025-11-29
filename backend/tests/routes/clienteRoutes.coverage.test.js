/**
 * Testes abrangentes para clienteRoutes
 * Objetivo: Aumentar cobertura de testes para > 75%
 */
const request = require('supertest');
const { sequelize, Cliente, Embarcacao } = require('../../models');
const clienteRoutes = require('../../routes/clienteRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/clientes', router: clienteRoutes });

describe('Rotas de Clientes - Testes de Cobertura', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('cliente');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Embarcacao.destroy({ where: {}, force: true });
    await Cliente.destroy({ where: {}, force: true });
  });

  describe('GET /api/clientes', () => {
    it('deve listar todos os clientes', async () => {
      await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Cliente Teste 1',
        cpf: generateTestCPF('cli1')
      });

      const response = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve ordenar por nome ASC', async () => {
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Zulu Cliente', cpf: generateTestCPF('z') });
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Alpha Cliente', cpf: generateTestCPF('a') });

      const response = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0].nome).toBe('Alpha Cliente');
    });

    it('deve filtrar por ativo=true', async () => {
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Ativo', cpf: generateTestCPF('ativo'), ativo: true });
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Inativo', cpf: generateTestCPF('inativo'), ativo: false });

      const response = await request(app)
        .get('/api/clientes?ativo=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(c => c.ativo === true)).toBe(true);
    });

    it('deve filtrar por ativo=false', async () => {
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Ativo2', cpf: generateTestCPF('ativo2'), ativo: true });
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Inativo2', cpf: generateTestCPF('inativo2'), ativo: false });

      const response = await request(app)
        .get('/api/clientes?ativo=false')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(c => c.ativo === false)).toBe(true);
    });

    it('deve filtrar por tipo_pessoa', async () => {
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Pessoa Fisica', cpf: generateTestCPF('pf') });
      await Cliente.create({ tipo_pessoa: 'JURIDICA', nome: 'Pessoa Juridica', cnpj: '12345678000190' });

      const response = await request(app)
        .get('/api/clientes?tipo_pessoa=FISICA')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(c => c.tipo_pessoa === 'FISICA')).toBe(true);
    });

    it('deve filtrar por cpf', async () => {
      const cpf = generateTestCPF('filtrocpf');
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Com CPF', cpf });

      const response = await request(app)
        .get(`/api/clientes?cpf=${cpf}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });

    it('deve filtrar por cnpj', async () => {
      const cnpj = '98765432000199';
      await Cliente.create({ tipo_pessoa: 'JURIDICA', nome: 'Com CNPJ', cnpj });

      const response = await request(app)
        .get(`/api/clientes?cnpj=${cnpj}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });

    it('deve incluir embarcações na listagem', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Com Embarcação',
        cpf: generateTestCPF('comemb')
      });

      await Embarcacao.create({
        nome: 'Barco Cliente',
        nr_inscricao_barco: `CLI${Date.now()}`,
        cliente_id: cliente.id
      });

      const response = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('embarcacoes');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/clientes');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/clientes/buscar/:documento', () => {
    it('deve buscar cliente por CPF (11 dígitos)', async () => {
      const cpf = generateTestCPF('busca');
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Busca CPF', cpf });

      const response = await request(app)
        .get(`/api/clientes/buscar/${cpf}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.cpf).toBe(cpf);
    });

    it('deve buscar cliente por CNPJ (14 dígitos)', async () => {
      const cnpj = '11222333000155';
      await Cliente.create({ tipo_pessoa: 'JURIDICA', nome: 'Busca CNPJ', cnpj });

      const response = await request(app)
        .get(`/api/clientes/buscar/${cnpj}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.cnpj).toBe(cnpj);
    });

    it('deve retornar 400 para documento inválido', async () => {
      const response = await request(app)
        .get('/api/clientes/buscar/12345')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('inválido');
    });

    it('deve retornar 404 para cliente não encontrado', async () => {
      const response = await request(app)
        .get('/api/clientes/buscar/99999999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve incluir embarcações na resposta', async () => {
      const cpf = generateTestCPF('comemb2');
      const cliente = await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Com Embarcações', cpf });

      await Embarcacao.create({
        nome: 'Embarcação Busca',
        nr_inscricao_barco: `BUSCA${Date.now()}`,
        cliente_id: cliente.id
      });

      const response = await request(app)
        .get(`/api/clientes/buscar/${cpf}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('embarcacoes');
    });
  });

  describe('GET /api/clientes/:id', () => {
    it('deve buscar cliente por id', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Busca ID',
        cpf: generateTestCPF('buscaid')
      });

      const response = await request(app)
        .get(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(cliente.id);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/clientes/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve incluir embarcações', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Com Embarcações ID',
        cpf: generateTestCPF('comembid')
      });

      const response = await request(app)
        .get(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('embarcacoes');
    });
  });

  describe('POST /api/clientes', () => {
    it('deve criar cliente pessoa física', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'FISICA',
          nome: 'Novo Cliente PF',
          cpf: generateTestCPF('novo')
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('deve criar cliente pessoa jurídica', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'JURIDICA',
          nome: 'Novo Cliente PJ',
          cnpj: '55666777000188'
        });

      expect(response.status).toBe(201);
    });

    it('deve usar FISICA como padrão quando tipo_pessoa não fornecido', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Cliente Sem Tipo',
          cpf: generateTestCPF('semtipo')
        });

      expect(response.status).toBe(201);
      expect(response.body.tipo_pessoa).toBe('FISICA');
    });

    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'FISICA',
          cpf: generateTestCPF('semnome')
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Nome');
    });

    it('deve retornar 400 para PF sem CPF', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'FISICA',
          nome: 'Sem CPF'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('CPF');
    });

    it('deve retornar 400 para PJ sem CNPJ', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'JURIDICA',
          nome: 'Sem CNPJ'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('CNPJ');
    });

    it('deve criar cliente com todos os campos opcionais', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'FISICA',
          nome: 'Cliente Completo',
          cpf: generateTestCPF('completo'),
          telefone_e164: '+5511999999999',
          email: 'cliente@teste.com',
          cep: '01310100',
          logradouro: 'Av. Paulista',
          numero: '1000',
          complemento: 'Sala 10',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          estado: 'SP',
          observacoes: 'Cliente VIP'
        });

      expect(response.status).toBe(201);
      expect(response.body.email).toBe('cliente@teste.com');
    });

    it('deve retornar 400 para CPF duplicado', async () => {
      const cpf = generateTestCPF('dup');
      await Cliente.create({ tipo_pessoa: 'FISICA', nome: 'Original', cpf });

      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'FISICA',
          nome: 'Duplicado',
          cpf
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('já cadastrado');
    });
  });

  describe('PUT /api/clientes/:id', () => {
    it('deve atualizar cliente', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Original',
        cpf: generateTestCPF('orig')
      });

      const response = await request(app)
        .put(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Atualizado'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Atualizado');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .put('/api/clientes/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Teste' });

      expect(response.status).toBe(404);
    });

    it('deve manter valores não fornecidos', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Manter',
        cpf: generateTestCPF('manter'),
        email: 'original@test.com'
      });

      const response = await request(app)
        .put(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Nome Novo'
        });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('original@test.com');
    });

    it('deve atualizar campo ativo', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Toggle',
        cpf: generateTestCPF('toggle'),
        ativo: true
      });

      const response = await request(app)
        .put(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ativo: false
        });

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(false);
    });
  });

  describe('DELETE /api/clientes/:id', () => {
    it('deve excluir cliente sem embarcações', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Delete',
        cpf: generateTestCPF('delete')
      });

      const response = await request(app)
        .delete(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('sucesso');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .delete('/api/clientes/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para cliente com embarcações', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Com Embarcação Delete',
        cpf: generateTestCPF('comembdel')
      });

      await Embarcacao.create({
        nome: 'Embarcação Vinculada',
        nr_inscricao_barco: `VINC${Date.now()}`,
        cliente_id: cliente.id
      });

      const response = await request(app)
        .delete(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('embarcações vinculadas');
    });
  });

  describe('PATCH /api/clientes/:id/toggle-status', () => {
    it('deve alternar status de ativo para inativo', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Toggle Status',
        cpf: generateTestCPF('togglestat'),
        ativo: true
      });

      const response = await request(app)
        .patch(`/api/clientes/${cliente.id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(false);
    });

    it('deve alternar status de inativo para ativo', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Toggle Status 2',
        cpf: generateTestCPF('togglestat2'),
        ativo: false
      });

      const response = await request(app)
        .patch(`/api/clientes/${cliente.id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(true);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .patch('/api/clientes/99999/toggle-status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });
});

