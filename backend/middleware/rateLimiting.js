/**
 * Middleware de Rate Limiting para proteger contra ataques
 * Limita o número de requisições por IP em um determinado período
 */

// Armazenar contadores em memória (em produção, considere usar Redis)
const requestCounts = new Map();
const blockedIPs = new Map();

/**
 * Limpa contadores antigos periodicamente
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.resetTime > data.windowMs) {
      requestCounts.delete(ip);
    }
  }
  
  // Limpar IPs bloqueados após o período de bloqueio
  for (const [ip, blockedUntil] of blockedIPs.entries()) {
    if (now > blockedUntil) {
      blockedIPs.delete(ip);
    }
  }
}, 60000); // Limpar a cada 1 minuto

/**
 * Cria um middleware de rate limiting
 * @param {Object} options - Opções de configuração
 * @param {number} options.windowMs - Janela de tempo em ms (padrão: 15 minutos)
 * @param {number} options.max - Número máximo de requisições na janela (padrão: 100)
 * @param {number} options.blockDuration - Duração do bloqueio em ms ao exceder (padrão: 1 hora)
 * @param {string} options.message - Mensagem de erro personalizada
 * @param {boolean} options.skipSuccessfulRequests - Não contar requisições bem sucedidas
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutos
    max = 100, // 100 requisições
    skip = (req) => req.method === 'OPTIONS', // Ignorar OPTIONS por padrão
    blockDuration = 60 * 60 * 1000, // 1 hora de bloqueio
    message = 'Muitas requisições deste IP. Tente novamente mais tarde.',
    skipSuccessfulRequests = false
  } = options;

  return (req, res, next) => {
    // Ignorar requisições OPTIONS (preflight CORS) - não contar no rate limit
    if (skip && skip(req)) {
      return next();
    }
    
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const now = Date.now();

    // Verificar se IP está bloqueado
    if (blockedIPs.has(ip)) {
      const blockedUntil = blockedIPs.get(ip);
      if (now < blockedUntil) {
        const remainingMinutes = Math.ceil((blockedUntil - now) / 60000);
        console.warn(`[RATE LIMIT] IP bloqueado tentou acessar: ${ip}`);
        return res.status(429).json({ 
          error: 'IP temporariamente bloqueado',
          message: `Seu IP foi bloqueado devido a excesso de requisições. Tente novamente em ${remainingMinutes} minutos.`,
          retryAfter: remainingMinutes
        });
      } else {
        // Bloqueio expirou
        blockedIPs.delete(ip);
      }
    }

    // Inicializar contador para o IP se não existir
    if (!requestCounts.has(ip)) {
      requestCounts.set(ip, {
        count: 0,
        resetTime: now,
        windowMs
      });
    }

    const requestData = requestCounts.get(ip);

    // Resetar contador se a janela expirou
    if (now - requestData.resetTime > windowMs) {
      requestData.count = 0;
      requestData.resetTime = now;
    }

    // Incrementar contador
    requestData.count++;

    // Verificar se excedeu o limite
    if (requestData.count > max) {
      // Bloquear IP
      blockedIPs.set(ip, now + blockDuration);
      console.error(`[RATE LIMIT] IP bloqueado por excesso de requisições: ${ip}`);
      
      return res.status(429).json({ 
        error: 'Limite de requisições excedido',
        message: `Você excedeu o limite de ${max} requisições. Seu IP foi bloqueado temporariamente.`,
        retryAfter: Math.ceil(blockDuration / 60000)
      });
    }

    // Adicionar headers informativos
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - requestData.count));
    res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime + windowMs).toISOString());

    // Log de aviso quando estiver próximo do limite
    if (requestData.count > max * 0.8) {
      console.warn(`[RATE LIMIT] IP próximo do limite: ${ip} (${requestData.count}/${max})`);
    }

    // Se configurado para não contar requisições bem sucedidas
    if (skipSuccessfulRequests) {
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        if (res.statusCode < 400) {
          requestData.count--;
        }
        return originalJson(data);
      };
    }

    next();
  };
}

/**
 * Rate limiter estrito para operações críticas (deletar, modificar em massa, etc)
 */
const strictRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // Apenas 10 operações críticas em 5 minutos
  blockDuration: 2 * 60 * 60 * 1000, // 2 horas de bloqueio
  message: 'Limite de operações críticas excedido'
});

/**
 * Rate limiter moderado para operações normais
 */
const moderateRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  blockDuration: 60 * 60 * 1000, // 1 hora
  message: 'Muitas requisições. Tente novamente mais tarde.'
});

/**
 * Rate limiter para login (mais restritivo para prevenir brute force)
 */
const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Apenas 5 tentativas de login
  blockDuration: 30 * 60 * 1000, // 30 minutos de bloqueio
  message: 'Muitas tentativas de login. Tente novamente mais tarde.',
  skipSuccessfulRequests: true // Não contar logins bem sucedidos
});

/**
 * Obter estatísticas de rate limiting (útil para dashboard de admin)
 */
function getRateLimitStats() {
  const stats = {
    activeIPs: requestCounts.size,
    blockedIPs: blockedIPs.size,
    topRequesters: []
  };

  // Ordenar IPs por número de requisições
  const sorted = Array.from(requestCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  stats.topRequesters = sorted.map(([ip, data]) => ({
    ip,
    requests: data.count,
    isBlocked: blockedIPs.has(ip)
  }));

  return stats;
}

module.exports = {
  createRateLimiter,
  strictRateLimiter,
  moderateRateLimiter,
  loginRateLimiter,
  getRateLimitStats
};

