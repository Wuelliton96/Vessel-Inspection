const { createRateLimiter, strictRateLimiter, moderateRateLimiter, loginRateLimiter, getRateLimitStats } = require('../../middleware/rateLimiting');

describe('Middleware de Rate Limiting', () => {
  function createMockReqRes(ip = '127.0.0.1', method = 'GET') {
    const req = {
      ip,
      method,
      connection: { remoteAddress: ip },
      headers: { 'x-forwarded-for': null }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      statusCode: 200
    };
    
    const next = jest.fn();
    
    return { req, res, next };
  }
  
  describe('createRateLimiter', () => {
    it('deve criar limiter com opções padrão', () => {
      const limiter = createRateLimiter();
      expect(typeof limiter).toBe('function');
    });
    
    it('deve criar limiter com opções personalizadas', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 10
      });
      expect(typeof limiter).toBe('function');
    });
    
    it('deve permitir requisição dentro do limite', () => {
      const limiter = createRateLimiter({ windowMs: 60000, max: 100 });
      const { req, res, next } = createMockReqRes('192.168.1.1');
      
      limiter(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
    });
    
    it('deve ignorar requisições OPTIONS', () => {
      const limiter = createRateLimiter({ windowMs: 60000, max: 1 });
      const { req, res, next } = createMockReqRes('192.168.1.2', 'OPTIONS');
      
      limiter(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
    
    it('deve adicionar headers de rate limit', () => {
      const limiter = createRateLimiter({ windowMs: 60000, max: 100 });
      const { req, res, next } = createMockReqRes('192.168.1.3');
      
      limiter(req, res, next);
      
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });
    
    it('deve bloquear após exceder limite', () => {
      const limiter = createRateLimiter({ 
        windowMs: 60000, 
        max: 2,
        blockDuration: 1000
      });
      
      const ip = `192.168.2.${Date.now() % 255}`;
      
      // Primeira requisição
      const mock1 = createMockReqRes(ip);
      limiter(mock1.req, mock1.res, mock1.next);
      expect(mock1.next).toHaveBeenCalled();
      
      // Segunda requisição
      const mock2 = createMockReqRes(ip);
      limiter(mock2.req, mock2.res, mock2.next);
      expect(mock2.next).toHaveBeenCalled();
      
      // Terceira requisição (deveria bloquear)
      const mock3 = createMockReqRes(ip);
      limiter(mock3.req, mock3.res, mock3.next);
      
      expect(mock3.res.status).toHaveBeenCalledWith(429);
    });
  });
  
  describe('strictRateLimiter', () => {
    it('deve ser uma função', () => {
      expect(typeof strictRateLimiter).toBe('function');
    });
    
    it('deve permitir requisições dentro do limite', () => {
      const { req, res, next } = createMockReqRes('192.168.3.1');
      
      strictRateLimiter(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
  
  describe('moderateRateLimiter', () => {
    it('deve ser uma função', () => {
      expect(typeof moderateRateLimiter).toBe('function');
    });
    
    it('deve permitir requisições dentro do limite', () => {
      const { req, res, next } = createMockReqRes('192.168.4.1');
      
      moderateRateLimiter(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
  
  describe('loginRateLimiter', () => {
    it('deve ser uma função', () => {
      expect(typeof loginRateLimiter).toBe('function');
    });
    
    it('deve permitir tentativas de login dentro do limite', () => {
      const { req, res, next } = createMockReqRes('192.168.5.1');
      
      loginRateLimiter(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
    
    it('deve ter limite mais restritivo (5 requisições)', () => {
      const ip = `192.168.6.${Date.now() % 255}`;
      
      // Simular 6 requisições
      for (let i = 0; i < 5; i++) {
        const { req, res, next } = createMockReqRes(ip);
        loginRateLimiter(req, res, next);
      }
      
      // A 6ª deve ser bloqueada
      const finalMock = createMockReqRes(ip);
      loginRateLimiter(finalMock.req, finalMock.res, finalMock.next);
      
      expect(finalMock.res.status).toHaveBeenCalledWith(429);
    });
  });
  
  describe('getRateLimitStats', () => {
    it('deve retornar estatísticas', () => {
      const stats = getRateLimitStats();
      
      expect(stats).toHaveProperty('activeIPs');
      expect(stats).toHaveProperty('blockedIPs');
      expect(stats).toHaveProperty('topRequesters');
      expect(typeof stats.activeIPs).toBe('number');
      expect(typeof stats.blockedIPs).toBe('number');
      expect(Array.isArray(stats.topRequesters)).toBe(true);
    });
    
    it('deve limitar topRequesters a 10', () => {
      const stats = getRateLimitStats();
      
      expect(stats.topRequesters.length).toBeLessThanOrEqual(10);
    });
    
    it('deve incluir informações de IP nos topRequesters', () => {
      // Fazer algumas requisições primeiro
      const limiter = createRateLimiter({ windowMs: 60000, max: 100 });
      const { req, res, next } = createMockReqRes('192.168.7.1');
      limiter(req, res, next);
      
      const stats = getRateLimitStats();
      
      if (stats.topRequesters.length > 0) {
        expect(stats.topRequesters[0]).toHaveProperty('ip');
        expect(stats.topRequesters[0]).toHaveProperty('requests');
        expect(stats.topRequesters[0]).toHaveProperty('isBlocked');
      }
    });
  });
  
  describe('Cenários de borda', () => {
    it('deve usar x-forwarded-for quando disponível', () => {
      const limiter = createRateLimiter({ windowMs: 60000, max: 100 });
      const req = {
        ip: null,
        method: 'GET',
        connection: { remoteAddress: null },
        headers: { 'x-forwarded-for': '10.0.0.1' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn()
      };
      const next = jest.fn();
      
      limiter(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
    
    it('deve lidar com skip personalizado', () => {
      const limiter = createRateLimiter({
        windowMs: 60000,
        max: 1,
        skip: (req) => req.path === '/health'
      });
      
      const req = {
        ip: '192.168.8.1',
        method: 'GET',
        path: '/health',
        connection: { remoteAddress: '192.168.8.1' },
        headers: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        setHeader: jest.fn()
      };
      const next = jest.fn();
      
      limiter(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
});
