const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { requireAuth, requireAdmin, requireVistoriador, requireAuthAllowPasswordUpdate } = require('../../middleware/auth');
const { Usuario, NivelAcesso, sequelize } = require('../../models');

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;
  let testUser, testVistoriador;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await NivelAcesso.create({ id: 1, nome: 'ADMINISTRADOR', descricao: 'Admin' });
    await NivelAcesso.create({ id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' });
    
    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    testUser = await Usuario.create({
      cpf: '12345678916',
      nome: 'Test User',
      email: 'test@auth.middleware',
      senha_hash: senhaHash,
      nivel_acesso_id: 1
    });

    testVistoriador = await Usuario.create({
      cpf: '12345678917',
      nome: 'Test Vistoriador',
      email: 'vist@auth.middleware',
      senha_hash: senhaHash,
      nivel_acesso_id: 2
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

  describe('requireAuth', () => {
    it('deve passar com token válido', async () => {
      const token = jwt.sign(
        { 
          userId: testUser.id, 
          cpf: testUser.cpf,
          email: testUser.email,
          nome: testUser.nome,
          nivelAcesso: 'ADMINISTRADOR',
          nivelAcessoId: 1
        },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(testUser.id);
    });

    it('deve retornar 401 sem token', async () => {
      mockReq.header.mockReturnValue(null);

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ 
        error: 'Token não fornecido.' 
      });
    });

    it('deve retornar 401 com token inválido', async () => {
      mockReq.header.mockReturnValue('Bearer token-invalido');

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('deve retornar 401 se usuário não existir', async () => {
      const token = jwt.sign(
        { 
          userId: 99999, 
          cpf: '99999999999',
          email: 'fake@test.com',
          nome: 'Fake',
          nivelAcesso: 'ADMINISTRADOR',
          nivelAcessoId: 1
        },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('deve retornar 403 se usuário deve atualizar senha', async () => {
      await testUser.update({ deve_atualizar_senha: true });
      
      const token = jwt.sign(
        { 
          userId: testUser.id, 
          cpf: testUser.cpf,
          email: testUser.email,
          nome: testUser.nome,
          nivelAcesso: 'ADMINISTRADOR',
          nivelAcessoId: 1
        },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      
      await testUser.update({ deve_atualizar_senha: false });
    });
  });

  describe('requireAdmin', () => {
    it('deve passar para admin', async () => {
      const token = jwt.sign(
        { 
          userId: testUser.id, 
          cpf: testUser.cpf,
          nivelAcessoId: 1
        },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      await requireAuth(mockReq, mockRes, mockNext);

      await requireAdmin(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('deve retornar 403 para não-admin', async () => {
      const token = jwt.sign(
        { 
          userId: testVistoriador.id, 
          cpf: testVistoriador.cpf,
          nivelAcessoId: 2
        },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      await requireAuth(mockReq, mockRes, mockNext);

      await requireAdmin(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('deve retornar 401 sem usuário', async () => {
      mockReq.user = null;

      await requireAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireVistoriador', () => {
    it('deve passar para admin', async () => {
      const token = jwt.sign(
        { 
          userId: testUser.id, 
          cpf: testUser.cpf,
          nivelAcessoId: 1
        },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      await requireAuth(mockReq, mockRes, mockNext);

      await requireVistoriador(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('deve passar para vistoriador', async () => {
      const token = jwt.sign(
        { 
          userId: testVistoriador.id, 
          cpf: testVistoriador.cpf,
          nivelAcessoId: 2
        },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      await requireAuth(mockReq, mockRes, mockNext);

      await requireVistoriador(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('deve retornar 401 sem usuário', async () => {
      mockReq.user = null;

      await requireVistoriador(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireAuthAllowPasswordUpdate', () => {
    it('deve passar mesmo com deve_atualizar_senha = true', async () => {
      await testUser.update({ deve_atualizar_senha: true });
      
      const token = jwt.sign(
        { 
          userId: testUser.id, 
          cpf: testUser.cpf,
          email: testUser.email,
          nome: testUser.nome,
          nivelAcesso: 'ADMINISTRADOR',
          nivelAcessoId: 1
        },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      await requireAuthAllowPasswordUpdate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      
      await testUser.update({ deve_atualizar_senha: false });
    });
  });
});
