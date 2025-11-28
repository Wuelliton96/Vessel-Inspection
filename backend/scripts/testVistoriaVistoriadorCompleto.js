/**
 * Script de teste completo para validar se vistorias aparecem para o vistoriador
 * Testa com vistorias reais do banco
 */

const { Vistoria, Embarcacao, Local, StatusVistoria, Usuario, NivelAcesso } = require('../models');

async function testVistoriaVistoriadorCompleto() {
  try {
    console.log('=== TESTE COMPLETO: VISTORIAS PARA VISTORIADOR ===\n');

    // Buscar todas as vistorias
    const todasVistorias = await Vistoria.findAll({
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`Total de vistorias no sistema: ${todasVistorias.length}\n`);

    if (todasVistorias.length === 0) {
      console.log('[AVISO]  Nenhuma vistoria encontrada no sistema');
      process.exit(0);
    }

    // Agrupar por vistoriador
    const vistoriasPorVistoriador = {};
    todasVistorias.forEach(vistoria => {
      const vistoriadorId = vistoria.vistoriador_id;
      if (!vistoriasPorVistoriador[vistoriadorId]) {
        vistoriasPorVistoriador[vistoriadorId] = {
          vistoriador: vistoria.vistoriador,
          vistorias: []
        };
      }
      vistoriasPorVistoriador[vistoriadorId].vistorias.push(vistoria);
    });

    // Buscar status
    const statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    const statusEmAndamento = await StatusVistoria.findOne({ where: { nome: 'EM_ANDAMENTO' } });
    const statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });

    const statusIds = [];
    if (statusPendente) statusIds.push(statusPendente.id);
    if (statusEmAndamento) statusIds.push(statusEmAndamento.id);
    if (statusConcluida) statusIds.push(statusConcluida.id);

    console.log('Status que serão retornados pela rota:', statusIds);
    console.log(`  - PENDENTE: ${statusPendente?.id || 'Não encontrado'}`);
    console.log(`  - EM_ANDAMENTO: ${statusEmAndamento?.id || 'Não encontrado'}`);
    console.log(`  - CONCLUIDA: ${statusConcluida?.id || 'Não encontrado'}\n`);

    // Testar para cada vistoriador
    for (const [vistoriadorId, data] of Object.entries(vistoriasPorVistoriador)) {
      const vistoriador = data.vistoriador;
      const vistorias = data.vistorias;

      console.log(`\n=== VISTORIADOR: ${vistoriador?.nome || 'ID ' + vistoriadorId} (ID: ${vistoriadorId}) ===`);
      console.log(`Total de vistorias atribuídas: ${vistorias.length}\n`);

      // Agrupar por status
      const porStatus = {};
      vistorias.forEach(v => {
        const statusNome = v.StatusVistoria?.nome || 'DESCONHECIDO';
        if (!porStatus[statusNome]) {
          porStatus[statusNome] = [];
        }
        porStatus[statusNome].push(v);
      });

      console.log('Vistorias por status:');
      for (const [statusNome, lista] of Object.entries(porStatus)) {
        console.log(`  ${statusNome}: ${lista.length} vistoria(s)`);
        lista.forEach(v => {
          console.log(`    - ID: ${v.id} | Embarcação: ${v.Embarcacao?.nome || 'N/A'} | Criada em: ${v.created_at}`);
        });
      }

      // Simular a query da rota
      const vistoriasRetornadas = vistorias.filter(v => statusIds.includes(v.status_id));
      
      console.log(`\nVistorias que seriam retornadas pela rota: ${vistoriasRetornadas.length}`);
      if (vistoriasRetornadas.length > 0) {
        vistoriasRetornadas.forEach(v => {
          console.log(`  [OK] ID: ${v.id} - ${v.Embarcacao?.nome || 'N/A'} - Status: ${v.StatusVistoria?.nome || 'N/A'}`);
        });
      } else {
        console.log('  [AVISO]  Nenhuma vistoria seria retornada');
        
        // Verificar quais status não estão sendo incluídos
        const statusNaoIncluidos = vistorias.filter(v => !statusIds.includes(v.status_id));
        if (statusNaoIncluidos.length > 0) {
          console.log('\n  Vistorias não retornadas (status não incluído):');
          statusNaoIncluidos.forEach(v => {
            console.log(`    [ERRO] ID: ${v.id} - Status: ${v.StatusVistoria?.nome || 'N/A'} (ID: ${v.status_id})`);
          });
        }
      }

      // Verificar especificamente vistorias PENDENTE
      const vistoriasPendentes = vistorias.filter(v => v.status_id === statusPendente?.id);
      if (vistoriasPendentes.length > 0) {
        console.log(`\n  [OK] Vistorias PENDENTE encontradas: ${vistoriasPendentes.length}`);
        const pendentesRetornadas = vistoriasPendentes.filter(v => statusIds.includes(v.status_id));
        if (pendentesRetornadas.length === vistoriasPendentes.length) {
          console.log('  [OK] Todas as vistorias PENDENTE seriam retornadas corretamente');
        } else {
          console.log('  [ERRO] PROBLEMA: Nem todas as vistorias PENDENTE seriam retornadas!');
        }
      }
    }

    // Teste final: Simular a rota completa
    console.log('\n\n=== TESTE FINAL: SIMULAÇÃO DA ROTA ===\n');
    
    // Pegar o primeiro vistoriador que tem vistorias
    const primeiroVistoriador = Object.keys(vistoriasPorVistoriador)[0];
    if (primeiroVistoriador) {
      const vistoriadorId = parseInt(primeiroVistoriador);
      console.log(`Testando com vistoriador ID: ${vistoriadorId}`);
      
      const resultadoRota = await Vistoria.findAll({
        where: {
          vistoriador_id: vistoriadorId,
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

      console.log(`\nResultado da rota: ${resultadoRota.length} vistoria(s)`);
      if (resultadoRota.length > 0) {
        console.log('\n[OK] Vistorias retornadas:');
        resultadoRota.forEach(v => {
          console.log(`  - ID: ${v.id} | ${v.Embarcacao?.nome || 'N/A'} | Status: ${v.StatusVistoria?.nome || 'N/A'}`);
        });
      } else {
        console.log('\n[AVISO]  Nenhuma vistoria retornada');
      }
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n');
    process.exit(0);
  } catch (error) {
    console.error('[ERRO] Erro no teste:', error);
    process.exit(1);
  }
}

testVistoriaVistoriadorCompleto();

