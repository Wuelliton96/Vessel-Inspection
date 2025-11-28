/**
 * Script de teste para validar se vistorias aparecem para o vistoriador
 */

const { Vistoria, Embarcacao, Local, StatusVistoria, Usuario, NivelAcesso } = require('../models');

async function testVistoriaVistoriador() {
  try {
    console.log('=== TESTE: VISTORIAS PARA VISTORIADOR ===\n');

    // Buscar um vistoriador
    const nivelVistoriador = await NivelAcesso.findOne({ where: { nome: 'VISTORIADOR' } });
    if (!nivelVistoriador) {
      console.log('[ERRO] Nível VISTORIADOR não encontrado');
      process.exit(1);
    }

    const vistoriador = await Usuario.findOne({
      where: { nivel_acesso_id: nivelVistoriador.id },
      include: [{ model: NivelAcesso, as: 'NivelAcesso' }]
    });

    if (!vistoriador) {
      console.log('[ERRO] Nenhum vistoriador encontrado');
      process.exit(1);
    }

    console.log(`[OK] Vistoriador encontrado: ${vistoriador.nome} (ID: ${vistoriador.id})\n`);

    // Buscar status
    const statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    const statusEmAndamento = await StatusVistoria.findOne({ where: { nome: 'EM_ANDAMENTO' } });
    const statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });

    console.log('Status encontrados:');
    console.log(`  ${statusPendente ? '[OK]' : '[ERRO]'} PENDENTE: ${statusPendente?.id || 'Não encontrado'}`);
    console.log(`  ${statusEmAndamento ? '[OK]' : '[AVISO]'} EM_ANDAMENTO: ${statusEmAndamento?.id || 'Não encontrado'}`);
    console.log(`  ${statusConcluida ? '[OK]' : '[AVISO]'} CONCLUIDA: ${statusConcluida?.id || 'Não encontrado'}\n`);

    // Buscar todas as vistorias atribuídas a este vistoriador
    const todasVistorias = await Vistoria.findAll({
      where: {
        vistoriador_id: vistoriador.id
      },
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`Total de vistorias atribuídas ao vistoriador: ${todasVistorias.length}\n`);

    if (todasVistorias.length === 0) {
      console.log('[AVISO]  Nenhuma vistoria encontrada para este vistoriador');
      console.log('   Verifique se há vistorias criadas com este vistoriador_id\n');
    } else {
      console.log('Vistorias encontradas:');
      todasVistorias.forEach((vistoria, index) => {
        console.log(`\n${index + 1}. Vistoria ID: ${vistoria.id}`);
        console.log(`   Embarcação: ${vistoria.Embarcacao?.nome || 'N/A'}`);
        console.log(`   Status: ${vistoria.StatusVistoria?.nome || 'N/A'}`);
        console.log(`   Data Criação: ${vistoria.created_at}`);
        
        // Verificar se seria retornada pela rota
        const statusIds = [];
        if (statusPendente) statusIds.push(statusPendente.id);
        if (statusEmAndamento) statusIds.push(statusEmAndamento.id);
        if (statusConcluida) statusIds.push(statusConcluida.id);
        
        const seriaRetornada = statusIds.includes(vistoria.status_id);
        console.log(`   Seria retornada pela rota: ${seriaRetornada ? '[OK] SIM' : '[ERRO] NÃO'}`);
      });
    }

    // Testar a query que a rota usa
    console.log('\n=== TESTE DA QUERY DA ROTA ===\n');
    
    const statusIds = [];
    if (statusPendente) statusIds.push(statusPendente.id);
    if (statusEmAndamento) statusIds.push(statusEmAndamento.id);
    if (statusConcluida) statusIds.push(statusConcluida.id);

    console.log('Status IDs que serão buscados:', statusIds);

    const vistoriasFiltradas = await Vistoria.findAll({
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

    console.log(`\nVistorias retornadas pela query da rota: ${vistoriasFiltradas.length}`);

    if (vistoriasFiltradas.length > 0) {
      console.log('\n[OK] Vistorias que seriam retornadas:');
      vistoriasFiltradas.forEach((vistoria, index) => {
        console.log(`   ${index + 1}. ID: ${vistoria.id} - ${vistoria.Embarcacao?.nome || 'N/A'} - Status: ${vistoria.StatusVistoria?.nome || 'N/A'}`);
      });
    } else {
      console.log('\n[AVISO]  Nenhuma vistoria seria retornada pela rota');
      
      // Verificar se há vistorias com outros status
      const vistoriasOutrosStatus = todasVistorias.filter(v => !statusIds.includes(v.status_id));
      if (vistoriasOutrosStatus.length > 0) {
        console.log('\nVistorias com outros status (não retornadas):');
        vistoriasOutrosStatus.forEach((vistoria) => {
          console.log(`   - ID: ${vistoria.id} - Status: ${vistoria.StatusVistoria?.nome || 'N/A'}`);
        });
      }
    }

    // Verificar se há vistorias PENDENTE
    const vistoriasPendentes = todasVistorias.filter(v => v.status_id === statusPendente?.id);
    console.log(`\n=== RESUMO ===`);
    console.log(`Total de vistorias: ${todasVistorias.length}`);
    console.log(`Vistorias PENDENTE: ${vistoriasPendentes.length}`);
    console.log(`Vistorias que seriam retornadas: ${vistoriasFiltradas.length}`);

    if (vistoriasPendentes.length > 0 && vistoriasFiltradas.length === 0) {
      console.log('\n[ERRO] PROBLEMA ENCONTRADO:');
      console.log('   Há vistorias PENDENTE que não estão sendo retornadas!');
      console.log('   A rota precisa incluir status PENDENTE na busca.');
    } else if (vistoriasPendentes.length > 0 && vistoriasFiltradas.length > 0) {
      console.log('\n[OK] OK: Vistorias PENDENTE estão sendo retornadas corretamente');
    } else if (vistoriasPendentes.length === 0) {
      console.log('\n[AVISO]  Não há vistorias PENDENTE para este vistoriador');
      console.log('   Crie uma vistoria com status PENDENTE para este vistoriador para testar');
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n');
    process.exit(0);
  } catch (error) {
    console.error('[ERRO] Erro no teste:', error);
    process.exit(1);
  }
}

testVistoriaVistoriador();

