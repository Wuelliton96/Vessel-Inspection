// backend/routes/fotoRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Foto, Vistoria, TipoFotoChecklist, VistoriaChecklistItem } = require('../models');
const { requireAuth, requireVistoriador } = require('../middleware/auth');
const { getUploadConfig, getFileUrl, getFullPath, deleteFile, getStorageInfo, UPLOAD_STRATEGY } = require('../services/uploadService');

// Configurar upload usando o service
const upload = multer(getUploadConfig());

// Log das configurações ao iniciar
const storageInfo = getStorageInfo();
console.log('[FOTO] Configuracoes de Upload:');
console.log(`[FOTO]   - Estrategia: ${storageInfo.strategy}`);
console.log(`[FOTO]   - Tamanho maximo: ${storageInfo.maxFileSize}`);
console.log(`[FOTO]   - Tipos aceitos: ${storageInfo.allowedTypes.join(', ')}`);
console.log(`[FOTO]   - Localizacao: ${storageInfo.location}`);

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth, requireVistoriador);

// GET /api/fotos/vistoria/:id - Buscar fotos de uma vistoria
router.get('/vistoria/:id', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/fotos/vistoria/:id ===');
    console.log('ID da vistoria:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const vistoria = await Vistoria.findByPk(req.params.id);
    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }
    
    // Verificar se o usuário pode acessar esta vistoria
    const isAdmin = req.user.NivelAcesso?.id === 1;
    const isOwner = vistoria.vistoriador_id === req.user.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    const fotos = await Foto.findAll({
      where: { vistoria_id: req.params.id },
      include: [
        { model: TipoFotoChecklist, as: 'TipoFotoChecklist' }
      ],
      order: [['created_at', 'ASC']]
    });
    
    console.log('Fotos encontradas:', fotos.length);
    
    // Construir URLs completas para cada foto
    const fotosComUrlCompleta = fotos.map(foto => {
      const fotoObj = foto.toJSON();
      fotoObj.url_completa = getFullPath(fotoObj.url_arquivo, parseInt(req.params.id));
      return fotoObj;
    });
    
    console.log('=== FIM ROTA GET /api/fotos/vistoria/:id ===\n');
    
    res.json(fotosComUrlCompleta);
  } catch (error) {
    console.error('Erro ao buscar fotos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/fotos - Upload de foto para vistoria
router.post('/', upload.single('foto'), async (req, res) => {
  try {
    console.log('=== ROTA POST /api/fotos ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Dados recebidos:', req.body);
    console.log('UPLOAD_STRATEGY:', UPLOAD_STRATEGY);
    
    if (req.file) {
      console.log('Arquivo recebido:');
      console.log('  - originalname:', req.file.originalname);
      console.log('  - mimetype:', req.file.mimetype);
      console.log('  - size:', req.file.size, 'bytes');
      console.log('  - filename:', req.file.filename);
      console.log('  - destination:', req.file.destination);
      if (UPLOAD_STRATEGY === 's3') {
        console.log('  - key (S3):', req.file.key);
        console.log('  - location (S3):', req.file.location);
        console.log('  - bucket (S3):', req.file.bucket);
      }
      console.log('  - Todas as propriedades:', Object.keys(req.file));
    } else {
      console.log('[UPLOAD] ATENCAO: NENHUM ARQUIVO RECEBIDO!');
    }
    
    // IMPORTANTE: Com FormData, os valores podem vir como strings
    const vistoria_id = req.body.vistoria_id;
    const tipo_foto_id = req.body.tipo_foto_id;
    const observacao = req.body.observacao;
    const checklist_item_id = req.body.checklist_item_id; // ID do item do checklist (opcional, mas mais preciso)
    
    console.log('[UPLOAD] Valores recebidos no req.body:');
    console.log('  - vistoria_id:', vistoria_id, '(tipo:', typeof vistoria_id, ')');
    console.log('  - tipo_foto_id:', tipo_foto_id, '(tipo:', typeof tipo_foto_id, ')');
    console.log('  - checklist_item_id:', checklist_item_id, '(tipo:', typeof checklist_item_id, ')');
    console.log('  - observacao:', observacao);
    
    if (!vistoria_id || !tipo_foto_id) {
      console.error('[UPLOAD] ERRO: vistoria_id ou tipo_foto_id ausente');
      console.error('[UPLOAD] req.body completo:', req.body);
      return res.status(400).json({ error: 'Vistoria ID e Tipo Foto ID são obrigatórios' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo de foto é obrigatório' });
    }
    
    const vistoria = await Vistoria.findByPk(vistoria_id);
    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }
    
    // Verificar se o usuário pode adicionar fotos a esta vistoria
    const isAdmin = req.user.NivelAcesso?.id === 1;
    const isOwner = vistoria.vistoriador_id === req.user.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    let tipoFoto = await TipoFotoChecklist.findByPk(tipo_foto_id);
    
    // Se não encontrar o tipo de foto, usar o primeiro disponível como fallback
    if (!tipoFoto) {
      console.warn(`Tipo de foto ID ${tipo_foto_id} não encontrado. Tentando usar tipo padrão...`);
      
      // Buscar primeiro tipo disponível como fallback
      tipoFoto = await TipoFotoChecklist.findOne({
        order: [['codigo', 'ASC']]
      });
      
      if (!tipoFoto) {
        console.error('Nenhum tipo de foto disponível no sistema!');
        return res.status(500).json({ 
          error: 'Nenhum tipo de foto configurado no sistema. Por favor, configure tipos de foto primeiro.' 
        });
      }
      
      console.log(`Usando tipo de foto padrão: ${tipoFoto.nome_exibicao} (ID: ${tipoFoto.id})`);
    }
    
    // Obter key (S3) ou nome do arquivo (local) para salvar no banco
    console.log('\n[UPLOAD] Processando arquivo...');
    console.log('[UPLOAD] Estratégia:', UPLOAD_STRATEGY);
    console.log('[UPLOAD] req.file.key:', req.file.key);
    console.log('[UPLOAD] req.file.location:', req.file.location);
    console.log('[UPLOAD] req.file.filename:', req.file.filename);
    
    const filename = getFileUrl(req.file);
    console.log('[UPLOAD] Key/Filename a salvar no banco:', filename);
    
    if (UPLOAD_STRATEGY === 's3') {
      if (req.file.location) {
        console.log('[UPLOAD] URL completa do arquivo no S3:', req.file.location);
      } else {
        console.warn('[UPLOAD] ATENCAO: req.file.location não está disponível!');
        console.warn('[UPLOAD] ATENCAO: Verificando se o upload foi bem-sucedido...');
      }
      
      if (req.file.key) {
        console.log('[UPLOAD] OK: S3 Key confirmada:', req.file.key);
      } else {
        console.error('[UPLOAD] ERRO: S3 Key não encontrada! Upload pode ter falhado.');
      }
    } else {
      console.log('[UPLOAD] Caminho completo do arquivo no servidor:', req.file.path);
    }
    
    console.log('[UPLOAD] Salvando foto no banco de dados...');
    console.log(`[UPLOAD] Vistoria ID confirmado: ${vistoria_id} (tipo: ${typeof vistoria_id})`);
    console.log(`[UPLOAD] Tipo Foto ID: ${tipo_foto_id} (tipo: ${typeof tipo_foto_id})`);
    console.log(`[UPLOAD] Filename original: ${filename}\n`);
    
    // Validar dados antes de criar
    const vistoriaIdInt = parseInt(vistoria_id);
    const tipoFotoIdInt = parseInt(tipo_foto_id);
    
    if (isNaN(vistoriaIdInt)) {
      console.error('[UPLOAD] ERRO: vistoria_id inválido:', vistoria_id);
      return res.status(400).json({ error: 'Vistoria ID inválido' });
    }
    
    if (isNaN(tipoFotoIdInt)) {
      console.error('[UPLOAD] ERRO: tipo_foto_id inválido:', tipo_foto_id);
      return res.status(400).json({ error: 'Tipo Foto ID inválido' });
    }
    
    // IMPORTANTE: Garantir que o nome do arquivo contenha checklist_item_id se fornecido
    // Formato desejado: vistorias/id-{vistoria_id}/foto-checklist-{checklist_item_id}-{timestamp}-{random}.jpg
    let filenameFinal = filename;
    let arquivoMovido = false;
    
    // Verificar se checklist_item_id foi fornecido e não está no nome do arquivo
    const checklistItemIdInt = checklist_item_id ? parseInt(checklist_item_id) : null;
    const checklistIdNoNome = checklistItemIdInt && filename.includes(`checklist-${checklistItemIdInt}`);
    
    console.log('[UPLOAD] Verificando nome do arquivo:');
    console.log(`  - Nome atual: ${filename}`);
    console.log(`  - checklist_item_id fornecido: ${checklistItemIdInt || 'null'}`);
    console.log(`  - checklist_id já no nome: ${checklistIdNoNome ? 'sim' : 'não'}`);
    
    if (UPLOAD_STRATEGY === 's3') {
      // Para S3: garantir que a pasta seja vistorias/id-{vistoria_id}/
      const pastaCorreta = `vistorias/id-${vistoriaIdInt}/`;
      
      // Construir nome correto do arquivo
      let nomeArquivoCorreto = null;
      
      // Se checklist_item_id foi fornecido mas não está no nome, construir nome correto
      if (checklistItemIdInt && !checklistIdNoNome) {
        // Extrair timestamp e random do nome atual ou gerar novos
        const match = filename.match(/foto-(\d+)-(\d+)\.jpg/);
        const timestamp = match ? match[1] : Date.now();
        const random = match ? match[2] : Math.round(Math.random() * 1E9);
        nomeArquivoCorreto = `vistorias/id-${vistoriaIdInt}/foto-checklist-${checklistItemIdInt}-${timestamp}-${random}.jpg`;
        console.log('[UPLOAD] ATENCAO: Nome do arquivo será corrigido para incluir checklist_item_id:');
        console.log(`  - Original: ${filename}`);
        console.log(`  - Corrigido: ${nomeArquivoCorreto}`);
      } else if (filename.includes('/id-unknown/') || filename.includes('/unknown/')) {
        // Arquivo foi salvo na pasta errada, precisamos movê-lo no S3
        const keyParts = filename.split('/');
        keyParts[1] = `id-${vistoriaIdInt}`;
        
        // Se checklist_item_id fornecido, adicionar ao nome
        if (checklistItemIdInt && !checklistIdNoNome) {
          const nomeArquivo = keyParts[keyParts.length - 1];
          const match = nomeArquivo.match(/foto-(\d+)-(\d+)\.jpg/);
          if (match) {
            keyParts[keyParts.length - 1] = `foto-checklist-${checklistItemIdInt}-${match[1]}-${match[2]}.jpg`;
          }
        }
        
        nomeArquivoCorreto = keyParts.join('/');
        console.log('[UPLOAD] ATENCAO: Key contém "unknown", será corrigida:');
        console.log(`  - Original: ${filename}`);
        console.log(`  - Corrigida: ${nomeArquivoCorreto}`);
      } else if (!filename.includes(`/id-${vistoriaIdInt}/`)) {
        // Se a pasta não contém o vistoria_id correto, corrigir
        const keyParts = filename.split('/');
        if (keyParts.length >= 2 && keyParts[0] === 'vistorias') {
          keyParts[1] = `id-${vistoriaIdInt}`;
          nomeArquivoCorreto = keyParts.join('/');
          console.log('[UPLOAD] ATENCAO: Key corrigida para usar vistoria_id correto:');
          console.log(`  - Original: ${filename}`);
          console.log(`  - Corrigida: ${nomeArquivoCorreto}`);
        }
      }
      
      // Se precisar renomear o arquivo no S3
      if (nomeArquivoCorreto && nomeArquivoCorreto !== filename) {
        try {
          const { CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
          const { s3Client, bucket } = require('../config/aws');
          
          console.log('[UPLOAD] Movendo arquivo no S3...');
          console.log(`  - De: ${filename}`);
          console.log(`  - Para: ${nomeArquivoCorreto}`);
          
          // Copiar para a nova localização
          const copyCommand = new CopyObjectCommand({
            Bucket: bucket,
            CopySource: `${bucket}/${filename}`,
            Key: nomeArquivoCorreto,
            MetadataDirective: 'COPY'
          });
          
          await s3Client.send(copyCommand);
          console.log('[UPLOAD] OK: Arquivo copiado no S3');
          
          // Deletar o arquivo antigo
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucket,
            Key: filename
          });
          
          await s3Client.send(deleteCommand);
          console.log('[UPLOAD] OK: Arquivo antigo deletado do S3');
          
          filenameFinal = nomeArquivoCorreto;
          arquivoMovido = true;
        } catch (moveError) {
          console.error('[UPLOAD] ERRO: Erro ao mover arquivo no S3:', moveError.message);
          console.error('[UPLOAD] Continuando com nome original...');
          // Continuar mesmo se falhar, mas tentar usar o nome correto no banco
          filenameFinal = nomeArquivoCorreto;
        }
      }
    } else {
      // Para local: garantir que o filename seja apenas o nome, sem pasta
      // A pasta será determinada pelo vistoria_id
      if (filename.includes('/')) {
        const parts = filename.split('/');
        let nomeArquivo = parts[parts.length - 1];
        
        // Se checklist_item_id fornecido mas não está no nome, adicionar
        if (checklistItemIdInt && !nomeArquivo.includes(`checklist-${checklistItemIdInt}`)) {
          const match = nomeArquivo.match(/foto-(\d+)-(\d+)(\.[^.]+)$/);
          if (match) {
            nomeArquivo = `foto-checklist-${checklistItemIdInt}-${match[1]}-${match[2]}${match[3]}`;
            console.log('[UPLOAD] ATENCAO: Nome do arquivo local corrigido para incluir checklist_item_id:');
            console.log(`  - Original: ${parts[parts.length - 1]}`);
            console.log(`  - Corrigido: ${nomeArquivo}`);
          }
        }
        
        filenameFinal = nomeArquivo;
      }
    }
    
    if (!filenameFinal || filenameFinal.trim() === '') {
      console.error('[UPLOAD] ERRO: filename inválido:', filenameFinal);
      return res.status(400).json({ error: 'Nome do arquivo inválido' });
    }
    
    console.log('[UPLOAD] Dados validados para inserção:');
    console.log(`  - url_arquivo: "${filenameFinal}"`);
    console.log(`  - vistoria_id: ${vistoriaIdInt}`);
    console.log(`  - tipo_foto_id: ${tipoFotoIdInt}`);
    console.log(`  - observacao: ${observacao || 'null'}\n`);
    
    let foto;
    try {
      // Preparar dados para criação
      const fotoData = {
        url_arquivo: filenameFinal, // Salva a key do S3 ou nome do arquivo local CORRETO
        observacao: observacao || null,
        vistoria_id: vistoriaIdInt,
        tipo_foto_id: tipoFotoIdInt
      };
      
      console.log('[UPLOAD] Dados para criar foto no banco:');
      console.log('  - url_arquivo:', fotoData.url_arquivo);
      console.log('  - vistoria_id:', fotoData.vistoria_id, '(tipo:', typeof fotoData.vistoria_id, ')');
      console.log('  - tipo_foto_id:', fotoData.tipo_foto_id, '(tipo:', typeof fotoData.tipo_foto_id, ')');
      console.log('  - observacao:', fotoData.observacao || 'null');
      
      // Criar foto no banco
      foto = await Foto.create(fotoData);
      
      console.log('[UPLOAD] OK: Foto criada no banco com ID:', foto.id);
      console.log('  - url_arquivo:', foto.url_arquivo);
      console.log('  - vistoria_id:', foto.vistoria_id);
      console.log('  - tipo_foto_id:', foto.tipo_foto_id);
      console.log('  - created_at:', foto.created_at);
      
      // Verificar se realmente foi salva (buscar novamente do banco)
      const fotoVerificada = await Foto.findByPk(foto.id, {
        include: [
          { model: TipoFotoChecklist, as: 'TipoFotoChecklist' },
          { model: Vistoria, as: 'Vistoria', attributes: ['id', 'vistoriador_id'] }
        ]
      });
      
      if (!fotoVerificada) {
        console.error('[UPLOAD] ERRO CRITICO: Foto criada mas não encontrada no banco!');
        return res.status(500).json({ error: 'Erro ao salvar foto no banco de dados' });
      }
      
      console.log('[UPLOAD] OK: Foto verificada no banco:');
      console.log('  - ID:', fotoVerificada.id);
      console.log('  - url_arquivo:', fotoVerificada.url_arquivo);
      console.log('  - vistoria_id:', fotoVerificada.vistoria_id);
      console.log('  - tipo_foto_id:', fotoVerificada.tipo_foto_id);
      
      // Verificar se o nome do arquivo contém checklist_item_id se foi fornecido
      if (checklist_item_id) {
        const itemIdInt = parseInt(checklist_item_id);
        if (!isNaN(itemIdInt) && fotoVerificada.url_arquivo.includes(`checklist-${itemIdInt}`)) {
          console.log(`[UPLOAD] OK: Nome do arquivo contém checklist_item_id: checklist-${itemIdInt}`);
        } else {
          console.warn(`[UPLOAD] ATENCAO: Nome do arquivo não contém checklist_item_id esperado: ${itemIdInt}`);
          console.warn(`  Nome atual: ${fotoVerificada.url_arquivo}`);
        }
      }
      
      // Verificar se a pasta no url_arquivo está correta
      if (UPLOAD_STRATEGY === 's3') {
        if (fotoVerificada.url_arquivo.includes(`vistorias/id-${vistoriaIdInt}/`)) {
          console.log(`[UPLOAD] OK: Pasta no banco está correta: vistorias/id-${vistoriaIdInt}/`);
        } else {
          console.error(`[UPLOAD] ERRO: Pasta no banco está incorreta! Esperado: vistorias/id-${vistoriaIdInt}/`);
          console.error(`  Recebido: ${fotoVerificada.url_arquivo}`);
        }
      }
      
      // Atualizar referência da foto para usar a versão verificada
      foto = fotoVerificada;
      
    } catch (createError) {
      console.error('[UPLOAD] ERRO: Erro ao criar foto no banco:');
      console.error('  - Tipo de erro:', createError.name);
      console.error('  - Mensagem:', createError.message);
      if (createError.errors) {
        console.error('  - Erros de validação:');
        createError.errors.forEach(err => {
          console.error(`    * ${err.path}: ${err.message}`);
        });
      }
      console.error('  - Stack:', createError.stack);
      throw createError; // Re-lançar para ser capturado pelo catch externo
    }
    
    // Construir URL completa para resposta (para exibição)
    const urlCompleta = getFullPath(foto.url_arquivo, foto.vistoria_id);
    console.log('URL completa construída para exibição:', urlCompleta);
    
    // Buscar item do checklist correspondente ao tipo de foto e marcar como concluído
    // Prioridade: 1. checklist_item_id (mais preciso), 2. busca por nome
    try {
      let checklistItem = null;
      
      console.log('\n[CHECKLIST] === INICIANDO BUSCA DO ITEM DO CHECKLIST ===');
      console.log(`[CHECKLIST] checklist_item_id recebido: ${checklist_item_id} (tipo: ${typeof checklist_item_id})`);
      console.log(`[CHECKLIST] vistoria_id: ${vistoria_id} (tipo: ${typeof vistoria_id})`);
      
      // 1. Se checklist_item_id foi fornecido, usar ele diretamente (mais preciso)
      if (checklist_item_id) {
        const itemIdInt = parseInt(checklist_item_id);
        console.log(`[CHECKLIST] Tentando converter para inteiro: ${itemIdInt} (é NaN? ${isNaN(itemIdInt)})`);
        
        if (!isNaN(itemIdInt)) {
          console.log(`[CHECKLIST] Buscando item do checklist com ID: ${itemIdInt} e vistoria_id: ${parseInt(vistoria_id)}`);
          
          // Buscar item mesmo se não estiver PENDENTE (pode estar em outro status)
          checklistItem = await VistoriaChecklistItem.findOne({
            where: {
              id: itemIdInt,
              vistoria_id: parseInt(vistoria_id)
            }
          });
          
          if (checklistItem) {
            console.log(`[CHECKLIST] OK: Item do checklist encontrado por ID:`);
            console.log(`[CHECKLIST]   - ID: ${checklistItem.id}`);
            console.log(`[CHECKLIST]   - Nome: "${checklistItem.nome}"`);
            console.log(`[CHECKLIST]   - Status atual: ${checklistItem.status}`);
            console.log(`[CHECKLIST]   - Vistoria ID: ${checklistItem.vistoria_id}`);
            console.log(`[CHECKLIST]   - Foto ID atual: ${checklistItem.foto_id || 'null'}`);
            
            // Se já existe uma foto vinculada, deletar a foto antiga antes de vincular a nova
            if (checklistItem.foto_id) {
              console.log(`[CHECKLIST] ATENCAO: Item já possui foto vinculada (ID: ${checklistItem.foto_id})`);
              console.log(`[CHECKLIST] Deletando foto antiga antes de vincular a nova...`);
              
              try {
                const fotoAntiga = await Foto.findByPk(checklistItem.foto_id);
                if (fotoAntiga) {
                  console.log(`[CHECKLIST] Foto antiga encontrada: ID ${fotoAntiga.id}, URL: ${fotoAntiga.url_arquivo}`);
                  
                  // Deletar arquivo (S3 ou local)
                  await deleteFile(fotoAntiga.url_arquivo);
                  console.log(`[CHECKLIST] OK: Arquivo da foto antiga deletado`);
                  
                  // Deletar registro do banco
                  await fotoAntiga.destroy();
                  console.log(`[CHECKLIST] OK: Registro da foto antiga deletado do banco`);
                } else {
                  console.log(`[CHECKLIST] ATENCAO: Foto antiga (ID: ${checklistItem.foto_id}) não encontrada no banco`);
                }
              } catch (deleteError) {
                console.error(`[CHECKLIST] ERRO ao deletar foto antiga:`, deleteError.message);
                console.error(`[CHECKLIST] Continuando com o upload da nova foto...`);
                // Continuar mesmo se falhar ao deletar a foto antiga
              }
            }
          } else {
            console.log(`[CHECKLIST] ATENCAO: Item do checklist ID ${itemIdInt} NÃO encontrado para vistoria ${vistoria_id}`);
            
            // Buscar todos os itens da vistoria para debug
            const todosItens = await VistoriaChecklistItem.findAll({
              where: { vistoria_id: parseInt(vistoria_id) },
              attributes: ['id', 'nome', 'status', 'vistoria_id'],
              order: [['ordem', 'ASC']]
            });
            
            console.log(`[CHECKLIST] Itens disponíveis na vistoria ${vistoria_id} (total: ${todosItens.length}):`);
            todosItens.forEach((item, index) => {
              console.log(`[CHECKLIST]   ${index + 1}. ID: ${item.id}, Nome: "${item.nome}", Status: ${item.status}`);
            });
            
            // Verificar se há algum item com ID próximo (pode ser erro de digitação)
            const itemProximo = todosItens.find(item => 
              Math.abs(item.id - itemIdInt) <= 5
            );
            if (itemProximo) {
              console.log(`[CHECKLIST] ATENCAO: Encontrado item com ID próximo: ${itemProximo.id} (diferença: ${Math.abs(itemProximo.id - itemIdInt)})`);
            }
          }
        } else {
          console.warn(`[CHECKLIST] ATENCAO: checklist_item_id inválido (não é um número): ${checklist_item_id}`);
        }
      } else {
        console.log(`[CHECKLIST] ATENCAO: checklist_item_id NÃO foi fornecido no req.body`);
        console.log(`[CHECKLIST] req.body keys disponíveis:`, Object.keys(req.body));
      }
      
      // 2. Se não encontrou por ID, buscar por nome do tipo de foto
      if (!checklistItem && tipoFoto && tipoFoto.nome_exibicao) {
        const { Op } = require('sequelize');
        const nomeTipoFoto = tipoFoto.nome_exibicao.trim();
        
        console.log('Buscando item do checklist por nome:', nomeTipoFoto);
        
        // 2.1. Tentar busca exata (case-insensitive)
        checklistItem = await VistoriaChecklistItem.findOne({
          where: {
            vistoria_id: parseInt(vistoria_id),
            nome: {
              [Op.iLike]: nomeTipoFoto // PostgreSQL case-insensitive
            },
            status: 'PENDENTE'
          },
          order: [['ordem', 'ASC']] // Pegar o primeiro se houver múltiplos
        });
        
        // 2. Se não encontrar, buscar todos os itens pendentes e fazer busca parcial
        if (!checklistItem) {
          const todosItens = await VistoriaChecklistItem.findAll({
            where: {
              vistoria_id: parseInt(vistoria_id),
              status: 'PENDENTE'
            }
          });
          
          console.log('Itens pendentes encontrados:', todosItens.map(i => i.nome));
          
          // Mapeamento inteligente de palavras-chave para tipos de foto
          // O nome do tipo de foto (ex: "Foto do Casco") é comparado com o nome do item do checklist
          const mapeamentoPalavrasChave = {
            'casco': ['casco', 'chassi', 'hull', 'casca', 'plaqueta do casco', 'plaqueta casco', 'plaqueta do casco/chassi', 'plaqueta casco/chassi'],
            'motor': ['motor', 'engine', 'máquina', 'maquina', 'propulsão', 'propulsao', 'rabeta', 'acionamento do motor', 'acionamento motor', 'visão geral do motor', 'visao geral motor', 'visao geral do motor', 'plaqueta do motor', 'plaqueta motor', 'plaqueta do motor/etiqueta', 'horas do motor', 'horimetro', 'horas motor'],
            'interior': ['interior', 'inside', 'interno', 'cockpit'],
            'documento': ['documento', 'document', 'papel', 'tie', 'inscrição', 'inscricao', 'nº de inscrição', 'numero inscricao', 'nº inscrição', 'num inscricao', 'confirmação', 'confirmacao', 'capitania', 'documentos (tie)', 'documentos tie', 'confirmação do nº de inscrição e nome', 'confirmação numero inscricao nome'],
            'proa': ['proa', 'bow', 'frente', 'frontal', 'proa (frente)', 'proa frente'],
            'popa': ['popa', 'stern', 'traseira', 'traseiro', 'popa (traseira)', 'popa traseira'],
            'convés': ['convés', 'conves', 'deck', 'coberta'],
            'cabine': ['cabine', 'cabin'],
            'timão': ['timão', 'timao', 'rudder', 'leme'],
            'hélice': ['hélice', 'helice', 'propeller', 'propulsão', 'propulsao'],
            'painel': ['painel', 'painel de comando', 'painel comando', 'instrumentos', 'comando', 'equipamentos do painel', 'equipamentos painel', 'painel de comando geral'],
            'horas': ['horas', 'horímetro', 'horimetro', 'hors', 'horas do motor', 'horas motor'],
            'extintor': ['extintor', 'extintores', 'validade', 'extintores + validade', 'extintores validade'],
            'salva-vidas': ['salva-vidas', 'salva vidas', 'colete', 'boia', 'boias salva-vidas', 'coletes salva-vidas', 'boias', 'coletes'],
            'bateria': ['bateria', 'baterias'],
            'bomba': ['bomba', 'bombas', 'porão', 'porao', 'água doce', 'agua doce', 'bombas de porão', 'bombas porao', 'bombas de água doce', 'bombas de agua doce'],
            'âncora': ['âncora', 'ancora', 'ancoragem'],
            'costado': ['costado', 'lateral', 'direito', 'esquerdo', 'costado direito', 'costado esquerdo']
          };
          
          // Extrair palavra-chave do tipo de foto
          const nomeTipoLower = nomeTipoFoto.toLowerCase().trim();
          let palavraChave = null;
          
          // Remover "Foto do/da/dos/das" do tipo de foto para buscar palavra-chave
          const nomeTipoLimpo = nomeTipoLower.replace(/^foto\s+(do|da|dos|das)\s+/, '').trim();
          
          for (const [chave, variações] of Object.entries(mapeamentoPalavrasChave)) {
            if (variações.some(v => nomeTipoLimpo.includes(v) || nomeTipoLower.includes(v))) {
              palavraChave = chave;
              console.log(`Palavra-chave identificada: "${palavraChave}" do tipo "${nomeTipoFoto}"`);
              break;
            }
          }
          
          // Se encontrou palavra-chave, buscar por ela nos itens
          if (palavraChave) {
            const variações = mapeamentoPalavrasChave[palavraChave];
            checklistItem = todosItens.find(item => {
              const nomeItem = item.nome?.toLowerCase().trim() || '';
              const match = variações.some(v => nomeItem.includes(v));
              if (match) {
                console.log(`[CHECKLIST] OK: Match encontrado por palavra-chave: "${item.nome}" contém "${variações.find(v => nomeItem.includes(v))}"`);
              }
              return match;
            });
          }
          
          // Se ainda não encontrou, fazer busca parcial mais genérica
          if (!checklistItem) {
            checklistItem = todosItens.find(item => {
              const nomeItem = item.nome?.toLowerCase().trim() || '';
              const nomeTipo = nomeTipoFoto.toLowerCase().trim();
              
              // Busca exata
              if (nomeItem === nomeTipo) return true;
              
              // Busca parcial (contém)
              if (nomeItem.includes(nomeTipo) || nomeTipo.includes(nomeItem)) return true;
              
              // Remover "Foto do/da/dos/das" e comparar
              const nomeItemLimpo = nomeItem.replace(/^foto\s+(do|da|dos|das)\s+/, '');
              const nomeTipoLimpo2 = nomeTipo.replace(/^foto\s+(do|da|dos|das)\s+/, '');
              if (nomeItemLimpo === nomeTipoLimpo2) return true;
              
              // Remover parenteses e informações extras
              const nomeItemSemParenteses = nomeItem.replace(/\s*\([^)]*\)/g, '').trim();
              const nomeTipoSemParenteses = nomeTipo.replace(/\s*\([^)]*\)/g, '').trim();
              if (nomeItemSemParenteses === nomeTipoSemParenteses) return true;
              
              // Extrair primeira palavra de cada e comparar
              const primeiraPalavraItem = nomeItem.split(/\s+/)[0];
              const primeiraPalavraTipo = nomeTipo.split(/\s+/)[0];
              if (primeiraPalavraItem && primeiraPalavraTipo && primeiraPalavraItem === primeiraPalavraTipo) return true;
              
              return false;
            });
            
            if (checklistItem) {
              console.log(`[CHECKLIST] OK: Match encontrado por busca parcial: "${checklistItem.nome}"`);
            }
          }
        }
      }
      
      // ATUALIZAR CHECKLIST - Executar sempre que checklistItem for encontrado (por ID ou por nome)
      if (checklistItem) {
        console.log(`[CHECKLIST] === ATUALIZANDO ITEM DO CHECKLIST ===`);
        console.log(`[CHECKLIST] Item antes da atualização:`);
        console.log(`[CHECKLIST]   - ID: ${checklistItem.id}`);
        console.log(`[CHECKLIST]   - Nome: "${checklistItem.nome}"`);
        console.log(`[CHECKLIST]   - Status atual: ${checklistItem.status}`);
        console.log(`[CHECKLIST]   - Foto ID atual: ${checklistItem.foto_id || 'null'}`);
        console.log(`[CHECKLIST] Foto a ser vinculada:`);
        console.log(`[CHECKLIST]   - Foto ID: ${foto.id}`);
        console.log(`[CHECKLIST]   - URL arquivo: ${foto.url_arquivo}`);
        
        // Marcar item como concluído e vincular a foto
        const updateData = {
          status: 'CONCLUIDO',
          foto_id: foto.id,
          concluido_em: new Date()
        };
        
        console.log(`[CHECKLIST] Dados para atualização:`, updateData);
        
        try {
          await checklistItem.update(updateData);
          console.log(`[CHECKLIST] OK: update() executado com sucesso`);
          
          // Verificar se foi atualizado corretamente
          await checklistItem.reload();
          console.log(`[CHECKLIST] OK: reload() executado`);
          
          console.log(`[CHECKLIST] OK: Item do checklist atualizado:`);
          console.log(`[CHECKLIST]   - Item ID: ${checklistItem.id}`);
          console.log(`[CHECKLIST]   - Nome: "${checklistItem.nome}"`);
          console.log(`[CHECKLIST]   - Foto ID vinculada: ${checklistItem.foto_id}`);
          console.log(`[CHECKLIST]   - Status: ${checklistItem.status}`);
          console.log(`[CHECKLIST]   - Concluído em: ${checklistItem.concluido_em}`);
          
          // Verificação adicional - buscar do banco novamente para garantir
          const itemVerificado = await VistoriaChecklistItem.findByPk(checklistItem.id);
          if (itemVerificado) {
            console.log(`[CHECKLIST] Verificação no banco de dados:`);
            console.log(`[CHECKLIST]   - ID: ${itemVerificado.id}`);
            console.log(`[CHECKLIST]   - Status: ${itemVerificado.status}`);
            console.log(`[CHECKLIST]   - Foto ID: ${itemVerificado.foto_id || 'null'}`);
            
            if (itemVerificado.foto_id !== foto.id) {
              console.error(`[CHECKLIST] ERRO CRITICO: Foto ID não foi vinculada corretamente!`);
              console.error(`[CHECKLIST]   Esperado: ${foto.id}`);
              console.error(`[CHECKLIST]   Recebido: ${itemVerificado.foto_id || 'null'}`);
            } else {
              console.log(`[CHECKLIST] OK: Verificação: Foto ID vinculada corretamente ao checklist no banco`);
            }
            
            if (itemVerificado.status !== 'CONCLUIDO') {
              console.error(`[CHECKLIST] ERRO CRITICO: Status não foi atualizado para CONCLUIDO!`);
              console.error(`[CHECKLIST]   Status atual: ${itemVerificado.status}`);
            } else {
              console.log(`[CHECKLIST] OK: Verificação: Status atualizado para CONCLUIDO no banco`);
            }
          } else {
            console.error(`[CHECKLIST] ERRO CRITICO: Item não encontrado no banco após atualização!`);
          }
        } catch (updateError) {
          console.error(`[CHECKLIST] ERRO: ao atualizar checklist:`, updateError.message);
          console.error(`[CHECKLIST] Stack:`, updateError.stack);
          throw updateError; // Re-lançar para não silenciar o erro
        }
      } else {
        console.log(`[CHECKLIST] ATENCAO: Nenhum item do checklist encontrado`);
        if (checklist_item_id) {
          console.log(`[CHECKLIST]   - checklist_item_id fornecido: ${checklist_item_id}`);
          console.log(`[CHECKLIST]   - Tipo: ${typeof checklist_item_id}`);
          console.log(`[CHECKLIST]   - Convertido para int: ${parseInt(checklist_item_id)}`);
        }
        if (tipoFoto && tipoFoto.nome_exibicao) {
          console.log(`[CHECKLIST]   - Tipo de foto: "${tipoFoto.nome_exibicao}"`);
        }
        console.log(`[CHECKLIST]   (A foto foi salva, mas nenhum item foi vinculado automaticamente)`);
      }
      
      console.log(`[CHECKLIST] === FIM DA BUSCA DO ITEM DO CHECKLIST ===\n`);
    } catch (checklistError) {
      // Não falhar o upload da foto se houver erro ao atualizar checklist
      console.error('Erro ao atualizar checklist (não crítico):', checklistError);
    }
    
    // Construir URL completa para retornar ao frontend
    const fotoObj = foto.toJSON();
    fotoObj.url_completa = getFullPath(fotoObj.url_arquivo, parseInt(vistoria_id));
    
    console.log('=== FIM ROTA POST /api/fotos ===');
    console.log('[UPLOAD] OK: Foto criada e salva com sucesso');
    console.log(`  - Foto ID: ${foto.id}`);
    console.log(`  - Vistoria ID: ${foto.vistoria_id}`);
    console.log(`  - Key/Filename: ${foto.url_arquivo}`);
    console.log(`  - URL completa: ${fotoObj.url_completa}`);
    // Verificar se checklist foi atualizado
    let itemAtualizado = null;
    try {
      itemAtualizado = await VistoriaChecklistItem.findOne({
        where: { foto_id: foto.id }
      });
      console.log(`  - Item do checklist atualizado: ${itemAtualizado ? 'sim' : 'não'}`);
      if (itemAtualizado) {
        console.log(`    └─ Item: "${itemAtualizado.nome}" (ID: ${itemAtualizado.id})`);
      }
    } catch (checkError) {
      console.warn('[UPLOAD] ATENCAO: Erro ao verificar checklist:', checkError.message);
    }
    console.log('');
    
    // Resposta final
    const resposta = {
      ...fotoObj,
      checklist_item_id_enviado: checklist_item_id || null, // Incluir o ID que foi enviado
      checklist_atualizado: itemAtualizado ? {
        item_id: itemAtualizado.id,
        item_nome: itemAtualizado.nome,
        status: itemAtualizado.status,
        foto_id: itemAtualizado.foto_id
      } : null
    };
    
    console.log('\n[UPLOAD] === RESUMO FINAL ===');
    console.log('[UPLOAD] Resposta enviada ao frontend:');
    console.log(`  - Foto ID: ${resposta.id}`);
    console.log(`  - url_arquivo: ${resposta.url_arquivo}`);
    console.log(`  - url_completa: ${resposta.url_completa}`);
    console.log(`  - checklist_item_id_enviado: ${resposta.checklist_item_id_enviado || 'null'}`);
    console.log(`  - checklist_atualizado: ${resposta.checklist_atualizado ? 'sim' : 'não'}`);
    if (resposta.checklist_atualizado) {
      console.log(`    └─ Item ID atualizado: ${resposta.checklist_atualizado.item_id}`);
      console.log(`    └─ Item Nome: "${resposta.checklist_atualizado.item_nome}"`);
      console.log(`    └─ Status: ${resposta.checklist_atualizado.status}`);
      console.log(`    └─ Foto ID vinculada: ${resposta.checklist_atualizado.foto_id}`);
      
      // Verificar se o ID enviado corresponde ao ID atualizado
      if (checklist_item_id && resposta.checklist_atualizado.item_id) {
        const idEnviado = parseInt(checklist_item_id);
        const idAtualizado = resposta.checklist_atualizado.item_id;
        if (idEnviado === idAtualizado) {
          console.log(`[UPLOAD] OK: ID enviado (${idEnviado}) corresponde ao ID atualizado (${idAtualizado})`);
        } else {
          console.error(`[UPLOAD] ERRO: ID enviado (${idEnviado}) NÃO corresponde ao ID atualizado (${idAtualizado})!`);
        }
      }
    }
    console.log('[UPLOAD] === FIM DO RESUMO ===\n');
    
    res.status(201).json(resposta);
  } catch (error) {
    console.error('Erro ao criar foto:', error);
    console.error('Stack trace:', error.stack);
    
    // Garantir que sempre retornamos JSON
    const errorMessage = error.message || 'Erro interno do servidor';
    
    // Tratar erros específicos do S3
    if (error.name === 'AccessControlListNotSupported') {
      return res.status(400).json({ 
        error: 'O bucket S3 não permite ACLs. Configure as políticas do bucket para permitir acesso público aos objetos.' 
      });
    }
    
    if (error.name === 'NoSuchBucket') {
      return res.status(400).json({ 
        error: 'Bucket S3 não encontrado. Verifique a configuração do AWS_S3_BUCKET.' 
      });
    }
    
    if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
      return res.status(401).json({ 
        error: 'Credenciais AWS inválidas. Verifique AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY.' 
      });
    }
    
    res.status(500).json({ error: errorMessage });
  }
});

// GET /api/fotos/:id/imagem-url - Obter URL da imagem (retorna JSON com presigned URL)
router.get('/:id/imagem-url', async (req, res) => {
  try {
    console.log('\n=== ROTA GET /api/fotos/:id/imagem-url ===');
    console.log('ID da foto:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const foto = await Foto.findByPk(req.params.id, {
      include: [{ model: Vistoria, as: 'Vistoria' }]
    });
    
    if (!foto) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }
    
    // Verificar se o usuário pode acessar esta foto
    const isAdmin = req.user.NivelAcesso?.id === 1;
    const isOwner = foto.Vistoria.vistoriador_id === req.user.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Se está no S3, gerar presigned URL
    if (foto.url_arquivo && foto.url_arquivo.startsWith('vistorias/')) {
      const { s3Client, bucket } = require('../config/aws');
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      
      const key = foto.url_arquivo;
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      
      return res.json({ 
        url: presignedUrl,
        foto_id: foto.id,
        encontrada: true
      });
    }
    
    // Se não está no S3, retornar URL local
    const { getFullPath } = require('../services/uploadService');
    const url = getFullPath(foto.url_arquivo, foto.vistoria_id);
    const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    return res.json({ 
      url: url.startsWith('http') ? url : `${baseUrl}${url}`,
      foto_id: foto.id,
      encontrada: true
    });
  } catch (error) {
    console.error('Erro ao obter URL da imagem:', error);
    return res.status(500).json({ 
      error: 'Erro ao obter URL da imagem',
      encontrada: false
    });
  }
});

// GET /api/fotos/:id/imagem - Servir imagem (S3 ou local)
router.get('/:id/imagem', async (req, res) => {
  try {
    console.log('\n=== ROTA GET /api/fotos/:id/imagem ===');
    console.log('ID da foto:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('UPLOAD_STRATEGY:', UPLOAD_STRATEGY);
    console.log('Timestamp:', new Date().toISOString());
    
    const foto = await Foto.findByPk(req.params.id, {
      include: [{ model: Vistoria, as: 'Vistoria' }]
    });
    
    if (!foto) {
      console.log('Foto não encontrada');
      console.log('=== FIM ROTA GET /api/fotos/:id/imagem (404) ===\n');
      return res.status(404).json({ error: 'Foto não encontrada' });
    }
    
    console.log('[IMAGEM] Foto encontrada:');
    console.log(`[IMAGEM]   - ID: ${foto.id}`);
    console.log(`[IMAGEM]   - url_arquivo: ${foto.url_arquivo}`);
    console.log(`[IMAGEM]   - vistoria_id: ${foto.vistoria_id}`);
    
    // Verificar se o usuário pode acessar esta foto
    const isAdmin = req.user.NivelAcesso?.id === 1;
    const isOwner = foto.Vistoria.vistoriador_id === req.user.id;
    
    if (!isAdmin && !isOwner) {
      console.log('Acesso negado');
      console.log('=== FIM ROTA GET /api/fotos/:id/imagem (403) ===\n');
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Verificar se a imagem está no S3
    // Se url_arquivo começa com "vistorias/", definitivamente está no S3
    // Se não começa com "vistorias/" mas também não é uma URL HTTP, pode estar no S3 (caso antigo)
    const isS3File = foto.url_arquivo && (
      foto.url_arquivo.startsWith('vistorias/') || 
      foto.url_arquivo.includes('/id-') ||
      (!foto.url_arquivo.includes('http') && !foto.url_arquivo.startsWith('/'))
    );
    
    // SEMPRE usar S3 se:
    // 1. UPLOAD_STRATEGY está configurado como 's3', OU
    // 2. A imagem claramente está no S3 (começa com "vistorias/")
    const shouldUseS3 = UPLOAD_STRATEGY === 's3' || isS3File;
    
    console.log(`[IMAGEM] Estrategia de armazenamento:`);
    console.log(`[IMAGEM]   - UPLOAD_STRATEGY: ${UPLOAD_STRATEGY}`);
    console.log(`[IMAGEM]   - url_arquivo: "${foto.url_arquivo}"`);
    console.log(`[IMAGEM]   - url_arquivo começa com "vistorias/": ${foto.url_arquivo?.startsWith('vistorias/')}`);
    console.log(`[IMAGEM]   - url_arquivo contém "/id-": ${foto.url_arquivo?.includes('/id-')}`);
    console.log(`[IMAGEM]   - É arquivo S3: ${isS3File}`);
    console.log(`[IMAGEM]   - Usar S3: ${shouldUseS3}`);
    
    // FORÇAR uso do S3 se a imagem claramente está no S3
    // Se começa com "vistorias/", SEMPRE está no S3, independente da configuração
    if (foto.url_arquivo && foto.url_arquivo.startsWith('vistorias/')) {
      console.log(`[IMAGEM] FORÇANDO uso do S3 - imagem claramente está no S3 (começa com "vistorias/")`);
      // Garantir que shouldUseS3 seja true
      const shouldUseS3 = true;
      
      // Entrar diretamente no bloco S3
      // S3: Gerar presigned URL ou redirecionar para URL pública
      try {
        const { s3Client, bucket } = require('../config/aws');
        const { GetObjectCommand } = require('@aws-sdk/client-s3');
        const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
        
        // A key do S3 é o url_arquivo completo
        let key = foto.url_arquivo;
        
        console.log('[IMAGEM] Configuração S3 (FORÇADO):');
        console.log(`[IMAGEM]   - Bucket: ${bucket}`);
        console.log(`[IMAGEM]   - Key: ${key}`);
        console.log(`[IMAGEM]   - Vistoria ID: ${foto.vistoria_id}`);
        
        if (!bucket) {
          throw new Error('Bucket S3 não configurado. Verifique AWS_S3_BUCKET no .env');
        }
        
        if (!key) {
          throw new Error('Key do arquivo não encontrada');
        }
        
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: key
        });
        
        // VERIFICAR SE A IMAGEM EXISTE NO S3 ANTES DE GERAR PRESIGNED URL
        console.log('[IMAGEM] Verificando se imagem existe no S3...');
        const { HeadObjectCommand } = require('@aws-sdk/client-s3');
        const headCommand = new HeadObjectCommand({
          Bucket: bucket,
          Key: key
        });
        
        try {
          const headResult = await s3Client.send(headCommand);
          console.log('[IMAGEM] OK: Imagem encontrada no S3!');
          console.log(`[IMAGEM]   - Content-Type: ${headResult.ContentType}`);
          console.log(`[IMAGEM]   - Content-Length: ${headResult.ContentLength} bytes`);
          console.log(`[IMAGEM]   - LastModified: ${headResult.LastModified}`);
        } catch (headError) {
          console.error('[IMAGEM] ERRO: Imagem não encontrada no S3!');
          console.error(`[IMAGEM]   - Nome do erro: ${headError.name}`);
          console.error(`[IMAGEM]   - Código: ${headError.code}`);
          console.error(`[IMAGEM]   - Mensagem: ${headError.message}`);
          
          if (headError.name === 'NoSuchKey' || headError.code === 'NoSuchKey') {
            return res.status(404).json({ 
              error: 'Imagem não encontrada no S3',
              details: `O arquivo não foi encontrado no bucket S3. Key: "${key}"`,
              foto_id: foto.id,
              url_arquivo: foto.url_arquivo,
              key_tentada: key,
              bucket: bucket
            });
          }
          throw headError;
        }
        
        console.log('[IMAGEM] Gerando presigned URL...');
        console.log(`[IMAGEM]   - Comando: GetObjectCommand({ Bucket: "${bucket}", Key: "${key}" })`);
        
        // Gerar presigned URL válida por 1 hora
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        console.log('[IMAGEM] Presigned URL gerada com sucesso');
        console.log(`[IMAGEM] URL completa: ${presignedUrl}`);
        console.log('[IMAGEM] Redirecionando para presigned URL do S3...');
        console.log('=== FIM ROTA GET /api/fotos/:id/imagem (302) ===\n');
        
        // IMPORTANTE: Sempre redirecionar para o S3 quando a imagem está no S3
        return res.redirect(302, presignedUrl);
      } catch (s3Error) {
        console.error('[IMAGEM] ERRO ao gerar presigned URL:', s3Error.message);
        console.error('[IMAGEM] Stack:', s3Error.stack);
        console.error('[IMAGEM] Detalhes do erro:', {
          name: s3Error.name,
          code: s3Error.code,
          message: s3Error.message,
          bucket: bucket,
          key: foto.url_arquivo
        });
        
        // Se o erro for de credenciais ou configuração, retornar erro específico
        if (s3Error.name === 'InvalidAccessKeyId' || s3Error.name === 'SignatureDoesNotMatch') {
          console.error('[IMAGEM] ERRO: Credenciais AWS inválidas ou não configuradas');
          return res.status(500).json({ 
            error: 'Erro de configuração AWS',
            details: 'Credenciais AWS inválidas ou não configuradas. Verifique AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY no .env',
            foto_id: foto.id,
            url_arquivo: foto.url_arquivo
          });
        }
        
        // Se o erro for de bucket não encontrado
        if (s3Error.name === 'NoSuchBucket' || s3Error.code === 'NoSuchBucket') {
          console.error('[IMAGEM] ERRO: Bucket não encontrado');
          return res.status(500).json({ 
            error: 'Bucket S3 não encontrado',
            details: `Bucket "${bucket}" não foi encontrado. Verifique AWS_S3_BUCKET no .env`,
            foto_id: foto.id,
            url_arquivo: foto.url_arquivo,
            bucket: bucket
          });
        }
        
        // Se o erro for de arquivo não encontrado
        if (s3Error.name === 'NoSuchKey' || s3Error.code === 'NoSuchKey') {
          console.error('[IMAGEM] ERRO: Arquivo não encontrado no S3');
          console.error(`[IMAGEM] Tentando key: "${foto.url_arquivo}" no bucket "${bucket}"`);
          return res.status(404).json({ 
            error: 'Imagem não encontrada no S3',
            details: `O arquivo não foi encontrado no bucket S3. Key: "${foto.url_arquivo}"`,
            foto_id: foto.id,
            url_arquivo: foto.url_arquivo,
            key_tentada: foto.url_arquivo,
            bucket: bucket
          });
        }
        
        // Fallback: tentar URL pública
        try {
          const publicUrl = getFullPath(foto.url_arquivo, foto.vistoria_id);
          console.log('[IMAGEM] Tentando URL pública como fallback:', publicUrl);
          console.log('=== FIM ROTA GET /api/fotos/:id/imagem (302) ===\n');
          return res.redirect(302, publicUrl);
        } catch (fallbackError) {
          console.error('[IMAGEM] ERRO no fallback:', fallbackError.message);
          return res.status(500).json({ 
            error: 'Erro ao acessar imagem no S3',
            details: s3Error.message,
            foto_id: foto.id,
            url_arquivo: foto.url_arquivo,
            key_tentada: foto.url_arquivo,
            bucket: bucket
          });
        }
      }
    }
    
    if (shouldUseS3) {
      // S3: Gerar presigned URL ou redirecionar para URL pública
      try {
        const { s3Client, bucket } = require('../config/aws');
        const { GetObjectCommand } = require('@aws-sdk/client-s3');
        const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
        
        // A key do S3 pode ser:
        // 1. Caminho completo: vistorias/id-30/foto-checklist-554-1763522840081-812548231.jpg
        // 2. Apenas o nome: foto-checklist-554-1763522840081-812548231.jpg
        let key = foto.url_arquivo;
        
        // Se o url_arquivo não começa com "vistorias/", é apenas o nome do arquivo
        // Nesse caso, construir o caminho completo: vistorias/id-{vistoria_id}/{nome_arquivo}
        if (!key.startsWith('vistorias/')) {
          if (foto.vistoria_id) {
            // Construir caminho completo: vistorias/id-{vistoria_id}/{nome_arquivo}
            key = `vistorias/id-${foto.vistoria_id}/${key}`;
            console.log(`[IMAGEM] url_arquivo no banco contém apenas o nome do arquivo`);
            console.log(`[IMAGEM] Caminho completo construído: ${key}`);
          } else {
            console.error(`[IMAGEM] ERRO: Não foi possível construir caminho completo - vistoria_id não disponível`);
            throw new Error('Não foi possível determinar o caminho completo da imagem no S3');
          }
        } else {
          console.log(`[IMAGEM] url_arquivo já contém caminho completo: ${key}`);
        }
        
        console.log('[IMAGEM] Configuração S3:');
        console.log(`[IMAGEM]   - Bucket: ${bucket}`);
        console.log(`[IMAGEM]   - Key: ${key}`);
        console.log(`[IMAGEM]   - Vistoria ID: ${foto.vistoria_id}`);
        
        if (!bucket) {
          throw new Error('Bucket S3 não configurado. Verifique AWS_S3_BUCKET no .env');
        }
        
        if (!key) {
          throw new Error('Key do arquivo não encontrada');
        }
        
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: key
        });
        
        console.log('[IMAGEM] Gerando presigned URL...');
        console.log(`[IMAGEM]   - Comando: GetObjectCommand({ Bucket: "${bucket}", Key: "${key}" })`);
        
        // Gerar presigned URL válida por 1 hora
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        console.log('[IMAGEM] Presigned URL gerada com sucesso');
        console.log(`[IMAGEM] URL completa: ${presignedUrl}`);
        console.log('=== FIM ROTA GET /api/fotos/:id/imagem (302) ===\n');
        return res.redirect(presignedUrl);
      } catch (s3Error) {
        console.error('[IMAGEM] ERRO ao gerar presigned URL:', s3Error.message);
        console.error('[IMAGEM] Stack:', s3Error.stack);
        console.error('[IMAGEM] Detalhes do erro:', {
          name: s3Error.name,
          code: s3Error.code,
          message: s3Error.message,
          bucket: bucket,
          key: key
        });
        
        // Se o erro for de credenciais ou configuração, retornar erro específico
        if (s3Error.name === 'InvalidAccessKeyId' || s3Error.name === 'SignatureDoesNotMatch') {
          console.error('[IMAGEM] ERRO: Credenciais AWS inválidas ou não configuradas');
          return res.status(500).json({ 
            error: 'Erro de configuração AWS',
            details: 'Credenciais AWS inválidas ou não configuradas. Verifique AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY no .env',
            foto_id: foto.id,
            url_arquivo: foto.url_arquivo
          });
        }
        
        // Se o erro for de bucket não encontrado
        if (s3Error.name === 'NoSuchBucket' || s3Error.code === 'NoSuchBucket') {
          console.error('[IMAGEM] ERRO: Bucket não encontrado');
          return res.status(500).json({ 
            error: 'Bucket S3 não encontrado',
            details: `Bucket "${bucket}" não foi encontrado. Verifique AWS_S3_BUCKET no .env`,
            foto_id: foto.id,
            url_arquivo: foto.url_arquivo,
            bucket: bucket
          });
        }
        
        // Se o erro for de arquivo não encontrado
        if (s3Error.name === 'NoSuchKey' || s3Error.code === 'NoSuchKey') {
          console.error('[IMAGEM] ERRO: Arquivo não encontrado no S3');
          console.error(`[IMAGEM] Tentando key: "${key}" no bucket "${bucket}"`);
          return res.status(404).json({ 
            error: 'Imagem não encontrada no S3',
            details: `O arquivo não foi encontrado no bucket S3. Key: "${key}"`,
            foto_id: foto.id,
            url_arquivo: foto.url_arquivo,
            key_tentada: key,
            bucket: bucket
          });
        }
        
        // Fallback: tentar URL pública
        try {
          const publicUrl = getFullPath(foto.url_arquivo, foto.vistoria_id);
          console.log('[IMAGEM] Tentando URL pública como fallback:', publicUrl);
          console.log('=== FIM ROTA GET /api/fotos/:id/imagem (302) ===\n');
          return res.redirect(publicUrl);
        } catch (fallbackError) {
          console.error('[IMAGEM] ERRO no fallback:', fallbackError.message);
          return res.status(500).json({ 
            error: 'Erro ao acessar imagem no S3',
            details: s3Error.message,
            foto_id: foto.id,
            url_arquivo: foto.url_arquivo,
            key_tentada: key,
            bucket: bucket
          });
        }
      }
    } else {
      // Local: Servir arquivo diretamente
      const path = require('path');
      const fs = require('fs');
      
      // Construir caminho completo do arquivo
      const filePath = path.join(__dirname, '..', 'uploads', 'fotos', `vistoria-${foto.vistoria_id}`, foto.url_arquivo);
      
      console.log('Servindo arquivo local:', filePath);
      
      // Verificar se arquivo existe
      if (!fs.existsSync(filePath)) {
        console.error('Arquivo não encontrado:', filePath);
        console.log('=== FIM ROTA GET /api/fotos/:id/imagem (404) ===\n');
        return res.status(404).json({ error: 'Arquivo de imagem não encontrado' });
      }
      
      // Determinar content-type baseado na extensão
      const ext = path.extname(foto.url_arquivo).toLowerCase();
      const contentTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif'
      };
      const contentType = contentTypes[ext] || 'image/jpeg';
      
      console.log('Enviando arquivo com content-type:', contentType);
      console.log('=== FIM ROTA GET /api/fotos/:id/imagem (200) ===\n');
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
      return res.sendFile(path.resolve(filePath));
    }
  } catch (error) {
    console.error('Erro ao servir imagem:', error);
    console.log('=== FIM ROTA GET /api/fotos/:id/imagem (500) ===\n');
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/fotos/:id - Excluir foto
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== ROTA DELETE /api/fotos/:id ===');
    console.log('ID da foto:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const foto = await Foto.findByPk(req.params.id, {
      include: [{ model: Vistoria, as: 'Vistoria' }]
    });
    
    if (!foto) {
      return res.status(404).json({ error: 'Foto não encontrada' });
    }
    
    // Verificar se o usuário pode excluir esta foto
    const isAdmin = req.user.NivelAcesso?.id === 1;
    const isOwner = foto.Vistoria.vistoriador_id === req.user.id;
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Deletar arquivo (local ou S3)
    await deleteFile(foto.url_arquivo);
    
    // Deletar registro do banco
    await foto.destroy();
    
    console.log('Foto excluida com sucesso');
    console.log('=== FIM ROTA DELETE /api/fotos/:id ===\n');
    
    res.json({ message: 'Foto excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

