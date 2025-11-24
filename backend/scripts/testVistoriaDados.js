/**
 * Script de teste para validar dados da vistoria
 * Verifica se createdAt e Local estão sendo retornados corretamente
 */

const { Vistoria, Embarcacao, Local, StatusVistoria, Usuario, Cliente } = require('../models');

async function testVistoriaDados() {
  try {
    console.log('=== TESTE: DADOS DA VISTORIA ===\n');

    // Buscar uma vistoria
    const vistoria = await Vistoria.findOne({
      include: [
        {
          model: Embarcacao,
          as: 'Embarcacao',
          include: [
            { model: Cliente, as: 'Cliente' }
          ]
        },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });

    if (!vistoria) {
      console.log('❌ Nenhuma vistoria encontrada');
      process.exit(1);
    }

    console.log(`✅ Vistoria encontrada: ID ${vistoria.id}\n`);

    // Verificar createdAt
    console.log('=== VERIFICAÇÃO DE DATA DE CRIAÇÃO ===');
    console.log(`createdAt: ${vistoria.createdAt || 'null/undefined'}`);
    console.log(`created_at: ${vistoria.created_at || 'null/undefined'}`);
    
    if (vistoria.createdAt) {
      const data = new Date(vistoria.createdAt);
      console.log(`✅ Data formatada (createdAt): ${data.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`);
    } else if (vistoria.created_at) {
      const data = new Date(vistoria.created_at);
      console.log(`✅ Data formatada (created_at): ${data.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`);
    } else {
      console.log('❌ PROBLEMA: Nenhuma data de criação encontrada!');
    }

    // Verificar Local
    console.log('\n=== VERIFICAÇÃO DE LOCAL ===');
    if (vistoria.Local) {
      console.log('✅ Local encontrado:');
      console.log(`   ID: ${vistoria.Local.id}`);
      console.log(`   Tipo: ${vistoria.Local.tipo || 'N/A'}`);
      console.log(`   Nome: ${vistoria.Local.nome_local || 'N/A'}`);
      console.log(`   Logradouro: ${vistoria.Local.logradouro || 'N/A'}`);
      console.log(`   Número: ${vistoria.Local.numero || 'N/A'}`);
      console.log(`   Bairro: ${vistoria.Local.bairro || 'N/A'}`);
      console.log(`   Cidade: ${vistoria.Local.cidade || 'N/A'}`);
      console.log(`   Estado: ${vistoria.Local.estado || 'N/A'}`);
      console.log(`   CEP: ${vistoria.Local.cep || 'N/A'}`);

      // Montar endereço completo
      const partes = [];
      if (vistoria.Local.nome_local) partes.push(`Nome: ${vistoria.Local.nome_local}`);
      if (vistoria.Local.logradouro) {
        const endereco = `${vistoria.Local.logradouro}${vistoria.Local.numero ? `, ${vistoria.Local.numero}` : ''}`;
        partes.push(endereco);
      }
      if (vistoria.Local.bairro) partes.push(vistoria.Local.bairro);
      if (vistoria.Local.cidade || vistoria.Local.estado) {
        const cidadeEstado = [vistoria.Local.cidade, vistoria.Local.estado].filter(Boolean).join(', ');
        if (cidadeEstado) partes.push(cidadeEstado);
      }

      console.log(`\n   Endereço completo: ${partes.length > 0 ? partes.join(' - ') : 'N/A'}`);
    } else {
      console.log('❌ PROBLEMA: Local não encontrado!');
      console.log(`   local_id na vistoria: ${vistoria.local_id}`);
    }

    // Verificar outros dados
    console.log('\n=== OUTROS DADOS ===');
    console.log(`Embarcação: ${vistoria.Embarcacao?.nome || 'N/A'} - ${vistoria.Embarcacao?.nr_inscricao_barco || 'N/A'}`);
    console.log(`Vistoriador: ${vistoria.vistoriador?.nome || 'N/A'}`);
    console.log(`Status: ${vistoria.StatusVistoria?.nome || 'N/A'}`);

    // Simular o que o frontend receberia
    console.log('\n=== DADOS QUE O FRONTEND RECEBERIA ===');
    const dadosFrontend = {
      id: vistoria.id,
      createdAt: vistoria.createdAt || vistoria.created_at,
      created_at: vistoria.created_at,
      Local: vistoria.Local ? {
        id: vistoria.Local.id,
        tipo: vistoria.Local.tipo,
        nome_local: vistoria.Local.nome_local,
        logradouro: vistoria.Local.logradouro,
        numero: vistoria.Local.numero,
        bairro: vistoria.Local.bairro,
        cidade: vistoria.Local.cidade,
        estado: vistoria.Local.estado,
        cep: vistoria.Local.cep
      } : null,
      Embarcacao: vistoria.Embarcacao ? {
        nome: vistoria.Embarcacao.nome,
        nr_inscricao_barco: vistoria.Embarcacao.nr_inscricao_barco
      } : null,
      vistoriador: vistoria.vistoriador ? {
        nome: vistoria.vistoriador.nome
      } : null,
      StatusVistoria: vistoria.StatusVistoria ? {
        nome: vistoria.StatusVistoria.nome
      } : null
    };

    console.log(JSON.stringify(dadosFrontend, null, 2));

    console.log('\n=== TESTE CONCLUÍDO ===\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

testVistoriaDados();

