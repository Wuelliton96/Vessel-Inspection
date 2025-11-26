/**
 * Função centralizada para servir imagens do S3
 * Reduz duplicação de código em fotoRoutes.js
 */

const { GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { construirS3Key, validarConfigS3, tratarErroS3, configurarHeadersCORS, processarStreamS3 } = require('./fotoHelpers');
const { getFullPath } = require('../services/uploadService');

/**
 * Serve imagem do S3
 */
async function servirImagemS3(foto, req, res, awsConfig) {
  const { s3Client } = awsConfig;
  const bucket = awsConfig.bucket;
  let key;
  
  try {
    // Construir key do S3
    key = construirS3Key(foto.url_arquivo, foto.vistoria_id);
    
    // Validar configuração
    validarConfigS3(bucket, key, foto.id, foto.url_arquivo);
    
    // Verificar se imagem existe no S3
    const headCommand = new HeadObjectCommand({ Bucket: bucket, Key: key });
    try {
      const headResult = await s3Client.send(headCommand);
      console.log('[IMAGEM] OK: Imagem encontrada no S3!');
      console.log(`[IMAGEM]   - Content-Type: ${headResult.ContentType}`);
      console.log(`[IMAGEM]   - Content-Length: ${headResult.ContentLength} bytes`);
    } catch (headError) {
      if (headError.name === 'NoSuchKey' || headError.code === 'NoSuchKey') {
        if (!res.headersSent) {
          return res.status(404).json({ 
            error: 'Imagem não encontrada no S3',
            details: `O arquivo não foi encontrado no bucket S3. Key: "${key}"`,
            foto_id: foto.id,
            url_arquivo: foto.url_arquivo,
            key_tentada: key,
            bucket: bucket
          });
        }
        return;
      }
      throw headError;
    }
    
    // Buscar imagem do S3
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    console.log('[IMAGEM] Buscando imagem do S3 para fazer proxy...');
    console.log(`[IMAGEM]   - Comando: GetObjectCommand({ Bucket: "${bucket}", Key: "${key}" })`);
    
    const s3Response = await s3Client.send(command);
    const contentType = s3Response.ContentType || 'image/jpeg';
    const contentLength = s3Response.ContentLength;
    
    console.log('[IMAGEM] Imagem obtida do S3 com sucesso');
    console.log(`[IMAGEM]   - Content-Type: ${contentType}`);
    console.log(`[IMAGEM]   - Content-Length: ${contentLength} bytes`);
    console.log('[IMAGEM] Servindo imagem via proxy...');
    
    // Configurar headers CORS
    if (!configurarHeadersCORS(res, req, contentType, contentLength)) {
      return;
    }
    
    // Processar e enviar stream
    await processarStreamS3(s3Response, res, foto.id);
    
  } catch (s3Error) {
    // Tratar erro S3
    const erroTratado = tratarErroS3(s3Error, res, foto, bucket, key);
    
    if (erroTratado) {
      if (!res.headersSent) {
        return res.status(erroTratado.status).json(erroTratado.json);
      }
      return;
    }
    
    // Fallback: tentar URL pública
    try {
      const publicUrl = getFullPath(foto.url_arquivo, foto.vistoria_id);
      console.log('[IMAGEM] Tentando URL pública como fallback:', publicUrl);
      console.log('=== FIM ROTA GET /api/fotos/:id/imagem (302) ===\n');
      
      if (!res.headersSent) {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        return res.redirect(302, publicUrl);
      }
    } catch (fallbackError) {
      console.error('[IMAGEM] ERRO no fallback:', fallbackError.message);
      if (!res.headersSent) {
        return res.status(500).json({ 
          error: 'Erro ao acessar imagem no S3',
          details: s3Error.message,
          foto_id: foto.id,
          url_arquivo: foto.url_arquivo,
          key_tentada: key || foto.url_arquivo,
          bucket: bucket || 'não definido'
        });
      }
    }
  }
}

module.exports = { servirImagemS3 };

