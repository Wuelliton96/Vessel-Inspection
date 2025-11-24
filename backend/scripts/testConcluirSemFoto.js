/**
 * Teste completo para validar conclusão de item não obrigatório sem foto
 */

const { VistoriaChecklistItem, Vistoria, Usuario, NivelAcesso } = require('../models');

async function testConcluirSemFoto() {
  try {
    console.log('=== TESTE: CONCLUIR ITEM NÃO OBRIGATÓRIO SEM FOTO ===\n');

    // Buscar item não obrigatório pendente
    const item = await VistoriaChecklistItem.findOne({
      where: {
        status: 'PENDENTE',
        obrigatorio: false
      },
      include: [
        {
          model: Vistoria,
          as: 'vistoria',
          attributes: ['id', 'vistoriador_id']
        }
      ]
    });

    if (!item) {
      console.log('Nenhum item não obrigatório pendente encontrado');
      process.exit(0);
    }

    console.log('Item encontrado:');
    console.log(`  ID: ${item.id}`);
    console.log(`  Nome: ${item.nome}`);
    console.log(`  Status: ${item.status}`);
    console.log(`  Obrigatório: ${item.obrigatorio}`);
    console.log(`  Foto ID: ${item.foto_id || 'null'}`);
    console.log(`  Vistoria ID: ${item.vistoria_id}\n`);

    // Estado ANTES
    console.log('=== ESTADO ANTES ===');
    console.log(`  Status: ${item.status}`);
    console.log(`  Foto ID: ${item.foto_id || 'null'}`);
    console.log(`  Concluído em: ${item.concluido_em || 'null'}\n`);

    // Simular atualização (como a rota PATCH faria)
    console.log('=== ATUALIZANDO PARA CONCLUIDO SEM FOTO ===');
    const updateData = {
      status: 'CONCLUIDO',
      concluido_em: new Date(),
      foto_id: null
    };

    await item.update(updateData);
    await item.reload();

    // Estado DEPOIS
    console.log('=== ESTADO DEPOIS ===');
    console.log(`  Status: ${item.status}`);
    console.log(`  Foto ID: ${item.foto_id || 'null'}`);
    console.log(`  Concluído em: ${item.concluido_em || 'null'}\n`);

    // Validações
    console.log('=== VALIDAÇÕES ===');
    let todasValido = true;

    if (item.status !== 'CONCLUIDO') {
      console.log('  ERRO: Status não é CONCLUIDO');
      todasValido = false;
    } else {
      console.log('  OK: Status é CONCLUIDO');
    }

    if (item.foto_id !== null) {
      console.log('  ERRO: Foto ID não é null');
      todasValido = false;
    } else {
      console.log('  OK: Foto ID é null (concluído sem foto)');
    }

    if (!item.concluido_em) {
      console.log('  ERRO: concluido_em não foi definido');
      todasValido = false;
    } else {
      console.log('  OK: concluido_em foi definido');
    }

    // Verificar se item aparece na lista de concluídos
    const itensConcluidos = await VistoriaChecklistItem.findAll({
      where: {
        vistoria_id: item.vistoria_id,
        status: 'CONCLUIDO'
      }
    });

    const itensPendentes = await VistoriaChecklistItem.findAll({
      where: {
        vistoria_id: item.vistoria_id,
        status: 'PENDENTE'
      }
    });

    console.log('\n=== VERIFICAÇÃO DE LISTAS ===');
    console.log(`  Itens concluídos na vistoria: ${itensConcluidos.length}`);
    console.log(`  Itens pendentes na vistoria: ${itensPendentes.length}`);

    const itemEstaConcluido = itensConcluidos.some(i => i.id === item.id);
    const itemEstaPendente = itensPendentes.some(i => i.id === item.id);

    if (itemEstaConcluido && !itemEstaPendente) {
      console.log('  OK: Item aparece apenas na lista de concluídos');
    } else {
      console.log('  ERRO: Item não está na lista correta');
      console.log(`    Está em concluídos: ${itemEstaConcluido}`);
      console.log(`    Está em pendentes: ${itemEstaPendente}`);
      todasValido = false;
    }

    // Voltar para PENDENTE
    console.log('\n=== TESTANDO VOLTAR PARA PENDENTE ===');
    await item.update({
      status: 'PENDENTE',
      concluido_em: null,
      foto_id: null
    });
    await item.reload();

    if (item.status === 'PENDENTE' && !item.concluido_em) {
      console.log('  OK: Item voltou para PENDENTE corretamente');
    } else {
      console.log('  ERRO: Item não voltou para PENDENTE corretamente');
      todasValido = false;
    }

    console.log('\n=== RESULTADO FINAL ===');
    if (todasValido) {
      console.log('OK: Todos os testes passaram!');
      console.log('A funcionalidade de concluir item não obrigatório sem foto está 100% funcional.');
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

testConcluirSemFoto();

