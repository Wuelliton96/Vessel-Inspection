'use strict'

// Security: License key deve ser configurada via variável de ambiente
// Nunca usar fallback hardcoded em produção
const getNewRelicLicenseKey = () => {
  const key = process.env.NEW_RELIC_LICENSE_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEW_RELIC_LICENSE_KEY não configurado em produção');
    }
    // Em desenvolvimento, usar chave de exemplo (não funcional)
    return 'dev-license-key-not-for-production';
  }
  return key;
};

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'SGVN-Backend-Production'],
  license_key: getNewRelicLicenseKey(),
  logging: {
    level: 'info',
    enabled: process.env.NODE_ENV === 'production'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  },
  distributed_tracing: {
    enabled: true
  },
  transaction_tracer: {
    enabled: true
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [404]
  },
  application_logging: {
    enabled: true,
    forwarding: {
      enabled: true
    }
  }
}

