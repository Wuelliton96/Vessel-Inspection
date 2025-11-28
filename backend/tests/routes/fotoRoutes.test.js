const request = require('supertest');
const { sequelize, Foto, Vistoria, TipoFotoChecklist } = require('../../models');
const fotoRoutes = require('../../routes/fotoRoutes');
const { setupCompleteTestEnvironment, createTestApp, createTestVistoriaPadrao } = require('../helpers/testHelpers');

const app = createTestApp({ path: '/api/fotos', router: fotoRoutes });

describe('Rotas de Fotos - Testes Adicionais', () => {
  let adminToken, vistoriadorToken;
  let vistoria, tipoFoto;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('foto');
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
    vistoria = await createTestVistoriaPadrao();

    tipoFoto = await TipoFotoChecklist.findOne();
    if (!tipoFoto) {
      tipoFoto = await TipoFotoChecklist.create({ nome: 'GERAL' });
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Foto.destroy({ where: {}, force: true });
  });

  describe('GET /api/fotos/vistoria/:id', () => {
    it('deve retornar fotos de uma vistoria', async () => {
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

    it('deve incluir url_completa na resposta', async () => {
      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto1.jpg'
      });

      const response = await request(app)
        .get(`/api/fotos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      const foundFoto = response.body.find(f => f.id === foto.id);
      expect(foundFoto).toBeDefined();
      expect(foundFoto).toHaveProperty('url_completa');
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .get('/api/fotos/vistoria/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 quando usuário não é dono da vistoria', async () => {
      const outraVistoria = await createTestVistoriaPadrao();

      const response = await request(app)
        .get(`/api/fotos/vistoria/${outraVistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/fotos/:id', () => {
    it('deve retornar foto por id', async () => {
      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto1.jpg'
      });

      const response = await request(app)
        .get(`/api/fotos/${foto.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(foto.id);
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/fotos/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/fotos/:id', () => {
    it('deve deletar foto', async () => {
      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto1.jpg'
      });

      const response = await request(app)
        .delete(`/api/fotos/${foto.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);

      const deleted = await Foto.findByPk(foto.id);
      expect(deleted).toBeNull();
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .delete('/api/fotos/99999')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/fotos/:id/imagem-url', () => {
    it('deve retornar URL da imagem', async () => {
      const foto = await Foto.create({
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id,
        url_arquivo: 'foto1.jpg'
      });

      const response = await request(app)
        .get(`/api/fotos/${foto.id}/imagem-url`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
    });

    it('deve retornar 404 para id inexistente', async () => {
      const response = await request(app)
        .get('/api/fotos/99999/imagem-url')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });
  });
});

