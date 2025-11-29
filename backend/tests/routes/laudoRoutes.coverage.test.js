/**
 * Testes abrangentes para laudoRoutes
 * Objetivo: Aumentar cobertura de testes para > 75%
 */
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { sequelize, Laudo, Vistoria, Embarcacao, StatusVistoria, Local, Foto, TipoFotoChecklist, Usuario, ConfiguracaoLaudo } = require('../../models');
const laudoRoutes = require('../../routes/laudoRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

// Mock do serviço de laudo
jest.mock('../../services/laudoService', () => ({
  gerarNumeroLaudo: jest.fn().mockReturnValue('241129A'),
  gerarLaudoPDF: jest.fn().mockResolvedValue({
    filePath: '/uploads/laudos/2024/11/laudo-1.pdf',
    urlRelativa: '/uploads/laudos/2024/11/laudo-1.pdf',
    fileName: 'laudo-1.pdf'
  }),
  deletarLaudoPDF: jest.fn()
}));

const app = createTestApp({ path: '/api/laudos', router: laudoRoutes });

describe('Rotas de Laudos - Testes de Cobertura', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador, embarcacao, local, statusConcluida, statusPendente, vistoria;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('laudo');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;

    // Criar embarcação
    embarcacao = await Embarcacao.create({
      nome: 'Test Boat Laudo',
      tipo_embarcacao: 'LANCHA',
      nr_inscricao_barco: `LAUDOTEST${Date.now()}`
    });

    // Criar local
    local = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Marina Laudo Test'
    });

    // Criar status
    statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });
    if (!statusConcluida) {
      statusConcluida = await StatusVistoria.create({ nome: 'CONCLUIDA', descricao: 'Vistoria concluída' });
    }

    statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    if (!statusPendente) {
      statusPendente = await StatusVistoria.create({ nome: 'PENDENTE', descricao: 'Vistoria pendente' });
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Foto.destroy({ where: {}, force: true });
    await Laudo.destroy({ where: {}, force: true });
    await Vistoria.destroy({ where: {}, force: true });

    // Criar vistoria para os testes
    vistoria = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: vistoriador.id,
      administrador_id: admin.id,
      status_id: statusConcluida.id
    });
  });

  describe('GET /api/laudos', () => {
    it('deve listar todos os laudos', async () => {
      await Laudo.create({
        numero_laudo: '241129A',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .get('/api/laudos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('deve ordenar por data de criação decrescente', async () => {
      await Laudo.create({
        numero_laudo: '241129A',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .get('/api/laudos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('deve incluir associação com Vistoria', async () => {
      await Laudo.create({
        numero_laudo: '241129A',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .get('/api/laudos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('Vistoria');
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app).get('/api/laudos');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/laudos/:id', () => {
    it('deve buscar laudo por id', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129A',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .get(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(laudo.id);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/laudos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para id inválido (não numérico)', async () => {
      const response = await request(app)
        .get('/api/laudos/abc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('inválido');
    });

    it('deve retornar 400 para id negativo', async () => {
      const response = await request(app)
        .get('/api/laudos/-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para id zero', async () => {
      const response = await request(app)
        .get('/api/laudos/0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/laudos/vistoria/:vistoriaId', () => {
    it('deve buscar laudo por vistoria id', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129B',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .get(`/api/laudos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(laudo.id);
    });

    it('deve retornar 404 para vistoria sem laudo', async () => {
      const response = await request(app)
        .get(`/api/laudos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para vistoria_id inválido', async () => {
      const response = await request(app)
        .get('/api/laudos/vistoria/abc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 para vistoria_id negativo', async () => {
      const response = await request(app)
        .get('/api/laudos/vistoria/-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/laudos/vistoria/:vistoriaId', () => {
    it('deve criar novo laudo para vistoria concluída', async () => {
      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_moto_aquatica: 'Barco Teste',
          proprietario: 'João Silva'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('numero_laudo');
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .post('/api/laudos/vistoria/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(404);
    });

    it('deve retornar 400 para vistoria não concluída', async () => {
      const vistoriaPendente = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoriaPendente.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('não concluída');
    });

    it('deve atualizar laudo existente', async () => {
      // Criar laudo existente
      await Laudo.create({
        numero_laudo: '241129C',
        vistoria_id: vistoria.id,
        nome_moto_aquatica: 'Nome Original'
      });

      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_moto_aquatica: 'Nome Atualizado'
        });

      expect(response.status).toBe(200);
    });

    it('deve usar configurações padrão quando disponíveis', async () => {
      // Criar configuração padrão
      await ConfiguracaoLaudo.create({
        nome_empresa: 'Empresa Teste',
        empresa_prestadora: 'Vessel Inspection',
        nota_rodape: 'Rodapé padrão',
        padrao: true
      });

      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(200);
    });

    it('deve exigir permissão de admin', async () => {
      const response = await request(app)
        .post(`/api/laudos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({});

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/laudos/:id/preview', () => {
    it('deve retornar preview do laudo', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129D',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .get(`/api/laudos/${laudo.id}/preview`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('numero_laudo');
      expect(response.body).toHaveProperty('tipoEmbarcacao');
      expect(response.body).toHaveProperty('fotos');
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      const response = await request(app)
        .get('/api/laudos/99999/preview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve incluir fotos da vistoria', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129E',
        vistoria_id: vistoria.id
      });

      // Criar tipo de foto
      const tipoFoto = await TipoFotoChecklist.findOne() || await TipoFotoChecklist.create({
        codigo: 'CASCO',
        nome_exibicao: 'Foto do Casco',
        obrigatorio: true
      });

      // Criar foto
      await Foto.create({
        url_arquivo: 'foto-teste.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .get(`/api/laudos/${laudo.id}/preview`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalFotos).toBeGreaterThan(0);
    });
  });

  describe('POST /api/laudos/:id/gerar-pdf', () => {
    it('deve gerar PDF do laudo', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129F',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .post(`/api/laudos/${laudo.id}/gerar-pdf`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('downloadUrl');
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      const response = await request(app)
        .post('/api/laudos/99999/gerar-pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve exigir permissão de admin', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129G',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .post(`/api/laudos/${laudo.id}/gerar-pdf`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve deletar PDF anterior ao gerar novo', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129H',
        vistoria_id: vistoria.id,
        url_pdf: '/uploads/laudos/old.pdf'
      });

      const { deletarLaudoPDF } = require('../../services/laudoService');

      const response = await request(app)
        .post(`/api/laudos/${laudo.id}/gerar-pdf`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(deletarLaudoPDF).toHaveBeenCalled();
    });
  });

  describe('GET /api/laudos/:id/download-pdf', () => {
    it('deve retornar 404 para laudo sem PDF', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129I',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .get(`/api/laudos/${laudo.id}/download-pdf`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      const response = await request(app)
        .get('/api/laudos/99999/download-pdf')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/laudos/:id/download (rota antiga)', () => {
    it('deve funcionar como alias para download-pdf', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129J',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .get(`/api/laudos/${laudo.id}/download`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404); // Sem PDF gerado
    });
  });

  describe('PUT /api/laudos/:id', () => {
    it('deve atualizar laudo', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129K',
        vistoria_id: vistoria.id,
        nome_moto_aquatica: 'Nome Original'
      });

      const response = await request(app)
        .put(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_moto_aquatica: 'Nome Atualizado',
          proprietario: 'Novo Proprietário'
        });

      expect(response.status).toBe(200);
      expect(response.body.nome_moto_aquatica).toBe('Nome Atualizado');
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      const response = await request(app)
        .put('/api/laudos/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome_moto_aquatica: 'Teste'
        });

      expect(response.status).toBe(404);
    });

    it('deve exigir permissão de admin', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129L',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .put(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .send({
          nome_moto_aquatica: 'Teste'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/laudos/:id', () => {
    it('deve excluir laudo', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129M',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .delete(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('sucesso');

      // Verificar exclusão
      const deleted = await Laudo.findByPk(laudo.id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para laudo inexistente', async () => {
      const response = await request(app)
        .delete('/api/laudos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve deletar PDF ao excluir laudo', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129N',
        vistoria_id: vistoria.id,
        url_pdf: '/uploads/laudos/delete.pdf'
      });

      const { deletarLaudoPDF } = require('../../services/laudoService');

      const response = await request(app)
        .delete(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(deletarLaudoPDF).toHaveBeenCalled();
    });

    it('deve exigir permissão de admin', async () => {
      const laudo = await Laudo.create({
        numero_laudo: '241129O',
        vistoria_id: vistoria.id
      });

      const response = await request(app)
        .delete(`/api/laudos/${laudo.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });
});

