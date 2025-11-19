/**
 * TESTE DE VISUALIZAÇÃO DE IMAGEM - VISTORIA 30
 * 
 * Este script testa:
 * 1. Busca vistoria 30 no banco de dados
 * 2. Busca todas as fotos dessa vistoria
 * 3. Para cada foto, tenta acessar no AWS S3
 * 4. Verifica se consegue gerar presigned URL
 * 5. Testa se a imagem está acessível
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Foto, Vistoria } = require('../models');
const { s3Client, bucket } = require('../config/aws');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const axios = require('axios');

const VISTORIA_ID = 30;

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  log('\n' + '='.repeat(70), 'cyan');
  log(title, 'cyan');
  log('='.repeat(70), 'cyan');
};

const logSuccess = (message) => log(`[OK] ${message}`, 'green');
const logError = (message) => log(`[ERRO] ${message}`, 'red');
const logInfo = (message) => log(`[INFO] ${message}`, 'yellow');
const logDetail = (message) => log(`  -> ${message}`, 'magenta');

async function main() {
  logSection('TESTE DE VISUALIZACAO - VISTORIA 30');
  
  try {
    // 1. Buscar vistoria 30
    logSection('PASSO 1: Buscando Vistoria 30 no banco de dados');
    const vistoria = await Vistoria.findByPk(VISTORIA_ID);
    
    if (!vistoria) {
      logError(`Vistoria ${VISTORIA_ID} não encontrada no banco de dados`);
      process.exit(1);
    }
    
    logSuccess(`Vistoria ${VISTORIA_ID} encontrada`);
    logDetail(`Vistoriador: ${vistoria.Vistoriador?.nome || 'N/A'} (ID: ${vistoria.vistoriador_id})`);
    logDetail(`Criada em: ${vistoria.created_at}`);
    
    // 2. Buscar todas as fotos da vistoria
    logSection('PASSO 2: Buscando fotos da vistoria');
    const fotos = await Foto.findAll({
      where: { vistoria_id: VISTORIA_ID },
      order: [['created_at', 'DESC']]
    });
    
    if (fotos.length === 0) {
      logError(`Nenhuma foto encontrada para a vistoria ${VISTORIA_ID}`);
      process.exit(1);
    }
    
    logSuccess(`${fotos.length} foto(s) encontrada(s)`);
    
    // 3. Verificar configuração AWS
    logSection('PASSO 3: Verificando configuração AWS');
    logDetail(`Bucket: ${bucket || 'NÃO CONFIGURADO'}`);
    logDetail(`Região: ${process.env.AWS_REGION || 'us-east-1'}`);
    logDetail(`Access Key ID: ${process.env.AWS_ACCESS_KEY_ID ? 'Configurado' : 'NÃO CONFIGURADO'}`);
    logDetail(`Secret Access Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'Configurado' : 'NÃO CONFIGURADO'}`);
    
    if (!bucket) {
      logError('Bucket S3 não configurado no .env (AWS_S3_BUCKET)');
      process.exit(1);
    }
    
    // 4. Testar cada foto
    logSection('PASSO 4: Testando acesso às imagens no S3');
    
    for (let i = 0; i < fotos.length; i++) {
      const foto = fotos[i];
      log(`\n--- Foto ${i + 1}/${fotos.length} (ID: ${foto.id}) ---`);
      logDetail(`URL no banco: "${foto.url_arquivo}"`);
      logDetail(`Vistoria ID: ${foto.vistoria_id}`);
      logDetail(`Criada em: ${foto.created_at}`);
      
      // Construir key do S3
      let key = foto.url_arquivo;
      
      // Se não começa com "vistorias/", construir caminho completo
      if (!key.startsWith('vistorias/')) {
        key = `vistorias/id-${foto.vistoria_id}/${key}`;
        logInfo(`Caminho completo construído: ${key}`);
      } else {
        logInfo(`Caminho completo já presente: ${key}`);
      }
      
      // Tentar gerar presigned URL
      try {
        logDetail('Gerando presigned URL...');
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: key
        });
        
        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        logSuccess('Presigned URL gerada com sucesso!');
        logDetail(`URL: ${presignedUrl.substring(0, 100)}...`);
        
        // Tentar acessar a imagem
        logDetail('Testando acesso à imagem...');
        try {
          const response = await axios.get(presignedUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            validateStatus: (status) => status === 200
          });
          
          if (response.status === 200 && response.data) {
            logSuccess(`Imagem acessível! Tamanho: ${response.data.length} bytes`);
            logDetail(`Content-Type: ${response.headers['content-type'] || 'N/A'}`);
          } else {
            logError(`Imagem retornou status ${response.status}`);
          }
        } catch (httpError) {
          if (httpError.response) {
            logError(`Erro HTTP ao acessar imagem: ${httpError.response.status} - ${httpError.response.statusText}`);
          } else {
            logError(`Erro ao acessar imagem: ${httpError.message}`);
          }
        }
        
      } catch (s3Error) {
        logError(`Erro ao gerar presigned URL: ${s3Error.message}`);
        logDetail(`Nome do erro: ${s3Error.name}`);
        logDetail(`Código do erro: ${s3Error.code}`);
        
        if (s3Error.name === 'NoSuchKey' || s3Error.code === 'NoSuchKey') {
          logError(`Arquivo não encontrado no S3!`);
          logDetail(`Bucket: ${bucket}`);
          logDetail(`Key tentada: ${key}`);
          logDetail(`URL no banco: ${foto.url_arquivo}`);
        } else if (s3Error.name === 'NoSuchBucket' || s3Error.code === 'NoSuchBucket') {
          logError(`Bucket não encontrado: ${bucket}`);
        } else if (s3Error.name === 'InvalidAccessKeyId' || s3Error.name === 'SignatureDoesNotMatch') {
          logError(`Credenciais AWS inválidas ou não configuradas`);
        }
      }
    }
    
    // 5. Resumo final
    logSection('RESUMO DO TESTE');
    logSuccess(`Vistoria ${VISTORIA_ID} encontrada`);
    logSuccess(`${fotos.length} foto(s) encontrada(s) no banco`);
    logInfo('Verifique os resultados acima para cada foto');
    
  } catch (error) {
    logError(`Erro durante o teste: ${error.message}`);
    logDetail(`Stack: ${error.stack}`);
    process.exit(1);
  }
}

main().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  process.exit(1);
});

