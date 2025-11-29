const jwt = require('jsonwebtoken');
const { sequelize, Usuario, NivelAcesso } = require('../../models');
const { requireAuth, requireAdmin, requireVistoriador, requireAuthAllowPasswordUpdate } = require('../../middleware/auth');
const { setupCompleteTestEnvironment, generateTestCPF } = require('../helpers/testHelpers');

describe('Middleware de Autenticação', () => {
  let admin, vistoriador, nivelAdmin, nivelVistoriador;
  let adminToken, vistoriadorToken;
  
  beforeAll(async () => {
    const setup = await setupCompleteTestEnvironment('authMiddleware');
    admin = setup.admin;
    vistoriador = setup.vistoriador;
    nivelAdmin = setup.nivelAdmin;
    nivelVistoriador = setup.nivelVistoriador;
    adminToken = setup.adminToken;
    vistoriadorToken = setup.vistoriadorToken;
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  function createMockReqRes(token = null, user = null) {
    const req = {
      header: jest.fn((name) => {
        if (name === 'Authorization' && token) {
          return `Bearer ${token}`;
        }
        return null;
      }),
      user: user
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false
    };
    
    const next = jest.fn();
    
    return { req, res, next };
  }
  
  describe('requireAuth', () => {
    it('deve permitir acesso com token válido', async () => {
      const { req, res, next } = createMockReqRes(adminToken);
      
      await requireAuth(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(admin.id);
    });
    
    it('deve retornar 401 sem token', async () => {
      const { req, res, next } = createMockReqRes();
      
      await requireAuth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Token')
      }));
      expect(next).not.toHaveBeenCalled();
    });
    
    it('deve retornar 401 com token inválido', async () => {
      const { req, res, next } = createMockReqRes('token-invalido');
      
      await requireAuth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('deve retornar 401 para usuário inexistente', async () => {
      const tokenUsuarioInexistente = jwt.sign(
        { userId: 99999 },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt',
        { expiresIn: '1h' }
      );
      
      const { req, res, next } = createMockReqRes(tokenUsuarioInexistente);
      
      await requireAuth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('não encontrado')
      }));
    });
    
    it('deve retornar 403 se deve atualizar senha', async () => {
      // Criar usuário que precisa atualizar senha
      const userDeveAtualizar = await Usuario.create({
        cpf: generateTestCPF('pwdupd'),
        nome: 'Usuario Atualizar Senha',
        email: `pwdupd${Date.now()}@test.com`,
        senha_hash: 'hash',
        nivel_acesso_id: nivelVistoriador.id,
        deve_atualizar_senha: true
      });
      
      const token = jwt.sign(
        { userId: userDeveAtualizar.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt',
        { expiresIn: '1h' }
      );
      
      const { req, res, next } = createMockReqRes(token);
      
      await requireAuth(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        code: 'PASSWORD_UPDATE_REQUIRED'
      }));
    });
    
    it('deve definir userInfo com dados do token', async () => {
      const { req, res, next } = createMockReqRes(adminToken);
      
      await requireAuth(req, res, next);
      
      expect(req.userInfo).toBeDefined();
      expect(req.userInfo.userId).toBe(admin.id);
    });
  });
  
  describe('requireAdmin', () => {
    it('deve permitir acesso para admin', async () => {
      const req = {
        user: {
          NivelAcesso: { id: 1 }
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await requireAdmin(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
    
    it('deve negar acesso para não-admin', async () => {
      const req = {
        user: {
          NivelAcesso: { id: 2 }
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await requireAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('deve retornar 401 sem usuário autenticado', async () => {
      const req = { user: null };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await requireAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
    
    it('deve retornar 401 sem NivelAcesso', async () => {
      const req = { user: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await requireAdmin(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
  
  describe('requireVistoriador', () => {
    it('deve permitir acesso para admin (nível 1)', async () => {
      const req = {
        user: {
          NivelAcesso: { id: 1 }
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await requireVistoriador(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
    
    it('deve permitir acesso para vistoriador (nível 2)', async () => {
      const req = {
        user: {
          NivelAcesso: { id: 2 }
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await requireVistoriador(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
    
    it('deve negar acesso para outros níveis', async () => {
      const req = {
        user: {
          NivelAcesso: { id: 3 }
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await requireVistoriador(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('deve retornar 401 sem usuário', async () => {
      const req = { user: null };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      await requireVistoriador(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
  
  describe('requireAuthAllowPasswordUpdate', () => {
    it('deve permitir acesso mesmo se deve atualizar senha', async () => {
      const userDeveAtualizar = await Usuario.create({
        cpf: generateTestCPF('pwdupd2'),
        nome: 'Usuario Atualizar 2',
        email: `pwdupd2${Date.now()}@test.com`,
        senha_hash: 'hash',
        nivel_acesso_id: nivelVistoriador.id,
        deve_atualizar_senha: true
      });
      
      const token = jwt.sign(
        { userId: userDeveAtualizar.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt',
        { expiresIn: '1h' }
      );
      
      const { req, res, next } = createMockReqRes(token);
      
      await requireAuthAllowPasswordUpdate(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });
    
    it('deve retornar 401 sem token', async () => {
      const { req, res, next } = createMockReqRes();
      
      await requireAuthAllowPasswordUpdate(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
