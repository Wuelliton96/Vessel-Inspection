/**
 * Teste end-to-end completo para validar se vistorias aparecem para o vistoriador
 * Simula o fluxo completo: criar vistoria -> verificar se aparece para o vistoriador
 */

const { Vistoria, Embarcacao, Local, StatusVistoria, Usuario, NivelAcesso } = require('../models');

async function testVistoriaVistoriadorEndToEnd() {
  try {
    console.log('=== TESTE END-TO-END: VISTORIAS PARA VISTORIADOR ===\n');

    // 1. Buscar um vistoriador
    const nivelVistoriador = await NivelAcesso.findOne({ where: { nome: 'VISTORIADOR' } });
    if (!nivelVistoriador) {
      console.log('❌ Nível VISTORIADOR não encontrado');
      process.exit(1);
    }

    const vistoriador = await Usuario.findOne({
      where: { nivel_acesso_id: nivelVistoriador.id },
      include: [{ model: NivelAcesso, as: 'NivelAcesso' }]
    });

    if (!vistoriador) {
      console.log('❌ Nenhum vistoriador encontrado');
      process.exit(1);
    }

    console.log(`✅ Vistoriador encontrado: ${vistoriador.nome} (ID: ${vistoriador.id})\n`);

    // 2. Buscar uma embarcação e local existentes
    const embarcacao = await Embarcacao.findOne();
    const local = await Local.findOne();
    const statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });

    if (!embarcacao || !local || !statusPendente) {
      console.log('❌ Dados necessários não encontrados:');
      console.log(`   Embarcação: ${embarcacao ? '✅' : '❌'}`);
      console.log(`   Local: ${local ? '✅' : '❌'}`);
      console.log(`   Status PENDENTE: ${statusPendente ? '✅' : '❌'}`);
      process.exit(1);
    }

    console.log(`✅ Embarcação: ${embarcacao.nome} (ID: ${embarcacao.id})`);
    console.log(`✅ Local: ${local.nome_local || local.logradouro || 'ID ' + local.id} (ID: ${local.id})`);
    console.log(`✅ Status PENDENTE: ID ${statusPendente.id}\n`);

    // 3. Verificar vistorias existentes antes
    const vistoriasAntes = await Vistoria.findAll({
      where: { vistoriador_id: vistoriador.id },
      include: [{ model: StatusVistoria, as: 'StatusVistoria' }]
    });

    console.log(`Vistorias existentes para este vistoriador: ${vistoriasAntes.length}`);

    // 4. Simular a query da rota ANTES de criar nova vistoria
    const statusIds = [];
    const statusEmAndamento = await StatusVistoria.findOne({ where: { nome: 'EM_ANDAMENTO' } });
    const statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });
    
    if (statusPendente) statusIds.push(statusPendente.id);
    if (statusEmAndamento) statusIds.push(statusEmAndamento.id);
    if (statusConcluida) statusIds.push(statusConcluida.id);

    const vistoriasAntesQuery = await Vistoria.findAll({
      where: {
        vistoriador_id: vistoriador.id,
        status_id: statusIds.length > 0 ? statusIds : [0]
      },
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`Vistorias retornadas pela rota ANTES: ${vistoriasAntesQuery.length}\n`);

    // 5. Criar uma nova vistoria PENDENTE para este vistoriador
    console.log('=== CRIANDO NOVA VISTORIA ===\n');
    
    const novaVistoria = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: vistoriador.id,
      administrador_id: 1, // Assumindo que existe um admin com ID 1
      status_id: statusPendente.id
    });

    console.log(`✅ Vistoria criada: ID ${novaVistoria.id}`);
    console.log(`   Vistoriador: ${vistoriador.nome} (ID: ${vistoriador.id})`);
    console.log(`   Status: PENDENTE (ID: ${statusPendente.id})\n`);

    // 6. Verificar se a vistoria aparece na rota
    console.log('=== VERIFICANDO SE VISTORIA APARECE NA ROTA ===\n');
    
    const vistoriasDepoisQuery = await Vistoria.findAll({
      where: {
        vistoriador_id: vistoriador.id,
        status_id: statusIds.length > 0 ? statusIds : [0]
      },
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`Vistorias retornadas pela rota DEPOIS: ${vistoriasDepoisQuery.length}`);

    const vistoriaEncontrada = vistoriasDepoisQuery.find(v => v.id === novaVistoria.id);

    if (vistoriaEncontrada) {
      console.log('\n✅ SUCESSO: A vistoria PENDENTE está sendo retornada pela rota!');
      console.log(`   ID: ${vistoriaEncontrada.id}`);
      console.log(`   Embarcação: ${vistoriaEncontrada.Embarcacao?.nome || 'N/A'}`);
      console.log(`   Status: ${vistoriaEncontrada.StatusVistoria?.nome || 'N/A'}`);
      console.log(`   Vistoriador: ${vistoriaEncontrada.vistoriador?.nome || 'N/A'}`);
    } else {
      console.log('\n❌ ERRO: A vistoria PENDENTE NÃO está sendo retornada pela rota!');
      console.log('   Verifique se o status PENDENTE está incluído na busca.');
    }

    // 7. Limpar - deletar a vistoria de teste
    console.log('\n=== LIMPEZA ===');
    await novaVistoria.destroy();
    console.log('✅ Vistoria de teste removida\n');

    // 8. Resumo final
    console.log('=== RESUMO DO TESTE ===');
    console.log(`✅ Vistoriador: ${vistoriador.nome} (ID: ${vistoriador.id})`);
    console.log(`✅ Status incluídos na busca: ${statusIds.join(', ')}`);
    console.log(`✅ Vistoria PENDENTE criada e encontrada: ${vistoriaEncontrada ? 'SIM' : 'NÃO'}`);
    
    if (vistoriaEncontrada) {
      console.log('\n✅ TESTE PASSOU: Vistorias PENDENTE aparecem corretamente para o vistoriador');
    } else {
      console.log('\n❌ TESTE FALHOU: Vistorias PENDENTE não aparecem para o vistoriador');
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n');
    process.exit(vistoriaEncontrada ? 0 : 1);
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testVistoriaVistoriadorEndToEnd();

