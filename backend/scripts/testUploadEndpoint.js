/**
 * Script para testar o endpoint de upload
 */

const http = require('http');

async function testUploadEndpoint() {
  try {
    console.log('=== TESTE: ENDPOINT DE UPLOAD ===\n');

    const baseUrl = process.env.API_URL || 'http://localhost:3000';
    const endpoint = `${baseUrl}/api/fotos`;

    console.log('Testando endpoint:', endpoint);
    console.log('Verificando se o servidor está respondendo...\n');

    // Testar se o servidor está rodando
    try {
      const healthCheck = await fetch(`${baseUrl}/health`);
      if (healthCheck.ok) {
        console.log('OK: Servidor está rodando');
      } else {
        console.log('ATENCAO: Servidor respondeu mas com status:', healthCheck.status);
      }
    } catch (err) {
      console.log('ERRO: Não foi possível conectar ao servidor:', err.message);
      console.log('Verifique se o backend está rodando em', baseUrl);
      process.exit(1);
    }

    // Testar se a rota existe (sem autenticação, deve retornar 401 ou 403)
    try {
      const response = await fetch(endpoint, {
        method: 'POST'
      });
      
      console.log('Status da resposta (sem auth):', response.status);
      
      if (response.status === 401 || response.status === 403) {
        console.log('OK: Rota existe e requer autenticação');
      } else if (response.status === 404) {
        console.log('ERRO: Rota não encontrada (404)');
      } else {
        console.log('ATENCAO: Status inesperado:', response.status);
      }
    } catch (err) {
      console.log('ERRO ao testar rota:', err.message);
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Erro no teste:', error);
    process.exit(1);
  }
}

testUploadEndpoint();

