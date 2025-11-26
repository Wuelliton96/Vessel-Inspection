#!/usr/bin/env node

/**
 * Script de teste massivo para imagens em produção
 * Testa todos os cenários possíveis
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.API_URL || 'https://api.vessel-inspection.com.br';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function normalizeUrl(baseUrl, path) {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  const combined = `${cleanBase}/${cleanPath}`;
  return combined.replace(/([^:]\/)\/+/g, '$1');
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Vessel-Inspection-Test/1.0',
        ...options.headers
      }
    };

    if (AUTH_TOKEN) {
      requestOptions.headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          url: res.responseUrl || url
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.timeout) {
      req.setTimeout(options.timeout, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    }

    req.end();
  });
}

async function testImageUrl(fotoId) {
  const tests = [];
  
  // Teste 1: URL normal
  tests.push({
    name: `Foto ${fotoId} - URL normal`,
    url: normalizeUrl(BASE_URL, `/api/fotos/${fotoId}/imagem`)
  });

  // Teste 2: URL com barra dupla (problema comum)
  tests.push({
    name: `Foto ${fotoId} - URL com barra dupla`,
    url: `${BASE_URL}//api/fotos/${fotoId}/imagem`
  });

  // Teste 3: URL com barra final
  tests.push({
    name: `Foto ${fotoId} - URL com barra final`,
    url: `${BASE_URL}/api/fotos/${fotoId}/imagem/`
  });

  // Teste 4: imagem-url endpoint
  tests.push({
    name: `Foto ${fotoId} - Endpoint imagem-url`,
    url: normalizeUrl(BASE_URL, `/api/fotos/${fotoId}/imagem-url`)
  });

  const results = [];
  
  for (const test of tests) {
    try {
      log(`\n🧪 Testando: ${test.name}`, 'cyan');
      log(`   URL: ${test.url}`, 'blue');
      
      const startTime = Date.now();
      const response = await makeRequest(test.url, {
        timeout: 10000,
        headers: {
          'Accept': 'image/*'
        }
      });
      const duration = Date.now() - startTime;

      if (response.status === 200) {
        log(`   ✅ Sucesso (${response.status}) - ${duration}ms`, 'green');
        log(`   Content-Type: ${response.headers['content-type']}`, 'blue');
        log(`   Content-Length: ${response.headers['content-length']} bytes`, 'blue');
        
        // Verificar CORS
        if (response.headers['access-control-allow-origin']) {
          log(`   ✅ CORS configurado: ${response.headers['access-control-allow-origin']}`, 'green');
        } else {
          log(`   ⚠️  CORS não configurado`, 'yellow');
        }
        
        results.push({ test: test.name, status: 'success', statusCode: response.status, duration });
      } else if (response.status === 404) {
        log(`   ⚠️  Foto não encontrada (${response.status})`, 'yellow');
        results.push({ test: test.name, status: 'not_found', statusCode: response.status });
      } else if (response.status === 403) {
        log(`   ⚠️  Acesso negado (${response.status})`, 'yellow');
        results.push({ test: test.name, status: 'forbidden', statusCode: response.status });
      } else {
        log(`   ❌ Erro (${response.status})`, 'red');
        results.push({ test: test.name, status: 'error', statusCode: response.status });
      }
    } catch (error) {
      log(`   ❌ Erro: ${error.message}`, 'red');
      results.push({ test: test.name, status: 'error', error: error.message });
    }
  }

  return results;
}

async function testCORS() {
  log('\n🌐 Testando CORS...', 'cyan');
  
  const origins = [
    'https://vessel-inspection.com.br',
    'https://www.vessel-inspection.com.br',
    'https://app.vessel-inspection.com.br'
  ];

  for (const origin of origins) {
    try {
      const url = normalizeUrl(BASE_URL, '/api/fotos/1/imagem');
      const response = await makeRequest(url, {
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'GET'
        }
      });

      if (response.headers['access-control-allow-origin'] === origin) {
        log(`   ✅ CORS permitido para: ${origin}`, 'green');
      } else {
        log(`   ❌ CORS não permitido para: ${origin}`, 'red');
      }
    } catch (error) {
      log(`   ❌ Erro ao testar CORS para ${origin}: ${error.message}`, 'red');
    }
  }
}

async function runMassiveTests() {
  log('\n🚀 Iniciando testes massivos de imagens em produção', 'cyan');
  log(`   Base URL: ${BASE_URL}`, 'blue');
  log(`   Token: ${AUTH_TOKEN ? 'Configurado' : 'Não configurado'}`, 'blue');

  const allResults = [];

  // Testar múltiplas fotos
  const fotoIds = [1, 2, 25, 999]; // IDs de teste
  
  for (const fotoId of fotoIds) {
    log(`\n📸 Testando foto ID: ${fotoId}`, 'cyan');
    const results = await testImageUrl(fotoId);
    allResults.push(...results);
    
    // Pequeno delay entre testes
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Testar CORS
  await testCORS();

  // Resumo
  log('\n📊 RESUMO DOS TESTES', 'cyan');
  const success = allResults.filter(r => r.status === 'success').length;
  const errors = allResults.filter(r => r.status === 'error').length;
  const notFound = allResults.filter(r => r.status === 'not_found').length;
  const forbidden = allResults.filter(r => r.status === 'forbidden').length;

  log(`   ✅ Sucessos: ${success}`, 'green');
  log(`   ⚠️  Não encontrado: ${notFound}`, 'yellow');
  log(`   ⚠️  Acesso negado: ${forbidden}`, 'yellow');
  log(`   ❌ Erros: ${errors}`, errors > 0 ? 'red' : 'green');

  if (errors === 0 && success > 0) {
    log('\n✅ Todos os testes passaram!', 'green');
    process.exit(0);
  } else {
    log('\n❌ Alguns testes falharam', 'red');
    process.exit(1);
  }
}

// Executar testes
runMassiveTests().catch(error => {
  log(`\n❌ Erro fatal: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

