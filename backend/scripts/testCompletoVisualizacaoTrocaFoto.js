/**
 * TESTE COMPLETO DE VISUALIZAÇÃO E TROCA DE FOTO
 * 
 * Este script testa:
 * 1. Upload de foto inicial
 * 2. Visualização da imagem via GET /api/fotos/:id/imagem (S3)
 * 3. Troca de foto (upload de nova foto para o mesmo checklist item)
 * 4. Verificação de que a foto antiga foi substituída
 * 5. Visualização da nova foto
 * 6. Validação completa no banco de dados
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
  uploadInicial: false,
  visualizacaoInicial: false,
  trocaFoto: false,
  fotoAntigaSubstituida: false,
  visualizacaoNovaFoto: false,
  checklistAtualizado: false,
  todasPassaram: false
};

// Função para criar imagem temporária
async function criarImagemTemporaria(imagePath, cor = 'azul') {
  // Criar um arquivo de texto simples que simula uma imagem
  // Na prática, você pode usar uma biblioteca como 'sharp' ou 'jimp'
  const placeholderText = `PLACEHOLDER_IMAGE_${cor}_${Date.now()}`;
  fs.writeFileSync(imagePath, placeholderText);
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
    if (createdData.foto1) {
      await createdData.foto1.destroy().catch(() => {});
    }
    if (createdData.foto2) {
      await createdData.foto2.destroy().catch(() => {});
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
  const bcrypt = require('bcryptjs');
  const senhaHash = await bcrypt.hash('senha123', 10);
  const cpfTeste = '11144477735';
  const emailTeste = `vistoriador.visual.troca.${Date.now()}@teste.com`;
  
  // Verificar se usuário já existe (com retry)
  let usuario = null;
  let tentativas = 0;
  const maxTentativas = 3;
  
  while (!usuario && tentativas < maxTentativas) {
    usuario = await Usuario.findOne({ where: { cpf: cpfTeste } });
    if (!usuario && tentativas < maxTentativas - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    tentativas++;
  }
  
  if (usuario) {
    logDetail(`Usuário existente encontrado: ${usuario.nome} (ID: ${usuario.id})`);
    // Atualizar senha e nível de acesso (não atualizar email para evitar constraint)
    try {
      await usuario.update({ 
        senha_hash: senhaHash,
        ativo: true,
        nivel_acesso_id: nivelAcesso.id
      });
      logDetail('Usuário atualizado com sucesso');
    } catch (updateError) {
      // Se falhar ao atualizar, continuar com o usuário existente
      logDetail('Não foi possível atualizar usuário, usando existente');
    }
  } else {
    logDetail('Usuário não encontrado após buscas, tentando criar...');
    // Criar novo usuário
    try {
      usuario = await Usuario.create({
        nome: 'Vistoriador Teste Visualização Troca',
        email: emailTeste,
        cpf: cpfTeste,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelAcesso.id,
        ativo: true
      });
      logDetail(`Novo usuário criado: ${usuario.nome} (ID: ${usuario.id})`);
    } catch (createError) {
      logDetail(`Erro ao criar usuário: ${createError.message}`);
      // Se falhar ao criar (provavelmente já existe), buscar novamente com delay maior
      await new Promise(resolve => setTimeout(resolve, 500));
      // Tentar buscar de várias formas
      usuario = await Usuario.findOne({ where: { cpf: cpfTeste } });
      if (!usuario) {
        // Tentar buscar sem where específico (pode ser problema de cache)
        const todosUsuarios = await Usuario.findAll({ limit: 100 });
        usuario = todosUsuarios.find(u => u.cpf === cpfTeste);
      }
      if (!usuario) {
        // Se ainda não encontrou, o erro é real
        logError(`Não foi possível criar ou encontrar usuário com CPF ${cpfTeste}`);
        throw createError;
      }
      logDetail(`Usuário encontrado após erro de criação: ${usuario.nome} (ID: ${usuario.id})`);
    }
  }
  
  if (!usuario) {
    throw new Error('Não foi possível obter ou criar usuário para teste');
  }
  
  // Criar status
  let status = await StatusVistoria.findOne({ where: { nome: 'EM ANDAMENTO' } });
  if (!status) {
    status = await StatusVistoria.create({ nome: 'EM ANDAMENTO' });
  }
  
  // Criar local
  let local = await Local.findOne({ where: { nome_local: 'Local Teste Visualização Troca' } });
  if (!local) {
    local = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Local Teste Visualização Troca',
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
  let embarcacao = await Embarcacao.findOne({ where: { nome: 'Embarcação Teste Visualização Troca' } });
  if (!embarcacao) {
    embarcacao = await Embarcacao.create({
      nome: 'Embarcação Teste Visualização Troca',
      tipo_embarcacao: 'JET_SKI',
      nr_inscricao_barco: `TEST-VISUAL-${Date.now()}`,
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
  const codigoTipoFoto = `TESTE_VISUAL_TROCA_${Date.now()}`;
  let tipoFoto = await TipoFotoChecklist.findOne({ where: { codigo: codigoTipoFoto } });
  if (!tipoFoto) {
    tipoFoto = await TipoFotoChecklist.create({
      codigo: codigoTipoFoto,
      nome_exibicao: 'Tipo Foto Teste Visualização Troca',
      descricao: 'Tipo de foto para teste de visualização e troca',
      obrigatorio: false
    });
  }
  
  // Criar item do checklist
  const checklistItem = await VistoriaChecklistItem.create({
    vistoria_id: vistoria.id,
    tipo_foto_id: tipoFoto.id,
    nome: 'Item Teste Visualização Troca',
    descricao: 'Item de teste para visualização e troca de imagem',
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
  logSection('TESTE COMPLETO DE VISUALIZACAO E TROCA DE FOTO');
  
  let token = null;
  let createdData = {};
  let foto1Id = null;
  let foto2Id = null;
  
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
    
    // ========== TESTE 1: UPLOAD DE FOTO INICIAL ==========
    logStep(3, 'TESTE 1: Upload de foto inicial...');
    const imagePath1 = path.join(__dirname, 'temp_test_foto1.png');
    await criarImagemTemporaria(imagePath1, 'AZUL');
    logSuccess(`Imagem 1 criada: ${imagePath1}`);
    
    const formData1 = new FormData();
    formData1.append('foto', fs.createReadStream(imagePath1), 'temp_test_foto1.png');
    formData1.append('vistoria_id', createdData.vistoria.id.toString());
    formData1.append('tipo_foto_id', createdData.tipoFoto.id.toString());
    formData1.append('checklist_item_id', createdData.checklistItem.id.toString());
    formData1.append('observacao', 'Foto inicial de teste');
    
    logDetail('Enviando requisição POST para /api/fotos...');
    
    const uploadResponse1 = await axios.post(`${API_BASE_URL}/api/fotos`, formData1, {
      headers: {
        ...formData1.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    logSuccess('Upload inicial realizado com sucesso!');
    logDetail(`Status HTTP: ${uploadResponse1.status}`);
    logDetail(`Foto ID retornado: ${uploadResponse1.data.id}`);
    logDetail(`URL arquivo: ${uploadResponse1.data.url_arquivo}`);
    foto1Id = uploadResponse1.data.id;
    validations.uploadInicial = true;
    
    // Remover arquivo temporário
    if (fs.existsSync(imagePath1)) {
      fs.unlinkSync(imagePath1);
    }
    
    // Verificar checklist atualizado
    const checklistItem1 = await VistoriaChecklistItem.findByPk(createdData.checklistItem.id);
    if (checklistItem1 && checklistItem1.status === 'CONCLUIDO' && checklistItem1.foto_id === foto1Id) {
      logSuccess('Checklist atualizado corretamente após upload inicial');
      logDetail(`Status: ${checklistItem1.status}`);
      logDetail(`Foto ID vinculada: ${checklistItem1.foto_id}`);
    } else {
      logError('Checklist NÃO foi atualizado corretamente após upload inicial!');
    }
    
    // ========== TESTE 2: VISUALIZAÇÃO DA FOTO INICIAL ==========
    logStep(4, 'TESTE 2: Visualizando foto inicial via GET /api/fotos/:id/imagem...');
    try {
      const visualizacaoResponse1 = await axios.get(`${API_BASE_URL}/api/fotos/${foto1Id}/imagem`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      });
      
      logSuccess('Rota de visualização respondeu corretamente');
      logDetail(`Status HTTP: ${visualizacaoResponse1.status}`);
      
      if (visualizacaoResponse1.status === 302 || visualizacaoResponse1.status === 301) {
        const redirectUrl = visualizacaoResponse1.headers.location;
        logDetail(`Redirecionado para: ${redirectUrl}`);
        
        // Tentar acessar a URL de destino
        try {
          const imageResponse = await axios.get(redirectUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
          });
          
          if (imageResponse.status === 200 && imageResponse.data) {
            logSuccess('Imagem inicial acessível via URL de redirecionamento');
            logDetail(`Tamanho da imagem: ${imageResponse.data.length} bytes`);
            validations.visualizacaoInicial = true;
          }
        } catch (imageError) {
          logError('Não foi possível acessar a imagem na URL de redirecionamento');
          logDetail(`Erro: ${imageError.message}`);
        }
      } else if (visualizacaoResponse1.status === 200) {
        if (visualizacaoResponse1.data) {
          logSuccess('Imagem inicial servida diretamente pelo servidor');
          logDetail(`Tamanho da imagem: ${visualizacaoResponse1.data.length || 'N/A'} bytes`);
          validations.visualizacaoInicial = true;
        }
      }
    } catch (visualizacaoError) {
      logError('Erro ao testar visualização da foto inicial');
      if (visualizacaoError.response) {
        logDetail(`Status: ${visualizacaoError.response.status}`);
        logDetail(`Erro: ${visualizacaoError.response.data?.error || visualizacaoError.response.data?.message || 'Erro desconhecido'}`);
      } else {
        logDetail(`Erro: ${visualizacaoError.message}`);
      }
    }
    
    // ========== TESTE 3: TROCA DE FOTO ==========
    logStep(5, 'TESTE 3: Trocando foto (upload de nova foto para o mesmo checklist item)...');
    const imagePath2 = path.join(__dirname, 'temp_test_foto2.png');
    await criarImagemTemporaria(imagePath2, 'VERMELHO');
    logSuccess(`Imagem 2 criada: ${imagePath2}`);
    
    const formData2 = new FormData();
    formData2.append('foto', fs.createReadStream(imagePath2), 'temp_test_foto2.png');
    formData2.append('vistoria_id', createdData.vistoria.id.toString());
    formData2.append('tipo_foto_id', createdData.tipoFoto.id.toString());
    formData2.append('checklist_item_id', createdData.checklistItem.id.toString());
    formData2.append('observacao', 'Foto de troca de teste');
    
    logDetail('Enviando requisição POST para /api/fotos (troca)...');
    
    const uploadResponse2 = await axios.post(`${API_BASE_URL}/api/fotos`, formData2, {
      headers: {
        ...formData2.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    logSuccess('Upload de troca realizado com sucesso!');
    logDetail(`Status HTTP: ${uploadResponse2.status}`);
    logDetail(`Nova Foto ID retornado: ${uploadResponse2.data.id}`);
    logDetail(`URL arquivo: ${uploadResponse2.data.url_arquivo}`);
    foto2Id = uploadResponse2.data.id;
    validations.trocaFoto = true;
    
    // Remover arquivo temporário
    if (fs.existsSync(imagePath2)) {
      fs.unlinkSync(imagePath2);
    }
    
    // ========== TESTE 4: VERIFICAR SE FOTO ANTIGA FOI SUBSTITUÍDA ==========
    logStep(6, 'TESTE 4: Verificando se foto antiga foi substituída...');
    
    // Verificar no checklist se a foto_id foi atualizada
    const checklistItem2 = await VistoriaChecklistItem.findByPk(createdData.checklistItem.id);
    if (checklistItem2 && checklistItem2.foto_id === foto2Id) {
      logSuccess('Foto antiga foi substituída no checklist');
      logDetail(`Foto ID antiga: ${foto1Id}`);
      logDetail(`Foto ID nova: ${foto2Id}`);
      logDetail(`Foto ID no checklist: ${checklistItem2.foto_id}`);
      validations.fotoAntigaSubstituida = true;
    } else {
      logError('Foto antiga NÃO foi substituída no checklist!');
      logDetail(`Foto ID esperada: ${foto2Id}`);
      logDetail(`Foto ID encontrada: ${checklistItem2?.foto_id || 'null'}`);
    }
    
    // Verificar se a foto antiga ainda existe no banco
    const fotoAntiga = await Foto.findByPk(foto1Id);
    if (fotoAntiga) {
      logInfo('Foto antiga ainda existe no banco (pode ser normal se não houver deleção automática)');
      logDetail(`Foto antiga ID: ${fotoAntiga.id}`);
      logDetail(`URL arquivo antiga: ${fotoAntiga.url_arquivo}`);
    } else {
      logInfo('Foto antiga foi deletada do banco (deleção automática ativa)');
    }
    
    // ========== TESTE 5: VISUALIZAÇÃO DA NOVA FOTO ==========
    logStep(7, 'TESTE 5: Visualizando nova foto via GET /api/fotos/:id/imagem...');
    try {
      const visualizacaoResponse2 = await axios.get(`${API_BASE_URL}/api/fotos/${foto2Id}/imagem`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      });
      
      logSuccess('Rota de visualização da nova foto respondeu corretamente');
      logDetail(`Status HTTP: ${visualizacaoResponse2.status}`);
      
      if (visualizacaoResponse2.status === 302 || visualizacaoResponse2.status === 301) {
        const redirectUrl = visualizacaoResponse2.headers.location;
        logDetail(`Redirecionado para: ${redirectUrl}`);
        
        // Tentar acessar a URL de destino
        try {
          const imageResponse = await axios.get(redirectUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
          });
          
          if (imageResponse.status === 200 && imageResponse.data) {
            logSuccess('Nova imagem acessível via URL de redirecionamento');
            logDetail(`Tamanho da imagem: ${imageResponse.data.length} bytes`);
            validations.visualizacaoNovaFoto = true;
          }
        } catch (imageError) {
          logError('Não foi possível acessar a nova imagem na URL de redirecionamento');
          logDetail(`Erro: ${imageError.message}`);
        }
      } else if (visualizacaoResponse2.status === 200) {
        if (visualizacaoResponse2.data) {
          logSuccess('Nova imagem servida diretamente pelo servidor');
          logDetail(`Tamanho da imagem: ${visualizacaoResponse2.data.length || 'N/A'} bytes`);
          validations.visualizacaoNovaFoto = true;
        }
      }
    } catch (visualizacaoError) {
      logError('Erro ao testar visualização da nova foto');
      if (visualizacaoError.response) {
        logDetail(`Status: ${visualizacaoError.response.status}`);
        logDetail(`Erro: ${visualizacaoError.response.data?.error || visualizacaoError.response.data?.message || 'Erro desconhecido'}`);
      } else {
        logDetail(`Erro: ${visualizacaoError.message}`);
      }
    }
    
    // ========== TESTE 6: VALIDAÇÃO FINAL NO BANCO ==========
    logStep(8, 'TESTE 6: Validação final no banco de dados...');
    
    const foto2NoBanco = await Foto.findByPk(foto2Id);
    const checklistItemFinal = await VistoriaChecklistItem.findByPk(createdData.checklistItem.id);
    
    if (foto2NoBanco && checklistItemFinal) {
      logSuccess('Validação final no banco:');
      logDetail(`Foto 2 ID: ${foto2NoBanco.id}`);
      logDetail(`Foto 2 URL: ${foto2NoBanco.url_arquivo}`);
      logDetail(`Checklist Item Status: ${checklistItemFinal.status}`);
      logDetail(`Checklist Item Foto ID: ${checklistItemFinal.foto_id}`);
      
      if (checklistItemFinal.status === 'CONCLUIDO' && checklistItemFinal.foto_id === foto2Id) {
        logSuccess('Checklist está correto com a nova foto');
        validations.checklistAtualizado = true;
      } else {
        logError('Checklist NÃO está correto com a nova foto!');
      }
    } else {
      logError('Dados não encontrados no banco para validação final');
    }
    
    // Armazenar fotos para limpeza
    createdData.foto1 = foto1Id ? await Foto.findByPk(foto1Id) : null;
    createdData.foto2 = foto2Id ? await Foto.findByPk(foto2Id) : null;
    
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
      if (key === 'todasPassaram') return; // Pular, será calculado
      const label = key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase());
      if (value) {
        logSuccess(`${label}`);
      } else {
        logError(`${label}`);
      }
    });
    
    validations.todasPassaram = Object.values(validations).filter((v, i, arr) => {
      const keys = Object.keys(validations);
      return keys[i] !== 'todasPassaram';
    }).every(Boolean);
    
    logSection('RESULTADO FINAL');
    if (validations.todasPassaram) {
      logSuccess('TODAS AS VALIDAÇÕES PASSARAM!');
      logSuccess('O sistema está funcionando corretamente!');
      logSuccess('Visualização e troca de fotos estão operacionais!');
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

