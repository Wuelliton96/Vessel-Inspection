/**
 * Teste completo end-to-end para validar conclusão sem foto
 * Simula o fluxo completo do frontend ao backend
 */

const E2ETestBase = require('../tests/helpers/e2eTestBase');

async function testConcluirSemFotoCompleto() {
  try {
    const testBase = new E2ETestBase();
    const todasValido = await testBase.runCompleteTest({
      testName: 'TESTE COMPLETO: CONCLUIR SEM FOTO',
      itemOptions: { obrigatorio: false },
      validateLists: true
    });

    if (todasValido) {
      console.log('O item não obrigatório pode ser concluído sem foto e sai da lista de pendentes corretamente.');
    }

    process.exit(todasValido ? 0 : 1);
  } catch (error) {
    console.error('Erro no teste:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testConcluirSemFotoCompleto();

