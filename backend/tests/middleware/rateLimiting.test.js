const {
  createRateLimiter,
  strictRateLimiter,
  moderateRateLimiter,
  loginRateLimiter,
  getRateLimitStats
} = require('../../middleware/rateLimiting');

describe('Rate Limiting Middleware', () => {
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
      setHeader: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('createRateLimiter', () => {
    it('deve permitir requisições dentro do limite', () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 5 });

      for (let i = 0; i < 5; i++) {
        limiter(mockReq, mockRes, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(5);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('deve bloquear requisições acima do limite', () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 2 });

      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext); // Terceira requisição deve ser bloqueada

      expect(mockNext).toHaveBeenCalledTimes(2);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Limite de requisições excedido'
        })
      );
    });

    it('deve ignorar requisições OPTIONS por padrão', () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 1 });
      mockReq.method = 'OPTIONS';

      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext); // Segunda OPTIONS não deve contar

      expect(mockNext).toHaveBeenCalledTimes(2);
    });

    it('deve adicionar headers informativos', () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 10 });

      limiter(mockReq, mockRes, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('deve usar IP de x-forwarded-for quando disponível', () => {
      mockReq.headers['x-forwarded-for'] = '192.168.1.1';
      mockReq.ip = undefined;
      const limiter = createRateLimiter({ windowMs: 1000, max: 1 });

      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });

    it('deve bloquear IP temporariamente após exceder limite', () => {
      const limiter = createRateLimiter({ 
        windowMs: 1000, 
        max: 1,
        blockDuration: 5000
      });

      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext); // Excede limite

      // Tentar novamente imediatamente
      limiter(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'IP temporariamente bloqueado'
        })
      );
    });

    it('deve não contar requisições bem sucedidas quando configurado', () => {
      const limiter = createRateLimiter({ 
        windowMs: 1000, 
        max: 2,
        skipSuccessfulRequests: true
      });

      const originalJson = mockRes.json.bind(mockRes);
      mockRes.json = function(data) {
        mockRes.statusCode = 200;
        return originalJson(data);
      };

      limiter(mockReq, mockRes, mockNext);
      mockRes.json({ success: true }); // Requisição bem sucedida

      limiter(mockReq, mockRes, mockNext);
      mockRes.json({ success: true });

      limiter(mockReq, mockRes, mockNext); // Terceira ainda deve passar

      expect(mockNext).toHaveBeenCalledTimes(3);
    });
  });

  describe('strictRateLimiter', () => {
    it('deve ter limite mais restritivo', () => {
      strictRateLimiter(mockReq, mockRes, mockNext);
      strictRateLimiter(mockReq, mockRes, mockNext);
      strictRateLimiter(mockReq, mockRes, mockNext);
      strictRateLimiter(mockReq, mockRes, mockNext);
      strictRateLimiter(mockReq, mockRes, mockNext);
      strictRateLimiter(mockReq, mockRes, mockNext);
      strictRateLimiter(mockReq, mockRes, mockNext);
      strictRateLimiter(mockReq, mockRes, mockNext);
      strictRateLimiter(mockReq, mockRes, mockNext);
      strictRateLimiter(mockReq, mockRes, mockNext);
      strictRateLimiter(mockReq, mockRes, mockNext); // 11ª deve ser bloqueada

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });

  describe('moderateRateLimiter', () => {
    it('deve permitir mais requisições que strict', () => {
      for (let i = 0; i < 50; i++) {
        moderateRateLimiter(mockReq, mockRes, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(50);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe('loginRateLimiter', () => {
    it('deve ter limite muito restritivo para login', () => {
      for (let i = 0; i < 5; i++) {
        loginRateLimiter(mockReq, mockRes, mockNext);
      }
      loginRateLimiter(mockReq, mockRes, mockNext); // 6ª deve ser bloqueada

      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });

  describe('getRateLimitStats', () => {
    it('deve retornar estatísticas de rate limiting', () => {
      const limiter = createRateLimiter({ windowMs: 1000, max: 10 });
      
      // Fazer algumas requisições
      limiter(mockReq, mockRes, mockNext);
      limiter(mockReq, mockRes, mockNext);

      const stats = getRateLimitStats();

      expect(stats).toHaveProperty('activeIPs');
      expect(stats).toHaveProperty('blockedIPs');
      expect(stats).toHaveProperty('topRequesters');
      expect(Array.isArray(stats.topRequesters)).toBe(true);
    });
  });
});

