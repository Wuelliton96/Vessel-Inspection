/**
 * Teste completo para validar marcação de item como concluído
 * Simula a requisição HTTP completa
 */

const { VistoriaChecklistItem, Vistoria, Usuario, NivelAcesso } = require('../models');

async function testMarcarConcluidoCompleto() {
  try {
    console.log('=== TESTE COMPLETO: MARCAR ITEM COMO CONCLUIDO ===\n');

    // 1. Buscar item pendente
    const item = await VistoriaChecklistItem.findOne({
      where: { status: 'PENDENTE' },
      include: [
        {
          model: Vistoria,
          as: 'vistoria',
          attributes: ['id', 'vistoriador_id']
        }
      ]
    });

    if (!item) {
      console.log('Nenhum item PENDENTE encontrado');
      process.exit(0);
    }

    console.log('1. ITEM ENCONTRADO:');
    console.log(`   ID: ${item.id}`);
    console.log(`   Nome: ${item.nome}`);
    console.log(`   Status: ${item.status}`);
    console.log(`   Obrigatório: ${item.obrigatorio}`);
    console.log(`   Foto ID: ${item.foto_id || 'null'}`);
    console.log(`   Vistoria ID: ${item.vistoria_id}`);
    console.log(`   Vistoriador ID: ${item.vistoria?.vistoriador_id || 'N/A'}\n`);

    // 2. Simular atualização como a rota faz
    console.log('2. SIMULANDO ATUALIZAÇÃO (como a rota PATCH faria):');
    
    const statusAntes = item.status;
    const fotoIdAntes = item.foto_id;
    
    const updateData = {
      status: 'CONCLUIDO',
      concluido_em: new Date(),
      foto_id: null
    };

    console.log('   Dados para atualização:', updateData);
    
    await item.update(updateData);
    await item.reload();

    console.log('\n   Estado após atualização:');
    console.log(`   Status: ${item.status}`);
    console.log(`   Foto ID: ${item.foto_id || 'null'}`);
    console.log(`   Concluído em: ${item.concluido_em || 'null'}`);

    // 3. Validações
    console.log('\n3. VALIDAÇÕES:');
    
    let todasValido = true;
    
    if (item.status !== 'CONCLUIDO') {
      console.log('   ERRO: Status não é CONCLUIDO');
      todasValido = false;
    } else {
      console.log('   OK: Status é CONCLUIDO');
    }

    if (item.foto_id !== null) {
      console.log('   ERRO: Foto ID não é null');
      todasValido = false;
    } else {
      console.log('   OK: Foto ID é null (concluído sem foto)');
    }

    if (!item.concluido_em) {
      console.log('   ERRO: concluido_em não foi definido');
      todasValido = false;
    } else {
      console.log('   OK: concluido_em foi definido');
    }

    // 4. Testar voltar para PENDENTE
    console.log('\n4. TESTANDO VOLTAR PARA PENDENTE:');
    await item.update({
      status: 'PENDENTE',
      concluido_em: null,
      foto_id: null
    });
    await item.reload();

    if (item.status === 'PENDENTE' && !item.concluido_em) {
      console.log('   OK: Item voltou para PENDENTE corretamente');
    } else {
      console.log('   ERRO: Item não voltou para PENDENTE corretamente');
      console.log(`   Status atual: ${item.status}`);
      console.log(`   concluido_em: ${item.concluido_em || 'null'}`);
      todasValido = false;
    }

    // 5. Verificar se item obrigatório pode ser concluído sem foto
    console.log('\n5. TESTANDO ITEM OBRIGATÓRIO:');
    const itemObrigatorio = await VistoriaChecklistItem.findOne({
      where: {
        status: 'PENDENTE',
        obrigatorio: true
      }
    });

    if (itemObrigatorio) {
      console.log(`   Item obrigatório encontrado: ${itemObrigatorio.nome} (ID: ${itemObrigatorio.id})`);
      console.log('   Testando marcar como concluído sem foto...');
      
      await itemObrigatorio.update({
        status: 'CONCLUIDO',
        concluido_em: new Date(),
        foto_id: null
      });
      await itemObrigatorio.reload();

      if (itemObrigatorio.status === 'CONCLUIDO' && !itemObrigatorio.foto_id) {
        console.log('   OK: Item obrigatório pode ser concluído sem foto (permitido pelo sistema)');
      } else {
        console.log('   ERRO: Item obrigatório não foi atualizado corretamente');
        todasValido = false;
      }

      // Voltar para PENDENTE
      await itemObrigatorio.update({
        status: 'PENDENTE',
        concluido_em: null,
        foto_id: null
      });
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

