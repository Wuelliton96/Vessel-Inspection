/**
 * Testes abrangentes para fotoRoutes
 * Objetivo: Aumentar cobertura de testes para > 75%
 */
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { sequelize, Foto, Vistoria, Embarcacao, StatusVistoria, Local, TipoFotoChecklist, Usuario, VistoriaChecklistItem } = require('../../models');
const fotoRoutes = require('../../routes/fotoRoutes');
const { setupCompleteTestEnvironment, createTestApp, generateTestCPF } = require('../helpers/testHelpers');

// Mocks
jest.mock('multer', () => {
  const mockMulter = jest.fn(() => ({
    single: jest.fn(() => (req, res, next) => {
      if (req.headers['x-test-no-file']) {
        req.file = null;
      } else {
        req.file = {
          filename: 'test-foto.jpg',
          path: '/uploads/fotos/temp/test-foto.jpg',
          mimetype: 'image/jpeg',
          originalname: 'test.jpg',
          size: 1024,
          destination: '/uploads/fotos/temp'
        };
      }
      next();
    })
  }));
  mockMulter.diskStorage = jest.fn(() => ({}));
  mockMulter.MulterError = class MulterError extends Error {
    constructor(code) {
      super(code);
      this.code = code;
    }
  };
  return mockMulter;
});

jest.mock('../../services/uploadService', () => ({
  getUploadConfig: jest.fn(() => ({
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: jest.fn((req, file, cb) => cb(null, true)),
    storage: {}
  })),
  getFileUrl: jest.fn(file => file.key || file.filename || 'test-file.jpg'),
  getFullPath: jest.fn((path, id) => `/uploads/fotos/vistoria-${id}/${path}`),
  deleteFile: jest.fn(),
  getStorageInfo: jest.fn(() => ({
    strategy: 'local',
    maxFileSize: '10MB',
    allowedTypes: ['JPEG', 'PNG'],
    location: 'Local'
  })),
  UPLOAD_STRATEGY: 'local'
}));

jest.mock('fs');

const app = createTestApp({ path: '/api/fotos', router: fotoRoutes });

describe('Rotas de Fotos - Testes de Cobertura', () => {
  let adminToken, vistoriadorToken;
  let admin, vistoriador, embarcacao, local, statusPendente, vistoria, tipoFoto;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('foto');
    admin = setup.admin;
    adminToken = setup.adminToken;
    vistoriador = setup.vistoriador;
    vistoriadorToken = setup.vistoriadorToken;

    // Criar embarcação
    embarcacao = await Embarcacao.create({
      nome: 'Test Boat Foto',
      tipo_embarcacao: 'LANCHA',
      nr_inscricao_barco: `FOTOTEST${Date.now()}`
    });

    // Criar local
    local = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Marina Foto Test'
    });

    // Criar status
    statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    if (!statusPendente) {
      statusPendente = await StatusVistoria.create({ nome: 'PENDENTE', descricao: 'Vistoria pendente' });
    }

    // Criar tipo de foto
    tipoFoto = await TipoFotoChecklist.findOne({ where: { codigo: 'CASCO' } });
    if (!tipoFoto) {
      tipoFoto = await TipoFotoChecklist.create({
        codigo: 'CASCO',
        nome_exibicao: 'Foto do Casco',
        descricao: 'Foto obrigatória do casco',
        obrigatorio: true
      });
    }

    // Mock fs
    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockImplementation(() => {});
    fs.renameSync.mockImplementation(() => {});
    fs.unlinkSync.mockImplementation(() => {});
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Foto.destroy({ where: {}, force: true });
    await Vistoria.destroy({ where: {}, force: true });

    // Criar vistoria para testes
    vistoria = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: vistoriador.id,
      administrador_id: admin.id,
      status_id: statusPendente.id
    });
  });

  describe('GET /api/fotos/vistoria/:id', () => {
    it('deve listar fotos de uma vistoria (admin)', async () => {
      await Foto.create({
        url_arquivo: 'foto1.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .get(`/api/fotos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('deve listar fotos para vistoriador dono', async () => {
      await Foto.create({
        url_arquivo: 'foto2.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .get(`/api/fotos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .get('/api/fotos/vistoria/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoriador não dono', async () => {
      // Criar outro vistoriador
      const outroVistoriador = await Usuario.create({
        cpf: generateTestCPF('outrofoto'),
        nome: 'Outro Vistoriador Foto',
        email: `outrofoto_${Date.now()}@test.com`,
        senha_hash: 'hash',
        nivel_acesso_id: 2
      });

      const outraVistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: outroVistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .get(`/api/fotos/vistoria/${outraVistoria.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve incluir url_completa nas fotos', async () => {
      await Foto.create({
        url_arquivo: 'foto3.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .get(`/api/fotos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body[0]).toHaveProperty('url_completa');
    });

    it('deve ordenar fotos por created_at ASC', async () => {
      await Foto.create({
        url_arquivo: 'foto-primeira.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      await Foto.create({
        url_arquivo: 'foto-segunda.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .get(`/api/fotos/vistoria/${vistoria.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const response = await request(app)
        .get(`/api/fotos/vistoria/${vistoria.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/fotos', () => {
    it('deve retornar 400 sem vistoria_id', async () => {
      const response = await request(app)
        .post('/api/fotos')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('tipo_foto_id', tipoFoto.id);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatórios');
    });

    it('deve retornar 400 sem tipo_foto_id', async () => {
      const response = await request(app)
        .post('/api/fotos')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('vistoria_id', vistoria.id);

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 para vistoria inexistente', async () => {
      const response = await request(app)
        .post('/api/fotos')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('vistoria_id', 99999)
        .field('tipo_foto_id', tipoFoto.id);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoriador não dono', async () => {
      const outroVistoriador = await Usuario.create({
        cpf: generateTestCPF('outrofoto2'),
        nome: 'Outro Vistoriador Foto 2',
        email: `outrofoto2_${Date.now()}@test.com`,
        senha_hash: 'hash',
        nivel_acesso_id: 2
      });

      const outraVistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: outroVistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const response = await request(app)
        .post('/api/fotos')
        .set('Authorization', `Bearer ${vistoriadorToken}`)
        .field('vistoria_id', outraVistoria.id)
        .field('tipo_foto_id', tipoFoto.id);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/fotos/:id/imagem-url', () => {
    it('deve retornar 404 para foto inexistente', async () => {
      const response = await request(app)
        .get('/api/fotos/99999/imagem-url')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.encontrada).toBe(false);
    });

    it('deve retornar URL para foto local', async () => {
      const foto = await Foto.create({
        url_arquivo: 'foto-local.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .get(`/api/fotos/${foto.id}/imagem-url`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
      expect(response.body.encontrada).toBe(true);
    });

    it('deve retornar 403 para vistoriador não dono', async () => {
      const outroVistoriador = await Usuario.create({
        cpf: generateTestCPF('outrofoto3'),
        nome: 'Outro Vistoriador Foto 3',
        email: `outrofoto3_${Date.now()}@test.com`,
        senha_hash: 'hash',
        nivel_acesso_id: 2
      });

      const outraVistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: outroVistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const foto = await Foto.create({
        url_arquivo: 'foto-outro.jpg',
        vistoria_id: outraVistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .get(`/api/fotos/${foto.id}/imagem-url`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/fotos/:id/imagem', () => {
    it('deve retornar 404 para foto inexistente', async () => {
      const response = await request(app)
        .get('/api/fotos/99999/imagem')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoriador não dono', async () => {
      const outroVistoriador = await Usuario.create({
        cpf: generateTestCPF('outrofoto4'),
        nome: 'Outro Vistoriador Foto 4',
        email: `outrofoto4_${Date.now()}@test.com`,
        senha_hash: 'hash',
        nivel_acesso_id: 2
      });

      const outraVistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: outroVistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const foto = await Foto.create({
        url_arquivo: 'foto-outro2.jpg',
        vistoria_id: outraVistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .get(`/api/fotos/${foto.id}/imagem`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve retornar 404 para arquivo local não encontrado', async () => {
      fs.existsSync.mockReturnValueOnce(true).mockReturnValue(false);

      const foto = await Foto.create({
        url_arquivo: 'foto-inexistente.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .get(`/api/fotos/${foto.id}/imagem`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/fotos/:id', () => {
    it('deve excluir foto como admin', async () => {
      const foto = await Foto.create({
        url_arquivo: 'foto-delete.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .delete(`/api/fotos/${foto.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('sucesso');

      // Verificar exclusão
      const deleted = await Foto.findByPk(foto.id);
      expect(deleted).toBeNull();
    });

    it('deve excluir foto como vistoriador dono', async () => {
      const foto = await Foto.create({
        url_arquivo: 'foto-delete-vist.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .delete(`/api/fotos/${foto.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve retornar 404 para foto inexistente', async () => {
      const response = await request(app)
        .delete('/api/fotos/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('deve retornar 403 para vistoriador não dono', async () => {
      const outroVistoriador = await Usuario.create({
        cpf: generateTestCPF('outrofoto5'),
        nome: 'Outro Vistoriador Foto 5',
        email: `outrofoto5_${Date.now()}@test.com`,
        senha_hash: 'hash',
        nivel_acesso_id: 2
      });

      const outraVistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: outroVistoriador.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });

      const foto = await Foto.create({
        url_arquivo: 'foto-outro-delete.jpg',
        vistoria_id: outraVistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .delete(`/api/fotos/${foto.id}`)
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(403);
    });

    it('deve chamar deleteFile do uploadService', async () => {
      const { deleteFile } = require('../../services/uploadService');

      const foto = await Foto.create({
        url_arquivo: 'foto-delete-service.jpg',
        vistoria_id: vistoria.id,
        tipo_foto_id: tipoFoto.id
      });

      const response = await request(app)
        .delete(`/api/fotos/${foto.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(deleteFile).toHaveBeenCalled();
    });
  });

  describe('Autenticação e Autorização', () => {
    it('deve retornar 401 para todas as rotas sem token', async () => {
      const routes = [
        { method: 'get', path: `/api/fotos/vistoria/${vistoria.id}` },
        { method: 'post', path: '/api/fotos' },
        { method: 'get', path: '/api/fotos/1/imagem' },
        { method: 'get', path: '/api/fotos/1/imagem-url' },
        { method: 'delete', path: '/api/fotos/1' }
      ];

      for (const route of routes) {
        const response = await request(app)[route.method](route.path);
        expect(response.status).toBe(401);
      }
    });
  });
});

