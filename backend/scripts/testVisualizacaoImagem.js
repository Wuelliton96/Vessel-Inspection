/**
 * TESTE DE VALIDAÇÃO DE VISUALIZAÇÃO DE IMAGEM
 * 
 * Este script testa:
 * 1. Upload de foto com checklist_item_id
 * 2. Verificação do nome do arquivo contendo checklist_item_id
 * 3. Teste da rota GET /api/fotos/:id/imagem
 * 4. Validação de acesso à imagem
 * 5. Verificação do checklist atualizado
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Foto, Vistoria, VistoriaChecklistItem, TipoFotoChecklist, Usuario, Embarcacao, Local, StatusVistoria, NivelAcesso, Cliente, Seguradora } = require('../models');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

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

const logStep = (step, message) => {
  log(`\n[PASSO ${step}] ${message}`, 'blue');
};

const logSuccess = (message) => log(`[OK] ${message}`, 'green');
const logError = (message) => log(`[ERRO] ${message}`, 'red');
const logInfo = (message) => log(`[INFO] ${message}`, 'yellow');
const logDetail = (message) => log(`  -> ${message}`, 'magenta');

// Objeto para armazenar validações
const validations = {
  uploadRealizado: false,
  nomeArquivoComChecklistId: false,
  checklistAtualizado: false,
  rotaVisualizacaoFunciona: false,
  imagemAcessivel: false,
  urlArquivoCorreta: false
};

// Função para criar imagem temporária
async function criarImagemTemporaria(imagePath) {
  // Criar uma imagem PNG simples (1x1 pixel)
  const width = 800;
  const height = 600;
  const buffer = Buffer.alloc(width * height * 4);
  
  // Preencher com cor de teste (azul)
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = 100;     // R
    buffer[i + 1] = 150; // G
    buffer[i + 2] = 255; // B
    buffer[i + 3] = 255; // A
  }
  
  // Usar um método mais simples: criar um arquivo de texto que simula uma imagem
  // Na prática, você pode usar uma biblioteca como 'sharp' ou 'jimp'
  // Por enquanto, vamos criar um arquivo vazio e depois usar uma imagem real se disponível
  
  // Tentar usar uma imagem existente ou criar um placeholder
  const placeholderText = 'PLACEHOLDER_IMAGE';
  fs.writeFileSync(imagePath, placeholderText);
  
  // Se houver uma imagem de teste disponível, usar ela
  const testImagePath = path.join(__dirname, '..', 'uploads', 'test-image.png');
  if (fs.existsSync(testImagePath)) {
    fs.copyFileSync(testImagePath, imagePath);
  }
}

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

// Função para limpar dados de teste
async function limparDadosTeste(createdData = {}) {
  try {
    if (createdData.foto) {
      await createdData.foto.destroy().catch(() => {});
    }
    if (createdData.checklistItem) {
      await createdData.checklistItem.destroy().catch(() => {});
    }
    if (createdData.vistoria) {
      await createdData.vistoria.destroy().catch(() => {});
    }
    if (createdData.tipoFoto) {
      await createdData.tipoFoto.destroy().catch(() => {});
    }
    if (createdData.embarcacao) {
      await createdData.embarcacao.destroy().catch(() => {});
    }
    if (createdData.local) {
      await createdData.local.destroy().catch(() => {});
    }
    if (createdData.status) {
      await createdData.status.destroy().catch(() => {});
    }
    if (createdData.usuario) {
      await createdData.usuario.destroy().catch(() => {});
    }
  } catch (error) {
    // Ignorar erros de limpeza
  }
}

// Função para criar dados de teste
async function criarDadosTeste() {
  // Criar ou buscar nível de acesso
  let nivelAcesso = await NivelAcesso.findOne({ where: { nome: 'Vistoriador' } });
  if (!nivelAcesso) {
    nivelAcesso = await NivelAcesso.create({ nome: 'Vistoriador' });
  }
  
  // Criar ou atualizar usuário
  const cpfTeste = '11144477735';
  let usuario = await Usuario.findOne({ where: { cpf: cpfTeste } });
  if (usuario) {
    usuario.senha_hash = require('bcryptjs').hashSync('senha123', 10);
    usuario.email = `teste-${Date.now()}@teste.com`;
    await usuario.save();
  } else {
    usuario = await Usuario.create({
      nome: 'Usuário Teste',
      cpf: cpfTeste,
      email: `teste-${Date.now()}@teste.com`,
      senha_hash: require('bcryptjs').hashSync('senha123', 10),
      nivel_acesso_id: nivelAcesso.id
    });
  }
  
  // Criar status
  let status = await StatusVistoria.findOne({ where: { nome: 'EM ANDAMENTO' } });
  if (!status) {
    status = await StatusVistoria.create({ nome: 'EM ANDAMENTO' });
  }
  
  // Criar local
  let local = await Local.findOne({ where: { nome_local: 'Local Teste Visualização' } });
  if (!local) {
    local = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Local Teste Visualização',
      logradouro: 'Rua Teste',
      numero: '123',
      cidade: 'Teste',
      estado: 'SC',
      cep: '12345678'
    });
  }
  
  // Criar seguradora
  let seguradora = await Seguradora.findOne({ where: { nome: 'Seguradora Teste' } });
  if (!seguradora) {
    seguradora = await Seguradora.create({
      nome: 'Seguradora Teste',
      ativo: true
    });
  }
  
  // Criar cliente
  let cliente = await Cliente.findOne({ where: { cpf: '12345678901' } });
  if (!cliente) {
    cliente = await Cliente.create({
      tipo_pessoa: 'FISICA',
      nome: 'Cliente Teste',
      cpf: '12345678901',
      telefone_e164: '+5511999999999',
      email: 'cliente@teste.com'
    });
  }
  
  // Criar embarcação
  let embarcacao = await Embarcacao.findOne({ where: { nome: 'Embarcação Teste Visualização' } });
  if (!embarcacao) {
    embarcacao = await Embarcacao.create({
      nome: 'Embarcação Teste Visualização',
      tipo_embarcacao: 'JET_SKI',
      nr_inscricao_barco: `TEST-${Date.now()}`,
      proprietario_cpf: cliente.cpf,
      seguradora_id: seguradora.id
    });
  }
  
  // Criar vistoria
  const vistoria = await Vistoria.create({
    embarcacao_id: embarcacao.id,
    local_id: local.id,
    vistoriador_id: usuario.id,
    administrador_id: usuario.id,
    status_id: status.id
  });
  
  // Criar tipo de foto
  const codigoTipoFoto = `TESTE_VISUALIZACAO_${Date.now()}`;
  let tipoFoto = await TipoFotoChecklist.findOne({ where: { codigo: codigoTipoFoto } });
  if (!tipoFoto) {
    tipoFoto = await TipoFotoChecklist.create({
      codigo: codigoTipoFoto,
      nome_exibicao: 'Tipo Foto Teste Visualização',
      descricao: 'Tipo de foto para teste de visualização',
      obrigatorio: false
    });
  }
  
  // Criar item do checklist
  const checklistItem = await VistoriaChecklistItem.create({
    vistoria_id: vistoria.id,
    tipo_foto_id: tipoFoto.id,
    nome: 'Item Teste Visualização',
    descricao: 'Item de teste para visualização de imagem',
    ordem: 1,
    status: 'PENDENTE',
    obrigatorio: false
  });
  
  return {
    usuario,
    vistoria,
    tipoFoto,
    checklistItem,
    embarcacao,
    local,
    status
  };
}

// Função principal
async function main() {
  logSection('TESTE DE VALIDAÇÃO DE VISUALIZAÇÃO DE IMAGEM');
  
  let token = null;
  let createdData = {};
  
  try {
    logStep(0, 'Limpando dados de teste antigos...');
    await limparDadosTeste();
    logSuccess('Dados antigos limpos');
    
    logStep(1, 'Criando dados de teste...');
    createdData = await criarDadosTeste();
    logSuccess('Dados de teste criados com sucesso!');
    logDetail(`Vistoria ID: ${createdData.vistoria.id}`);
    logDetail(`Checklist Item ID: ${createdData.checklistItem.id}`);
    logDetail(`Tipo Foto ID: ${createdData.tipoFoto.id}`);
    
    logStep(2, 'Fazendo login...');
    token = await fazerLogin(createdData.usuario.cpf, 'senha123');
    logSuccess('Login realizado com sucesso');
    logDetail(`Token recebido: ${token.substring(0, 20)}...`);
    
    logStep(3, 'Criando imagem de teste...');
    const imagePath = path.join(__dirname, 'temp_test_visualizacao.png');
    await criarImagemTemporaria(imagePath);
    logSuccess(`Imagem criada: ${imagePath}`);
    
    logStep(4, 'Testando upload de foto...');
    const formData = new FormData();
    formData.append('foto', fs.createReadStream(imagePath), 'temp_test_visualizacao.png');
    formData.append('vistoria_id', createdData.vistoria.id.toString());
    formData.append('tipo_foto_id', createdData.tipoFoto.id.toString());
    formData.append('checklist_item_id', createdData.checklistItem.id.toString());
    formData.append('observacao', 'Foto de teste para visualização');
    
    logDetail('Enviando requisição POST para /api/fotos...');
    
    const uploadResponse = await axios.post(`${API_BASE_URL}/api/fotos`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    logSuccess('Upload realizado com sucesso!');
    logDetail(`Status HTTP: ${uploadResponse.status}`);
    logDetail(`Foto ID retornado: ${uploadResponse.data.id}`);
    logDetail(`URL arquivo: ${uploadResponse.data.url_arquivo}`);
    logDetail(`Checklist item ID enviado: ${uploadResponse.data.checklist_item_id_enviado}`);
    
    validations.uploadRealizado = true;
    
    // Remover arquivo temporário
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    const fotoId = uploadResponse.data.id;
    const checklistItemId = createdData.checklistItem.id;
    const expectedFilenamePart = `checklist-${checklistItemId}`;
    
    logStep(5, 'Validando nome do arquivo...');
    if (uploadResponse.data.url_arquivo && uploadResponse.data.url_arquivo.includes(expectedFilenamePart)) {
      logSuccess(`Nome do arquivo contém checklist_item_id: ${expectedFilenamePart}`);
      logDetail(`URL completa: ${uploadResponse.data.url_arquivo}`);
      validations.nomeArquivoComChecklistId = true;
      validations.urlArquivoCorreta = true;
    } else {
      logError(`Nome do arquivo NÃO contém checklist_item_id esperado`);
      logDetail(`Esperado: ${expectedFilenamePart}`);
      logDetail(`Recebido: ${uploadResponse.data.url_arquivo}`);
    }
    
    logStep(6, 'Validando checklist atualizado...');
    const checklistItemAtualizado = await VistoriaChecklistItem.findByPk(checklistItemId);
    if (checklistItemAtualizado && checklistItemAtualizado.status === 'CONCLUIDO' && checklistItemAtualizado.foto_id === fotoId) {
      logSuccess('Checklist atualizado corretamente');
      logDetail(`Status: ${checklistItemAtualizado.status}`);
      logDetail(`Foto ID vinculada: ${checklistItemAtualizado.foto_id}`);
      validations.checklistAtualizado = true;
    } else {
      logError('Checklist NÃO foi atualizado corretamente!');
      logDetail(`Status atual: ${checklistItemAtualizado?.status || 'N/A'} (esperado: CONCLUIDO)`);
      logDetail(`Foto ID vinculada: ${checklistItemAtualizado?.foto_id || 'null'} (esperado: ${fotoId})`);
    }
    
    logStep(7, 'Testando rota de visualização GET /api/fotos/:id/imagem...');
    try {
      const visualizacaoResponse = await axios.get(`${API_BASE_URL}/api/fotos/${fotoId}/imagem`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400 // Aceitar 2xx e 3xx (redirects)
      });
      
      logSuccess('Rota de visualização respondeu corretamente');
      logDetail(`Status HTTP: ${visualizacaoResponse.status}`);
      
      // Se for um redirect (302), a URL de destino está no header Location
      if (visualizacaoResponse.status === 302 || visualizacaoResponse.status === 301) {
        const redirectUrl = visualizacaoResponse.headers.location;
        logDetail(`Redirecionado para: ${redirectUrl}`);
        
        // Tentar acessar a URL de destino (pode ser S3 ou local)
        try {
          const imageResponse = await axios.get(redirectUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
          });
          
          if (imageResponse.status === 200 && imageResponse.data) {
            logSuccess('Imagem acessível via URL de redirecionamento');
            logDetail(`Tamanho da imagem: ${imageResponse.data.length} bytes`);
            validations.imagemAcessivel = true;
          }
        } catch (imageError) {
          logError('Não foi possível acessar a imagem na URL de redirecionamento');
          logDetail(`Erro: ${imageError.message}`);
        }
      } else if (visualizacaoResponse.status === 200) {
        // Se retornou 200, a imagem foi servida diretamente (armazenamento local)
        if (visualizacaoResponse.data) {
          logSuccess('Imagem servida diretamente pelo servidor');
          logDetail(`Tamanho da imagem: ${visualizacaoResponse.data.length || 'N/A'} bytes`);
          logDetail(`Content-Type: ${visualizacaoResponse.headers['content-type'] || 'N/A'}`);
          validations.imagemAcessivel = true;
        }
      }
      
      validations.rotaVisualizacaoFunciona = true;
    } catch (visualizacaoError) {
      logError('Erro ao testar rota de visualização');
      if (visualizacaoError.response) {
        logDetail(`Status: ${visualizacaoError.response.status}`);
        logDetail(`Erro: ${visualizacaoError.response.data?.error || visualizacaoError.response.data?.message || 'Erro desconhecido'}`);
      } else {
        logDetail(`Erro: ${visualizacaoError.message}`);
      }
    }
    
    logStep(8, 'Verificando foto no banco de dados...');
    const fotoNoBanco = await Foto.findByPk(fotoId);
    if (fotoNoBanco) {
      logSuccess(`Foto encontrada no banco (ID: ${fotoNoBanco.id})`);
      logDetail(`url_arquivo: ${fotoNoBanco.url_arquivo}`);
      logDetail(`vistoria_id: ${fotoNoBanco.vistoria_id}`);
      logDetail(`tipo_foto_id: ${fotoNoBanco.tipo_foto_id}`);
      
      // Verificar se o nome do arquivo no banco contém o checklist_item_id
      if (fotoNoBanco.url_arquivo.includes(expectedFilenamePart)) {
        logSuccess(`Nome do arquivo no banco contém checklist_item_id`);
      } else {
        logError(`Nome do arquivo no banco NÃO contém checklist_item_id`);
      }
    } else {
      logError(`Foto NÃO encontrada no banco (ID: ${fotoId})`);
    }
    
  } catch (error) {
    logError(`\nErro durante o teste: ${error.message}`);
    if (error.response) {
      logDetail(`Status: ${error.response.status}`);
      logDetail(`Dados: ${JSON.stringify(error.response.data)}`);
    }
    logDetail(`Stack: ${error.stack}`);
  } finally {
    logSection('RESUMO DAS VALIDAÇÕES');
    Object.entries(validations).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase());
      if (value) {
        logSuccess(`${label}`);
      } else {
        logError(`${label}`);
      }
    });
    
    logSection('RESULTADO FINAL');
    const todasPassaram = Object.values(validations).every(Boolean);
    if (todasPassaram) {
      logSuccess('TODAS AS VALIDAÇÕES PASSARAM!');
      logSuccess('O sistema está funcionando corretamente!');
      logSuccess('A visualização de imagens está operacional!');
    } else {
      logError('ALGUMAS VALIDAÇÕES FALHARAM!');
      logError('Verifique os logs acima para identificar o problema.');
      process.exit(1);
    }
    
    logStep(9, 'Limpando dados de teste...');
    await limparDadosTeste(createdData);
    logSuccess('Dados de teste limpos');
  }
}

// Executar teste
main().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  process.exit(1);
});

