/**
 * TESTE COMPLETO DE VISUALIZAÇÃO NO FRONTEND
 * 
 * Este script simula o comportamento do frontend:
 * 1. Faz login como vistoriador
 * 2. Busca vistoria 30
 * 3. Busca itens do checklist com foto
 * 4. Chama /api/fotos/:id/imagem-url para obter a presigned URL
 * 5. Tenta carregar a imagem usando a presigned URL
 * 6. Verifica se a imagem é exibível
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Foto, Vistoria, VistoriaChecklistItem, Usuario } = require('../models');
const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
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

// Função para fazer login
async function fazerLogin(cpf, senha) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      cpf,
      senha
    });
    
    if (response.data.token) {
      return response.data.token;
    }
    throw new Error('Token não recebido');
  } catch (error) {
    if (error.response) {
      throw new Error(`Erro no login: ${error.response.data.error || error.response.data.message || 'Erro desconhecido'}`);
    }
    throw new Error(`Erro no login: ${error.message}`);
  }
}

async function main() {
  logSection('TESTE COMPLETO DE VISUALIZACAO NO FRONTEND');
  
  let token = null;
  
  try {
    // 1. Buscar vistoria e vistoriador
    logSection('PASSO 1: Buscando Vistoria 30 e Vistoriador');
    const vistoria = await Vistoria.findByPk(VISTORIA_ID);
    
    if (!vistoria) {
      logError(`Vistoria ${VISTORIA_ID} não encontrada`);
      process.exit(1);
    }
    
    logSuccess(`Vistoria ${VISTORIA_ID} encontrada`);
    
    const vistoriador = await Usuario.findByPk(vistoria.vistoriador_id);
    if (!vistoriador) {
      logError(`Vistoriador não encontrado`);
      process.exit(1);
    }
    
    logSuccess(`Vistoriador: ${vistoriador.nome} (CPF: ${vistoriador.cpf})`);
    
    // 2. Fazer login
    logSection('PASSO 2: Fazendo login como vistoriador');
    
    // Atualizar senha se necessário
    const bcrypt = require('bcryptjs');
    const senhaHash = await bcrypt.hash('senha123', 10);
    await vistoriador.update({ senha_hash: senhaHash });
    
    token = await fazerLogin(vistoriador.cpf, 'senha123');
    logSuccess('Login realizado com sucesso');
    logDetail(`Token: ${token.substring(0, 20)}...`);
    
    // 3. Buscar itens do checklist com foto
    logSection('PASSO 3: Buscando itens do checklist com foto');
    const checklistItens = await VistoriaChecklistItem.findAll({
      where: {
        vistoria_id: VISTORIA_ID,
        status: 'CONCLUIDO',
        foto_id: { [require('sequelize').Op.ne]: null }
      },
      include: [
        { model: Foto, as: 'foto', attributes: ['id', 'url_arquivo', 'created_at'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    if (checklistItens.length === 0) {
      logError('Nenhum item do checklist com foto encontrado');
      process.exit(1);
    }
    
    logSuccess(`${checklistItens.length} item(ns) do checklist com foto encontrado(s)`);
    
    // 4. Testar visualização de cada foto (simulando o frontend)
    logSection('PASSO 4: Testando visualização de fotos (simulando frontend)');
    
    for (let i = 0; i < checklistItens.length; i++) {
      const item = checklistItens[i];
      const foto = item.foto;
      
      if (!foto) continue;
      
      log(`\n--- Item ${i + 1}/${checklistItens.length}: "${item.nome}" (Foto ID: ${foto.id}) ---`);
      logDetail(`URL no banco: "${foto.url_arquivo}"`);
      
      // PASSO 4.1: Chamar /api/fotos/:id/imagem-url (como o frontend faz)
      logDetail('Simulando frontend: Chamando /api/fotos/:id/imagem-url...');
      try {
        const urlResponse = await axios.get(`${API_BASE_URL}/api/fotos/${foto.id}/imagem-url`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (urlResponse.status === 200 && urlResponse.data.encontrada && urlResponse.data.url) {
          logSuccess('URL da imagem obtida com sucesso!');
          logDetail(`URL: ${urlResponse.data.url.substring(0, 100)}...`);
          
          const presignedUrl = urlResponse.data.url;
          
          // PASSO 4.2: Tentar carregar a imagem usando a presigned URL (como o frontend faz)
          logDetail('Simulando frontend: Carregando imagem usando presigned URL...');
          try {
            const imageResponse = await axios.get(presignedUrl, {
              responseType: 'arraybuffer',
              timeout: 15000,
              validateStatus: (status) => status === 200
            });
            
            if (imageResponse.status === 200 && imageResponse.data) {
              logSuccess('Imagem carregada com sucesso!');
              logDetail(`Tamanho: ${imageResponse.data.length} bytes`);
              logDetail(`Content-Type: ${imageResponse.headers['content-type'] || 'N/A'}`);
              
              // Verificar se é uma imagem válida
              const buffer = Buffer.from(imageResponse.data);
              const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8;
              const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50;
              
              if (isJPEG || isPNG) {
                logSuccess('Imagem válida detectada!');
                logDetail(`Formato: ${isJPEG ? 'JPEG' : 'PNG'}`);
              } else {
                logError('Arquivo não parece ser uma imagem válida');
              }
            } else {
              logError(`Imagem retornou status ${imageResponse.status}`);
            }
          } catch (imageError) {
            if (imageError.response) {
              logError(`Erro ao carregar imagem: ${imageError.response.status} - ${imageError.response.statusText}`);
            } else {
              logError(`Erro ao carregar imagem: ${imageError.message}`);
            }
          }
        } else {
          logError('Resposta da API não contém URL válida');
          logDetail(`Status: ${urlResponse.status}`);
          logDetail(`Dados: ${JSON.stringify(urlResponse.data)}`);
        }
      } catch (urlError) {
        if (urlError.response) {
          logError(`Erro ao obter URL da imagem: ${urlError.response.status} - ${urlError.response.statusText}`);
          if (urlError.response.data) {
            logDetail(`Erro: ${JSON.stringify(urlError.response.data)}`);
          }
        } else {
          logError(`Erro ao obter URL da imagem: ${urlError.message}`);
        }
      }
    }
    
    // 5. Resumo final
    logSection('RESUMO DO TESTE');
    logSuccess(`Vistoria ${VISTORIA_ID} encontrada`);
    logSuccess(`Vistoriador: ${vistoriador.nome}`);
    logSuccess(`Login realizado com sucesso`);
    logSuccess(`${checklistItens.length} item(ns) do checklist com foto encontrado(s)`);
    logInfo('Verifique os resultados acima para cada foto testada');
    logInfo('\nSe todas as imagens foram carregadas com sucesso, o sistema está funcionando!');
    
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

