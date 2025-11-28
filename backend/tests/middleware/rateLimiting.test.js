const {
  createRateLimiter,
  strictRateLimiter,
  moderateRateLimiter,
  loginRateLimiter,
  getRateLimitStats
} = require('../../middleware/rateLimiting');

describe('Rate Limiting Middleware - Testes Adicionais', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' },
      headers: {},
      method: 'GET'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      statusCode: 200
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createRateLimiter - Casos Adicionais', () => {
    it('deve resetar contador quando janela expira', async () => {
      const limiter = createRateLimiter({ windowMs: 100, max: 2 });
      
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(2);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledTimes(4);
    });

    it('deve usar connection.remoteAddress quando ip não existe', () => {
      delete mockReq.ip;
      mockReq.connection.remoteAddress = '192.168.1.1';
      
      const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
      
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('deve usar x-forwarded-for quando ip e connection não existem', () => {
      delete mockReq.ip;
      delete mockReq.connection;
      mockReq.headers['x-forwarded-for'] = '10.0.0.1';
      
      const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
      
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('deve remover bloqueio quando expira', async () => {
      const limiter = createRateLimiter({ 
        windowMs: 1000, 
        max: 1,
        blockDuration: 100
      });
      
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      mockRes.status.mockClear();
      limiter(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).not.toHaveBeenCalledWith(429);
    });

    it('deve adicionar headers de rate limit', () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 10 });
      
      limiter(mockReq, mockRes, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('deve calcular remaining corretamente', () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 10 });
      
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);
      
      const remainingCall = mockRes.setHeader.mock.calls.find(call => call[0] === 'X-RateLimit-Remaining');
      expect(remainingCall).toBeDefined();
      expect(remainingCall[1]).toBeLessThanOrEqual(8);
    });
  });

  describe('strictRateLimiter', () => {
    it('deve ter configuração mais restritiva', () => {
      strictRateLimiter(mockReq, mockRes, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
    });
  });

  describe('moderateRateLimiter', () => {
    it('deve ter configuração moderada', () => {
      moderateRateLimiter(mockReq, mockRes, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
    });
  });

  describe('loginRateLimiter', () => {
    it('deve ter configuração restritiva para login', () => {
      loginRateLimiter(mockReq, mockRes, mockNext);
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
    });

    it('deve não contar requisições bem sucedidas', () => {
      const originalJson = mockRes.json.bind(mockRes);
      mockRes.json = function(data) {
        mockRes.statusCode = 200;
        return originalJson(data);
      };

      loginRateLimiter(mockReq, mockRes, mockNext);
      mockRes.json({ success: true });
      
      loginRateLimiter(mockReq, mockRes, mockNext);
      mockRes.json({ success: true });
      
      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRateLimitStats', () => {
    it('deve retornar estatísticas corretas', () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 10 });
      
      limiter(mockReq, mockRes, mockNext);
      
      const stats = getRateLimitStats();
      
      expect(stats).toHaveProperty('activeIPs');
      expect(stats).toHaveProperty('blockedIPs');
      expect(stats).toHaveProperty('topRequesters');
      expect(stats.activeIPs).toBeGreaterThanOrEqual(0);
      expect(stats.blockedIPs).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(stats.topRequesters)).toBe(true);
    });

    it('deve incluir IPs bloqueados nas estatísticas', () => {
      const limiter = createRateLimiter({ 
        windowMs: 1000, 
        max: 1,
        blockDuration: 5000
      });
      
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);
      
      const stats = getRateLimitStats();
      
      expect(stats.blockedIPs).toBeGreaterThanOrEqual(1);
      const blockedIP = stats.topRequesters.find(r => r.isBlocked);
      expect(blockedIP).toBeDefined();
    });
  });
});
