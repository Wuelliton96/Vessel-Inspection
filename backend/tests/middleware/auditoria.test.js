const { 
  registrarAuditoria, 
  auditoriaMiddleware, 
  salvarDadosOriginais 
} = require('../../middleware/auditoria');
const { AuditoriaLog } = require('../../models');

const originalConsole = global.console;
beforeAll(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn()
  };
});

afterAll(() => {
  global.console = originalConsole;
});

describe('Auditoria Middleware - Testes Adicionais', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      user: {
        id: 1,
        email: 'test@example.com',
        nome: 'Test User'
      },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      headers: {},
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      params: {},
      body: {},
      originalData: null
    };
    mockRes = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('registrarAuditoria - Casos Adicionais', () => {
    it('deve usar IP de x-forwarded-for quando disponível', async () => {
      mockReq.headers['x-forwarded-for'] = '192.168.1.1';
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});

      await registrarAuditoria({
        req: mockReq,
        acao: 'CREATE',
        entidade: 'Test'
      });

      expect(createSpy.mock.calls[0][0].ip_address).toBe('192.168.1.1');
      createSpy.mockRestore();
    });

    it('deve usar connection.remoteAddress quando ip não existe', async () => {
      delete mockReq.ip;
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});

      await registrarAuditoria({
        req: mockReq,
        acao: 'CREATE',
        entidade: 'Test'
      });

      expect(createSpy.mock.calls[0][0].ip_address).toBe('127.0.0.1');
      createSpy.mockRestore();
    });

    it('deve incluir user_agent na auditoria', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});

      await registrarAuditoria({
        req: mockReq,
        acao: 'CREATE',
        entidade: 'Test'
      });

      expect(createSpy.mock.calls[0][0].user_agent).toBe('Mozilla/5.0');
      createSpy.mockRestore();
    });

    it('deve incluir nivel_critico quando fornecido', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});

      await registrarAuditoria({
        req: mockReq,
        acao: 'DELETE',
        entidade: 'Usuario',
        nivelCritico: true
      });

      expect(createSpy.mock.calls[0][0].nivel_critico).toBe(true);
      createSpy.mockRestore();
    });

    it('deve incluir detalhes quando fornecidos', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});

      await registrarAuditoria({
        req: mockReq,
        acao: 'UPDATE',
        entidade: 'Test',
        detalhes: 'Detalhes importantes'
      });

      expect(createSpy.mock.calls[0][0].detalhes).toBe('Detalhes importantes');
      createSpy.mockRestore();
    });
  });

  describe('auditoriaMiddleware - Casos Adicionais', () => {
    it('deve usar entidadeId de body quando params.id não existe', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});
      mockReq.body.id = 456;
      const middleware = auditoriaMiddleware('UPDATE', 'Test');

      await middleware(mockReq, mockRes, mockNext);
      mockRes.json({ success: true });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(createSpy.mock.calls[0][0].entidade_id).toBe(456);
      createSpy.mockRestore();
    });

    it('deve usar dadosAnteriores das opções quando disponível', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});
      const dadosAnteriores = { nome: 'Antigo' };
      const middleware = auditoriaMiddleware('UPDATE', 'Test', {
        dadosAnteriores
      });

      await middleware(mockReq, mockRes, mockNext);
      mockRes.json({ success: true });

      await new Promise(resolve => setTimeout(resolve, 100));

      const callArgs = createSpy.mock.calls[0][0];
      expect(callArgs.dados_anteriores).toBeDefined();
      createSpy.mockRestore();
    });

    it('deve usar dadosNovos das opções quando disponível', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});
      const dadosNovos = { nome: 'Novo' };
      const middleware = auditoriaMiddleware('CREATE', 'Test', {
        dadosNovos
      });

      await middleware(mockReq, mockRes, mockNext);
      mockRes.json({ success: true });

      await new Promise(resolve => setTimeout(resolve, 100));

      const callArgs = createSpy.mock.calls[0][0];
      expect(callArgs.dados_novos).toBeDefined();
      createSpy.mockRestore();
    });
  });

  describe('salvarDadosOriginais - Casos Adicionais', () => {
    it('deve lidar com registro não encontrado', async () => {
      const MockModel = {
        findByPk: jest.fn().mockResolvedValue(null)
      };
      mockReq.params.id = '1';

      const middleware = salvarDadosOriginais(MockModel);
      await middleware(mockReq, mockRes, mockNext);

      expect(MockModel.findByPk).toHaveBeenCalledWith('1');
      expect(mockReq.originalData).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('deve lidar com registro sem método toJSON', async () => {
      const MockModel = {
        findByPk: jest.fn().mockResolvedValue({
          id: 1,
          nome: 'Test'
        })
      };
      mockReq.params.id = '1';

      const middleware = salvarDadosOriginais(MockModel);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
