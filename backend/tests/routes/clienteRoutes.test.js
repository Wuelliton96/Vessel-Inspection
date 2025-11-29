const request = require('supertest');
const { sequelize, Cliente, Embarcacao } = require('../../models');
const clienteRoutes = require('../../routes/clienteRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/clientes', router: clienteRoutes });

describe('Rotas de Clientes - Testes Completos', () => {
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
    await Cliente.destroy({ where: { nome: { [require('sequelize').Op.like]: '%Test Cliente%' } }, force: true });
  });

  describe('GET /api/clientes', () => {
    it('deve listar todos os clientes', async () => {
      await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test Cliente Lista',
        cpf: generateTestCPF('lista')
      });

      const response = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar por tipo de pessoa', async () => {
      await Cliente.create({
        tipo_pessoa: 'JURIDICA',
        nome: 'Test Cliente PJ',
        cnpj: '12345678000190'
      });

      const response = await request(app)
        .get('/api/clientes?tipo_pessoa=JURIDICA')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(c => c.tipo_pessoa === 'JURIDICA')).toBe(true);
    });

    it('deve filtrar por status ativo', async () => {
      await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test Cliente Ativo',
        cpf: generateTestCPF('ativo'),
        ativo: true
      });

      const response = await request(app)
        .get('/api/clientes?ativo=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(c => c.ativo === true)).toBe(true);
    });

    it('deve filtrar por CPF', async () => {
      const cpfTeste = generateTestCPF('filtrocpf');
      await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test Cliente CPF Filtro',
        cpf: cpfTeste
      });

      const response = await request(app)
        .get(`/api/clientes?cpf=${cpfTeste}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('deve filtrar por CNPJ', async () => {
      const cnpj = '98765432000199';
      await Cliente.create({
        tipo_pessoa: 'JURIDICA',
        nome: 'Test Cliente CNPJ Filtro',
        cnpj: cnpj
      });

      const response = await request(app)
        .get(`/api/clientes?cnpj=${cnpj}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('deve ordenar por nome', async () => {
      await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'ZZZ Test Cliente Z',
        cpf: generateTestCPF('z')
      });
      await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'AAA Test Cliente A',
        cpf: generateTestCPF('a')
      });

      const response = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('deve incluir embarcações na resposta', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test Cliente Com Emb',
        cpf: generateTestCPF('emb')
      });

      await Embarcacao.create({
        nome: 'Embarcacao do Cliente',
        nr_inscricao_barco: `EMB${Date.now()}`,
        cliente_id: cliente.id
      });

      const response = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const clienteComEmb = response.body.find(c => c.id === cliente.id);
      if (clienteComEmb) {
        expect(clienteComEmb).toHaveProperty('embarcacoes');
      }
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/clientes');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/clientes/buscar/:documento', () => {
    it('deve buscar cliente por CPF', async () => {
      const cpf = generateTestCPF('busca');
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test Cliente Busca CPF',
        cpf: cpf
      });

      const response = await request(app)
        .get(`/api/clientes/buscar/${cpf}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(cliente.id);
    });

    it('deve buscar cliente por CNPJ', async () => {
      const cnpj = '11222333000144';
      const cliente = await Cliente.create({
        tipo_pessoa: 'JURIDICA',
        nome: 'Test Cliente Busca CNPJ',
        cnpj: cnpj
      });

      const response = await request(app)
        .get(`/api/clientes/buscar/${cnpj}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(cliente.id);
    });

    it('deve retornar 400 para documento inválido', async () => {
      const response = await request(app)
        .get('/api/clientes/buscar/12345')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('inválido');
    });

    it('deve retornar 404 para cliente não encontrado', async () => {
      const cpfInexistente = generateTestCPF('inexistente');
      const response = await request(app)
        .get(`/api/clientes/buscar/${cpfInexistente}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve incluir embarcações na resposta', async () => {
      const cpf = generateTestCPF('buscaemb');
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test Cliente Busca Com Emb',
        cpf: cpf
      });

      await Embarcacao.create({
        nome: 'Emb Cliente Busca',
        nr_inscricao_barco: `EMBCLI${Date.now()}`,
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
    it('deve retornar cliente por id', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test Cliente Por ID',
        cpf: generateTestCPF('id')
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

    it('deve incluir embarcações na resposta', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test Cliente ID Com Emb',
        cpf: generateTestCPF('idemb')
      });

      await Embarcacao.create({
        nome: 'Emb Cliente ID',
        nr_inscricao_barco: `EMBID${Date.now()}`,
        cliente_id: cliente.id
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
      const cpf = generateTestCPF('novo');
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'FISICA',
          nome: 'Test Cliente Novo PF',
          cpf: cpf,
          email: `novopf_${Date.now()}@test.com`
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.tipo_pessoa).toBe('FISICA');
    });

    it('deve criar cliente pessoa jurídica', async () => {
      const cnpj = '55666777000188';
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'JURIDICA',
          nome: 'Test Cliente Novo PJ',
          cnpj: cnpj,
          email: `novopj_${Date.now()}@test.com`
        });

      expect(response.status).toBe(201);
      expect(response.body.tipo_pessoa).toBe('JURIDICA');
    });

    it('deve criar cliente com todos os campos', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'FISICA',
          nome: 'Test Cliente Completo',
          cpf: generateTestCPF('completo'),
          telefone_e164: '+5511999998888',
          email: `completo_${Date.now()}@test.com`,
          cep: '12345678',
          logradouro: 'Rua Teste',
          numero: '123',
          complemento: 'Sala 1',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          observacoes: 'Cliente de teste'
        });

      expect(response.status).toBe(201);
      expect(response.body.cep).toBe('12345678');
      expect(response.body.cidade).toBe('São Paulo');
    });

    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'FISICA',
          cpf: generateTestCPF('semNome')
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatório');
    });

    it('deve retornar 400 sem CPF para pessoa física', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'FISICA',
          nome: 'Test Cliente Sem CPF'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('CPF');
    });

    it('deve retornar 400 sem CNPJ para pessoa jurídica', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'JURIDICA',
          nome: 'Test Cliente Sem CNPJ'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('CNPJ');
    });

    it('deve usar tipo FISICA como padrão', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Test Cliente Tipo Padrao',
          cpf: generateTestCPF('padrao')
        });

      expect(response.status).toBe(201);
      expect(response.body.tipo_pessoa).toBe('FISICA');
    });

    it('deve retornar 400 para CPF/CNPJ duplicado', async () => {
      const cpf = generateTestCPF('dup');
      await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test Cliente Existente',
        cpf: cpf
      });

      const response = await request(app)
        .post('/api/clientes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_pessoa: 'FISICA',
          nome: 'Test Cliente Duplicado',
          cpf: cpf
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('cadastrado');
    });
  });

  describe('PUT /api/clientes/:id', () => {
    let clienteTeste;

    beforeEach(async () => {
      clienteTeste = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test Cliente Para Update',
        cpf: generateTestCPF('update'),
        email: `update_${Date.now()}@test.com`
      });
    });

    it('deve atualizar cliente com sucesso', async () => {
      const response = await request(app)
        .put(`/api/clientes/${clienteTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Test Cliente Atualizado'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Test Cliente Atualizado');
    });

    it('deve atualizar todos os campos', async () => {
      const response = await request(app)
        .put(`/api/clientes/${clienteTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Test Cliente Full Update',
          telefone_e164: '+5521999998888',
          email: `fullupdate_${Date.now()}@test.com`,
          cep: '87654321',
          logradouro: 'Rua Atualizada',
          numero: '456',
          complemento: 'Apto 2',
          bairro: 'Novo Bairro',
          cidade: 'Rio de Janeiro',
          estado: 'RJ',
          observacoes: 'Observação atualizada'
        });

      expect(response.status).toBe(200);
      expect(response.body.cidade).toBe('Rio de Janeiro');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .put('/api/clientes/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Teste' });

      expect(response.status).toBe(404);
    });

    it('deve atualizar status ativo', async () => {
      const response = await request(app)
        .put(`/api/clientes/${clienteTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ativo: false });

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(false);
    });
  });

  describe('DELETE /api/clientes/:id', () => {
    it('deve deletar cliente sem embarcações', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test Cliente Para Deletar',
        cpf: generateTestCPF('delete')
      });

      const response = await request(app)
        .delete(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('sucesso');

      const deleted = await Cliente.findByPk(cliente.id);
      expect(deleted).toBeNull();
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
        nome: 'Test Cliente Com Emb Del',
        cpf: generateTestCPF('delemb')
      });

      await Embarcacao.create({
        nome: 'Emb Del Cliente',
        nr_inscricao_barco: `EMBDEL${Date.now()}`,
        cliente_id: cliente.id
      });

      const response = await request(app)
        .delete(`/api/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('embarcações');
    });
  });

  describe('PATCH /api/clientes/:id/toggle-status', () => {
    it('deve alternar status de ativo para inativo', async () => {
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Test Cliente Toggle',
        cpf: generateTestCPF('toggle'),
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
        nome: 'Test Cliente Toggle 2',
        cpf: generateTestCPF('toggle2'),
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
