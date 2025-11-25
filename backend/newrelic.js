'use strict'

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'SGVN-Backend-Production'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY || '8e63814058ad11aa968515539c3994a7FFFFNRAL',
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

