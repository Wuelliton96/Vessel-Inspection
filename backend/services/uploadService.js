// backend/services/uploadService.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========== ESTRATÉGIA DE UPLOAD ==========
// 'local' = Salvar no servidor (padrão)
// 's3' = Salvar na AWS S3
const UPLOAD_STRATEGY = process.env.UPLOAD_STRATEGY || 'local';

console.log(`[UPLOAD] Estrategia: ${UPLOAD_STRATEGY.toUpperCase()}`);
if (UPLOAD_STRATEGY === 's3') {
  console.log(`[UPLOAD] Salvando arquivos no AWS S3`);
} else {
  console.log(`[UPLOAD] Salvando arquivos localmente`);
}

// ========== CONFIGURAÇÃO STORAGE LOCAL ==========
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // IMPORTANTE: No multer, req.body pode não estar disponível ainda durante destination()
    // Vamos extrair vistoria_id do req.body se disponível, senão usar 'unknown' temporariamente
    let vistoriaId = req.body?.vistoria_id || req.body?.vistoriaId;
    
    // Garantir que seja uma string válida
    if (vistoriaId) {
      vistoriaId = String(vistoriaId).trim();
      if (vistoriaId === '' || vistoriaId === 'undefined' || vistoriaId === 'null') {
        vistoriaId = 'unknown';
      }
    } else {
      vistoriaId = 'unknown';
    }
    
    const uploadDir = path.join(__dirname, `../uploads/fotos/vistoria-${vistoriaId}`);
    
    // Criar pasta automaticamente se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`[UPLOAD] Pasta criada: ${uploadDir}`);
    }
    
    // Armazenar uploadDir e vistoriaId no req para uso no filename
    req.uploadDir = uploadDir;
    req.uploadVistoriaId = vistoriaId;
    
    console.log(`[UPLOAD] Destination: vistoria-${vistoriaId}`);
    cb(null, uploadDir);
  },
  
  filename: (req, file, cb) => {
    // Nome do arquivo: foto-checklist-{id}-timestamp-random.extensao (se checklist_item_id disponível)
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    
    // Tentar obter checklist_item_id do req.body
    let checklistItemId = null;
    if (req.body) {
      checklistItemId = req.body.checklist_item_id || req.body.checklistItemId;
      if (checklistItemId) {
        checklistItemId = String(checklistItemId).trim();
        if (checklistItemId === '' || checklistItemId === 'undefined' || checklistItemId === 'null') {
          checklistItemId = null;
        }
      }
    }
    
    let filename;
    if (checklistItemId) {
      filename = `foto-checklist-${checklistItemId}-${timestamp}-${randomNum}${extension}`;
    } else {
      filename = `foto-${timestamp}-${randomNum}${extension}`;
    }
    
    const uploadDir = req.uploadDir || 'desconhecido';
    const vistoriaId = req.uploadVistoriaId || 'unknown';
    console.log(`[UPLOAD] Salvando foto: ${filename} na pasta: vistoria-${vistoriaId}`);
    cb(null, filename);
  }
});

// ========== CONFIGURAÇÃO STORAGE S3 ==========
const getS3Storage = () => {
  try {
    const multerS3 = require('multer-s3');
    const { s3Client, bucket } = require('../config/aws');
    
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET não está configurado no .env');
    }
    
    console.log('[UPLOAD] Configurando storage S3 para bucket:', bucket);
    
    // Importar transform de compressão
    const getImageCompressTransform = require('../middleware/imageCompress');
    
    // multer-s3 v3+ usa S3Client do AWS SDK v3
    // O multer-s3 v3 funciona com S3Client, mas precisa ser configurado corretamente
    // NOTA: Buckets modernos do S3 não suportam ACLs, então removemos 'acl: public-read'
    return multerS3({
      s3: s3Client, // S3Client do @aws-sdk/client-s3
      bucket: bucket,
      // acl: 'public-read', // Removido: buckets modernos não suportam ACLs
      contentType: multerS3.AUTO_CONTENT_TYPE,
      // serverSideEncryption: 'AES256', // Opcional: removido para simplificar
      cacheControl: 'max-age=31536000', // Cache por 1 ano
      // Comprimir imagem antes de salvar no S3
      shouldTransform: true,
      transforms: [{
        id: 'compressed',
        key: function (req, file, cb) {
          // A key já foi definida acima, apenas retornar ela
          const vistoriaId = req.body?.vistoria_id || 'unknown';
          const checklistItemId = req.body?.checklist_item_id || null;
          const timestamp = Date.now();
          const randomNum = Math.round(Math.random() * 1E9);
          
          // Incluir checklist_item_id no nome se disponível para melhor rastreamento
          let filename;
          if (checklistItemId) {
            filename = `vistorias/id-${vistoriaId}/foto-checklist-${checklistItemId}-${timestamp}-${randomNum}.jpg`;
          } else {
            filename = `vistorias/id-${vistoriaId}/foto-${timestamp}-${randomNum}.jpg`;
          }
          
          cb(null, filename);
        },
        transform: function (req, file, cb) {
          cb(null, getImageCompressTransform());
        },
        contentType: 'image/jpeg'
      }],
      metadata: (req, file, cb) => {
        console.log('[UPLOAD] Preparando metadata para upload S3');
        cb(null, {
          fieldName: file.fieldname,
          vistoriaId: req.body.vistoria_id || 'unknown',
          originalName: file.originalname,
          uploadedAt: new Date().toISOString()
        });
      },
      key: (req, file, cb) => {
        // IMPORTANTE: Com o middleware parseFormData, req.body.vistoria_id deve estar disponível
        
        // Tentar obter de várias formas (com prioridade para req.body que foi parseado pelo middleware)
        let vistoriaId = null;
        
        // 1. Tentar do req.body (agora deve estar disponível via middleware)
        if (req.body) {
          vistoriaId = req.body.vistoria_id || req.body.vistoriaId;
          // Limpar espaços e validar
          if (vistoriaId) {
            vistoriaId = String(vistoriaId).trim();
            if (vistoriaId === '' || vistoriaId === 'undefined' || vistoriaId === 'null') {
              vistoriaId = null;
            }
          }
        }
        
        // 2. Tentar do req.query (fallback)
        if (!vistoriaId && req.query) {
          vistoriaId = req.query.vistoria_id || req.query.vistoriaId;
          if (vistoriaId) {
            vistoriaId = String(vistoriaId).trim();
          }
        }
        
        // 3. Tentar do req.params (fallback)
        if (!vistoriaId && req.params) {
          vistoriaId = req.params.vistoria_id || req.params.vistoriaId;
          if (vistoriaId) {
            vistoriaId = String(vistoriaId).trim();
          }
        }
        
        // Se ainda não tiver, usar 'unknown' e será corrigido na rota + mover arquivo no S3
        if (!vistoriaId || vistoriaId === 'undefined' || vistoriaId === 'null') {
          vistoriaId = 'unknown';
          console.warn('[UPLOAD] ATENCAO: vistoria_id não encontrado durante key() - será corrigido na rota');
          console.warn('[UPLOAD] req.body disponível:', req.body ? 'sim' : 'não');
          if (req.body) {
            console.warn('[UPLOAD] req.body keys:', Object.keys(req.body));
            console.warn('[UPLOAD] req.body.vistoria_id:', req.body.vistoria_id);
          }
        }
        
        const timestamp = Date.now();
        const randomNum = Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        
        // Tentar obter checklist_item_id do req.body para incluir no nome
        let checklistItemId = null;
        if (req.body) {
          checklistItemId = req.body.checklist_item_id || req.body.checklistItemId;
          if (checklistItemId) {
            checklistItemId = String(checklistItemId).trim();
            if (checklistItemId === '' || checklistItemId === 'undefined' || checklistItemId === 'null') {
              checklistItemId = null;
            }
          }
        }
        
        // Usar formato: vistorias/id-{vistoria_id}/foto-checklist-{checklist_item_id}-{timestamp}-{random}.jpg
        // Sempre usar .jpg pois vamos comprimir para JPEG
        let filename;
        if (checklistItemId) {
          filename = `vistorias/id-${vistoriaId}/foto-checklist-${checklistItemId}-${timestamp}-${randomNum}.jpg`;
        } else {
          filename = `vistorias/id-${vistoriaId}/foto-${timestamp}-${randomNum}.jpg`;
        }
        
        console.log(`[UPLOAD] S3 Key gerada: ${filename}`);
        console.log(`[UPLOAD] Vistoria ID no key(): ${vistoriaId}`);
        console.log(`[UPLOAD] req.body disponível:`, req.body ? 'sim' : 'não');
        if (req.body) {
          console.log(`[UPLOAD] req.body.vistoria_id:`, req.body.vistoria_id);
          console.log(`[UPLOAD] req.body keys:`, Object.keys(req.body));
        }
        
        cb(null, filename);
      }
    });
  } catch (error) {
    console.error('[UPLOAD] Erro ao configurar S3:', error.message);
    throw new Error(`Erro ao configurar S3: ${error.message}. Verifique as credenciais no .env`);
  }
};

// ========== CONFIGURAÇÃO DO MULTER ==========
const getUploadConfig = () => {
  const config = {
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB por arquivo
    },
    fileFilter: (req, file, cb) => {
      // Tipos de arquivo permitidos
      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const allowedExts = /jpeg|jpg|png|gif/;
      
      const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedMimes.includes(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Apenas imagens são permitidas (JPEG, JPG, PNG, GIF)'));
      }
    }
  };

  // Escolher storage baseado na estratégia
  if (UPLOAD_STRATEGY === 's3') {
    config.storage = getS3Storage();
  } else {
    config.storage = localStorage;
  }

  return config;
};

// ========== OBTER URL DO ARQUIVO ==========
// Retorna a key (S3) ou nome do arquivo (local) para salvar no banco
const getFileUrl = (file) => {
  if (UPLOAD_STRATEGY === 's3') {
    // AWS S3: retorna apenas a key (caminho no bucket)
    // file.key = vistorias/{vistoriaId}/foto-{timestamp}-{random}.jpg
    // file.location = URL completa (não usamos no banco, apenas para exibição)
    return file.key; // Salva apenas a key no banco
  } else {
    // Local: retorna APENAS o nome do arquivo (sem caminho)
    return file.filename;
  }
};

// ========== OBTER CAMINHO COMPLETO DO ARQUIVO ==========
// Constrói a URL completa para exibição/servir o arquivo
const getFullPath = (keyOrFilename, vistoriaId) => {
  if (UPLOAD_STRATEGY === 's3') {
    // S3: constrói URL pública do arquivo
    const { bucket, region } = require('../config/aws');
    if (keyOrFilename.startsWith('http')) {
      // Se já for uma URL completa, retorna como está
      return keyOrFilename;
    }
    // Constrói URL pública do S3
    // Formato: https://{bucket}.s3.{region}.amazonaws.com/{key}
    return `https://${bucket}.s3.${region}.amazonaws.com/${keyOrFilename}`;
  } else {
    // Local: constrói caminho relativo baseado no vistoriaId
    return `/uploads/fotos/vistoria-${vistoriaId}/${keyOrFilename}`;
  }
};

// ========== DELETAR ARQUIVO ==========
const deleteFile = async (fileUrlOrKey) => {
  try {
    if (UPLOAD_STRATEGY === 's3') {
      // Deletar do S3
      const { s3Client, bucket } = require('../config/aws');
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      
      // fileUrlOrKey pode ser uma URL completa ou apenas a key
      let key = fileUrlOrKey;
      if (fileUrlOrKey.includes('.amazonaws.com/')) {
        // Extrair key da URL
        key = fileUrlOrKey.split('.amazonaws.com/')[1];
      }
      
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      });
      
      await s3Client.send(command);
      console.log(`Arquivo deletado do S3: ${key}`);
    } else {
      // Deletar arquivo local
      // fileUrl pode ser apenas o nome do arquivo ou caminho completo
      // Se for apenas nome, precisa construir o caminho com vistoria_id
      let filePath;
      if (fileUrl.startsWith('/uploads/')) {
        // Caminho completo (formato antigo ou migração)
        filePath = path.join(__dirname, '..', fileUrl);
      } else {
        // Apenas nome do arquivo - precisa vistoria_id para construir caminho
        // Como não temos vistoria_id aqui, tentar encontrar o arquivo
        // Percorrer pastas de vistorias para encontrar
        const fotosDir = path.join(__dirname, '../uploads/fotos');
        if (fs.existsSync(fotosDir)) {
          const vistoriaDirs = fs.readdirSync(fotosDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && dirent.name.startsWith('vistoria-'));
          
          let arquivoEncontrado = false;
          for (const vistoriaDir of vistoriaDirs) {
            const caminhoCompleto = path.join(fotosDir, vistoriaDir.name, fileUrl);
            if (fs.existsSync(caminhoCompleto)) {
              filePath = caminhoCompleto;
              arquivoEncontrado = true;
              break;
            }
          }
          
          if (!arquivoEncontrado) {
            console.log(`Arquivo nao encontrado: ${fileUrl}`);
            return;
          }
        } else {
          console.log(`Diretorio de fotos nao existe: ${fotosDir}`);
          return;
        }
      }
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Arquivo deletado: ${filePath}`);
      } else {
        console.log(`Arquivo nao encontrado: ${filePath}`);
      }
    }
  } catch (error) {
      console.error('Erro ao deletar arquivo:', error.message);
    throw error;
  }
};

// ========== OBTER INFORMAÇÕES DO STORAGE ==========
const getStorageInfo = () => {
  return {
    strategy: UPLOAD_STRATEGY,
    maxFileSize: '10MB',
    allowedTypes: ['JPEG', 'JPG', 'PNG', 'GIF'],
    location: UPLOAD_STRATEGY === 's3' 
      ? `AWS S3: ${process.env.AWS_S3_BUCKET || 'não configurado'}` 
      : 'Local: backend/uploads/fotos/'
  };
};

// ========== EXPORTS ==========
module.exports = {
  getUploadConfig,
  getFileUrl,
  getFullPath,
  deleteFile,
  getStorageInfo,
  UPLOAD_STRATEGY
};


