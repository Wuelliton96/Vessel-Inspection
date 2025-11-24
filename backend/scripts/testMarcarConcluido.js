/**
 * Script de teste para validar marcação de item como concluído
 */

const { VistoriaChecklistItem, Vistoria, Usuario, NivelAcesso } = require('../models');

async function testMarcarConcluido() {
  try {
    console.log('=== TESTE: MARCAR ITEM COMO CONCLUIDO ===\n');

    // Buscar um item de checklist
    const item = await VistoriaChecklistItem.findOne({
      include: [
        {
          model: Vistoria,
          as: 'vistoria',
          attributes: ['id', 'vistoriador_id'],
          include: [
            {
              model: Usuario,
              as: 'vistoriador',
              attributes: ['id', 'nome']
            }
          ]
        }
      ],
      where: {
        status: 'PENDENTE'
      }
    });

    if (!item) {
      console.log('Nenhum item PENDENTE encontrado para teste');
      process.exit(0);
    }

    console.log('Item encontrado:');
    console.log(`  ID: ${item.id}`);
    console.log(`  Nome: ${item.nome}`);
    console.log(`  Status atual: ${item.status}`);
    console.log(`  Obrigatório: ${item.obrigatorio}`);
    console.log(`  Vistoria ID: ${item.vistoria_id}`);
    console.log(`  Vistoriador: ${item.vistoria?.vistoriador?.nome || 'N/A'} (ID: ${item.vistoria?.vistoriador_id || 'N/A'})`);
    console.log('');

    // Simular atualização
    console.log('Simulando atualização para CONCLUIDO...');
    const updateData = {
      status: 'CONCLUIDO',
      concluido_em: new Date(),
      foto_id: null // Concluir sem foto
    };

    console.log('Dados para atualização:', updateData);

    // Atualizar item
    await item.update(updateData);
    await item.reload();

    console.log('\nItem atualizado:');
    console.log(`  Status: ${item.status}`);
    console.log(`  Foto ID: ${item.foto_id || 'null'}`);
    console.log(`  Concluído em: ${item.concluido_em || 'null'}`);

    // Verificar se foi atualizado corretamente
    if (item.status === 'CONCLUIDO' && !item.foto_id) {
      console.log('\nOK: Item marcado como concluído sem foto corretamente');
    } else {
      console.log('\nERRO: Item não foi atualizado corretamente');
    }

    // Testar voltar para PENDENTE
    console.log('\nTestando voltar para PENDENTE...');
    await item.update({
      status: 'PENDENTE',
      concluido_em: null,
      foto_id: null
    });
    await item.reload();

    console.log('Item voltou para PENDENTE:');
    console.log(`  Status: ${item.status}`);
    console.log(`  Concluído em: ${item.concluido_em || 'null'}`);

    if (item.status === 'PENDENTE') {
      console.log('\nOK: Item voltou para PENDENTE corretamente');
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Erro no teste:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testMarcarConcluido();

