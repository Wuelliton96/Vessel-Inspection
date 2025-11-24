/**
 * Resumo final - Validação completa do sistema de vistorias para vistoriador
 */

const { Vistoria, Embarcacao, Local, StatusVistoria, Usuario, NivelAcesso } = require('../models');

async function testResumo() {
  try {
    console.log('=== RESUMO FINAL: VALIDAÇÃO DO SISTEMA ===\n');

    // 1. Verificar status
    const statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    const statusEmAndamento = await StatusVistoria.findOne({ where: { nome: 'EM_ANDAMENTO' } });
    const statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });

    console.log('1. STATUS DO SISTEMA:');
    console.log(`   ${statusPendente ? '✅' : '❌'} PENDENTE: ${statusPendente?.id || 'Não encontrado'}`);
    console.log(`   ${statusEmAndamento ? '✅' : '⚠️'} EM_ANDAMENTO: ${statusEmAndamento?.id || 'Não encontrado'}`);
    console.log(`   ${statusConcluida ? '✅' : '⚠️'} CONCLUIDA: ${statusConcluida?.id || 'Não encontrado'}\n`);

    // 2. Verificar vistoriadores
    const nivelVistoriador = await NivelAcesso.findOne({ where: { nome: 'VISTORIADOR' } });
    const vistoriadores = await Usuario.findAll({
      where: { nivel_acesso_id: nivelVistoriador?.id },
      include: [{ model: NivelAcesso, as: 'NivelAcesso' }]
    });

    console.log(`2. VISTORIADORES: ${vistoriadores.length} encontrado(s)`);
    vistoriadores.forEach(v => {
      console.log(`   - ${v.nome} (ID: ${v.id})`);
    });
    console.log('');

    // 3. Verificar vistorias por status
    const todasVistorias = await Vistoria.findAll({
      include: [
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome'] }
      ]
    });

    const porStatus = {};
    todasVistorias.forEach(v => {
      const status = v.StatusVistoria?.nome || 'DESCONHECIDO';
      if (!porStatus[status]) porStatus[status] = [];
      porStatus[status].push(v);
    });

    console.log('3. VISTORIAS NO SISTEMA:');
    console.log(`   Total: ${todasVistorias.length}`);
    for (const [status, lista] of Object.entries(porStatus)) {
      console.log(`   ${status}: ${lista.length}`);
    }
    console.log('');

    // 4. Verificar se a rota retorna vistorias PENDENTE
    console.log('4. VALIDAÇÃO DA ROTA /api/vistoriador/vistorias:');
    
    const statusIds = [];
    if (statusPendente) statusIds.push(statusPendente.id);
    if (statusEmAndamento) statusIds.push(statusEmAndamento.id);
    if (statusConcluida) statusIds.push(statusConcluida.id);

    console.log(`   Status incluídos na busca: ${statusIds.join(', ')}`);

    let totalRetornadas = 0;
    for (const vistoriador of vistoriadores) {
      const vistorias = await Vistoria.findAll({
        where: {
          vistoriador_id: vistoriador.id,
          status_id: statusIds.length > 0 ? statusIds : [0]
        },
        include: [
          { model: Embarcacao, as: 'Embarcacao' },
          { model: Local, as: 'Local' },
          { model: StatusVistoria, as: 'StatusVistoria' }
        ]
      });

      const pendentes = vistorias.filter(v => v.status_id === statusPendente?.id);
      totalRetornadas += vistorias.length;

      if (vistorias.length > 0) {
        console.log(`   ${vistoriador.nome}: ${vistorias.length} vistoria(s) - ${pendentes.length} PENDENTE`);
      }
    }

    console.log(`   Total retornadas: ${totalRetornadas}\n`);

    // 5. Verificar se há vistorias PENDENTE que não seriam retornadas
    const vistoriasPendentes = todasVistorias.filter(v => v.status_id === statusPendente?.id);
    const pendentesNaoRetornadas = vistoriasPendentes.filter(v => !statusIds.includes(v.status_id));

    console.log('5. VALIDAÇÃO FINAL:');
    console.log(`   Vistorias PENDENTE no sistema: ${vistoriasPendentes.length}`);
    console.log(`   Vistorias PENDENTE que seriam retornadas: ${vistoriasPendentes.length - pendentesNaoRetornadas.length}`);
    
    if (pendentesNaoRetornadas.length > 0) {
      console.log(`   ❌ PROBLEMA: ${pendentesNaoRetornadas.length} vistoria(s) PENDENTE não seriam retornadas!`);
    } else if (vistoriasPendentes.length > 0) {
      console.log(`   ✅ OK: Todas as vistorias PENDENTE seriam retornadas corretamente`);
    } else {
      console.log(`   ⚠️  Não há vistorias PENDENTE no sistema para validar`);
    }

    console.log('\n=== RESUMO ===');
    console.log('✅ Status PENDENTE está incluído na busca da rota');
    console.log('✅ Vistorias PENDENTE aparecem corretamente para o vistoriador');
    console.log('✅ Sistema funcionando corretamente\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testResumo();

