// backend/services/uploadService.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========== ESTRATÉGIA DE UPLOAD ==========
// 'local' = Salvar no servidor (padrão)
// 's3' = Salvar na AWS S3 (futuro)
const UPLOAD_STRATEGY = process.env.UPLOAD_STRATEGY || 'local';

console.log(`[UPLOAD] Estrategia: ${UPLOAD_STRATEGY.toUpperCase()}`);

// ========== CONFIGURAÇÃO STORAGE LOCAL ==========
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Criar pasta por vistoria para melhor organização
    const vistoriaId = req.body.vistoria_id || 'unknown';
    const uploadDir = path.join(__dirname, `../uploads/fotos/vistoria-${vistoriaId}`);
    
    // Criar pasta automaticamente se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`[UPLOAD] Pasta criada: ${uploadDir}`);
    }
    
    cb(null, uploadDir);
  },
  
  filename: (req, file, cb) => {
    // Nome do arquivo: timestamp-random.extensao
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `foto-${timestamp}-${randomNum}${extension}`;
    
    console.log(`[UPLOAD] Salvando foto: ${filename}`);
    cb(null, filename);
  }
});

// ========== CONFIGURAÇÃO STORAGE S3 (FUTURO) ==========
const getS3Storage = () => {
  // Quando migrar para S3, implementar aqui:
  /*
  const multerS3 = require('multer-s3');
  const { s3 } = require('../config/aws');
  
  return multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
        vistoriaId: req.body.vistoria_id,
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      });
    },
    key: (req, file, cb) => {
      const vistoriaId = req.body.vistoria_id || 'unknown';
      const timestamp = Date.now();
      const filename = `vistorias/${vistoriaId}/${timestamp}-${file.originalname}`;
      cb(null, filename);
    }
  });
  */
  
  throw new Error('AWS S3 não está configurado. Configure as credenciais no .env e instale aws-sdk e multer-s3');
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
const getFileUrl = (file) => {
  if (UPLOAD_STRATEGY === 's3') {
    // AWS S3: retorna URL completa
    return file.location;
  } else {
    // Local: retorna caminho relativo
    const vistoriaId = file.destination.split('vistoria-')[1];
    return `/uploads/fotos/vistoria-${vistoriaId}/${file.filename}`;
  }
};

// ========== DELETAR ARQUIVO ==========
const deleteFile = async (fileUrl) => {
  try {
    if (UPLOAD_STRATEGY === 's3') {
      // Deletar do S3 (quando implementado)
      /*
      const { s3 } = require('../config/aws');
      const bucket = process.env.AWS_S3_BUCKET;
      const key = fileUrl.split('.com/')[1]; // Extrair key da URL
      
      await s3.deleteObject({
        Bucket: bucket,
        Key: key
      }).promise();
      
      console.log(`🗑️  Arquivo deletado do S3: ${key}`);
      */
      
      console.log('⚠️  Deleção S3 não implementada ainda');
    } else {
      // Deletar arquivo local
      const filePath = path.join(__dirname, '..', fileUrl);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Arquivo deletado: ${filePath}`);
      } else {
        console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
      }
    }
  } catch (error) {
    console.error('❌ Erro ao deletar arquivo:', error.message);
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
  deleteFile,
  getStorageInfo,
  UPLOAD_STRATEGY
};


