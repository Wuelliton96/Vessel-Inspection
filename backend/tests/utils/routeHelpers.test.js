const {
  handleRouteError,
  notFoundResponse,
  validationErrorResponse,
  asyncHandler,
  logRouteStart,
  logRouteEnd,
  getVistoriaIncludes,
  getLaudoIncludes
} = require('../../utils/routeHelpers');

// Mock do console
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('Route Helpers', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('handleRouteError', () => {
    it('deve enviar resposta de erro quando headers não foram enviados', () => {
      const error = new Error('Test error');
      handleRouteError(error, mockRes, 'Erro customizado');

      expect(console.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erro customizado',
        details: 'Test error'
      });
    });

    it('não deve enviar resposta quando headers já foram enviados', () => {
      mockRes.headersSent = true;
      const error = new Error('Test error');
      handleRouteError(error, mockRes);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('não deve incluir details em produção', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      handleRouteError(error, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erro interno do servidor'
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFoundResponse', () => {
    it('deve retornar resposta 404', () => {
      const result = notFoundResponse(mockRes, 'Usuario');

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Usuario não encontrado'
      });
    });

    it('deve usar nome padrão quando não especificado', () => {
      notFoundResponse(mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Recurso não encontrado'
      });
    });

    it('não deve enviar resposta quando headers já foram enviados', () => {
      mockRes.headersSent = true;
      const result = notFoundResponse(mockRes);

      expect(mockRes.status).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('validationErrorResponse', () => {
    it('deve retornar resposta 400', () => {
      validationErrorResponse(mockRes, 'Campo obrigatório');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Campo obrigatório'
      });
    });

    it('não deve enviar resposta quando headers já foram enviados', () => {
      mockRes.headersSent = true;
      validationErrorResponse(mockRes, 'Erro');

      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('asyncHandler', () => {
    it('deve executar handler sem erros', async () => {
      const handler = async (req, res) => {
        res.json({ success: true });
      };

      const wrapped = asyncHandler(handler);
      await wrapped({}, mockRes, jest.fn());

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('deve capturar e tratar erros', async () => {
      const handler = async () => {
        throw new Error('Test error');
      };

      const wrapped = asyncHandler(handler);
      await wrapped({}, mockRes, jest.fn());

      expect(console.error).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('logRouteStart', () => {
    it('deve logar início de rota sem usuário', () => {
      logRouteStart('GET', '/test', {});

      expect(console.log).toHaveBeenCalledWith('=== ROTA GET /test ===');
    });

    it('deve logar início de rota com usuário', () => {
      const req = {
        user: {
          id: 1,
          nome: 'Test User',
          NivelAcesso: { nome: 'ADMIN' }
        }
      };

      logRouteStart('POST', '/test', req);

      expect(console.log).toHaveBeenCalledWith('=== ROTA POST /test ===');
      expect(console.log).toHaveBeenCalledWith('Usuário:', 'Test User', '(ID:', 1, ')');
      expect(console.log).toHaveBeenCalledWith('Nível de acesso:', 'ADMIN');
    });
  });

  describe('logRouteEnd', () => {
    it('deve logar fim de rota com status padrão', () => {
      logRouteEnd('GET', '/test');

      expect(console.log).toHaveBeenCalledWith('=== FIM ROTA GET /test (200) ===\n');
    });

    it('deve logar fim de rota com status customizado', () => {
      logRouteEnd('POST', '/test', 404);

      expect(console.log).toHaveBeenCalledWith('=== FIM ROTA POST /test (404) ===\n');
    });
  });

  describe('getVistoriaIncludes', () => {
    it('deve retornar array de includes', () => {
      const includes = getVistoriaIncludes();

      expect(Array.isArray(includes)).toBe(true);
      expect(includes.length).toBeGreaterThan(0);
    });
  });

  describe('getLaudoIncludes', () => {
    it('deve retornar array de includes', () => {
      const includes = getLaudoIncludes();

      expect(Array.isArray(includes)).toBe(true);
      expect(includes.length).toBeGreaterThan(0);
    });
  });
});

