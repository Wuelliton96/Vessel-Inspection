const { errorHandler, asyncHandler } = require('../../middleware/errorHandler');
const logger = require('../../utils/logger');

// Mock do logger
jest.mock('../../utils/logger', () => ({
  error: jest.fn()
}));

describe('Error Handler Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      path: '/test',
      method: 'GET',
      user: { id: 1 }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('deve tratar erro de validação do Sequelize', () => {
      const error = {
        name: 'SequelizeValidationError',
        errors: [
          { message: 'Campo obrigatório' },
          { message: 'Valor inválido' }
        ]
      };

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erro de validação',
        details: ['Campo obrigatório', 'Valor inválido']
      });
    });

    it('deve tratar erro de constraint única do Sequelize', () => {
      const error = {
        name: 'SequelizeUniqueConstraintError'
      };

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Violação de constraint única',
        message: 'Já existe um registro com esses dados'
      });
    });

    it('deve tratar erro de banco de dados do Sequelize', () => {
      const error = {
        name: 'SequelizeDatabaseError'
      };

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erro no banco de dados',
        message: 'Erro interno do servidor'
      });
    });

    it('deve tratar erro de JWT inválido', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'Token inválido'
      };

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token inválido'
      });
    });

    it('deve tratar erro de token expirado', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'Token expirado'
      };

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Token expirado'
      });
    });

    it('deve tratar erro genérico em produção', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = {
        message: 'Erro específico',
        statusCode: 500
      };

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erro interno do servidor'
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('deve tratar erro genérico em desenvolvimento', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = {
        message: 'Erro específico',
        statusCode: 500
      };

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(logger.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erro específico'
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('deve usar statusCode do erro se disponível', () => {
      const error = {
        message: 'Erro customizado',
        statusCode: 404
      };

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('asyncHandler', () => {
    it('deve executar função async sem erros', async () => {
      const asyncFn = async (req, res, next) => {
        res.json({ success: true });
      };

      const handler = asyncHandler(asyncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('deve capturar erro e passar para next', async () => {
      const asyncFn = async (req, res, next) => {
        throw new Error('Erro de teste');
      };

      const handler = asyncHandler(asyncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('deve funcionar com função síncrona', async () => {
      const syncFn = (req, res, next) => {
        res.json({ success: true });
      };

      const handler = asyncHandler(syncFn);
      await handler(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });
  });
});

