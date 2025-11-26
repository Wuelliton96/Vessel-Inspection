/**
 * Teste completo para validar conclusão de item não obrigatório sem foto
 */

const E2ETestBase = require('../tests/helpers/e2eTestBase');

async function testConcluirSemFoto() {
  try {
    const testBase = new E2ETestBase();
    const todasValido = await testBase.runCompleteTest({
      testName: 'TESTE: CONCLUIR ITEM NÃO OBRIGATÓRIO SEM FOTO',
      itemOptions: { obrigatorio: false },
      validateLists: true
    });

    if (todasValido) {
      console.log('A funcionalidade de concluir item não obrigatório sem foto está 100% funcional.');
    }

    process.exit(todasValido ? 0 : 1);
  } catch (error) {
    console.error('Erro no teste:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testConcluirSemFoto();

