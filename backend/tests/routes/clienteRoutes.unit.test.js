/**
 * Testes unitários para clienteRoutes - sem dependência de banco de dados
 */

const express = require('express');
const request = require('supertest');

// Mock dos modelos
jest.mock('../../models', () => ({
  Cliente: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn()
  },
  Embarcacao: {
    count: jest.fn(),
    findAll: jest.fn()
  },
  sequelize: {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true)
  }
}));

// Mock do middleware de autenticação
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, NivelAcesso: { id: 1, nome: 'ADMINISTRADOR' } };
    req.userInfo = { userId: 1 };
    next();
  },
  requireAdmin: (req, res, next) => next(),
  requireVistoriador: (req, res, next) => next()
}));

const { Cliente, Embarcacao } = require('../../models');

describe('Cliente Routes - Unit Tests', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    const clienteRoutes = require('../../routes/clienteRoutes');
    app.use('/api/clientes', clienteRoutes);
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/clientes', () => {
    it('deve listar clientes com sucesso', async () => {
      const mockClientes = [
        { id: 1, nome: 'Cliente 1', tipo_pessoa: 'FISICA', toJSON: () => ({ id: 1, nome: 'Cliente 1' }) },
        { id: 2, nome: 'Cliente 2', tipo_pessoa: 'JURIDICA', toJSON: () => ({ id: 2, nome: 'Cliente 2' }) }
      ];
      
      Cliente.findAll.mockResolvedValue(mockClientes);
      
      const response = await request(app).get('/api/clientes');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    it('deve filtrar por tipo de pessoa', async () => {
      const mockClientes = [
        { id: 1, nome: 'Empresa', tipo_pessoa: 'JURIDICA', toJSON: () => ({ id: 1 }) }
      ];
      
      Cliente.findAll.mockResolvedValue(mockClientes);
      
      const response = await request(app).get('/api/clientes?tipo_pessoa=JURIDICA');
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar erro 500 em caso de falha', async () => {
      Cliente.findAll.mockRejectedValue(new Error('DB Error'));
      
      const response = await request(app).get('/api/clientes');
      
      expect(response.status).toBe(500);
    });
  });
  
  describe('GET /api/clientes/:id', () => {
    it('deve retornar cliente por ID', async () => {
      const mockCliente = { 
        id: 1, 
        nome: 'Cliente Teste', 
        tipo_pessoa: 'FISICA',
        toJSON: () => ({ id: 1, nome: 'Cliente Teste' })
      };
      
      Cliente.findByPk.mockResolvedValue(mockCliente);
      
      const response = await request(app).get('/api/clientes/1');
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 404 para cliente inexistente', async () => {
      Cliente.findByPk.mockResolvedValue(null);
      
      const response = await request(app).get('/api/clientes/999');
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('GET /api/clientes/buscar/:documento', () => {
    it('deve buscar cliente por CPF', async () => {
      const mockCliente = {
        id: 1,
        nome: 'Cliente CPF',
        cpf: '12345678901',
        toJSON: () => ({ id: 1, nome: 'Cliente CPF' })
      };
      
      Cliente.findOne.mockResolvedValue(mockCliente);
      
      const response = await request(app).get('/api/clientes/buscar/12345678901');
      
      expect(response.status).toBe(200);
    });
    
    it('deve buscar cliente por CNPJ', async () => {
      const mockCliente = {
        id: 1,
        nome: 'Empresa CNPJ',
        cnpj: '12345678000199',
        toJSON: () => ({ id: 1, nome: 'Empresa CNPJ' })
      };
      
      Cliente.findOne.mockResolvedValue(mockCliente);
      
      const response = await request(app).get('/api/clientes/buscar/12345678000199');
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 400 para documento inválido', async () => {
      const response = await request(app).get('/api/clientes/buscar/123');
      
      expect(response.status).toBe(400);
    });
    
    it('deve retornar 404 para cliente não encontrado', async () => {
      Cliente.findOne.mockResolvedValue(null);
      
      const response = await request(app).get('/api/clientes/buscar/12345678901');
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('POST /api/clientes', () => {
    it('deve criar cliente pessoa física', async () => {
      const mockCliente = { 
        id: 1, 
        nome: 'Novo Cliente', 
        tipo_pessoa: 'FISICA',
        cpf: '12345678901'
      };
      
      Cliente.findOne.mockResolvedValue(null);
      Cliente.create.mockResolvedValue(mockCliente);
      
      const response = await request(app)
        .post('/api/clientes')
        .send({
          nome: 'Novo Cliente',
          tipo_pessoa: 'FISICA',
          cpf: '12345678901'
        });
      
      expect(response.status).toBe(201);
    });
    
    it('deve criar cliente pessoa jurídica', async () => {
      const mockCliente = { 
        id: 1, 
        nome: 'Empresa Nova', 
        tipo_pessoa: 'JURIDICA',
        cnpj: '12345678000199'
      };
      
      Cliente.findOne.mockResolvedValue(null);
      Cliente.create.mockResolvedValue(mockCliente);
      
      const response = await request(app)
        .post('/api/clientes')
        .send({
          nome: 'Empresa Nova',
          tipo_pessoa: 'JURIDICA',
          cnpj: '12345678000199'
        });
      
      expect(response.status).toBe(201);
    });
    
    it('deve retornar 400 sem nome', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .send({
          tipo_pessoa: 'FISICA',
          cpf: '12345678901'
        });
      
      expect(response.status).toBe(400);
    });
    
    it('deve retornar 400 para CPF/CNPJ duplicado', async () => {
      Cliente.findOne.mockResolvedValue({ id: 1, cpf: '12345678901' });
      
      const response = await request(app)
        .post('/api/clientes')
        .send({
          nome: 'Cliente Duplicado',
          tipo_pessoa: 'FISICA',
          cpf: '12345678901'
        });
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('PUT /api/clientes/:id', () => {
    it('deve atualizar cliente existente', async () => {
      const mockCliente = {
        id: 1,
        nome: 'Cliente Original',
        update: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1, nome: 'Cliente Atualizado' })
      };
      
      Cliente.findByPk.mockResolvedValue(mockCliente);
      
      const response = await request(app)
        .put('/api/clientes/1')
        .send({ nome: 'Cliente Atualizado' });
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 404 para cliente inexistente', async () => {
      Cliente.findByPk.mockResolvedValue(null);
      
      const response = await request(app)
        .put('/api/clientes/999')
        .send({ nome: 'Teste' });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('DELETE /api/clientes/:id', () => {
    it('deve deletar cliente sem embarcações', async () => {
      const mockCliente = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true)
      };
      
      Cliente.findByPk.mockResolvedValue(mockCliente);
      Embarcacao.count.mockResolvedValue(0);
      
      const response = await request(app).delete('/api/clientes/1');
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 400 para cliente com embarcações', async () => {
      const mockCliente = { id: 1 };
      
      Cliente.findByPk.mockResolvedValue(mockCliente);
      Embarcacao.count.mockResolvedValue(3);
      
      const response = await request(app).delete('/api/clientes/1');
      
      expect(response.status).toBe(400);
    });
    
    it('deve retornar 404 para cliente inexistente', async () => {
      Cliente.findByPk.mockResolvedValue(null);
      
      const response = await request(app).delete('/api/clientes/999');
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('PATCH /api/clientes/:id/toggle-status', () => {
    it('deve alternar status do cliente', async () => {
      const mockCliente = {
        id: 1,
        ativo: true,
        update: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1, ativo: false })
      };
      
      Cliente.findByPk.mockResolvedValue(mockCliente);
      
      const response = await request(app).patch('/api/clientes/1/toggle-status');
      
      expect(response.status).toBe(200);
    });
    
    it('deve retornar 404 para cliente inexistente', async () => {
      Cliente.findByPk.mockResolvedValue(null);
      
      const response = await request(app).patch('/api/clientes/999/toggle-status');
      
      expect(response.status).toBe(404);
    });
  });
});

