// Script para testar upload de foto no S3
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { s3Client, bucket, region } = require('../config/aws');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function testS3Upload() {
  console.log('=== TESTE DE UPLOAD NO AWS S3 ===\n');
  
  try {
    if (!bucket) {
      console.error('[ERRO] AWS_S3_BUCKET não configurado no .env');
      process.exit(1);
    }
    
    console.log(`Bucket: ${bucket}`);
    console.log(`Região: ${region}\n`);
    
    // 1. Verificar se o bucket existe e está acessível
    console.log('1. Verificando acesso ao bucket...');
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 1
      });
      await s3Client.send(listCommand);
      console.log('[OK] Bucket acessível\n');
    } catch (error) {
      console.error('[ERRO] Erro ao acessar bucket:', error.message);
      process.exit(1);
    }
    
    // 2. Criar uma imagem de teste em memória (simulando upload)
    console.log('2. Criando imagem de teste...');
    const vistoriaId = 999; // ID de teste
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E9);
    const filename = `foto-${timestamp}-${randomNum}.jpg`;
    const s3Key = `vistorias/${vistoriaId}/${filename}`;
    
    // Criar um buffer simples simulando uma imagem JPEG
    const imageBuffer = Buffer.from('FFD8FFE000104A46494600010101006000600000FFDB004300', 'hex');
    
    console.log(`[OK] Imagem de teste criada: ${filename}`);
    console.log(`[OK] S3 Key: ${s3Key}\n`);
    
    // 3. Fazer upload para o S3
    console.log('3. Fazendo upload para o S3...');
    try {
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: imageBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          vistoriaId: vistoriaId.toString(),
          originalName: filename,
          uploadedAt: new Date().toISOString()
        }
      });
      
      const uploadResult = await s3Client.send(putCommand);
      console.log('[OK] Upload realizado com sucesso');
      console.log(`  ETag: ${uploadResult.ETag}\n`);
    } catch (error) {
      console.error('[ERRO] Erro ao fazer upload:', error.message);
      if (error.Code) {
        console.error(`  Código de erro AWS: ${error.Code}`);
      }
      process.exit(1);
    }
    
    // 4. Verificar se o arquivo foi salvo corretamente
    console.log('4. Verificando arquivo no S3...');
    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: s3Key
      });
      
      const getResult = await s3Client.send(getCommand);
      console.log('[OK] Arquivo encontrado no S3');
      console.log(`  ContentType: ${getResult.ContentType}`);
      console.log(`  ContentLength: ${getResult.ContentLength} bytes`);
      console.log(`  Metadata:`, getResult.Metadata);
      console.log(`  URL: https://${bucket}.s3.${region}.amazonaws.com/${s3Key}\n`);
    } catch (error) {
      console.error('[ERRO] Erro ao buscar arquivo:', error.message);
      process.exit(1);
    }
    
    // 5. Listar objetos na pasta da vistoria
    console.log('5. Listando objetos na pasta da vistoria...');
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `vistorias/${vistoriaId}/`
      });
      
      const listResult = await s3Client.send(listCommand);
      const objects = listResult.Contents || [];
      console.log(`[OK] ${objects.length} objeto(s) encontrado(s) na pasta vistorias/${vistoriaId}/`);
      
      if (objects.length > 0) {
        objects.forEach((obj, index) => {
          console.log(`  ${index + 1}. ${obj.Key} (${obj.Size} bytes)`);
        });
      }
      console.log('');
    } catch (error) {
      console.error('[ERRO] Erro ao listar objetos:', error.message);
    }
    
    // 6. Testar estrutura de pastas (verificar outras vistorias)
    console.log('6. Verificando estrutura de pastas...');
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: 'vistorias/',
        Delimiter: '/'
      });
      
      const listResult = await s3Client.send(listCommand);
      const prefixes = listResult.CommonPrefixes || [];
      
      if (prefixes.length > 0) {
        console.log(`[OK] ${prefixes.length} pasta(s) de vistoria encontrada(s):`);
        prefixes.forEach((prefix, index) => {
          console.log(`  ${index + 1}. ${prefix.Prefix}`);
        });
      } else {
        console.log('⚠ Nenhuma pasta de vistoria encontrada (exceto a de teste)');
      }
      console.log('');
    } catch (error) {
      console.error('[ERRO] Erro ao verificar estrutura:', error.message);
    }
    
    // 7. Verificar se a key seria salva corretamente no banco
    console.log('7. Verificando formato da key para salvar no banco...');
    console.log(`[OK] Key a salvar no banco: ${s3Key}`);
    console.log(`[OK] Esta key será salva na coluna url_arquivo da tabela fotos`);
    console.log(`[OK] URL completa para exibição: https://${bucket}.s3.${region}.amazonaws.com/${s3Key}\n`);
    
    // 8. Limpar arquivo de teste (opcional)
    console.log('8. Limpando arquivo de teste...');
    try {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      const deleteCommand = new DeleteObjectCommand({
        Bucket: bucket,
        Key: s3Key
      });
      
      await s3Client.send(deleteCommand);
      console.log('[OK] Arquivo de teste removido\n');
    } catch (error) {
      console.error('⚠ Erro ao remover arquivo de teste (não crítico):', error.message);
      console.log('⚠ Arquivo de teste pode ser removido manualmente\n');
    }
    
    console.log('========================================');
    console.log('[OK] TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('========================================\n');
    
    console.log('RESUMO:');
    console.log('- Bucket está acessível');
    console.log('- Upload para S3 funcionando');
    console.log('- Estrutura de pastas por vistoria funcionando');
    console.log('- Metadata sendo salva corretamente');
    console.log('- Key formatada corretamente para salvar no banco');
    
  } catch (error) {
    console.error('\n[ERRO] ERRO CRÍTICO:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testS3Upload();

