const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { requireAuth, requireAdmin, requireVistoriador, requireAuthAllowPasswordUpdate } = require('../../middleware/auth');
const { Usuario, NivelAcesso, sequelize } = require('../../models');
const { generateTestCPF } = require('../helpers/testHelpers');

describe('Auth Middleware - Testes Adicionais', () => {
  let mockReq, mockRes, mockNext;
  let testUser, testVistoriador, testCliente;

  beforeAll(async () => {
    const { setupTestEnvironment } = require('../helpers/testHelpers');
    const { nivelAdmin, nivelVistoriador, nivelCliente } = await setupTestEnvironment();
    
    const senhaHash = await bcrypt.hash('Teste@123', 10);
    
    testUser = await Usuario.create({
      cpf: generateTestCPF('auth20'),
      nome: 'Test Admin',
      email: 'admin@auth.test',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAdmin.id
    });

    testVistoriador = await Usuario.create({
      cpf: generateTestCPF('auth21'),
      nome: 'Test Vistoriador',
      email: 'vist@auth.test',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelVistoriador.id
    });

    if (nivelCliente) {
      testCliente = await Usuario.create({
        cpf: generateTestCPF('auth22'),
        nome: 'Test Cliente',
        email: 'cliente@auth.test',
        senha_hash: senhaHash,
        nivel_acesso_id: nivelCliente.id
      });
    }
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
      json: jest.fn(),
      headersSent: false
    };
    mockNext = jest.fn();
  });

  describe('requireAuth - Casos Adicionais', () => {
    it('deve tratar erro quando headersSent é true', async () => {
      mockRes.headersSent = true;
      const token = jwt.sign(
        { userId: testUser.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('deve tratar token sem Bearer prefix', async () => {
      const token = jwt.sign(
        { userId: testUser.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      mockReq.header.mockReturnValue(token);

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('deve tratar token expirado', async () => {
      const token = jwt.sign(
        { userId: testUser.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt',
        { expiresIn: '-1h' }
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      await requireAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireVistoriador - Casos Adicionais', () => {
    it('deve retornar 403 para cliente', async () => {
      if (!testCliente) return;

      const token = jwt.sign(
        { userId: testCliente.id },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);
      await requireAuth(mockReq, mockRes, mockNext);

      await requireVistoriador(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    it('deve tratar erro quando NivelAcesso não existe', async () => {
      mockReq.user = { id: 1, NivelAcesso: null };

      await requireVistoriador(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('requireAdmin - Casos Adicionais', () => {
    it('deve tratar erro quando NivelAcesso não existe', async () => {
      mockReq.user = { id: 1, NivelAcesso: null };

      await requireAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('deve tratar erro quando headersSent é true', async () => {
      mockRes.headersSent = true;
      mockReq.user = { id: 1, NivelAcesso: { id: 2 } };

      await requireAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('requireAuthAllowPasswordUpdate - Casos Adicionais', () => {
    it('deve passar mesmo com token inválido inicialmente', async () => {
      mockReq.header.mockReturnValue(null);

      await requireAuthAllowPasswordUpdate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('deve tratar erro quando usuário não existe', async () => {
      const token = jwt.sign(
        { userId: 99999 },
        process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
      );

      mockReq.header.mockReturnValue(`Bearer ${token}`);

      await requireAuthAllowPasswordUpdate(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});
