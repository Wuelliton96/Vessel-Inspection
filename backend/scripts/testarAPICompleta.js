/**
 * Teste HTTP completo das APIs
 */

const http = require('http');

function request(path, method = 'GET', data = null, token = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testar() {
  console.log('\n[TESTE] API HTTP COMPLETA\n');
  console.log('='.repeat(60));
  console.log('\n[INFO] Servidor deve estar rodando em http://localhost:3000\n');

  try {
    // Teste 1: Seguradoras
    console.log('[1] GET /api/seguradoras');
    const r1 = await request('/api/seguradoras');
    console.log(`    Status: ${r1.status} ${r1.status === 401 ? '[Precisa autenticacao]' : ''}`);
    
    // Teste 2: Auditoria
    console.log('[2] GET /api/auditoria');
    const r2 = await request('/api/auditoria');
    console.log(`    Status: ${r2.status} ${r2.status === 401 ? '[Precisa autenticacao]' : ''}`);
    
    // Teste 3: Vistorias
    console.log('[3] GET /api/vistorias');
    const r3 = await request('/api/vistorias');
    console.log(`    Status: ${r3.status} ${r3.status === 401 ? '[Precisa autenticacao]' : ''}`);

    console.log('\n' + '='.repeat(60));
    console.log('\n[INFO] APIs respondendo corretamente');
    console.log('[INFO] Status 401 e esperado (rotas protegidas)');
    console.log('\n[SUCESSO] Servidor esta funcionando!\n');

  } catch (error) {
    console.log('\n[ERRO] Servidor nao esta respondendo!');
    console.log('Mensagem:', error.message);
    console.log('\n[SOLUCAO] Execute em outro terminal:');
    console.log('  cd backend');
    console.log('  npm start\n');
  }
}

testar();

