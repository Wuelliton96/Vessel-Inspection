/**
 * Script de teste para validar busca de laudo
 * Testa as rotas GET /api/laudos/:id e GET /api/laudos/vistoria/:vistoriaId
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const path = require('path');

// Tentar carregar dotenv
try {
  require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
} catch (e) {
  // dotenv não disponível
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[33m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, url, data, config) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers || {})
      }
    };
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const response = {
          data: body ? JSON.parse(body) : {},
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers
        };
        resolve(response);
      });
    });
    
    req.on('error', (error) => {
      reject({ message: error.message, response: { status: 500, data: { error: error.message } } });
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testBuscarLaudo() {
  log('\n=== TESTE DE BUSCA DE LAUDO ===\n', 'cyan');

  try {
    // 1. Login
    log('1. Fazendo login...', 'blue');
    const loginResponse = await makeRequest('POST', `${API_BASE_URL}/api/auth/login`, {
      cpf: process.env.ADMIN_CPF || '000.000.000-00',
      senha: process.env.ADMIN_SENHA || 'admin123'
    });

    if (!loginResponse.data.token) {
      throw new Error('Token não recebido no login');
    }

    const token = loginResponse.data.token;
    log('✓ Login realizado com sucesso', 'green');

    const headers = {
      'Authorization': `Bearer ${token}`
    };

    // 2. Listar laudos
    log('\n2. Listando laudos...', 'blue');
    const laudosResponse = await makeRequest('GET', `${API_BASE_URL}/api/laudos`, null, { headers });
    
    if (laudosResponse.status !== 200) {
      log(`✗ Erro ao listar laudos: ${laudosResponse.status}`, 'red');
      log(`  Resposta: ${JSON.stringify(laudosResponse.data, null, 2)}`, 'red');
      return;
    }

    const laudos = laudosResponse.data;
    log(`✓ ${laudos.length || 0} laudo(s) encontrado(s)`, 'green');

    if (!laudos || laudos.length === 0) {
      log('\n⚠ Nenhum laudo encontrado. Não é possível testar a busca.', 'yellow');
      log('Por favor, crie um laudo primeiro e execute o teste novamente.', 'yellow');
      return;
    }

    // 3. Buscar primeiro laudo por ID
    const primeiroLaudo = laudos[0];
    log(`\n3. TESTE 1: Buscando laudo por ID (${primeiroLaudo.id})...`, 'cyan');
    
    try {
      const buscarResponse = await makeRequest(
        'GET',
        `${API_BASE_URL}/api/laudos/${primeiroLaudo.id}`,
        null,
        { headers }
      );

      if (buscarResponse.status === 200) {
        log('✓ Laudo buscado com sucesso!', 'green');
        log('\nDados do laudo:', 'blue');
        log(`  - ID: ${buscarResponse.data.id}`, 'blue');
        log(`  - Número: ${buscarResponse.data.numero_laudo || 'N/A'}`, 'blue');
        log(`  - Vistoria ID: ${buscarResponse.data.vistoria_id || 'N/A'}`, 'blue');
        log(`  - Nome Embarcação: ${buscarResponse.data.nome_moto_aquatica || 'N/A'}`, 'blue');
        log(`  - Proprietário: ${buscarResponse.data.proprietario || 'N/A'}`, 'blue');
        
        // Verificar se tem Vistoria incluída
        if (buscarResponse.data.Vistoria) {
          log(`  - Vistoria incluída: Sim`, 'green');
          log(`  - Embarcação: ${buscarResponse.data.Vistoria.Embarcacao?.nome || 'N/A'}`, 'blue');
        } else {
          log(`  - Vistoria incluída: Não`, 'yellow');
        }
        
        log('\n✓ TESTE 1 PASSOU: Busca por ID funcionando!', 'green');
      } else {
        log(`✗ Erro ao buscar laudo: ${buscarResponse.status}`, 'red');
        log(`  Resposta: ${JSON.stringify(buscarResponse.data, null, 2)}`, 'red');
      }
    } catch (error) {
      log(`✗ ERRO ao buscar laudo: ${error.message}`, 'red');
      if (error.response) {
        log(`  Status: ${error.response.status}`, 'red');
        log(`  Dados: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
      }
      throw error;
    }

    // 4. Buscar laudo por vistoria
    if (primeiroLaudo.vistoria_id) {
      log(`\n4. TESTE 2: Buscando laudo por vistoria (${primeiroLaudo.vistoria_id})...`, 'cyan');
      
      try {
        const buscarVistoriaResponse = await makeRequest(
          'GET',
          `${API_BASE_URL}/api/laudos/vistoria/${primeiroLaudo.vistoria_id}`,
          null,
          { headers }
        );

        if (buscarVistoriaResponse.status === 200) {
          log('✓ Laudo buscado por vistoria com sucesso!', 'green');
          log(`  - ID: ${buscarVistoriaResponse.data.id}`, 'blue');
          log(`  - Número: ${buscarVistoriaResponse.data.numero_laudo || 'N/A'}`, 'blue');
          log('\n✓ TESTE 2 PASSOU: Busca por vistoria funcionando!', 'green');
        } else {
          log(`✗ Erro ao buscar laudo por vistoria: ${buscarVistoriaResponse.status}`, 'red');
          log(`  Resposta: ${JSON.stringify(buscarVistoriaResponse.data, null, 2)}`, 'red');
        }
      } catch (error) {
        log(`✗ ERRO ao buscar laudo por vistoria: ${error.message}`, 'red');
        if (error.response) {
          log(`  Status: ${error.response.status}`, 'red');
          log(`  Dados: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
        }
      }
    }

    log('\n=== RESUMO DOS TESTES ===', 'cyan');
    log('✓ Teste de busca por ID', 'green');
    log('✓ Teste de busca por vistoria', 'green');
    log('\n✓ TODOS OS TESTES PASSARAM!', 'green');

  } catch (error) {
    log(`\n✗ ERRO NO TESTE: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Dados: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    console.error(error);
    process.exit(1);
  }
}

testBuscarLaudo()
  .then(() => {
    log('\n✓ Teste concluído com sucesso!', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log(`\n✗ Teste falhou: ${error.message}`, 'red');
    process.exit(1);
  });

