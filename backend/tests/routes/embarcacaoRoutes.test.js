const request = require('supertest');
const { sequelize, Embarcacao, Seguradora, Cliente } = require('../../models');
const embarcacaoRoutes = require('../../routes/embarcacaoRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/embarcacoes', router: embarcacaoRoutes });

describe('Rotas de Embarcações - Testes Completos', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;
  let seguradora, cliente;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('embarcacao');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;

    // Criar seguradora de teste
    seguradora = await Seguradora.create({
      nome: `Seguradora Test Emb ${Date.now()}`,
      ativo: true
    });

    // Criar cliente de teste
    cliente = await Cliente.create({
      tipo_pessoa: 'FISICA',
      nome: 'Cliente Teste Embarcacao',
      cpf: generateTestCPF('cliente'),
      email: `cliente_emb_${Date.now()}@test.com`
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Embarcacao.destroy({ where: { nome: { [require('sequelize').Op.like]: '%Test Emb%' } }, force: true });
  });

  describe('GET /api/embarcacoes', () => {
    it('deve listar todas as embarcações', async () => {
      await Embarcacao.create({
        nome: 'Test Emb Lista 1',
        nr_inscricao_barco: `TEST${Date.now()}`
      });

      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar por CPF do proprietário', async () => {
      const cpfTeste = generateTestCPF('filtro');
      await Embarcacao.create({
        nome: 'Test Emb Filtro CPF',
        nr_inscricao_barco: `TESTCPF${Date.now()}`,
        proprietario_cpf: cpfTeste
      });

      const response = await request(app)
        .get(`/api/embarcacoes?proprietario_cpf=${cpfTeste}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(e => e.proprietario_cpf === cpfTeste)).toBe(true);
    });

    it('deve ordenar por nome ascendente', async () => {
      await Embarcacao.create({
        nome: 'ZZZ Test Emb Z',
        nr_inscricao_barco: `TESTZ${Date.now()}`
      });
      await Embarcacao.create({
        nome: 'AAA Test Emb A',
        nr_inscricao_barco: `TESTA${Date.now()}`
      });

      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      // Verifica se está ordenado
      const nomes = response.body.filter(e => e.nome.includes('Test Emb')).map(e => e.nome);
      expect(nomes).toEqual([...nomes].sort());
    });

    it('deve incluir Seguradora na resposta', async () => {
      await Embarcacao.create({
        nome: 'Test Emb Com Seguradora',
        nr_inscricao_barco: `TESTSEG${Date.now()}`,
        seguradora_id: seguradora.id
      });

      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const embComSeg = response.body.find(e => e.nome === 'Test Emb Com Seguradora');
      if (embComSeg) {
        expect(embComSeg).toHaveProperty('Seguradora');
      }
    });

    it('deve incluir Cliente na resposta', async () => {
      await Embarcacao.create({
        nome: 'Test Emb Com Cliente',
        nr_inscricao_barco: `TESTCLI${Date.now()}`,
        cliente_id: cliente.id
      });

      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const embComCli = response.body.find(e => e.nome === 'Test Emb Com Cliente');
      if (embComCli) {
        expect(embComCli).toHaveProperty('Cliente');
      }
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/embarcacoes');
      expect(response.status).toBe(401);
    });

    it('deve permitir acesso para vistoriador', async () => {
      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/embarcacoes/:id', () => {
    it('deve retornar embarcação por id', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Test Emb Por ID',
        nr_inscricao_barco: `TESTID${Date.now()}`
      });

      const response = await request(app)
        .get(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(embarcacao.id);
      expect(response.body.nome).toBe('Test Emb Por ID');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/embarcacoes/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve incluir Seguradora e Cliente na resposta', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Test Emb Completa',
        nr_inscricao_barco: `TESTCOMP${Date.now()}`,
        seguradora_id: seguradora.id,
        cliente_id: cliente.id
      });

      const response = await request(app)
        .get(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('Seguradora');
      expect(response.body).toHaveProperty('Cliente');
    });
  });

  describe('POST /api/embarcacoes', () => {
    it('deve criar embarcação com sucesso', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Test Emb Nova',
          nr_inscricao_barco: `NEW${Date.now()}`
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.nome).toBe('Test Emb Nova');
    });

    it('deve criar embarcação com todos os campos', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Test Emb Completa Nova',
          nr_inscricao_barco: `NEWCOMP${Date.now()}`,
          tipo_embarcacao: 'LANCHA',
          porte: 'MEDIO',
          seguradora_id: seguradora.id,
          cliente_id: cliente.id,
          valor_embarcacao: 150000,
          ano_fabricacao: 2020
        });

      expect(response.status).toBe(201);
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
      expect(response.body.porte).toBe('MEDIO');
    });

    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nr_inscricao_barco: `NONAME${Date.now()}`
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatório');
    });

    it('deve retornar 400 sem número de inscrição', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Test Emb Sem Inscricao'
        });

      expect(response.status).toBe(400);
    });

    it('deve permitir vistoriador criar embarcação', async () => {
      const response = await request(app)
        .post('/api/embarcacoes')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          nome: 'Test Emb Por Vistoriador',
          nr_inscricao_barco: `VIST${Date.now()}`
        });

      expect(response.status).toBe(201);
    });
  });

  describe('PUT /api/embarcacoes/:id', () => {
    let embarcacaoTeste;

    beforeEach(async () => {
      embarcacaoTeste = await Embarcacao.create({
        nome: 'Test Emb Para Update',
        nr_inscricao_barco: `UPDATE${Date.now()}`
      });
    });

    it('deve atualizar embarcação com sucesso', async () => {
      const response = await request(app)
        .put(`/api/embarcacoes/${embarcacaoTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Test Emb Atualizada'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toBe('Test Emb Atualizada');
    });

    it('deve atualizar todos os campos', async () => {
      const response = await request(app)
        .put(`/api/embarcacoes/${embarcacaoTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Test Emb Full Update',
          tipo_embarcacao: 'JET_SKI',
          porte: 'PEQUENO',
          seguradora_id: seguradora.id,
          cliente_id: cliente.id,
          valor_embarcacao: 80000,
          ano_fabricacao: 2022
        });

      expect(response.status).toBe(200);
      expect(response.body.tipo_embarcacao).toBe('JET_SKI');
      expect(response.body.porte).toBe('PEQUENO');
      expect(response.body.ano_fabricacao).toBe(2022);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .put('/api/embarcacoes/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Teste' });

      expect(response.status).toBe(404);
    });

    it('deve manter campos não fornecidos', async () => {
      await embarcacaoTeste.update({ tipo_embarcacao: 'LANCHA' });

      const response = await request(app)
        .put(`/api/embarcacoes/${embarcacaoTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Test Emb Nome Atualizado'
        });

      expect(response.status).toBe(200);
      expect(response.body.tipo_embarcacao).toBe('LANCHA');
    });

    it('deve incluir Seguradora e Cliente na resposta', async () => {
      const response = await request(app)
        .put(`/api/embarcacoes/${embarcacaoTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          seguradora_id: seguradora.id,
          cliente_id: cliente.id
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('Seguradora');
      expect(response.body).toHaveProperty('Cliente');
    });
  });

  describe('DELETE /api/embarcacoes/:id', () => {
    it('deve deletar embarcação com sucesso', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Test Emb Para Deletar',
        nr_inscricao_barco: `DEL${Date.now()}`
      });

      const response = await request(app)
        .delete(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('sucesso');

      const deleted = await Embarcacao.findByPk(embarcacao.id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .delete('/api/embarcacoes/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve permitir vistoriador deletar', async () => {
      const embarcacao = await Embarcacao.create({
        nome: 'Test Emb Del Vist',
        nr_inscricao_barco: `DELV${Date.now()}`
      });

      const response = await request(app)
        .delete(`/api/embarcacoes/${embarcacao.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('Autenticação e Autorização', () => {
    it('deve retornar 401 para requisições sem token', async () => {
      const responses = await Promise.all([
        request(app).get('/api/embarcacoes'),
        request(app).get('/api/embarcacoes/1'),
        request(app).post('/api/embarcacoes').send({ nome: 'Test', nr_inscricao_barco: 'TEST' }),
        request(app).put('/api/embarcacoes/1').send({ nome: 'Test' }),
        request(app).delete('/api/embarcacoes/1')
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(401);
      });
    });

    it('deve retornar 401 para token inválido', async () => {
      const response = await request(app)
        .get('/api/embarcacoes')
        .set('Authorization', 'Bearer tokeninvalido');

      expect(response.status).toBe(401);
    });
  });
});
