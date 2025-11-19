/**
 * Script para testar a API de auditoria via HTTP
 * Certifique-se que o servidor está rodando em outra janela
 */

const http = require('http');

function testarAPI() {
  console.log('\n[TESTE] TESTANDO API DE AUDITORIA\n');
  console.log('═'.repeat(60));
  console.log('\n[INFO] Certifique-se que o servidor esta rodando!');
  console.log('   Execute em outro terminal: npm start\n');

  // Teste 1: Rota de teste
  console.log('[1] Testando rota /api/auditoria/test...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auditoria/test',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('   [OK] Rota de teste funcionando!');
        console.log('   Resposta:', JSON.parse(data));
      } else {
        console.log('   [ERRO] Erro:', res.statusCode);
        console.log('   Resposta:', data);
      }
      console.log('\n' + '═'.repeat(60));
      console.log('\n[INFO] Para testar com autenticacao:');
      console.log('   1. Faca login no frontend');
      console.log('   2. Acesse /auditoria no menu');
      console.log('   3. Veja os logs no console do backend\n');
    });
  });

  req.on('error', (error) => {
    console.log('\n[ERRO] ERRO AO CONECTAR:');
    console.log('   Mensagem:', error.message);
    console.log('\n[SOLUCAO] Solucao:');
    console.log('   1. Abra outro terminal');
    console.log('   2. cd backend');
    console.log('   3. npm start\n');
  });

  req.end();
}

testarAPI();

