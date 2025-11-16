/**
 * Script para testar API de seguradoras via HTTP
 * IMPORTANTE: O servidor deve estar rodando em outra janela
 */

const http = require('http');

// Simular token de admin (você deve pegar um token real fazendo login)
const TOKEN = process.argv[2] || '';

function fazerRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData ? JSON.parse(responseData) : null
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testarAPI() {
  console.log('\n[TESTE] TESTANDO API DE SEGURADORAS\n');
  console.log('='.repeat(60));

  if (!TOKEN) {
    console.log('\n[AVISO] Token nao fornecido. Alguns testes podem falhar.');
    console.log('[INFO] Para testar com autenticacao:');
    console.log('  1. Faca login no frontend');
    console.log('  2. Pegue o token do localStorage');
    console.log('  3. Execute: node scripts/testarAPISeguradoras.js SEU_TOKEN\n');
  }

  console.log('[INFO] Certifique-se que o servidor esta rodando (npm start)\n');

  try {
    // Teste 1: Listar seguradoras
    console.log('[1] Testando GET /api/seguradoras...');
    const result1 = await fazerRequest('/api/seguradoras');
    
    if (result1.status === 200) {
      console.log(`   [OK] ${result1.data.length} seguradoras encontradas`);
      result1.data.slice(0, 3).forEach(seg => {
        console.log(`      - ${seg.nome} (${seg.tiposPermitidos.length} tipos)`);
      });
    } else if (result1.status === 401) {
      console.log('   [AVISO] Nao autenticado (401)');
    } else {
      console.log(`   [ERRO] Status: ${result1.status}`);
    }

    // Teste 2: Buscar seguradora específica
    console.log('\n[2] Testando GET /api/seguradoras/1...');
    const result2 = await fazerRequest('/api/seguradoras/1');
    
    if (result2.status === 200) {
      console.log(`   [OK] Seguradora: ${result2.data.nome}`);
      console.log(`       Tipos: ${result2.data.tiposPermitidos.length}`);
    } else if (result2.status === 401) {
      console.log('   [AVISO] Nao autenticado (401)');
    } else {
      console.log(`   [ERRO] Status: ${result2.status}`);
    }

    // Teste 3: Listar apenas ativas
    console.log('\n[3] Testando GET /api/seguradoras?ativo=true...');
    const result3 = await fazerRequest('/api/seguradoras?ativo=true');
    
    if (result3.status === 200) {
      console.log(`   [OK] ${result3.data.length} seguradoras ativas`);
    } else {
      console.log(`   [ERRO] Status: ${result3.status}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n[INFO] Testes basicos concluidos!');
    console.log('\n[PROXIMOS PASSOS]');
    console.log('  1. Teste no navegador: http://localhost:3001/seguradoras');
    console.log('  2. Verifique se consegue criar/editar seguradoras');
    console.log('  3. Verifique o console do backend por erros\n');

  } catch (error) {
    console.log('\n[ERRO] Erro ao conectar:');
    console.log('   Mensagem:', error.message);
    console.log('\n[SOLUCAO]');
    console.log('   1. Abra outro terminal');
    console.log('   2. cd backend');
    console.log('   3. npm start\n');
  }
}

testarAPI();

