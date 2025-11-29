const request = require('supertest');
const { sequelize } = require('../../models');
const cepRoutes = require('../../routes/cepRoutes');
const { setupCompleteTestEnvironment, createTestApp } = require('../helpers/testHelpers');

// Mock do serviço de CEP
jest.mock('../../services/cepService', () => ({
  buscarEnderecoPorCEP: jest.fn(),
  buscarCEPPorEndereco: jest.fn()
}));

const { buscarEnderecoPorCEP, buscarCEPPorEndereco } = require('../../services/cepService');

const app = createTestApp({ path: '/api/cep', router: cepRoutes });

describe('Rotas de CEP', () => {
  let adminToken, vistoriadorToken;

  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('cep');
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/cep/:cep', () => {
    it('deve buscar endereço por CEP válido', async () => {
      const mockEndereco = {
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP'
      };

      buscarEnderecoPorCEP.mockResolvedValue(mockEndereco);

      const response = await request(app)
        .get('/api/cep/01310100')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockEndereco);
      expect(buscarEnderecoPorCEP).toHaveBeenCalledWith('01310100');
    });

    it('deve retornar erro para CEP inválido', async () => {
      buscarEnderecoPorCEP.mockRejectedValue(new Error('CEP inválido'));

      const response = await request(app)
        .get('/api/cep/123')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar erro para CEP não encontrado', async () => {
      buscarEnderecoPorCEP.mockRejectedValue(new Error('CEP não encontrado'));

      const response = await request(app)
        .get('/api/cep/00000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('CEP não encontrado');
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/cep/01310100');
      expect(response.status).toBe(401);
    });

    it('deve aceitar CEP com hífen', async () => {
      const mockEndereco = {
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        estado: 'SP'
      };

      buscarEnderecoPorCEP.mockResolvedValue(mockEndereco);

      const response = await request(app)
        .get('/api/cep/01310-100')
        .set('Authorization', `Bearer ${vistoriadorToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/cep/buscar/:uf/:cidade/:logradouro', () => {
    it('deve buscar CEP por endereço', async () => {
      const mockEnderecos = [
        { cep: '01310-100', logradouro: 'Avenida Paulista', bairro: 'Bela Vista' },
        { cep: '01310-200', logradouro: 'Avenida Paulista', bairro: 'Consolação' }
      ];

      buscarCEPPorEndereco.mockResolvedValue(mockEnderecos);

      const response = await request(app)
        .get('/api/cep/buscar/SP/Sao Paulo/Paulista')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockEnderecos);
      expect(response.body.count).toBe(2);
    });

    it('deve retornar array vazio se não encontrar', async () => {
      buscarCEPPorEndereco.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/cep/buscar/SP/Cidade Inexistente/Rua Teste')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('deve retornar erro para parâmetros inválidos', async () => {
      buscarCEPPorEndereco.mockRejectedValue(new Error('Parâmetros inválidos'));

      const response = await request(app)
        .get('/api/cep/buscar/XX/Cidade/Rua')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    it('deve exigir autenticação', async () => {
      const response = await request(app).get('/api/cep/buscar/SP/Sao Paulo/Paulista');
      expect(response.status).toBe(401);
    });
  });
});
