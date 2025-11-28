/**
 * Helper para funções compartilhadas entre scripts de teste
 * Reduz duplicação de código entre scripts de teste
 */

const fs = require('fs');
const path = require('path');

/**
 * Cria um buffer com uma imagem JPEG válida mínima (1x1 pixel)
 * @returns {Buffer} Buffer contendo os bytes de um JPEG válido
 */
function criarJPEGMinimo() {
  return Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
    0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
    0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4, 0x00, 0x14,
    0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x40, 0xFF, 0xD9
  ]);
}

/**
 * Cria um arquivo de imagem JPEG de teste
 * @param {string} filePath - Caminho completo onde o arquivo será criado
 * @returns {string} Caminho do arquivo criado
 */
function criarImagemTeste(filePath) {
  const uploadDir = path.dirname(filePath);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const jpegBuffer = criarJPEGMinimo();
  fs.writeFileSync(filePath, jpegBuffer);
  
  return filePath;
}

/**
 * Remove um arquivo de teste se ele existir
 * @param {string} filePath - Caminho do arquivo a ser removido
 */
function removerArquivoTeste(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

/**
 * Trata erros de upload de forma padronizada
 * @param {Error} uploadError - Erro capturado durante o upload
 * @throws {Error} Re-lança o erro após logar
 */
function tratarErroUpload(uploadError) {
  console.error('\n✗ Erro no upload:', uploadError.response?.data || uploadError.message);
  if (uploadError.response?.data) {
    console.error('  Detalhes:', JSON.stringify(uploadError.response.data, null, 2));
  }
  throw uploadError;
}

/**
 * Trata erros críticos de forma padronizada e encerra o processo
 * @param {Error} error - Erro crítico
 */
function tratarErroCritico(error) {
  console.error('\n✗ ERRO CRÍTICO:', error.message);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}

/**
 * Valida se uma entidade existe, caso contrário exibe erro e encerra o processo
 * @param {any} entidade - Entidade a ser validada
 * @param {string} mensagemErro - Mensagem de erro a ser exibida se a entidade não existir
 * @returns {void}
 * @throws {void} Encerra o processo se a entidade não existir
 */
function validarEntidade(entidade, mensagemErro) {
  if (!entidade) {
    console.log(`[ERRO] ${mensagemErro}`);
    process.exit(1);
  }
}

/**
 * Constrói um array de IDs de status a partir dos objetos de status
 * @param {Object} statusPendente - Objeto de status PENDENTE (pode ser null)
 * @param {Object} statusEmAndamento - Objeto de status EM_ANDAMENTO (pode ser null)
 * @param {Object} statusConcluida - Objeto de status CONCLUIDA (pode ser null)
 * @returns {number[]} Array de IDs de status
 */
function construirStatusIds(statusPendente, statusEmAndamento, statusConcluida) {
  const statusIds = [];
  if (statusPendente) statusIds.push(statusPendente.id);
  if (statusEmAndamento) statusIds.push(statusEmAndamento.id);
  if (statusConcluida) statusIds.push(statusConcluida.id);
  return statusIds;
}

module.exports = {
  criarJPEGMinimo,
  criarImagemTeste,
  removerArquivoTeste,
  tratarErroUpload,
  tratarErroCritico,
  validarEntidade,
  construirStatusIds
};

