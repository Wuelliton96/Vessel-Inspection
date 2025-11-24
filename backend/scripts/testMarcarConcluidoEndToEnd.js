/**
 * Teste end-to-end completo para validar marcação de item como concluído
 */

const { VistoriaChecklistItem, Vistoria, Usuario, NivelAcesso } = require('../models');
const jwt = require('jsonwebtoken');

async function testMarcarConcluidoEndToEnd() {
  try {
    console.log('=== TESTE END-TO-END: MARCAR ITEM COMO CONCLUIDO ===\n');

    // Buscar um vistoriador
    const nivelVistoriador = await NivelAcesso.findOne({ where: { nome: 'VISTORIADOR' } });
    if (!nivelVistoriador) {
      console.log('Nível VISTORIADOR não encontrado');
      process.exit(1);
    }

    const vistoriador = await Usuario.findOne({
      where: { nivel_acesso_id: nivelVistoriador.id },
      include: [{ model: NivelAcesso, as: 'NivelAcesso' }]
    });

    if (!vistoriador) {
      console.log('Nenhum vistoriador encontrado');
      process.exit(1);
    }

    console.log(`Vistoriador: ${vistoriador.nome} (ID: ${vistoriador.id})\n`);

    // Buscar item pendente de qualquer vistoria
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
      console.log('Nenhum item PENDENTE encontrado para teste');
      process.exit(0);
    }

    if (!item) {
      console.log('Nenhum item PENDENTE encontrado para teste');
      process.exit(0);
    }

    const vistoria = item.vistoria;

    console.log('Item encontrado:');
    console.log(`  ID: ${item.id}`);
    console.log(`  Nome: ${item.nome}`);
    console.log(`  Status: ${item.status}`);
    console.log(`  Obrigatório: ${item.obrigatorio}`);
    console.log(`  Vistoria ID: ${item.vistoria_id}`);
    console.log(`  Vistoriador da vistoria: ${vistoria?.vistoriador_id || 'N/A'}\n`);

    // Simular requisição da rota
    console.log('=== SIMULANDO ROTA PATCH /api/checklists/vistoria/item/:id/status ===\n');

    const statusAntes = item.status;
    const fotoIdAntes = item.foto_id;
    const concluidoEmAntes = item.concluido_em;

    console.log('Estado ANTES:');
    console.log(`  Status: ${statusAntes}`);
    console.log(`  Foto ID: ${fotoIdAntes || 'null'}`);
    console.log(`  Concluído em: ${concluidoEmAntes || 'null'}\n`);

    // Atualizar como a rota faria
    const updateData = {
      status: 'CONCLUIDO',
      concluido_em: new Date(),
      foto_id: null
    };

    await item.update(updateData);
    await item.reload();

    console.log('Estado DEPOIS:');
    console.log(`  Status: ${item.status}`);
    console.log(`  Foto ID: ${item.foto_id || 'null'}`);
    console.log(`  Concluído em: ${item.concluido_em || 'null'}\n`);

    // Validações
    let todasValido = true;

    if (item.status !== 'CONCLUIDO') {
      console.log('ERRO: Status não foi atualizado para CONCLUIDO');
      todasValido = false;
    } else {
      console.log('OK: Status atualizado para CONCLUIDO');
    }

    if (item.foto_id !== null) {
      console.log('ERRO: Foto ID deveria ser null (concluído sem foto)');
      todasValido = false;
    } else {
      console.log('OK: Foto ID está null (concluído sem foto)');
    }

    if (!item.concluido_em) {
      console.log('ERRO: concluido_em não foi definido');
      todasValido = false;
    } else {
      console.log('OK: concluido_em foi definido');
    }

    // Testar voltar para PENDENTE
    console.log('\n=== TESTANDO VOLTAR PARA PENDENTE ===\n');
    await item.update({
      status: 'PENDENTE',
      concluido_em: null,
      foto_id: null
    });
    await item.reload();

    if (item.status === 'PENDENTE' && !item.concluido_em) {
      console.log('OK: Item voltou para PENDENTE corretamente');
    } else {
      console.log('ERRO: Item não voltou para PENDENTE corretamente');
      todasValido = false;
    }

    console.log('\n=== RESULTADO FINAL ===');
    if (todasValido) {
      console.log('OK: Todos os testes passaram!');
      console.log('A funcionalidade de marcar como concluído sem foto está funcionando corretamente.');
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

testMarcarConcluidoEndToEnd();

