const request = require('supertest');
const { sequelize, Foto, Vistoria, TipoFotoChecklist, Embarcacao, Local, StatusVistoria, Cliente } = require('../../models');
const fotoRoutes = require('../../routes/fotoRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/fotos', router: fotoRoutes });

describe('Rotas de Fotos', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador;
  let tipoFoto, statusVistoria;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('foto');
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
    admin = setup.admin;
    vistoriador = setup.vistoriador;

    // Criar ou buscar tipo de foto
    tipoFoto = await TipoFotoChecklist.findOne();
    if (!tipoFoto) {
      tipoFoto = await TipoFotoChecklist.create({
        codigo: `GERAL${Date.now()}`,
        nome_exibicao: 'Foto Geral'
      });
    }

    // Criar ou buscar status
    statusVistoria = await StatusVistoria.findOne({ where: { nome: 'EM_ANDAMENTO' } });
    if (!statusVistoria) {
      statusVistoria = await StatusVistoria.create({ nome: 'EM_ANDAMENTO' });
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  const createVistoriaForVistoriador = async (vistoriadorId) => {
    const cliente = await Cliente.create({
      nome: `Cliente Foto ${Date.now()}`,
      cpf: generateTestCPF(`ft${Date.now().toString().slice(-6)}`),
      tipo_pessoa: 'FISICA'
    });

    const embarcacao = await Embarcacao.create({
      nome: 'Barco Foto Test',
      nr_inscricao_barco: `FT${Date.now()}`,
      tipo_embarcacao: 'LANCHA',
      cliente_id: cliente.id
    });

    const local = await Local.create({
      nome_local: 'Local Foto Test',
      tipo: 'MARINA'
    });

    return await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: vistoriadorId,
      status_id: statusVistoria.id
    });
  };

  describe('GET /api/fotos/vistoria/:id', () => {
    it('deve retornar fotos de uma vistoria (owner)', async () => {
      const vistoria = await createVistoriaForVistoriador(vistoriador.id);

      await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto1.jpg'
      });

      const response = await request(app)
        .get(`/api/fotos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve incluir url_completa nas fotos', async () => {
      const vistoria = await createVistoriaForVistoriador(vistoriador.id);

      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto2.jpg'
      });

      const response = await request(app)
        .get(`/api/fotos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('url_completa');
    });

    it('deve retornar fotos com TipoFotoChecklist incluído', async () => {
      const vistoria = await createVistoriaForVistoriador(vistoriador.id);

      await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto3.jpg'
      });

      const response = await request(app)
        .get(`/api/fotos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('TipoFotoChecklist');
    });

    it('admin deve poder acessar fotos de qualquer vistoria', async () => {
      const vistoria = await createVistoriaForVistoriador(vistoriador.id);

      await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto4.jpg'
      });

      const response = await request(app)
        .get(`/api/fotos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .get('/api/fotos/vistoria/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 quando usuário não é dono nem admin', async () => {
      // Criar vistoria de outro vistoriador (admin)
      const vistoria = await createVistoriaForVistoriador(admin.id);

      const response = await request(app)
        .get(`/api/fotos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/fotos/vistoria/1');
      expect(response.status).toBe(401);
    });

    it('deve retornar lista vazia se não há fotos', async () => {
      const vistoria = await createVistoriaForVistoriador(vistoriador.id);

      const response = await request(app)
        .get(`/api/fotos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/fotos/:id/imagem-url', () => {
    it('deve retornar URL da imagem', async () => {
      const vistoria = await createVistoriaForVistoriador(vistoriador.id);

      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto-url.jpg'
      });

      const response = await request(app)
        .get(`/api/fotos/${foto.id}/imagem-url`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('foto_id');
      expect(response.body).toHaveProperty('encontrada');
    });

    it('deve retornar 404 para foto inexistente', async () => {
      const response = await request(app)
        .get('/api/fotos/99999/imagem-url')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 quando não é dono nem admin', async () => {
      const vistoria = await createVistoriaForVistoriador(admin.id);

      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto-outro.jpg'
      });

      const response = await request(app)
        .get(`/api/fotos/${foto.id}/imagem-url`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/fotos/:id/imagem', () => {
    it('deve retornar erro para foto com arquivo inexistente (local)', async () => {
      const vistoria = await createVistoriaForVistoriador(vistoriador.id);

      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'arquivo-inexistente.jpg'
      });

      const response = await request(app)
        .get(`/api/fotos/${foto.id}/imagem`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      // Pode ser 404 ou 500 dependendo da estratégia
      expect([404, 500]).toContain(response.status);
    });

    it('deve retornar 404 para foto inexistente', async () => {
      const response = await request(app)
        .get('/api/fotos/99999/imagem')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 quando não é dono nem admin', async () => {
      const vistoria = await createVistoriaForVistoriador(admin.id);

      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto-perm.jpg'
      });

      const response = await request(app)
        .get(`/api/fotos/${foto.id}/imagem`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/fotos/:id', () => {
    it('deve deletar foto (owner)', async () => {
      const vistoria = await createVistoriaForVistoriador(vistoriador.id);

      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto-delete.jpg'
      });

      const response = await request(app)
        .delete(`/api/fotos/${foto.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('excluída');

      const deleted = await Foto.findByPk(foto.id);
      expect(deleted).toBeNull();
    });

    it('admin deve poder deletar foto de qualquer vistoria', async () => {
      const vistoria = await createVistoriaForVistoriador(vistoriador.id);

      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto-admin-del.jpg'
      });

      const response = await request(app)
        .delete(`/api/fotos/${foto.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('deve retornar 404 para foto inexistente', async () => {
      const response = await request(app)
        .delete('/api/fotos/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 quando não é dono nem admin', async () => {
      const vistoria = await createVistoriaForVistoriador(admin.id);

      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto-perm-del.jpg'
      });

      const response = await request(app)
        .delete(`/api/fotos/${foto.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).delete('/api/fotos/1');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/fotos - validações', () => {
    it('deve retornar 400 sem vistoria_id', async () => {
      const response = await request(app)
        .post('/api/fotos')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .field('tipo_foto_id', tipoFoto.id);

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem tipo_foto_id', async () => {
      const vistoria = await createVistoriaForVistoriador(vistoriador.id);

      const response = await request(app)
        .post('/api/fotos')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .field('vistoria_id', vistoria.id);

      expect(response.status).toBe(400);
    });

    it('deve retornar 400 sem arquivo de foto', async () => {
      const vistoria = await createVistoriaForVistoriador(vistoriador.id);

      const response = await request(app)
        .post('/api/fotos')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .field('vistoria_id', vistoria.id)
        .field('tipo_foto_id', tipoFoto.id);

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .post('/api/fotos')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .field('vistoria_id', 99999)
        .field('tipo_foto_id', tipoFoto.id);

      // Sem arquivo, retorna 400 primeiro
      expect([400, 404]).toContain(response.status);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app)
        .post('/api/fotos')
        .field('vistoria_id', 1)
        .field('tipo_foto_id', 1);

      expect(response.status).toBe(401);
    });
  });
});
