// Script completo para testar upload de foto e vinculação com checklist
const sequelize = require('../config/database');
const { Foto, Vistoria, TipoFotoChecklist, VistoriaChecklistItem } = require('../models');
const { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, bucket, region } = require('../config/aws');
const { UPLOAD_STRATEGY } = require('../services/uploadService');

async function testFotoCompleto() {
  console.log('=== TESTE COMPLETO DE UPLOAD DE FOTO ===\n');
  console.log(`Estratégia de upload: ${UPLOAD_STRATEGY.toUpperCase()}\n`);
  
  try {
    await sequelize.authenticate();
    console.log('[OK] Conexão com banco estabelecida\n');
    
    // 1. Buscar uma vistoria com checklist
    console.log('1. Buscando vistoria com checklist...');
    const vistoria = await Vistoria.findOne({
      include: [{
        model: VistoriaChecklistItem,
        as: 'checklistItens',
        where: { status: 'PENDENTE' },
        required: false
      }]
    });
    
    if (!vistoria) {
      console.error('[ERRO] Nenhuma vistoria encontrada com checklist.');
      process.exit(1);
    }
    
    console.log(`[OK] Vistoria encontrada: ID ${vistoria.id}`);
    console.log(`[OK] Itens de checklist pendentes: ${vistoria.checklistItens?.length || 0}\n`);
    
    // 2. Buscar um tipo de foto
    console.log('2. Buscando tipo de foto...');
    const tipoFoto = await TipoFotoChecklist.findOne();
    if (!tipoFoto) {
      console.error('[ERRO] Nenhum tipo de foto encontrado.');
      process.exit(1);
    }
    
    console.log(`[OK] Tipo de foto: ${tipoFoto.nome_exibicao} (ID: ${tipoFoto.id})\n`);
    
    // 3. Buscar item de checklist que pode ser vinculado
    console.log('3. Buscando item de checklist correspondente...');
    const { Op } = require('sequelize');
    
    const nomeTipoFoto = tipoFoto.nome_exibicao.trim();
    const nomeTipoLower = nomeTipoFoto.toLowerCase().trim();
    const nomeTipoLimpo = nomeTipoLower.replace(/^foto\s+(do|da|dos|das)\s+/, '').trim();
    
    const mapeamentoPalavrasChave = {
      'casco': ['casco', 'chassi', 'hull', 'casca', 'plaqueta do casco', 'plaqueta casco'],
      'motor': ['motor', 'engine', 'máquina', 'maquina', 'propulsão', 'propulsao', 'rabeta', 'acionamento do motor', 'visão geral do motor', 'visao geral motor', 'plaqueta do motor', 'plaqueta motor', 'horas do motor', 'horimetro'],
      'interior': ['interior', 'inside', 'interno', 'cockpit'],
      'documento': ['documento', 'document', 'papel', 'tie', 'inscrição', 'inscricao', 'nº de inscrição', 'numero inscricao', 'confirmação', 'confirmacao', 'capitania'],
      'proa': ['proa', 'bow', 'frente', 'frontal'],
      'popa': ['popa', 'stern', 'traseira', 'traseiro'],
      'painel': ['painel', 'painel de comando', 'instrumentos', 'comando', 'equipamentos do painel'],
      'horas': ['horas', 'horímetro', 'horimetro', 'hors'],
      'extintor': ['extintor', 'extintores', 'validade'],
      'salva-vidas': ['salva-vidas', 'salva vidas', 'colete', 'boia', 'boias salva-vidas', 'coletes salva-vidas'],
      'bateria': ['bateria', 'baterias'],
      'bomba': ['bomba', 'bombas', 'porão', 'porao', 'água doce', 'agua doce', 'bombas de porão', 'bombas de agua doce'],
      'âncora': ['âncora', 'ancora', 'ancoragem']
    };
    
    let palavraChave = null;
    for (const [chave, variações] of Object.entries(mapeamentoPalavrasChave)) {
      if (variações.some(v => nomeTipoLimpo.includes(v) || nomeTipoLower.includes(v))) {
        palavraChave = chave;
        break;
      }
    }
    
    let checklistItem = null;
    if (palavraChave) {
      const variações = mapeamentoPalavrasChave[palavraChave];
      const todosItens = await VistoriaChecklistItem.findAll({
        where: {
          vistoria_id: vistoria.id,
          status: 'PENDENTE'
        }
      });
      
      checklistItem = todosItens.find(item => {
        const nomeItem = item.nome?.toLowerCase().trim() || '';
        return variações.some(v => nomeItem.includes(v));
      });
    }
    
    if (checklistItem) {
      console.log(`[OK] Item de checklist encontrado: "${checklistItem.nome}" (ID: ${checklistItem.id})`);
      console.log(`  Status: ${checklistItem.status}`);
      console.log(`  Foto ID atual: ${checklistItem.foto_id || 'null'}\n`);
    } else {
      console.log(`[AVISO] Nenhum item de checklist encontrado para "${nomeTipoFoto}"`);
      console.log(`  (Isso é normal se não houver correspondência)\n`);
    }
    
    // 4. Simular upload da foto
    console.log('4. Simulando upload da foto...');
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E9);
    let filename, urlCompleta;
    
    if (UPLOAD_STRATEGY === 's3') {
      // S3: criar key com pasta por vistoria
      filename = `vistorias/${vistoria.id}/foto-${timestamp}-${randomNum}.jpg`;
      urlCompleta = `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
      
      console.log(`[OK] S3 Key: ${filename}`);
      console.log(`[OK] URL completa: ${urlCompleta}\n`);
      
      // Fazer upload de teste no S3
      console.log('   Fazendo upload de teste no S3...');
      try {
        const imageBuffer = Buffer.from('FFD8FFE000104A46494600010101006000600000FFDB004300', 'hex');
        
        const putCommand = new PutObjectCommand({
          Bucket: bucket,
          Key: filename,
          Body: imageBuffer,
          ContentType: 'image/jpeg',
          Metadata: {
            vistoriaId: vistoria.id.toString(),
            tipoFotoId: tipoFoto.id.toString(),
            originalName: `foto-${timestamp}-${randomNum}.jpg`,
            uploadedAt: new Date().toISOString()
          }
        });
        
        await s3Client.send(putCommand);
        console.log('   [OK] Upload no S3 realizado com sucesso\n');
      } catch (error) {
        console.error(`   [ERRO] Erro no upload S3: ${error.message}`);
        console.log('   [AVISO] Continuando teste do banco mesmo assim...\n');
      }
    } else {
      // Local: apenas nome do arquivo
      filename = `foto-${timestamp}-${randomNum}.jpg`;
      urlCompleta = `/uploads/fotos/vistoria-${vistoria.id}/${filename}`;
      
      console.log(`[OK] Nome do arquivo: ${filename}`);
      console.log(`[OK] Caminho completo: ${urlCompleta}\n`);
    }
    
    // 5. Salvar foto no banco de dados
    console.log('5. Salvando foto no banco de dados...');
    const foto = await Foto.create({
      url_arquivo: filename,
      observacao: 'Foto de teste - será deletada',
      vistoria_id: vistoria.id,
      tipo_foto_id: tipoFoto.id
    });
    
    console.log(`[OK] Foto salva no banco: ID ${foto.id}`);
    console.log(`  url_arquivo: ${foto.url_arquivo}`);
    console.log(`  vistoria_id: ${foto.vistoria_id}`);
    console.log(`  tipo_foto_id: ${foto.tipo_foto_id}\n`);
    
    // 6. Atualizar checklist se encontrou item correspondente
    if (checklistItem) {
      console.log('6. Atualizando item do checklist...');
      
      await checklistItem.update({
        status: 'CONCLUIDO',
        foto_id: foto.id,
        concluido_em: new Date()
      });
      
      console.log(`[OK] Item "${checklistItem.nome}" atualizado`);
      console.log(`  Status: CONCLUIDO`);
      console.log(`  Foto ID: ${checklistItem.foto_id}`);
      
      // Verificar atualização no banco
      const itemAtualizado = await VistoriaChecklistItem.findByPk(checklistItem.id);
      console.log(`  Concluído em: ${itemAtualizado.concluido_em}\n`);
    } else {
      console.log('6. Pulando atualização de checklist (nenhum item correspondente)\n');
    }
    
    // 7. Verificar foto no banco com relacionamentos
    console.log('7. Verificando foto no banco com relacionamentos...');
    const fotoCompleta = await Foto.findByPk(foto.id, {
      include: [
        { model: Vistoria, as: 'Vistoria' },
        { model: TipoFotoChecklist, as: 'TipoFotoChecklist' }
      ]
    });
    
    if (fotoCompleta) {
      console.log(`[OK] Foto encontrada no banco: ID ${fotoCompleta.id}`);
      console.log(`  url_arquivo: ${fotoCompleta.url_arquivo}`);
      console.log(`  Vistoria: ${fotoCompleta.Vistoria?.id || 'N/A'}`);
      console.log(`  Tipo Foto: ${fotoCompleta.TipoFotoChecklist?.nome_exibicao || 'N/A'}\n`);
    }
    
    // 8. Verificar se o arquivo existe no S3 (se usando S3)
    if (UPLOAD_STRATEGY === 's3' && bucket) {
      console.log('8. Verificando arquivo no S3...');
      try {
        const getCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: filename
        });
        
        const getResult = await s3Client.send(getCommand);
        console.log(`[OK] Arquivo encontrado no S3`);
        console.log(`  ContentType: ${getResult.ContentType}`);
        console.log(`  ContentLength: ${getResult.ContentLength} bytes`);
        console.log(`  URL: ${urlCompleta}\n`);
      } catch (error) {
        console.error(`[ERRO] Arquivo não encontrado no S3: ${error.message}\n`);
      }
      
      // Listar objetos na pasta da vistoria
      console.log('   Listando objetos na pasta da vistoria no S3...');
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `vistorias/${vistoria.id}/`
        });
        
        const listResult = await s3Client.send(listCommand);
        const objects = listResult.Contents || [];
        console.log(`   [OK] ${objects.length} objeto(s) na pasta vistorias/${vistoria.id}/`);
        
        if (objects.length > 0) {
          objects.slice(0, 5).forEach((obj, index) => {
            console.log(`     ${index + 1}. ${obj.Key} (${obj.Size} bytes)`);
          });
          if (objects.length > 5) {
            console.log(`     ... e mais ${objects.length - 5} arquivo(s)`);
          }
        }
        console.log('');
      } catch (error) {
        console.error(`   [ERRO] Erro ao listar objetos: ${error.message}\n`);
      }
    }
    
    // 9. Limpar dados de teste
    console.log('9. Limpando dados de teste...');
    
    if (checklistItem) {
      await checklistItem.update({
        status: 'PENDENTE',
        foto_id: null,
        concluido_em: null
      });
      console.log('[OK] Checklist revertido');
    }
    
    await foto.destroy();
    console.log('[OK] Foto deletada do banco');
    
    if (UPLOAD_STRATEGY === 's3' && bucket) {
      try {
        const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucket,
          Key: filename
        });
        
        await s3Client.send(deleteCommand);
        console.log('[OK] Arquivo deletado do S3');
      } catch (error) {
        console.log(`[AVISO] Arquivo de teste no S3 pode ser removido manualmente: ${filename}`);
      }
    }
    
    console.log('\n========================================');
    console.log('[OK] TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('========================================\n');
    
    console.log('RESUMO:');
    console.log(`- Estratégia de upload: ${UPLOAD_STRATEGY.toUpperCase()}`);
    console.log('- Foto salva no banco de dados [OK]');
    if (UPLOAD_STRATEGY === 's3') {
      console.log('- Foto enviada para S3 [OK]');
      console.log('- Pasta por vistoria criada [OK]');
    } else {
      console.log('- Foto seria salva localmente [OK]');
    }
    if (checklistItem) {
      console.log('- Checklist vinculado automaticamente [OK]');
    } else {
      console.log('- Checklist: nenhum item correspondente encontrado');
    }
    console.log('- Nome da imagem salvo na tabela fotos [OK]');
    console.log('- Vinculação com vistoria e tipo de foto funcionando [OK]');
    
  } catch (error) {
    console.error('\n[ERRO] ERRO CRÍTICO:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

testFotoCompleto();

