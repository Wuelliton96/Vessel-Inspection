const request = require('supertest');
const { sequelize, Seguradora, SeguradoraTipoEmbarcacao } = require('../../models');
const seguradoraRoutes = require('../../routes/seguradoraRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/seguradoras', router: seguradoraRoutes });

describe('Rotas de Seguradoras - Testes Completos', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('seguradora');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Seguradora.destroy({ where: { nome: { [require('sequelize').Op.like]: '%Test Seg%' } }, force: true });
  });

  describe('GET /api/seguradoras', () => {
    it('deve listar todas as seguradoras', async () => {
      await Seguradora.create({
        nome: `Test Seg Lista ${Date.now()}`,
        ativo: true
      });

      const response = await request(app)
        .get('/api/seguradoras')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve filtrar por status ativo', async () => {
      await Seguradora.create({
        nome: `Test Seg Ativa ${Date.now()}`,
        ativo: true
      });

      const response = await request(app)
        .get('/api/seguradoras?ativo=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(s => s.ativo === true)).toBe(true);
    });

    it('deve filtrar por status inativo', async () => {
      await Seguradora.create({
        nome: `Test Seg Inativa ${Date.now()}`,
        ativo: false
      });

      const response = await request(app)
        .get('/api/seguradoras?ativo=false')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const testSeg = response.body.filter(s => s.nome.includes('Test Seg'));
      expect(testSeg.every(s => s.ativo === false)).toBe(true);
    });

    it('deve ordenar por nome', async () => {
      await Seguradora.create({ nome: `ZZZ Test Seg Z ${Date.now()}`, ativo: true });
      await Seguradora.create({ nome: `AAA Test Seg A ${Date.now()}`, ativo: true });

      const response = await request(app)
        .get('/api/seguradoras')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('deve incluir tipos permitidos na resposta', async () => {
      const seguradora = await Seguradora.create({
        nome: `Test Seg Com Tipos ${Date.now()}`,
        ativo: true
      });

      await SeguradoraTipoEmbarcacao.create({
        seguradora_id: seguradora.id,
        tipo_embarcacao: 'LANCHA'
      });

      const response = await request(app)
        .get('/api/seguradoras')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const segComTipos = response.body.find(s => s.id === seguradora.id);
      if (segComTipos) {
        expect(segComTipos).toHaveProperty('tiposPermitidos');
      }
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/seguradoras');
      expect(response.status).toBe(401);
    });

    it('deve permitir acesso para vistoriador', async () => {
      const response = await request(app)
        .get('/api/seguradoras')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/seguradoras/:id', () => {
    it('deve retornar seguradora por id', async () => {
      const seguradora = await Seguradora.create({
        nome: `Test Seg Por ID ${Date.now()}`,
        ativo: true
      });

      const response = await request(app)
        .get(`/api/seguradoras/${seguradora.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(seguradora.id);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/seguradoras/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve incluir tipos permitidos na resposta', async () => {
      const seguradora = await Seguradora.create({
        nome: `Test Seg ID Com Tipos ${Date.now()}`,
        ativo: true
      });

      await SeguradoraTipoEmbarcacao.create({
        seguradora_id: seguradora.id,
        tipo_embarcacao: 'JET_SKI'
      });

      const response = await request(app)
        .get(`/api/seguradoras/${seguradora.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tiposPermitidos');
      expect(response.body.tiposPermitidos.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/seguradoras/:id/tipos-permitidos', () => {
    it('deve retornar tipos permitidos da seguradora', async () => {
      const seguradora = await Seguradora.create({
        nome: `Test Seg Tipos ${Date.now()}`,
        ativo: true
      });

      await SeguradoraTipoEmbarcacao.create({
        seguradora_id: seguradora.id,
        tipo_embarcacao: 'LANCHA'
      });
      await SeguradoraTipoEmbarcacao.create({
        seguradora_id: seguradora.id,
        tipo_embarcacao: 'JET_SKI'
      });

      const response = await request(app)
        .get(`/api/seguradoras/${seguradora.id}/tipos-permitidos`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('LANCHA');
      expect(response.body).toContain('JET_SKI');
    });

    it('deve retornar array vazio para seguradora sem tipos', async () => {
      const seguradora = await Seguradora.create({
        nome: `Test Seg Sem Tipos ${Date.now()}`,
        ativo: true
      });

      const response = await request(app)
        .get(`/api/seguradoras/${seguradora.id}/tipos-permitidos`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('POST /api/seguradoras', () => {
    it('deve criar seguradora com sucesso', async () => {
      const response = await request(app)
        .post('/api/seguradoras')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: `Test Seg Nova ${Date.now()}`
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.ativo).toBe(true);
    });

    it('deve criar seguradora com tipos permitidos', async () => {
      const response = await request(app)
        .post('/api/seguradoras')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: `Test Seg Com Tipos Nova ${Date.now()}`,
          tipos_permitidos: ['LANCHA', 'JET_SKI', 'IATE']
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('tiposPermitidos');
      expect(response.body.tiposPermitidos.length).toBe(3);
    });

    it('deve criar seguradora inativa', async () => {
      const response = await request(app)
        .post('/api/seguradoras')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: `Test Seg Inativa Nova ${Date.now()}`,
          ativo: false
        });

      expect(response.status).toBe(201);
      expect(response.body.ativo).toBe(false);
    });

    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/seguradoras')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatório');
    });

    it('deve retornar 400 para nome duplicado', async () => {
      const nome = `Test Seg Duplicada ${Date.now()}`;
      await Seguradora.create({ nome, ativo: true });

      const response = await request(app)
        .post('/api/seguradoras')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('existe');
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .post('/api/seguradoras')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          nome: `Test Seg Vist ${Date.now()}`
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/seguradoras/:id', () => {
    let seguradoraTeste;

    beforeEach(async () => {
      seguradoraTeste = await Seguradora.create({
        nome: `Test Seg Update ${Date.now()}`,
        ativo: true
      });
    });

    it('deve atualizar seguradora com sucesso', async () => {
      const response = await request(app)
        .put(`/api/seguradoras/${seguradoraTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: `Test Seg Atualizada ${Date.now()}`
        });

      expect(response.status).toBe(200);
      expect(response.body.nome).toContain('Atualizada');
    });

    it('deve atualizar status ativo', async () => {
      const response = await request(app)
        .put(`/api/seguradoras/${seguradoraTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ativo: false });

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(false);
    });

    it('deve atualizar tipos permitidos', async () => {
      await SeguradoraTipoEmbarcacao.create({
        seguradora_id: seguradoraTeste.id,
        tipo_embarcacao: 'LANCHA'
      });

      const response = await request(app)
        .put(`/api/seguradoras/${seguradoraTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipos_permitidos: ['JET_SKI', 'IATE']
        });

      expect(response.status).toBe(200);
      expect(response.body.tiposPermitidos.length).toBe(2);
    });

    it('deve remover todos os tipos permitidos', async () => {
      await SeguradoraTipoEmbarcacao.create({
        seguradora_id: seguradoraTeste.id,
        tipo_embarcacao: 'LANCHA'
      });

      const response = await request(app)
        .put(`/api/seguradoras/${seguradoraTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          tipos_permitidos: []
        });

      expect(response.status).toBe(200);
      expect(response.body.tiposPermitidos.length).toBe(0);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .put('/api/seguradoras/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Teste' });

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para nome duplicado', async () => {
      const outraSeg = await Seguradora.create({
        nome: `Test Seg Outra ${Date.now()}`,
        ativo: true
      });

      const response = await request(app)
        .put(`/api/seguradoras/${seguradoraTeste.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: outraSeg.nome });

      expect(response.status).toBe(400);
    });

    it('deve retornar 403 para vistoriador', async () => {
      const response = await request(app)
        .put(`/api/seguradoras/${seguradoraTeste.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ nome: 'Tentativa' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/seguradoras/:id', () => {
    it('deve deletar seguradora com sucesso', async () => {
      const seguradora = await Seguradora.create({
        nome: `Test Seg Deletar ${Date.now()}`,
        ativo: true
      });

      const response = await request(app)
        .delete(`/api/seguradoras/${seguradora.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('sucesso');

      const deleted = await Seguradora.findByPk(seguradora.id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .delete('/api/seguradoras/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoriador', async () => {
      const seguradora = await Seguradora.create({
        nome: `Test Seg Del Vist ${Date.now()}`,
        ativo: true
      });

      const response = await request(app)
        .delete(`/api/seguradoras/${seguradora.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/seguradoras/:id/toggle-status', () => {
    it('deve alternar status de ativo para inativo', async () => {
      const seguradora = await Seguradora.create({
        nome: `Test Seg Toggle ${Date.now()}`,
        ativo: true
      });

      const response = await request(app)
        .patch(`/api/seguradoras/${seguradora.id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(false);
    });

    it('deve alternar status de inativo para ativo', async () => {
      const seguradora = await Seguradora.create({
        nome: `Test Seg Toggle 2 ${Date.now()}`,
        ativo: false
      });

      const response = await request(app)
        .patch(`/api/seguradoras/${seguradora.id}/toggle-status`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ativo).toBe(true);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .patch('/api/seguradoras/99999/toggle-status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoriador', async () => {
      const seguradora = await Seguradora.create({
        nome: `Test Seg Toggle Vist ${Date.now()}`,
        ativo: true
      });

      const response = await request(app)
        .patch(`/api/seguradoras/${seguradora.id}/toggle-status`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });
});
