const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const cepRoutes = require('../../routes/cepRoutes');
const { buscarEnderecoPorCEP, buscarCEPPorEndereco } = require('../../services/cepService');
const { Usuario, NivelAcesso, sequelize } = require('../../models');
const bcrypt = require('bcryptjs');
const { generateTestCPF, setupTestEnvironment } = require('../helpers/testHelpers');

// Mock do serviço CEP
jest.mock('../../services/cepService');

const app = express();
app.use(express.json());
app.use('/api/cep', cepRoutes);

describe('CEP Routes', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    const { nivelAdmin } = await setupTestEnvironment();
    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    testUser = await Usuario.create({
      cpf: generateTestCPF('cep01'),
      nome: 'Test User',
      email: 'test@cep.com',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAdmin.id
    });

    authToken = jwt.sign(
      {
        userId: testUser.id,
        cpf: testUser.cpf,
        email: testUser.email,
        nome: testUser.nome,
        nivelAcesso: 'ADMINISTRADOR',
        nivelAcessoId: nivelAdmin.id
      },
      process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
    );
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/cep/:cep', () => {
    it('deve buscar endereço por CEP com sucesso', async () => {
      const mockEndereco = {
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        complemento: '',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP'
      };

      buscarEnderecoPorCEP.mockResolvedValue(mockEndereco);

      const response = await request(app)
        .get('/api/cep/01310100')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: mockEndereco
      });
      expect(buscarEnderecoPorCEP).toHaveBeenCalledWith('01310100');
    });

    it('deve retornar erro quando CEP é inválido', async () => {
      buscarEnderecoPorCEP.mockRejectedValue(new Error('CEP não encontrado'));

      const response = await request(app)
        .get('/api/cep/00000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'CEP não encontrado'
      });
    });

    it('deve exigir autenticação', async () => {
      await request(app)
        .get('/api/cep/01310100')
        .expect(401);
    });
  });

  describe('GET /api/cep/buscar/:uf/:cidade/:logradouro', () => {
    it('deve buscar CEP por endereço com sucesso', async () => {
      const mockEnderecos = [
        {
          cep: '01310-100',
          logradouro: 'Avenida Paulista',
          bairro: 'Bela Vista',
          localidade: 'São Paulo',
          uf: 'SP'
        }
      ];

      buscarCEPPorEndereco.mockResolvedValue(mockEnderecos);

      const response = await request(app)
        .get('/api/cep/buscar/SP/São Paulo/Avenida Paulista')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: mockEnderecos,
        count: 1
      });
      expect(buscarCEPPorEndereco).toHaveBeenCalledWith('SP', 'São Paulo', 'Avenida Paulista');
    });

    it('deve retornar lista vazia quando não encontra endereços', async () => {
      buscarCEPPorEndereco.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/cep/buscar/SP/São Paulo/Rua Inexistente')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
        count: 0
      });
    });

    it('deve retornar erro quando serviço falha', async () => {
      buscarCEPPorEndereco.mockRejectedValue(new Error('Erro ao buscar CEP'));

      const response = await request(app)
        .get('/api/cep/buscar/SP/São Paulo/Teste')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Erro ao buscar CEP'
      });
    });

    it('deve exigir autenticação', async () => {
      await request(app)
        .get('/api/cep/buscar/SP/São Paulo/Teste')
        .expect(401);
    });
  });
});

