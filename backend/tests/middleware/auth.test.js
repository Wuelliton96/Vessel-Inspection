const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin, requireAdminOrVistoriador } = require('../../middleware/auth');
const { Usuario, NivelAcesso, sequelize } = require('../../models');

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;
  let testUser;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await NivelAcesso.create({ id: 1, nome: 'ADMINISTRADOR', descricao: 'Admin' });
    await NivelAcesso.create({ id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' });
    
    testUser = await Usuario.create({
      nome: 'Test User',
      email: 'test@auth.middleware',
      senha_hash: 'hash',
      nivel_acesso_id: 1
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(() => {
    mockReq = {
      headers: {},
      header: jest.fn()
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('authenticateToken', () => {
    it('deve passar com token válido', async () => {
      const token = jwt.sign(
        { userId: testUser.id, email: testUser.email },
        process.env.JWT_SECRET || 'test-secret'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(testUser.id);
    });

    it('deve retornar 401 sem token', async () => {
      mockReq.header.mockReturnValue(null);

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Token não fornecido' 
      });
    });

    it('deve retornar 401 com token inválido', async () => {
      mockReq.header.mockReturnValue('Bearer token-invalido');

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('deve retornar 404 se usuário não existir', async () => {
      const token = jwt.sign(
        { userId: 99999, email: 'fake@test.com' },
        process.env.JWT_SECRET || 'test-secret'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      await authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('requireAdmin', () => {
    it('deve passar para admin', () => {
      mockReq.user = { nivelAcessoId: 1 };

      requireAdmin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('deve retornar 403 para não-admin', () => {
      mockReq.user = { nivelAcessoId: 2 };

      requireAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Acesso negado. Apenas administradores.' 
      });
    });

    it('deve retornar 403 sem usuário', () => {
      mockReq.user = null;

      requireAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireAdminOrVistoriador', () => {
    it('deve passar para admin', () => {
      mockReq.user = { nivelAcessoId: 1 };

      requireAdminOrVistoriador(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('deve passar para vistoriador', () => {
      mockReq.user = { nivelAcessoId: 2 };

      requireAdminOrVistoriador(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('deve retornar 403 para outros níveis', () => {
      mockReq.user = { nivelAcessoId: 3 };

      requireAdminOrVistoriador(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('deve retornar 403 sem usuário', () => {
      mockReq.user = null;

      requireAdminOrVistoriador(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});
