/**
 * Funções auxiliares para rotas de fotos
 * Reduz duplicação de código
 */

/**
 * Constrói a key correta do S3 baseado no url_arquivo
 */
function construirS3Key(urlArquivo, vistoriaId) {
  let key = urlArquivo;
  
  // Se não começa com "vistorias/", construir o caminho completo usando vistoria_id
  if (!key.startsWith('vistorias/')) {
    if (vistoriaId) {
      key = `vistorias/id-${vistoriaId}/${key}`;
      console.log(`[IMAGEM] url_arquivo no banco contém apenas o nome do arquivo`);
      console.log(`[IMAGEM] Caminho completo construído: ${key}`);
    } else {
      throw new Error('Não foi possível determinar o caminho completo da imagem no S3 - vistoria_id não disponível');
    }
  } else {
    console.log(`[IMAGEM] url_arquivo já contém caminho completo: ${key}`);
  }
  
  return key;
}

/**
 * Valida configuração S3
 */
function validarConfigS3(bucket, key, fotoId, urlArquivo) {
  if (!bucket) {
    throw new Error('Bucket S3 não configurado. Verifique AWS_S3_BUCKET no .env');
  }
  
  if (!key) {
    throw new Error('Key do arquivo não encontrada');
  }
  
  console.log('[IMAGEM] Configuração S3:');
  console.log(`[IMAGEM]   - Bucket: ${bucket}`);
  console.log(`[IMAGEM]   - Key original no banco: ${urlArquivo}`);
  console.log(`[IMAGEM]   - Key final construída: ${key}`);
  console.log(`[IMAGEM]   - Foto ID: ${fotoId}`);
}

/**
 * Retorna erro de resposta HTTP padronizado
 */
function criarErroResposta(status, error, details, fotoId, urlArquivo, extras = {}) {
  return {
    error,
    details,
    foto_id: fotoId,
    url_arquivo: urlArquivo,
    ...extras
  };
}

/**
 * Trata erros S3 comuns
 */
function tratarErroS3(s3Error, res, foto, bucket, key) {
  // Verificar se já enviou resposta
  if (res.headersSent) {
    console.error('[IMAGEM] ERRO: Resposta já foi enviada, não é possível enviar erro');
    return null;
  }
  
  console.error('[IMAGEM] ERRO ao gerar presigned URL:', s3Error.message);
  console.error('[IMAGEM] Stack:', s3Error.stack);
  console.error('[IMAGEM] Detalhes do erro:', {
    name: s3Error.name,
    code: s3Error.code,
    message: s3Error.message,
    bucket: bucket || 'não definido',
    key: key || foto.url_arquivo || 'não definido'
  });
  
  // Se o erro for de credenciais ou configuração
  if (s3Error.name === 'InvalidAccessKeyId' || s3Error.name === 'SignatureDoesNotMatch') {
    console.error('[IMAGEM] ERRO: Credenciais AWS inválidas ou não configuradas');
    return {
      status: 500,
      json: criarErroResposta(
        'Erro de configuração AWS',
        'Credenciais AWS inválidas ou não configuradas. Verifique AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY no .env',
        foto.id,
        foto.url_arquivo
      )
    };
  }
  
  // Se o erro for de bucket não encontrado
  if (s3Error.name === 'NoSuchBucket' || s3Error.code === 'NoSuchBucket') {
    console.error('[IMAGEM] ERRO: Bucket não encontrado');
    return {
      status: 500,
      json: criarErroResposta(
        'Bucket S3 não encontrado',
        `Bucket não foi encontrado. Verifique AWS_S3_BUCKET no .env`,
        foto.id,
        foto.url_arquivo,
        { bucket: bucket || 'não definido' }
      )
    };
  }
  
  // Se o erro for de arquivo não encontrado
  if (s3Error.name === 'NoSuchKey' || s3Error.code === 'NoSuchKey') {
    console.error('[IMAGEM] ERRO: Arquivo não encontrado no S3');
    console.error(`[IMAGEM] Tentando key: "${key || foto.url_arquivo}" no bucket "${bucket || 'não definido'}"`);
    return {
      status: 404,
      json: criarErroResposta(
        'Imagem não encontrada no S3',
        `O arquivo não foi encontrado no bucket S3. Key: "${key || foto.url_arquivo}"`,
        foto.id,
        foto.url_arquivo,
        {
          key_tentada: key || foto.url_arquivo,
          bucket: bucket || 'não definido'
        }
      )
    };
  }
  
  return null;
}

/**
 * Configura headers CORS para imagens
 */
function configurarHeadersCORS(res, req, contentType, contentLength) {
  if (res.headersSent) {
    console.error('[IMAGEM] ERRO: Headers já foram enviados!');
    return false;
  }
  
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', contentLength);
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache por 1 hora
  
  return true;
}

/**
 * Processa stream do S3 e envia como buffer
 */
async function processarStreamS3(s3Response, res, fotoId) {
  try {
    const chunks = [];
    for await (const chunk of s3Response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    console.log(`[IMAGEM] Buffer criado: ${buffer.length} bytes`);
    console.log('=== FIM ROTA GET /api/fotos/:id/imagem (200) ===\n');
    
    if (!res.headersSent) {
      res.send(buffer);
    }
  } catch (pipeError) {
    console.error('[IMAGEM] ERRO ao processar stream do S3:', pipeError.message);
    // Se ainda não enviou resposta, tentar pipe direto
    if (!res.headersSent) {
      try {
        s3Response.Body.pipe(res);
      } catch (pipeError2) {
        console.error('[IMAGEM] ERRO no pipe direto:', pipeError2.message);
        if (!res.headersSent) {
          return res.status(500).json({ 
            error: 'Erro ao processar imagem do S3',
            details: pipeError2.message,
            foto_id: fotoId
          });
        }
      }
    }
  }
}

module.exports = {
  construirS3Key,
  validarConfigS3,
  criarErroResposta,
  tratarErroS3,
  configurarHeadersCORS,
  processarStreamS3
};

