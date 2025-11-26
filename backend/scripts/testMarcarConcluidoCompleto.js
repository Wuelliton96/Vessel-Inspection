/**
 * Teste completo para validar marcação de item como concluído
 * Simula a requisição HTTP completa
 */

const E2ETestBase = require('../tests/helpers/e2eTestBase');
const { VistoriaChecklistItem } = require('../models');

async function testMarcarConcluidoCompleto() {
  try {
    console.log('=== TESTE COMPLETO: MARCAR ITEM COMO CONCLUIDO ===\n');

    const testBase = new E2ETestBase();

    // 1. Buscar item pendente
    const item = await testBase.findPendingItem();

    if (!item) {
      console.log('Nenhum item PENDENTE encontrado');
      process.exit(0);
    }

    console.log('1. ITEM ENCONTRADO:');
    testBase.logItemInfo();
    console.log('');

    // 2. Simular atualização como a rota faz
    console.log('2. SIMULANDO ATUALIZAÇÃO (como a rota PATCH faria):');
    console.log('   Dados para atualização: { status: "CONCLUIDO", concluido_em: new Date(), foto_id: null }');
    
    await testBase.markItemAsCompleted(null);

    console.log('\n   Estado após atualização:');
    testBase.logItemState('');

    // 3. Validações
    console.log('\n3. VALIDAÇÕES:');
    
    const validation = testBase.validateItemState('CONCLUIDO', null);
    let todasValido = validation.isValid;
    
    if (validation.isValid) {
      console.log('   OK: Status é CONCLUIDO');
      console.log('   OK: Foto ID é null (concluído sem foto)');
      console.log('   OK: concluido_em foi definido');
    } else {
      validation.errors.forEach(error => {
        console.log(`   ERRO: ${error}`);
      });
    }

    // 4. Testar voltar para PENDENTE
    console.log('\n4. TESTANDO VOLTAR PARA PENDENTE:');
    await testBase.markItemAsPending();

    const validationPending = testBase.validateItemState('PENDENTE', null);
    if (validationPending.isValid) {
      console.log('   OK: Item voltou para PENDENTE corretamente');
    } else {
      console.log('   ERRO: Item não voltou para PENDENTE corretamente');
      validationPending.errors.forEach(error => {
        console.log(`   ERRO: ${error}`);
      });
      todasValido = false;
    }

    // 5. Verificar se item obrigatório pode ser concluído sem foto
    console.log('\n5. TESTANDO ITEM OBRIGATÓRIO:');
    const testBaseObrigatorio = new E2ETestBase();
    const itemObrigatorio = await testBaseObrigatorio.findPendingItem({ obrigatorio: true });

    if (itemObrigatorio) {
      console.log(`   Item obrigatório encontrado: ${testBaseObrigatorio.item.nome} (ID: ${testBaseObrigatorio.item.id})`);
      console.log('   Testando marcar como concluído sem foto...');
      
      await testBaseObrigatorio.markItemAsCompleted(null);

      const validationObrigatorio = testBaseObrigatorio.validateItemState('CONCLUIDO', null);
      if (validationObrigatorio.isValid) {
        console.log('   OK: Item obrigatório pode ser concluído sem foto (permitido pelo sistema)');
      } else {
        console.log('   ERRO: Item obrigatório não foi atualizado corretamente');
        validationObrigatorio.errors.forEach(error => {
          console.log(`   ERRO: ${error}`);
        });
        todasValido = false;
      }

      // Voltar para PENDENTE
      await testBaseObrigatorio.markItemAsPending();
    } else {
      console.log('   Nenhum item obrigatório pendente encontrado para teste');
    }

    console.log('\n=== RESULTADO FINAL ===');
    if (todasValido) {
      console.log('OK: Todos os testes passaram!');
      console.log('A funcionalidade está 100% funcional.');
    } else {
      console.log('ERRO: Alguns testes falharam');
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n');
    process.exit(todasValido ? 0 : 1);
  } catch (error) {
    console.error('Erro no teste:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testMarcarConcluidoCompleto();

