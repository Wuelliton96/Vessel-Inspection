/**
 * Script para verificar se uma imagem existe no S3 antes de tentar exibir
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Foto } = require('../models');
const { s3Client, bucket } = require('../config/aws');
const { HeadObjectCommand } = require('@aws-sdk/client-s3');

const FOTO_ID = 26; // Foto que está dando problema

async function verificarImagem() {
  try {
    console.log('=== VERIFICAÇÃO DE IMAGEM NO S3 ===\n');
    
    // 1. Buscar foto no banco
    console.log('1. Buscando foto no banco de dados...');
    const foto = await Foto.findByPk(FOTO_ID);
    
    if (!foto) {
      console.error('ERRO: Foto não encontrada no banco de dados');
      process.exit(1);
    }
    
    console.log('OK: Foto encontrada');
    console.log(`   - ID: ${foto.id}`);
    console.log(`   - URL no banco: "${foto.url_arquivo}"`);
    console.log(`   - Vistoria ID: ${foto.vistoria_id}`);
    
    // 2. Construir key do S3
    console.log('\n2. Construindo key do S3...');
    let key = foto.url_arquivo;
    
    if (!key.startsWith('vistorias/')) {
      key = `vistorias/id-${foto.vistoria_id}/${key}`;
      console.log(`   - Key construída: "${key}"`);
    } else {
      console.log(`   - Key já completa: "${key}"`);
    }
    
    // 3. Verificar se existe no S3
    console.log('\n3. Verificando se imagem existe no S3...');
    console.log(`   - Bucket: ${bucket}`);
    console.log(`   - Key: ${key}`);
    
    const headCommand = new HeadObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    try {
      const headResult = await s3Client.send(headCommand);
      console.log('OK: Imagem encontrada no S3!');
      console.log(`   - Content-Type: ${headResult.ContentType}`);
      console.log(`   - Content-Length: ${headResult.ContentLength} bytes`);
      console.log(`   - LastModified: ${headResult.LastModified}`);
      console.log(`   - ETag: ${headResult.ETag}`);
      
      // 4. Gerar presigned URL
      console.log('\n4. Gerando presigned URL...');
      const { GetObjectCommand } = require('@aws-sdk/client-s3');
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });
      
      const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
      console.log('OK: Presigned URL gerada com sucesso!');
      console.log(`   - URL: ${presignedUrl.substring(0, 100)}...`);
      
      // 5. Testar acesso
      console.log('\n5. Testando acesso à imagem...');
      const axios = require('axios');
      const response = await axios.get(presignedUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        validateStatus: (status) => status === 200
      });
      
      if (response.status === 200 && response.data) {
        console.log('OK: Imagem acessível!');
        console.log(`   - Tamanho recebido: ${response.data.length} bytes`);
        console.log(`   - Content-Type: ${response.headers['content-type']}`);
      }
      
      console.log('\n=== VERIFICAÇÃO CONCLUÍDA COM SUCESSO ===');
      console.log('A imagem existe no S3 e está acessível!');
      
    } catch (s3Error) {
      console.error('ERRO: Imagem não encontrada no S3!');
      console.error(`   - Nome do erro: ${s3Error.name}`);
      console.error(`   - Código: ${s3Error.code}`);
      console.error(`   - Mensagem: ${s3Error.message}`);
      
      if (s3Error.name === 'NoSuchKey' || s3Error.code === 'NoSuchKey') {
        console.error('\nO arquivo não existe no S3 com essa key!');
        console.error(`Tentando buscar objetos similares...`);
        
        // Tentar listar objetos no diretório
        const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
        const listCommand = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `vistorias/id-${foto.vistoria_id}/`
        });
        
        try {
          const listResult = await s3Client.send(listCommand);
          if (listResult.Contents && listResult.Contents.length > 0) {
            console.log(`\nEncontrados ${listResult.Contents.length} objeto(s) no diretório:`);
            listResult.Contents.forEach((obj, index) => {
              console.log(`   ${index + 1}. ${obj.Key} (${obj.Size} bytes)`);
            });
          } else {
            console.log('\nNenhum objeto encontrado no diretório!');
          }
        } catch (listError) {
          console.error('Erro ao listar objetos:', listError.message);
        }
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

verificarImagem();

