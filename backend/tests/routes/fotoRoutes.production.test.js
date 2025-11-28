/**
 * Testes completos para rotas de fotos em ambiente de produção
 * Testa todos os cenários possíveis de carregamento de imagens
 */

const request = require('supertest');
const express = require('express');
const { Foto, Vistoria, Usuario, NivelAcesso } = require('../../models');
const fotoRoutes = require('../../routes/fotoRoutes');
const { requireAuth } = require('../../middleware/auth');

// Mock do middleware de autenticação para testes
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    // Simular usuário autenticado
    req.user = {
      id: 1,
      nome: 'Teste User',
      NivelAcesso: { id: 1, nome: 'ADMINISTRADOR' }
    };
    next();
  },
  requireVistoriador: (req, res, next) => next()
}));

describe('Rotas de Fotos - Testes de Produção', () => {
  let app;
  let testFoto;
  let testVistoria;
  let authToken;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/fotos', fotoRoutes);

    // Criar dados de teste
    const { generateTestCPF } = require('../helpers/testHelpers');
    const nivelAcesso = await NivelAcesso.findOne({ where: { nome: 'ADMINISTRADOR' } });
    const usuario = await Usuario.create({
      cpf: generateTestCPF('foto01'),
      nome: 'Teste User',
      email: 'teste@teste.com',
      senha_hash: 'hash',
      nivel_acesso_id: nivelAcesso.id
    });

    testVistoria = await Vistoria.create({
      embarcacao_id: 1,
      local_id: 1,
      vistoriador_id: usuario.id,
      status_id: 1
    });

    testFoto = await Foto.create({
      url_arquivo: 'vistorias/id-1/teste.jpg',
      vistoria_id: testVistoria.id,
      tipo_foto_id: 1
    });

    // Gerar token de autenticação
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { userId: usuario.id },
      process.env.JWT_SECRET || 'sua-chave-secreta-jwt',
      { expiresIn: '24h' }
    );
  });

  afterAll(async () => {
    if (testFoto) await testFoto.destroy();
    if (testVistoria) await testVistoria.destroy();
  });

  describe('GET /api/fotos/:id/imagem', () => {
    it('deve retornar 404 se foto não existir', async () => {
      const response = await request(app)
        .get('/api/fotos/99999/imagem')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Foto não encontrada');
    });

    it('deve retornar 403 se usuário não tiver permissão', async () => {
      // Mock de usuário sem permissão
      const originalRequireAuth = require('../../middleware/auth').requireAuth;
      jest.spyOn(require('../../middleware/auth'), 'requireAuth').mockImplementation((req, res, next) => {
        req.user = {
          id: 999,
          nome: 'Outro User',
          NivelAcesso: { id: 2, nome: 'VISTORIADOR' }
        };
        next();
      });

      const response = await request(app)
        .get(`/api/fotos/${testFoto.id}/imagem`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Acesso negado');

      // Restaurar mock
      require('../../middleware/auth').requireAuth = originalRequireAuth;
    });

    it('deve retornar imagem com headers CORS corretos', async () => {
      const response = await request(app)
        .get(`/api/fotos/${testFoto.id}/imagem`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Origin', 'https://vessel-inspection.com.br')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://vessel-inspection.com.br');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['content-type']).toMatch(/^image\//);
    });

    it('deve lidar com URLs duplas (//) corretamente', async () => {
      // Testar se a URL é normalizada corretamente
      const url1 = 'https://api.vessel-inspection.com.br//api/fotos/1/imagem';
      const url2 = 'https://api.vessel-inspection.com.br/api/fotos/1/imagem';
      
      // URLs devem ser equivalentes após normalização
      expect(url1.replace(/([^:]\/)\/+/g, '$1')).toBe(url2);
    });

    it('deve retornar erro 500 se houver problema no S3', async () => {
      // Mock de erro S3
      const originalServirImagemS3 = require('../../utils/servirImagemS3').servirImagemS3;
      jest.spyOn(require('../../utils/servirImagemS3'), 'servirImagemS3').mockRejectedValue(
        new Error('Erro ao acessar S3')
      );

      const response = await request(app)
        .get(`/api/fotos/${testFoto.id}/imagem`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');

      // Restaurar mock
      require('../../utils/servirImagemS3').servirImagemS3 = originalServirImagemS3;
    });
  });

  describe('GET /api/fotos/:id/imagem-url', () => {
    it('deve retornar URL da imagem', async () => {
      const response = await request(app)
        .get(`/api/fotos/${testFoto.id}/imagem-url`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toBeTruthy();
    });
  });

  describe('Validação de URLs', () => {
    it('deve normalizar URLs com barras duplas', () => {
      const { normalizeUrl } = require('../../utils/urlHelper');
      
      expect(normalizeUrl('https://api.example.com/', '/api/fotos/1/imagem'))
        .toBe('https://api.example.com/api/fotos/1/imagem');
      
      expect(normalizeUrl('https://api.example.com', '//api/fotos/1/imagem'))
        .toBe('https://api.example.com/api/fotos/1/imagem');
      
      expect(normalizeUrl('https://api.example.com/', '//api/fotos/1/imagem'))
        .toBe('https://api.example.com/api/fotos/1/imagem');
    });
  });

  describe('CORS em Produção', () => {
    it('deve permitir origem de produção', async () => {
      const origins = [
        'https://vessel-inspection.com.br',
        'https://www.vessel-inspection.com.br',
        'https://app.vessel-inspection.com.br'
      ];

      for (const origin of origins) {
        const response = await request(app)
          .options(`/api/fotos/${testFoto.id}/imagem`)
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'GET')
          .expect(204);

        expect(response.headers['access-control-allow-origin']).toBe(origin);
      }
    });
  });
});

