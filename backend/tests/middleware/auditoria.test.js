const { 
  registrarAuditoria, 
  auditoriaMiddleware, 
  salvarDadosOriginais 
} = require('../../middleware/auditoria');
const { AuditoriaLog } = require('../../models');

// Mock do console.log e console.error
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

describe('Auditoria Middleware', () => {
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

  describe('registrarAuditoria', () => {
    it('deve registrar auditoria com sucesso', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});

      await registrarAuditoria({
        req: mockReq,
        acao: 'CREATE',
        entidade: 'Usuario',
        entidadeId: 1,
        dadosNovos: { nome: 'Test' }
      });

      expect(createSpy).toHaveBeenCalled();
      expect(createSpy.mock.calls[0][0]).toMatchObject({
        usuario_id: 1,
        usuario_email: 'test@example.com',
        usuario_nome: 'Test User',
        acao: 'CREATE',
        entidade: 'Usuario',
        entidade_id: 1,
        ip_address: '127.0.0.1'
      });

      createSpy.mockRestore();
    });

    it('deve sanitizar dados sensíveis', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});

      await registrarAuditoria({
        req: mockReq,
        acao: 'UPDATE',
        entidade: 'Usuario',
        dadosAnteriores: { senha: '123456', senha_hash: 'hash' },
        dadosNovos: { senha: '654321', password: 'pass' }
      });

      const callArgs = createSpy.mock.calls[0][0];
      const dadosAnteriores = JSON.parse(callArgs.dados_anteriores);
      const dadosNovos = JSON.parse(callArgs.dados_novos);

      expect(dadosAnteriores.senha).toBeUndefined();
      expect(dadosAnteriores.senha_hash).toBeUndefined();
      expect(dadosNovos.senha).toBeUndefined();
      expect(dadosNovos.password).toBeUndefined();

      createSpy.mockRestore();
    });

    it('deve usar valores padrão quando req.user não existe', async () => {
      mockReq.user = null;
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});

      await registrarAuditoria({
        req: mockReq,
        acao: 'DELETE',
        entidade: 'Test'
      });

      expect(createSpy.mock.calls[0][0]).toMatchObject({
        usuario_id: null,
        usuario_email: 'sistema',
        usuario_nome: 'Sistema'
      });

      createSpy.mockRestore();
    });

    it('deve tratar erro sem quebrar aplicação', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockRejectedValue(new Error('DB Error'));

      await expect(registrarAuditoria({
        req: mockReq,
        acao: 'CREATE',
        entidade: 'Test'
      })).resolves.not.toThrow();

      expect(console.error).toHaveBeenCalled();

      createSpy.mockRestore();
    });
  });

  describe('auditoriaMiddleware', () => {
    it('deve registrar auditoria quando res.json é chamado com sucesso', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});
      const middleware = auditoriaMiddleware('CREATE', 'Test');

      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();

      // Simular resposta bem sucedida
      mockRes.json({ success: true });

      // Aguardar um pouco para o registro assíncrono
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(createSpy).toHaveBeenCalled();
      createSpy.mockRestore();
    });

    it('deve registrar auditoria quando res.send é chamado com sucesso', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});
      const middleware = auditoriaMiddleware('UPDATE', 'Test');

      await middleware(mockReq, mockRes, mockNext);
      mockRes.send('OK');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(createSpy).toHaveBeenCalled();
      createSpy.mockRestore();
    });

    it('não deve registrar auditoria para status de erro', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});
      const middleware = auditoriaMiddleware('DELETE', 'Test');

      await middleware(mockReq, mockRes, mockNext);
      mockRes.statusCode = 400;
      mockRes.json({ error: 'Bad Request' });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(createSpy).not.toHaveBeenCalled();
      createSpy.mockRestore();
    });

    it('não deve registrar auditoria duas vezes', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});
      const middleware = auditoriaMiddleware('CREATE', 'Test');

      await middleware(mockReq, mockRes, mockNext);
      mockRes.json({ success: true });
      mockRes.send('OK'); // Segunda chamada não deve registrar novamente

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(createSpy).toHaveBeenCalledTimes(1);
      createSpy.mockRestore();
    });

    it('deve usar entidadeId de params ou body', async () => {
      const createSpy = jest.spyOn(AuditoriaLog, 'create').mockResolvedValue({});
      mockReq.params.id = 123;
      const middleware = auditoriaMiddleware('UPDATE', 'Test');

      await middleware(mockReq, mockRes, mockNext);
      mockRes.json({ success: true });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(createSpy.mock.calls[0][0].entidade_id).toBe(123);
      createSpy.mockRestore();
    });
  });

  describe('salvarDadosOriginais', () => {
    const MockModel = {
      findByPk: jest.fn()
    };

    it('deve salvar dados originais quando id existe', async () => {
      const mockData = { id: 1, nome: 'Original' };
      MockModel.findByPk.mockResolvedValue({
        toJSON: () => mockData
      });
      mockReq.params.id = '1';

      const middleware = salvarDadosOriginais(MockModel);
      await middleware(mockReq, mockRes, mockNext);

      expect(MockModel.findByPk).toHaveBeenCalledWith('1');
      expect(mockReq.originalData).toEqual(mockData);
      expect(mockNext).toHaveBeenCalled();
    });

    it('deve continuar sem dados originais quando id não existe', async () => {
      mockReq.params = {};
      const middleware = salvarDadosOriginais(MockModel);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.originalData).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('deve tratar erro sem quebrar aplicação', async () => {
      MockModel.findByPk.mockRejectedValue(new Error('DB Error'));
      mockReq.params.id = '1';

      const middleware = salvarDadosOriginais(MockModel);
      await middleware(mockReq, mockRes, mockNext);

      expect(console.error).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

