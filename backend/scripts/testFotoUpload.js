// Script para testar upload de foto e vinculação com checklist
const sequelize = require('../config/database');
const { Foto, Vistoria, TipoFotoChecklist, VistoriaChecklistItem } = require('../models');

async function testFotoAndChecklist() {
  console.log('=== TESTE DE UPLOAD E VINCULAÇÃO COM CHECKLIST ===\n');
  
  try {
    await sequelize.authenticate();
    console.log('✓ Conexão com banco estabelecida\n');
    
    // 1. Buscar uma vistoria com checklist
    const vistoria = await Vistoria.findOne({
      include: [{
        model: VistoriaChecklistItem,
        as: 'checklistItens',
        where: { status: 'PENDENTE' },
        required: false
      }]
    });
    
    if (!vistoria) {
      console.log('⚠ Nenhuma vistoria encontrada.');
      return;
    }
    
    console.log(`✓ Vistoria encontrada: ID ${vistoria.id}`);
    console.log(`✓ Itens de checklist: ${vistoria.checklistItens?.length || 0}\n`);
    
    // 2. Buscar um tipo de foto
    const tipoFoto = await TipoFotoChecklist.findOne();
    if (!tipoFoto) {
      console.log('⚠ Nenhum tipo de foto encontrado.');
      return;
    }
    
    console.log(`✓ Tipo de foto: ${tipoFoto.nome_exibicao} (ID: ${tipoFoto.id})\n`);
    
    // 3. Buscar item de checklist pendente
    const checklistItem = await VistoriaChecklistItem.findOne({
      where: {
        vistoria_id: vistoria.id,
        status: 'PENDENTE'
      }
    });
    
    if (!checklistItem) {
      console.log('⚠ Nenhum item de checklist pendente encontrado.');
      return;
    }
    
    console.log(`✓ Item de checklist: "${checklistItem.nome}" (ID: ${checklistItem.id})`);
    console.log(`  - Status: ${checklistItem.status}`);
    console.log(`  - Foto ID: ${checklistItem.foto_id || 'null'}\n`);
    
    // 4. Criar foto de teste
    const fotoTest = await Foto.create({
      url_arquivo: `foto-teste-${Date.now()}.jpg`,
      vistoria_id: vistoria.id,
      tipo_foto_id: tipoFoto.id,
      observacao: 'Foto de teste - será deletada'
    });
    
    console.log(`✓ Foto criada: ID ${fotoTest.id}`);
    console.log(`  - url_arquivo: ${fotoTest.url_arquivo}`);
    console.log(`  - vistoria_id: ${fotoTest.vistoria_id}`);
    console.log(`  - tipo_foto_id: ${fotoTest.tipo_foto_id}\n`);
    
    // 5. Testar a lógica de vinculação (como no código real)
    const { Op } = require('sequelize');
    const nomeTipoFoto = tipoFoto.nome_exibicao.trim();
    
    console.log(`=== TESTANDO BUSCA DE ITEM DO CHECKLIST ===`);
    console.log(`Buscando item para tipo: "${nomeTipoFoto}"`);
    
    // Busca exata
    let itemEncontrado = await VistoriaChecklistItem.findOne({
      where: {
        vistoria_id: vistoria.id,
        nome: {
          [Op.iLike]: nomeTipoFoto
        },
        status: 'PENDENTE'
      }
    });
    
    if (itemEncontrado) {
      console.log(`✓ Item encontrado por busca exata: "${itemEncontrado.nome}"`);
    } else {
      console.log('⚠ Item não encontrado por busca exata. Tentando busca parcial...');
      
      const todosItens = await VistoriaChecklistItem.findAll({
        where: {
          vistoria_id: vistoria.id,
          status: 'PENDENTE'
        }
      });
      
      console.log(`Itens pendentes (${todosItens.length}):`);
      todosItens.forEach(item => {
        console.log(`  - "${item.nome}"`);
      });
      
      // Mapeamento inteligente de palavras-chave
      const mapeamentoPalavrasChave = {
        'casco': ['casco', 'chassi', 'hull', 'casca', 'plaqueta do casco', 'plaqueta casco'],
        'motor': ['motor', 'engine', 'máquina', 'maquina', 'propulsão', 'propulsao', 'rabeta', 'acionamento do motor', 'visão geral do motor', 'visao geral motor', 'plaqueta do motor', 'plaqueta motor', 'horas do motor', 'horimetro'],
        'interior': ['interior', 'inside', 'interno', 'cockpit'],
        'documento': ['documento', 'document', 'papel', 'tie', 'inscrição', 'inscricao', 'nº de inscrição', 'numero inscricao', 'confirmação', 'confirmacao', 'capitania'],
        'proa': ['proa', 'bow', 'frente', 'frontal'],
        'popa': ['popa', 'stern', 'traseira', 'traseiro'],
        'convés': ['convés', 'conves', 'deck', 'coberta'],
        'cabine': ['cabine', 'cabin'],
        'timão': ['timão', 'timao', 'rudder', 'leme'],
        'hélice': ['hélice', 'helice', 'propeller', 'propulsão', 'propulsao'],
        'painel': ['painel', 'painel de comando', 'instrumentos', 'comando', 'equipamentos do painel'],
        'horas': ['horas', 'horímetro', 'horimetro', 'hors'],
        'extintor': ['extintor', 'extintores', 'validade'],
        'salva-vidas': ['salva-vidas', 'salva vidas', 'colete', 'boia', 'boias salva-vidas', 'coletes salva-vidas'],
        'bateria': ['bateria', 'baterias'],
        'bomba': ['bomba', 'bombas', 'porão', 'porao', 'água doce', 'agua doce', 'bombas de porão', 'bombas de agua doce'],
        'âncora': ['âncora', 'ancora', 'ancoragem'],
        'costado': ['costado', 'lateral', 'direito', 'esquerdo']
      };
      
      const nomeTipoLower = nomeTipoFoto.toLowerCase().trim();
      const nomeTipoLimpo = nomeTipoLower.replace(/^foto\s+(do|da|dos|das)\s+/, '').trim();
      
      let palavraChave = null;
      for (const [chave, variações] of Object.entries(mapeamentoPalavrasChave)) {
        if (variações.some(v => nomeTipoLimpo.includes(v) || nomeTipoLower.includes(v))) {
          palavraChave = chave;
          console.log(`Palavra-chave identificada: "${palavraChave}" do tipo "${nomeTipoFoto}"`);
          break;
        }
      }
      
      // Se encontrou palavra-chave, buscar por ela
      if (palavraChave) {
        const variações = mapeamentoPalavrasChave[palavraChave];
        itemEncontrado = todosItens.find(item => {
          const nomeItem = item.nome?.toLowerCase().trim() || '';
          return variações.some(v => nomeItem.includes(v));
        });
        
        if (itemEncontrado) {
          console.log(`✓ Item encontrado por palavra-chave: "${itemEncontrado.nome}"`);
        }
      }
      
      // Se ainda não encontrou, fazer busca parcial mais genérica
      if (!itemEncontrado) {
        itemEncontrado = todosItens.find(item => {
          const nomeItem = item.nome?.toLowerCase().trim() || '';
          const nomeTipo = nomeTipoFoto.toLowerCase().trim();
          
          if (nomeItem === nomeTipo) return true;
          if (nomeItem.includes(nomeTipo) || nomeTipo.includes(nomeItem)) return true;
          
          const nomeItemLimpo = nomeItem.replace(/^foto\s+(do|da|dos|das)\s+/, '');
          const nomeTipoLimpo2 = nomeTipo.replace(/^foto\s+(do|da|dos|das)\s+/, '');
          if (nomeItemLimpo === nomeTipoLimpo2) return true;
          
          const nomeItemSemParenteses = nomeItem.replace(/\s*\([^)]*\)/g, '').trim();
          const nomeTipoSemParenteses = nomeTipo.replace(/\s*\([^)]*\)/g, '').trim();
          if (nomeItemSemParenteses === nomeTipoSemParenteses) return true;
          
          const primeiraPalavraItem = nomeItem.split(/\s+/)[0];
          const primeiraPalavraTipo = nomeTipo.split(/\s+/)[0];
          if (primeiraPalavraItem && primeiraPalavraTipo && primeiraPalavraItem === primeiraPalavraTipo) return true;
          
          return false;
        });
        
        if (itemEncontrado) {
          console.log(`✓ Item encontrado por busca parcial: "${itemEncontrado.nome}"`);
        }
      }
      
      if (itemEncontrado) {
        console.log(`✓ Item encontrado por busca parcial: "${itemEncontrado.nome}"`);
      } else {
        console.log(`✗ Nenhum item encontrado para "${nomeTipoFoto}"`);
      }
    }
    
    // 6. Se encontrou, atualizar checklist
    if (itemEncontrado) {
      console.log('\n=== ATUALIZANDO CHECKLIST ===');
      
      await itemEncontrado.update({
        status: 'CONCLUIDO',
        foto_id: fotoTest.id,
        concluido_em: new Date()
      });
      
      console.log(`✓ Item "${itemEncontrado.nome}" atualizado`);
      console.log(`  - Status: CONCLUIDO`);
      console.log(`  - Foto ID: ${fotoTest.id}`);
      
      // Verificar atualização
      const itemAtualizado = await VistoriaChecklistItem.findByPk(itemEncontrado.id);
      console.log(`✓ Verificação no banco:`);
      console.log(`  - Status: ${itemAtualizado.status}`);
      console.log(`  - Foto ID: ${itemAtualizado.foto_id}`);
      console.log(`  - Concluído em: ${itemAtualizado.concluido_em}`);
    }
    
    // 7. Verificar foto no banco
    console.log('\n=== VERIFICANDO FOTO NO BANCO ===');
    const fotoNoBanco = await Foto.findByPk(fotoTest.id, {
      include: [
        { model: Vistoria, as: 'Vistoria' },
        { model: TipoFotoChecklist, as: 'TipoFotoChecklist' }
      ]
    });
    
    if (fotoNoBanco) {
      console.log(`✓ Foto encontrada no banco: ID ${fotoNoBanco.id}`);
      console.log(`  - url_arquivo: ${fotoNoBanco.url_arquivo}`);
      console.log(`  - vistoria_id: ${fotoNoBanco.vistoria_id}`);
      console.log(`  - tipo_foto_id: ${fotoNoBanco.tipo_foto_id}`);
      console.log(`  - Vistoria: ${fotoNoBanco.Vistoria?.id || 'N/A'}`);
      console.log(`  - Tipo Foto: ${fotoNoBanco.TipoFotoChecklist?.nome_exibicao || 'N/A'}`);
    }
    
    // 8. Limpar dados de teste
    console.log('\n=== LIMPANDO DADOS DE TESTE ===');
    if (itemEncontrado) {
      await itemEncontrado.update({
        status: 'PENDENTE',
        foto_id: null,
        concluido_em: null
      });
      console.log('✓ Checklist revertido');
    }
    
    await fotoTest.destroy();
    console.log('✓ Foto deletada');
    
    console.log('\n========================================');
    console.log('✓ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n✗ ERRO:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testFotoAndChecklist();

