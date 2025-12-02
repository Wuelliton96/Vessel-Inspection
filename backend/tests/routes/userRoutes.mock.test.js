/**
 * Testes unitários para userRoutes
 * Usa mocks para evitar dependência do banco de dados
 */

const express = require('express');
const request = require('supertest');
const bcrypt = require('bcryptjs');

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password')
}));

// Mock user data
const mockUser = {
  id: 2,
  nome: 'Test User',
  email: 'test@test.com',
  cpf: '12345678900',
  nivel_acesso_id: 2,
  ativo: true,
  telefone_e164: '+5511999998888',
  estado: 'SP',
  NivelAcesso: { id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' },
  createdAt: new Date(),
  updatedAt: new Date(),
  update: jest.fn().mockResolvedValue(true),
  destroy: jest.fn().mockResolvedValue(true)
};

const mockAdmin = {
  id: 1,
  nome: 'Admin User',
  email: 'admin@test.com',
  cpf: '98765432100',
  nivel_acesso_id: 1,
  ativo: true,
  NivelAcesso: { id: 1, nome: 'ADMIN' },
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockNivelAcesso = {
  id: 2,
  nome: 'VISTORIADOR',
  descricao: 'Vistoriador do sistema'
};

// Mock models
jest.mock('../../models', () => ({
  Usuario: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    count: jest.fn()
  },
  NivelAcesso: {
    findByPk: jest.fn()
  }
}));

// Mock middleware
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 1, nome: 'Admin', email: 'admin@test.com', NivelAcesso: { id: 1, nome: 'ADMIN' } };
    next();
  },
  requireAdmin: (req, res, next) => next()
}));

jest.mock('../../middleware/auditoria', () => ({
  registrarAuditoria: jest.fn().mockResolvedValue(true),
  auditoriaMiddleware: (req, res, next) => next(),
  salvarDadosOriginais: () => (req, res, next) => {
    req.originalData = {};
    next();
  }
}));

jest.mock('../../middleware/rateLimiting', () => ({
  strictRateLimiter: (req, res, next) => next(),
  moderateRateLimiter: (req, res, next) => next()
}));

jest.mock('../../utils/validators', () => ({
  validarTelefoneE164: jest.fn().mockReturnValue(true),
  converterParaE164: jest.fn(tel => tel),
  validarEstado: jest.fn().mockReturnValue(true),
  validarCPF: jest.fn().mockReturnValue(true),
  limparCPF: jest.fn(cpf => cpf.replace(/\D/g, ''))
}));

describe('userRoutes - Testes Unitários', () => {
  let app;
  let models;
  let validators;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    jest.resetModules();
    models = require('../../models');
    validators = require('../../utils/validators');
    
    const userRoutes = require('../../routes/userRoutes');
    app.use('/api/usuarios', userRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/usuarios', () => {
    it('deve retornar lista de usuários', async () => {
      models.Usuario.findAll.mockResolvedValue([mockUser]);

      const response = await request(app)
        .get('/api/usuarios')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty('nome');
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Usuario.findAll.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .get('/api/usuarios')
        .expect(500);
    });
  });

  describe('GET /api/usuarios/:id', () => {
    it('deve retornar usuário por ID', async () => {
      models.Usuario.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/usuarios/2')
        .expect(200);

      expect(response.body.nome).toBe('Test User');
    });

    it('deve retornar 404 se não encontrar', async () => {
      models.Usuario.findByPk.mockResolvedValue(null);

      await request(app)
        .get('/api/usuarios/999')
        .expect(404);
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Usuario.findByPk.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .get('/api/usuarios/1')
        .expect(500);
    });
  });

  describe('POST /api/usuarios', () => {
    it('deve criar usuário com sucesso', async () => {
      models.Usuario.findOne.mockResolvedValue(null);
      models.NivelAcesso.findByPk.mockResolvedValue(mockNivelAcesso);
      models.Usuario.create.mockResolvedValue({ id: 3, ...mockUser });
      models.Usuario.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Novo Usuario',
          cpf: '12345678900',
          nivelAcessoId: 2,
          email: 'novo@test.com'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('deve criar usuário sem email', async () => {
      models.Usuario.findOne.mockResolvedValue(null);
      models.NivelAcesso.findByPk.mockResolvedValue(mockNivelAcesso);
      models.Usuario.create.mockResolvedValue({ id: 3, ...mockUser, email: null });
      models.Usuario.findByPk.mockResolvedValue({ ...mockUser, email: null });

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Usuario Sem Email',
          cpf: '12345678900',
          nivelAcessoId: 2
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('deve retornar 400 se nome não fornecido', async () => {
      const response = await request(app)
        .post('/api/usuarios')
        .send({ cpf: '12345678900', nivelAcessoId: 2 })
        .expect(400);

      expect(response.body.error).toContain('Nome');
    });

    it('deve retornar 400 se CPF não fornecido', async () => {
      await request(app)
        .post('/api/usuarios')
        .send({ nome: 'Test', nivelAcessoId: 2 })
        .expect(400);
    });

    it('deve retornar 400 se CPF inválido', async () => {
      validators.validarCPF.mockReturnValueOnce(false);

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Test',
          cpf: '11111111111',
          nivelAcessoId: 2
        })
        .expect(400);

      expect(response.body.error).toContain('CPF');
    });

    it('deve retornar 400 se CPF já cadastrado', async () => {
      models.Usuario.findOne.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Test',
          cpf: '12345678900',
          nivelAcessoId: 2
        })
        .expect(400);

      expect(response.body.error).toContain('CPF já está cadastrado');
    });

    it('deve retornar 400 se email inválido', async () => {
      models.Usuario.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Test',
          cpf: '12345678900',
          email: 'email-invalido',
          nivelAcessoId: 2
        })
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    it('deve retornar 400 se email já cadastrado', async () => {
      models.Usuario.findOne
        .mockResolvedValueOnce(null) // CPF check
        .mockResolvedValueOnce(mockUser); // Email check

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Test',
          cpf: '12345678900',
          email: 'existente@test.com',
          nivelAcessoId: 2
        })
        .expect(400);

      expect(response.body.error).toContain('Email já cadastrado');
    });

    it('deve retornar 400 se telefone inválido', async () => {
      validators.validarTelefoneE164.mockReturnValueOnce(false);
      models.Usuario.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Test',
          cpf: '12345678900',
          telefone_e164: '1234',
          nivelAcessoId: 2
        })
        .expect(400);

      expect(response.body.error).toContain('telefone');
    });

    it('deve retornar 400 se estado inválido', async () => {
      validators.validarEstado.mockReturnValueOnce(false);
      models.Usuario.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Test',
          cpf: '12345678900',
          estado: 'XX',
          nivelAcessoId: 2
        })
        .expect(400);

      expect(response.body.error).toContain('Estado');
    });

    it('deve retornar 400 se nível de acesso não encontrado', async () => {
      models.Usuario.findOne.mockResolvedValue(null);
      models.NivelAcesso.findByPk.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Test',
          cpf: '12345678900',
          nivelAcessoId: 999
        })
        .expect(400);

      expect(response.body.error).toContain('Nível de acesso');
    });

    it('deve tratar erro de constraint única no CPF', async () => {
      models.Usuario.findOne.mockResolvedValue(null);
      models.NivelAcesso.findByPk.mockResolvedValue(mockNivelAcesso);
      
      const error = new Error('Unique constraint');
      error.name = 'SequelizeUniqueConstraintError';
      error.errors = [{ path: 'cpf' }];
      models.Usuario.create.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Test',
          cpf: '12345678900',
          nivelAcessoId: 2
        })
        .expect(400);

      expect(response.body.error).toContain('CPF');
    });

    it('deve tratar erro de validação do Sequelize', async () => {
      models.Usuario.findOne.mockResolvedValue(null);
      models.NivelAcesso.findByPk.mockResolvedValue(mockNivelAcesso);
      
      const error = new Error('Validation');
      error.name = 'SequelizeValidationError';
      error.errors = [{ message: 'Campo obrigatório' }];
      models.Usuario.create.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/usuarios')
        .send({
          nome: 'Test',
          cpf: '12345678900',
          nivelAcessoId: 2
        })
        .expect(400);

      expect(response.body.error).toContain('Campo obrigatório');
    });
  });

  describe('PUT /api/usuarios/:id', () => {
    it('deve atualizar usuário com sucesso', async () => {
      const user = { ...mockUser, update: jest.fn().mockResolvedValue(true) };
      models.Usuario.findByPk
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(user);
      models.Usuario.findOne.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/usuarios/2')
        .send({ nome: 'Nome Atualizado' })
        .expect(200);

      expect(user.update).toHaveBeenCalled();
    });

    it('deve retornar 404 se usuário não encontrado', async () => {
      models.Usuario.findByPk.mockResolvedValue(null);

      await request(app)
        .put('/api/usuarios/999')
        .send({ nome: 'Test' })
        .expect(404);
    });

    it('deve retornar 400 se tentar remover CPF', async () => {
      models.Usuario.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/usuarios/2')
        .send({ cpf: '' })
        .expect(400);

      expect(response.body.error).toContain('CPF é obrigatório');
    });

    it('deve retornar 400 se CPF inválido', async () => {
      validators.validarCPF.mockReturnValueOnce(false);
      models.Usuario.findByPk.mockResolvedValue(mockUser);

      const response = await request(app)
        .put('/api/usuarios/2')
        .send({ cpf: '11111111111' })
        .expect(400);

      expect(response.body.error).toContain('CPF inválido');
    });

    it('deve retornar 400 se CPF já existe em outro usuário', async () => {
      models.Usuario.findByPk.mockResolvedValue(mockUser);
      models.Usuario.findOne.mockResolvedValue({ id: 999, cpf: '99999999999' });

      const response = await request(app)
        .put('/api/usuarios/2')
        .send({ cpf: '99999999999' })
        .expect(400);

      expect(response.body.error).toContain('CPF já está cadastrado');
    });

    it('deve limpar telefone se valor vazio fornecido', async () => {
      const user = { ...mockUser, update: jest.fn().mockResolvedValue(true) };
      models.Usuario.findByPk
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(user);
      models.Usuario.findOne.mockResolvedValue(null);

      await request(app)
        .put('/api/usuarios/2')
        .send({ telefone_e164: '' })
        .expect(200);

      expect(user.update).toHaveBeenCalledWith(
        expect.objectContaining({ telefone_e164: null })
      );
    });
  });

  describe('DELETE /api/usuarios/:id', () => {
    it('deve excluir usuário com sucesso', async () => {
      const user = { ...mockUser, destroy: jest.fn().mockResolvedValue(true) };
      models.Usuario.findByPk.mockResolvedValue(user);
      models.Usuario.count.mockResolvedValue(2);

      const response = await request(app)
        .delete('/api/usuarios/2')
        .expect(200);

      expect(response.body.message).toContain('excluído');
    });

    it('deve retornar 403 se tentar deletar a si mesmo', async () => {
      // ID do admin logado é 1
      const response = await request(app)
        .delete('/api/usuarios/1')
        .expect(403);

      expect(response.body.message).toContain('própria conta');
    });

    it('deve retornar 404 se usuário não encontrado', async () => {
      models.Usuario.findByPk.mockResolvedValue(null);

      await request(app)
        .delete('/api/usuarios/999')
        .expect(404);
    });

    it('deve retornar 403 se for o último admin', async () => {
      const adminUser = { ...mockAdmin, destroy: jest.fn() };
      models.Usuario.findByPk.mockResolvedValue(adminUser);
      models.Usuario.count.mockResolvedValue(1);

      const response = await request(app)
        .delete('/api/usuarios/999')
        .expect(403);

      expect(response.body.message).toContain('último administrador');
    });
  });

  describe('POST /api/usuarios/:id/reset-password', () => {
    it('deve redefinir senha com sucesso', async () => {
      const user = { ...mockUser, update: jest.fn().mockResolvedValue(true) };
      models.Usuario.findByPk.mockResolvedValue(user);

      const response = await request(app)
        .post('/api/usuarios/2/reset-password')
        .send({ novaSenha: 'NovaSenha123!' })
        .expect(200);

      expect(response.body.message).toContain('Senha redefinida');
    });

    it('deve retornar 400 se senha não fornecida', async () => {
      await request(app)
        .post('/api/usuarios/2/reset-password')
        .send({})
        .expect(400);
    });

    it('deve retornar 400 se senha fraca', async () => {
      const response = await request(app)
        .post('/api/usuarios/2/reset-password')
        .send({ novaSenha: '123' })
        .expect(400);

      expect(response.body).toHaveProperty('details');
    });

    it('deve retornar 404 se usuário não encontrado', async () => {
      models.Usuario.findByPk.mockResolvedValue(null);

      await request(app)
        .post('/api/usuarios/999/reset-password')
        .send({ novaSenha: 'NovaSenha123!' })
        .expect(404);
    });
  });

  describe('PATCH /api/usuarios/:id/toggle-status', () => {
    it('deve alternar status de ativo para inativo', async () => {
      const user = { 
        ...mockUser, 
        ativo: true, 
        update: jest.fn().mockResolvedValue(true) 
      };
      models.Usuario.findByPk
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({ ...user, ativo: false });

      const response = await request(app)
        .patch('/api/usuarios/2/toggle-status')
        .expect(200);

      expect(user.update).toHaveBeenCalledWith({ ativo: false });
    });

    it('deve alternar status de inativo para ativo', async () => {
      const user = { 
        ...mockUser, 
        ativo: false, 
        update: jest.fn().mockResolvedValue(true) 
      };
      models.Usuario.findByPk
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce({ ...user, ativo: true });

      await request(app)
        .patch('/api/usuarios/2/toggle-status')
        .expect(200);

      expect(user.update).toHaveBeenCalledWith({ ativo: true });
    });

    it('deve retornar 404 se usuário não encontrado', async () => {
      models.Usuario.findByPk.mockResolvedValue(null);

      await request(app)
        .patch('/api/usuarios/999/toggle-status')
        .expect(404);
    });

    it('deve retornar 500 em caso de erro', async () => {
      models.Usuario.findByPk.mockRejectedValue(new Error('DB Error'));

      await request(app)
        .patch('/api/usuarios/2/toggle-status')
        .expect(500);
    });
  });
});



