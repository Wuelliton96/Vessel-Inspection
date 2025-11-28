const request = require('supertest');
const { sequelize } = require('../../models');
const cepRoutes = require('../../routes/cepRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');
const { buscarEnderecoPorCEP } = require('../../services/cepService');

jest.mock('../../services/cepService');

const app = createTestApp({ path: '/api/cep', router: cepRoutes });

describe('Rotas de CEP - Testes Adicionais', () => {
  let adminToken, vistoriadorToken;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('cep');
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/cep/:cep', () => {
    it('deve buscar endereço por CEP válido', async () => {
      const mockEndereco = {
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        uf: 'SP'
      };

      buscarEnderecoPorCEP.mockResolvedValue(mockEndereco);

      const response = await request(app)
        .get('/api/cep/01310100')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.cep).toBe('01310-100');
      expect(response.body.logradouro).toBe('Avenida Paulista');
    });

    it('deve aceitar CEP formatado', async () => {
      const mockEndereco = {
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        cidade: 'São Paulo',
        uf: 'SP'
      };

      buscarEnderecoPorCEP.mockResolvedValue(mockEndereco);

      const response = await request(app)
        .get('/api/cep/01310-100')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });

    it('deve retornar 400 para CEP inválido', async () => {
      buscarEnderecoPorCEP.mockRejectedValue(new Error('CEP invalido'));

      const response = await request(app)
        .get('/api/cep/12345')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(400);
    });

    it('deve retornar 404 para CEP não encontrado', async () => {
      buscarEnderecoPorCEP.mockRejectedValue(new Error('CEP nao encontrado'));

      const response = await request(app)
        .get('/api/cep/00000000')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(404);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/cep/01310100');
      expect(response.status).toBe(401);
    });
  });
});
