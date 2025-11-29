const request = require('supertest');
const { sequelize, Vistoria, Embarcacao, Local, StatusVistoria, Usuario, ChecklistTemplate, ChecklistTemplateItem, VistoriaChecklistItem, Seguradora, SeguradoraTipoEmbarcacao } = require('../../models');
const vistoriaRoutes = require('../../routes/vistoriaRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/vistorias', router: vistoriaRoutes });

describe('Rotas de Vistorias - Testes Completos', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador, embarcacao, local, statusPendente, statusEmAndamento, statusConcluida;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('vistoria');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;

    // Criar embarcação de teste
    embarcacao = await Embarcacao.create({
      nome: 'Test Boat Vistoria',
      tipo_embarcacao: 'LANCHA',
      nr_inscricao_barco: `TESTVIST${Date.now()}`
    });

    // Criar local de teste
    local = await Local.create({
      nome_local: 'Test Marina Vistoria',
      tipo: 'MARINA',
      cep: '12345678',
      cidade: 'Rio de Janeiro',
      estado: 'RJ'
    });

    // Criar status de vistoria
    statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    if (!statusPendente) {
      statusPendente = await StatusVistoria.create({ nome: 'PENDENTE', descricao: 'Vistoria pendente' });
    }

    statusEmAndamento = await StatusVistoria.findOne({ where: { nome: 'EM_ANDAMENTO' } });
    if (!statusEmAndamento) {
      statusEmAndamento = await StatusVistoria.create({ nome: 'EM_ANDAMENTO', descricao: 'Vistoria em andamento' });
    }

    statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });
    if (!statusConcluida) {
      statusConcluida = await StatusVistoria.create({ nome: 'CONCLUIDA', descricao: 'Vistoria concluída' });
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Vistoria.destroy({ where: {}, force: true });
  });

  describe('GET /api/vistorias', () => {
    it('deve listar todas as vistorias', async () => {
      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .get('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve ordenar por data de criação decrescente', async () => {
      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusEmAndamento.id
      });

      const response = await request(app)
        .get('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/vistorias');
      expect(response.status).toBe(401);
    });

    it('deve incluir associações Embarcacao, Local e StatusVistoria', async () => {
      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .get('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('Embarcacao');
      expect(response.body[0]).toHaveProperty('Local');
      expect(response.body[0]).toHaveProperty('StatusVistoria');
    });
  });

  describe('GET /api/vistorias/vistoriador', () => {
    it('deve listar vistorias atribuídas ao vistoriador logado', async () => {
      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .get('/api/vistorias/vistoriador')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].vistoriador_id).toBe(vistoriador.id);
    });

    it('não deve retornar vistorias de outros vistoriadores', async () => {
      // Criar outro vistoriador
      const outroVistoriador = await Usuario.create({
        cpf: generateTestCPF('outro'),
        nome: 'Outro Vistoriador',
        email: `outro_${Date.now()}@test.com`,
        senha_hash: 'hash',
        nivel_acesso_id: 2
      });

      await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: outroVistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .get('/api/vistorias/vistoriador')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every(v => v.vistoriador_id === vistoriador.id)).toBe(true);
    });
  });

  describe('GET /api/vistorias/:id', () => {
    it('deve retornar vistoria por id para admin', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .get(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vistoria.id);
    });

    it('deve retornar vistoria por id para o vistoriador dono', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .get(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(vistoria.id);
    });

    it('deve retornar 403 para vistoriador que não é dono', async () => {
      const outroVistoriador = await Usuario.create({
        cpf: generateTestCPF('outrov2'),
        nome: 'Outro Vistoriador 2',
        email: `outro2_${Date.now()}@test.com`,
        senha_hash: 'hash',
        nivel_acesso_id: 2
      });

      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: outroVistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .get(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/vistorias/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/vistorias', () => {
    it('deve criar vistoria com embarcação existente', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          local_id: local.id,
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.embarcacao_id).toBe(embarcacao.id);
    });

    it('deve criar vistoria com nova embarcação', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_nome: 'Nova Embarcacao',
          embarcacao_nr_inscricao_barco: `NEW${Date.now()}`,
          embarcacao_tipo: 'IATE',
          local_id: local.id,
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('deve criar vistoria com novo local', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          local_tipo: 'MARINA',
          local_nome_local: 'Nova Marina',
          local_cep: '12345678',
          local_cidade: 'São Paulo',
          local_estado: 'SP',
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(201);
    });

    it('deve retornar 400 sem vistoriador_id', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          local_id: local.id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Vistoriador');
    });

    it('deve retornar 400 sem campos obrigatórios para nova embarcação', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          local_id: local.id,
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem tipo de local quando criando novo local', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para marina sem nome', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          local_tipo: 'MARINA',
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('marina');
    });

    it('deve retornar 400 para CEP inválido', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          local_tipo: 'RESIDENCIA',
          local_cep: '123',
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('CEP');
    });

    it('deve exigir permissão de admin', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          local_id: local.id,
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(403);
    });

    it('deve criar vistoria com campos financeiros', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          local_id: local.id,
          vistoriador_id: vistoriador.id,
          valor_embarcacao: 100000,
          valor_vistoria: 500,
          valor_vistoriador: 300
        });

      expect(response.status).toBe(201);
      expect(response.body.valor_embarcacao).toBe('100000');
    });

    it('deve criar vistoria com campos de contato', async () => {
      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          local_id: local.id,
          vistoriador_id: vistoriador.id,
          contato_acompanhante_nome: 'João',
          contato_acompanhante_telefone_e164: '+5511999998888',
          contato_acompanhante_email: 'joao@test.com'
        });

      expect(response.status).toBe(201);
    });
  });

  describe('PUT /api/vistorias/:id', () => {
    it('deve atualizar vistoria como admin', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .put(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dados_rascunho: { campo: 'valor' }
        });

      expect(response.status).toBe(200);
    });

    it('deve permitir vistoriador atualizar sua própria vistoria', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .put(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          dados_rascunho: { campo: 'novo valor' }
        });

      expect(response.status).toBe(200);
    });

    it('deve retornar 403 para vistoriador atualizar vistoria de outro', async () => {
      const outroVistoriador = await Usuario.create({
        cpf: generateTestCPF('outrov3'),
        nome: 'Outro Vistoriador 3',
        email: `outro3_${Date.now()}@test.com`,
        senha_hash: 'hash',
        nivel_acesso_id: 2
      });

      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: outroVistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .put(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({ dados_rascunho: { campo: 'teste' } });

      expect(response.status).toBe(403);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .put('/api/vistorias/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ dados_rascunho: { campo: 'teste' } });

      expect(response.status).toBe(404);
    });

    it('deve atualizar status da vistoria', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .put(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status_id: statusEmAndamento.id
        });

      expect(response.status).toBe(200);
      expect(response.body.status_id).toBe(statusEmAndamento.id);
    });
  });

  describe('DELETE /api/vistorias/:id', () => {
    it('deve deletar vistoria pendente como admin', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .delete(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const deleted = await Vistoria.findByPk(vistoria.id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 403 para vistoriador tentar deletar', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .delete(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve retornar 403 para deletar vistoria não pendente', async () => {
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusEmAndamento.id
      });

      const response = await request(app)
        .delete(`/api/vistorias/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('não permitida');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .delete('/api/vistorias/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Validações de seguradora', () => {
    it('deve validar tipo de embarcação com seguradora', async () => {
      const seguradora = await Seguradora.create({
        nome: `Seguradora Test ${Date.now()}`,
        ativo: true
      });

      await SeguradoraTipoEmbarcacao.create({
        seguradora_id: seguradora.id,
        tipo_embarcacao: 'LANCHA'
      });

      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_nome: 'Jet Ski Teste',
          embarcacao_nr_inscricao_barco: `JS${Date.now()}`,
          embarcacao_tipo: 'JET_SKI',
          seguradora_id: seguradora.id,
          local_id: local.id,
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('não permitido');
    });
  });

  describe('Reutilização de local existente', () => {
    it('deve reutilizar local existente com mesmos dados', async () => {
      const localExistente = await Local.create({
        tipo: 'MARINA',
        nome_local: 'Marina Existente',
        cep: '11111111',
        cidade: 'Santos',
        estado: 'SP'
      });

      const response = await request(app)
        .post('/api/vistorias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          embarcacao_id: embarcacao.id,
          local_tipo: 'MARINA',
          local_nome_local: 'Marina Existente',
          local_cep: '11111111',
          local_cidade: 'Santos',
          local_estado: 'SP',
          vistoriador_id: vistoriador.id
        });

      expect(response.status).toBe(201);
      expect(response.body.local_id).toBe(localExistente.id);
    });
  });
});
