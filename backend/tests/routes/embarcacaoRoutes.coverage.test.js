/**
 * Testes abrangentes para embarcacaoRoutes
 * Objetivo: Aumentar cobertura de testes para > 75%
 */
const request = require('supertest');
const { sequelize, Embarcacao, Seguradora, Cliente } = require('../../models');
const embarcacaoRoutes = require('../../routes/embarcacaoRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/embarcacoes', router: embarcacaoRoutes });

describe('Rotas de Embarcações - Testes de Cobertura', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('embarcacao');
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
    await Seguradora.destroy({ where: {}, force: true });
  });

  describe('GET /api/embarcacoes', () => {
    it('deve listar todas as embarcações', async () => {
      await Embarcacao.create({
        nome: 'Barco Teste 1',
        nr_inscricao_barco: `TEST${Date.now()}`
      });

      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve ordenar por nome ASC', async () => {
      await Embarcacao.create({ nome: 'Zulu Boat', nr_inscricao_barco: `Z${Date.now()}` });
      await Embarcacao.create({ nome: 'Alpha Boat', nr_inscricao_barco: `A${Date.now()}` });

      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0].nome).toBe('Alpha Boat');
    });

    it('deve filtrar por proprietario_cpf', async () => {
      const cpf = generateTestCPF('filter');
      await Embarcacao.create({
        nome: 'Barco Filtro',
        nr_inscricao_barco: `FILTER${Date.now()}`,
        proprietario_cpf: cpf
      });

      await Embarcacao.create({
        nome: 'Outro Barco',
        nr_inscricao_barco: `OUTRO${Date.now()}`,
        proprietario_cpf: '99999999999'
      });

      const response = await request(app)
        .get(`/api/embarcacoes?proprietario_cpf=${cpf}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].proprietario_cpf).toBe(cpf);
    });

    it('deve incluir associações Seguradora e Cliente', async () => {
      const seguradora = await Seguradora.create({ nome: 'Seguradora Teste', ativo: true });
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Cliente Teste',
        cpf: generateTestCPF('cliente')
      });

      await Embarcacao.create({
        nome: 'Barco Com Associações',
        nr_inscricao_barco: `ASSOC${Date.now()}`,
        seguradora_id: seguradora.id,
        cliente_id: cliente.id
      });

      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('Seguradora');
      expect(response.body[0]).toHaveProperty('Cliente');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/embarcacoes');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/embarcacoes/:id', () => {
    it('deve buscar embarcação por id', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Barco Busca',
        nr_inscricao_barco: `BUSCA${Date.now()}`
      });

      const response = await request(app)
        .get(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(embarcacao.id);
      expect(response.body.nome).toBe('Barco Busca');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/embarcacoes/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve incluir Seguradora e Cliente na resposta', async () => {
      const seguradora = await Seguradora.create({ nome: 'Seguradora GetById', ativo: true });
      const embarcacao = await Embarcacao.create({
        nome: 'Barco Com Seguradora',
        nr_inscricao_barco: `SEG${Date.now()}`,
        seguradora_id: seguradora.id
      });

      const response = await request(app)
        .get(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('Seguradora');
    });
  });

  describe('POST /api/embarcacoes', () => {
    it('deve criar nova embarcação', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Nova Embarcação',
          nr_inscricao_barco: `NEW${Date.now()}`
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('Nova Embarcação');
    });

    it('deve criar embarcação com todos os campos opcionais', async () => {
      const seguradora = await Seguradora.create({ nome: 'Seguradora Create', ativo: true });
      const cliente = await Cliente.create({
        tipo_pessoa: 'FISICA',
        nome: 'Cliente Create',
        cpf: generateTestCPF('create')
      });

      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Embarcação Completa',
          nr_inscricao_barco: `COMP${Date.now()}`,
          cliente_id: cliente.id,
          tipo_embarcacao: 'LANCHA',
          porte: 'MEDIO',
          seguradora_id: seguradora.id,
          valor_embarcacao: 150000,
          ano_fabricacao: 2022
        });

      expect(response.status).toBe(201);
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
      expect(response.body.ano_fabricacao).toBe(2022);
    });

    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nr_inscricao_barco: `NONAME${Date.now()}`
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatórios');
    });

    it('deve retornar 400 sem nr_inscricao_barco', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Sem Inscrição'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatórios');
    });

    it('deve criar embarcação com cliente_id null', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Embarcação Sem Cliente',
          nr_inscricao_barco: `NOCLI${Date.now()}`,
          cliente_id: null
        });

      expect(response.status).toBe(201);
      expect(response.body.cliente_id).toBeNull();
    });
  });

  describe('PUT /api/embarcacoes/:id', () => {
    it('deve atualizar embarcação existente', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Barco Original',
        nr_inscricao_barco: `ORIG${Date.now()}`
      });

      const response = await request(app)
        .put(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Barco Atualizado'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Barco Atualizado');
    });

    it('deve manter valores não fornecidos', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Barco Manter',
        nr_inscricao_barco: `MANTER${Date.now()}`,
        tipo_embarcacao: 'LANCHA'
      });

      const response = await request(app)
        .put(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Barco Nome Novo'
        });

      expect(response.status).toBe(200);
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
    });

    it('deve atualizar campos opcionais para undefined', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Barco Update',
        nr_inscricao_barco: `UPD${Date.now()}`,
        tipo_embarcacao: 'LANCHA',
        porte: 'GRANDE'
      });

      const response = await request(app)
        .put(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipo_embarcacao: 'JET_SKI',
          porte: undefined
        });

      expect(response.status).toBe(200);
      expect(response.body.tipo_embarcacao).toBe('JET_SKI');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .put('/api/embarcacoes/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Não Existe'
        });

      expect(response.status).toBe(404);
    });

    it('deve incluir associações na resposta', async () => {
      const seguradora = await Seguradora.create({ nome: 'Seguradora Update', ativo: true });
      const embarcacao = await Embarcacao.create({
        nome: 'Barco Com Seg Update',
        nr_inscricao_barco: `SEGUPD${Date.now()}`
      });

      const response = await request(app)
        .put(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          seguradora_id: seguradora.id
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('Seguradora');
    });

    it('deve atualizar valor_embarcacao', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Barco Valor',
        nr_inscricao_barco: `VALOR${Date.now()}`,
        valor_embarcacao: 100000
      });

      const response = await request(app)
        .put(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          valor_embarcacao: 150000
        });

      expect(response.status).toBe(200);
      expect(parseFloat(response.body.valor_embarcacao)).toBe(150000);
    });

    it('deve atualizar ano_fabricacao', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Barco Ano',
        nr_inscricao_barco: `ANO${Date.now()}`,
        ano_fabricacao: 2020
      });

      const response = await request(app)
        .put(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ano_fabricacao: 2022
        });

      expect(response.status).toBe(200);
      expect(response.body.ano_fabricacao).toBe(2022);
    });
  });

  describe('DELETE /api/embarcacoes/:id', () => {
    it('deve excluir embarcação', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Barco Delete',
        nr_inscricao_barco: `DEL${Date.now()}`
      });

      const response = await request(app)
        .delete(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('sucesso');

      // Verificar que foi excluído
      const deleted = await Embarcacao.findByPk(embarcacao.id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .delete('/api/embarcacoes/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Autenticação e Autorização', () => {
    it('deve permitir vistoriador listar embarcações', async () => {
      await Embarcacao.create({
        nome: 'Barco Vistoriador',
        nr_inscricao_barco: `VIST${Date.now()}`
      });

      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve permitir vistoriador buscar embarcação por id', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Barco Vistoriador Get',
        nr_inscricao_barco: `VISTGET${Date.now()}`
      });

      const response = await request(app)
        .get(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve permitir vistoriador criar embarcação', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          nome: 'Barco Vistoriador Create',
          nr_inscricao_barco: `VISTCREATE${Date.now()}`
        });

      expect(response.status).toBe(201);
    });
  });
});

