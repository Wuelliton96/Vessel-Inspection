// backend/config/aws.js
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');
const logger = require('../utils/logger');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuração do cliente S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Verificar se as credenciais estão configuradas
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  logger.warn('[AWS] Credenciais AWS não configuradas no .env');
}

if (!process.env.AWS_S3_BUCKET) {
  logger.warn('[AWS] AWS_S3_BUCKET não configurado no .env');
}

logger.info('[AWS] Configuração S3 inicializada', {
  region: process.env.AWS_REGION || 'us-east-1',
  hasBucket: !!process.env.AWS_S3_BUCKET
});

module.exports = {
  s3Client,
  s3: s3Client, // Alias para compatibilidade com código antigo
  bucket: process.env.AWS_S3_BUCKET,
  region: process.env.AWS_REGION || 'us-east-1',
};

