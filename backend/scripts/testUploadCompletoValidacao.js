/**
 * TESTE COMPLETO DE VALIDAÇÃO DE UPLOAD DE FOTO
 * 
 * Este script testa todo o fluxo de upload:
 * 1. Cria dados de teste (vistoria, checklist item)
 * 2. Faz upload de foto com checklist_item_id
 * 3. Verifica se a foto foi salva no banco
 * 4. Verifica se o checklist foi atualizado
 * 5. Verifica se o nome do arquivo contém o checklist_item_id
 * 6. Valida tudo no banco de dados
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Foto, Vistoria, VistoriaChecklistItem, TipoFotoChecklist, Usuario, Embarcacao, Local, StatusVistoria, NivelAcesso } = require('../models');
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

const logSuccess = (message) => log(`✓ ${message}`, 'green');
const logError = (message) => log(`✗ ${message}`, 'red');
const logInfo = (message) => log(`ℹ ${message}`, 'yellow');
const logDetail = (message) => log(`  → ${message}`, 'magenta');

let dadosTeste = null;

async function limparDadosAntigos() {
  logStep(0, 'Limpando dados de teste antigos...');
  try {
    // Buscar vistorias de teste
    const vistoriasTeste = await Vistoria.findAll({
      where: {
        '$Embarcacao.nr_inscricao_barco$': 'TEST-UPLOAD-001'
      },
      include: [{ model: Embarcacao, as: 'Embarcacao' }]
    });
    
    for (const vistoria of vistoriasTeste) {
      // Deletar fotos
      const fotos = await Foto.findAll({ where: { vistoria_id: vistoria.id } });
      for (const foto of fotos) {
        await foto.destroy();
      }
      
      // Deletar checklist items
      const items = await VistoriaChecklistItem.findAll({ where: { vistoria_id: vistoria.id } });
      for (const item of items) {
        await item.destroy();
      }
      
      await vistoria.destroy();
    }
    
    logSuccess('Dados antigos limpos');
  } catch (error) {
    logError(`Erro ao limpar: ${error.message}`);
  }
}

async function criarDadosTeste() {
  logStep(1, 'Criando dados de teste...');
  
  try {
    // Criar nível de acesso
    const [nivelAcesso] = await NivelAcesso.findOrCreate({
      where: { id: 2 },
      defaults: { nome: 'VISTORIADOR', descricao: 'Vistoriador' }
    });
    logDetail(`Nível de acesso: ${nivelAcesso.nome} (ID: ${nivelAcesso.id})`);
    
    // Criar usuário vistoriador
    const bcrypt = require('bcryptjs');
    const senhaHash = await bcrypt.hash('senha123', 10);
    // CPF válido para teste: 11144477735 (válido segundo algoritmo)
    const cpfTeste = '11144477735';
    const emailTeste = `vistoriador.upload.${Date.now()}@teste.com`;
    
    // Verificar se usuário já existe
    let usuario = await Usuario.findOne({ where: { cpf: cpfTeste } });
    
    if (usuario) {
      // Atualizar senha e email
      await usuario.update({ 
        senha_hash: senhaHash,
        email: emailTeste,
        ativo: true
      });
      logDetail(`Usuário existente encontrado, senha e email atualizados`);
    } else {
      // Criar novo usuário
      usuario = await Usuario.create({
        nome: 'Vistoriador Teste Upload',
        email: emailTeste,
        cpf: cpfTeste,
        senha_hash: senhaHash,
        nivel_acesso_id: nivelAcesso.id,
        ativo: true
      });
      logDetail(`Novo usuário criado`);
    }
    logDetail(`Usuário criado: ${usuario.nome} (ID: ${usuario.id}, CPF: ${usuario.cpf})`);
    
    // Criar embarcação
    const [embarcacao] = await Embarcacao.findOrCreate({
      where: { nr_inscricao_barco: 'TEST-UPLOAD-001' },
      defaults: {
        nome: 'Embarcação Teste Upload',
        nr_inscricao_barco: 'TEST-UPLOAD-001',
        tipo_embarcacao: 'JET_SKI'
      }
    });
    logDetail(`Embarcação: ${embarcacao.nome} (ID: ${embarcacao.id})`);
    
    // Criar local
    const [local] = await Local.findOrCreate({
      where: { tipo: 'MARINA', nome_local: 'Marina Teste Upload' },
      defaults: {
        tipo: 'MARINA',
        nome_local: 'Marina Teste Upload',
        cidade: 'Rio de Janeiro',
        estado: 'RJ'
      }
    });
    logDetail(`Local: ${local.nome_local} (ID: ${local.id})`);
    
    // Criar status
    const [status] = await StatusVistoria.findOrCreate({
      where: { nome: 'PENDENTE' },
      defaults: { nome: 'PENDENTE', descricao: 'Vistoria pendente' }
    });
    logDetail(`Status: ${status.nome} (ID: ${status.id})`);
    
    // Criar vistoria
    const vistoria = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: usuario.id,
      status_id: status.id,
      administrador_id: usuario.id
    });
    logDetail(`Vistoria criada: ID ${vistoria.id}`);
    
    // Criar tipo de foto
    const [tipoFoto] = await TipoFotoChecklist.findOrCreate({
      where: { codigo: 'DOCUMENTO_TEST' },
      defaults: {
        codigo: 'DOCUMENTO_TEST',
        nome_exibicao: 'Confirmação do nº de inscrição e nome',
        descricao: 'Foto mostrando claramente o número de inscrição e nome da lancha',
        obrigatorio: true
      }
    });
    logDetail(`Tipo de foto: ${tipoFoto.nome_exibicao} (ID: ${tipoFoto.id})`);
    
    // Criar item do checklist
    const checklistItem = await VistoriaChecklistItem.create({
      vistoria_id: vistoria.id,
      nome: 'Confirmação do nº de inscrição e nome',
      descricao: 'Foto mostrando claramente o número de inscrição e nome da lancha',
      obrigatorio: true,
      status: 'PENDENTE',
      ordem: 1
    });
    logDetail(`Checklist item criado: "${checklistItem.nome}" (ID: ${checklistItem.id})`);
    
    logSuccess('Dados de teste criados com sucesso!');
    
    return { usuario, vistoria, checklistItem, tipoFoto, embarcacao, local };
  } catch (error) {
    logError(`Erro ao criar dados: ${error.message}`);
    throw error;
  }
}

async function fazerLogin(usuario) {
  logStep(2, 'Fazendo login...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      cpf: usuario.cpf,
      senha: 'senha123'
    });
    
    if (response.data.token) {
      logSuccess('Login realizado com sucesso');
      logDetail(`Token recebido: ${response.data.token.substring(0, 20)}...`);
      return response.data.token;
    } else {
      throw new Error('Token não recebido');
    }
  } catch (error) {
    logError(`Erro no login: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      logDetail(`Detalhes: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

function criarImagemTeste() {
  logStep(3, 'Criando imagem de teste...');
  
  // Criar uma imagem PNG simples (1x1 pixel vermelho)
  const imagemBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  
  const tempPath = path.join(__dirname, 'temp_test_upload.png');
  fs.writeFileSync(tempPath, imagemBuffer);
  
  logSuccess(`Imagem criada: ${tempPath} (${imagemBuffer.length} bytes)`);
  return tempPath;
}

async function testarUpload(token, vistoria, checklistItem, tipoFoto) {
  logStep(4, 'Testando upload de foto...');
  
  const imagemPath = criarImagemTeste();
  
  try {
    logDetail(`Preparando FormData...`);
    logDetail(`  - vistoria_id: ${vistoria.id}`);
    logDetail(`  - tipo_foto_id: ${tipoFoto.id}`);
    logDetail(`  - checklist_item_id: ${checklistItem.id}`);
    
    const formData = new FormData();
    formData.append('foto', fs.createReadStream(imagemPath), {
      filename: 'test_upload.png',
      contentType: 'image/png'
    });
    formData.append('vistoria_id', vistoria.id.toString());
    formData.append('tipo_foto_id', tipoFoto.id.toString());
    formData.append('checklist_item_id', checklistItem.id.toString());
    formData.append('observacao', 'Foto de teste - validação completa');
    
    logDetail('Enviando requisição POST para /api/fotos...');
    
    const response = await axios.post(`${API_BASE_URL}/api/fotos`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    logSuccess('Upload realizado com sucesso!');
    logDetail(`Status HTTP: ${response.status}`);
    logDetail(`Foto ID retornado: ${response.data.id}`);
    logDetail(`URL arquivo: ${response.data.url_arquivo}`);
    logDetail(`Checklist item ID enviado: ${response.data.checklist_item_id_enviado || 'null'}`);
    
    return response.data;
  } catch (error) {
    logError(`Erro no upload: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Dados: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  } finally {
    // Limpar arquivo temporário
    if (fs.existsSync(imagemPath)) {
      fs.unlinkSync(imagemPath);
      logDetail('Arquivo temporário removido');
    }
  }
}

async function validarNoBanco(fotoResponse, vistoria, checklistItem) {
  logStep(5, 'Validando dados no banco de dados...');
  
  const validacoes = [];
  
  // 1. Verificar se a foto existe no banco
  logDetail('1. Verificando se foto foi salva no banco...');
  const fotoNoBanco = await Foto.findByPk(fotoResponse.id, {
    include: [
      { model: TipoFotoChecklist, as: 'TipoFotoChecklist' },
      { model: Vistoria, as: 'Vistoria' }
    ]
  });
  
  if (fotoNoBanco) {
    logSuccess(`Foto encontrada no banco (ID: ${fotoNoBanco.id})`);
    logDetail(`  - url_arquivo: ${fotoNoBanco.url_arquivo}`);
    logDetail(`  - vistoria_id: ${fotoNoBanco.vistoria_id}`);
    logDetail(`  - tipo_foto_id: ${fotoNoBanco.tipo_foto_id}`);
    logDetail(`  - created_at: ${fotoNoBanco.created_at}`);
    validacoes.push({ nome: 'Foto salva no banco', sucesso: true });
  } else {
    logError('Foto NÃO encontrada no banco!');
    validacoes.push({ nome: 'Foto salva no banco', sucesso: false });
  }
  
  // 2. Verificar se o nome do arquivo contém checklist_item_id
  logDetail('2. Verificando se nome do arquivo contém checklist_item_id...');
  if (fotoNoBanco && fotoNoBanco.url_arquivo.includes(`checklist-${checklistItem.id}`)) {
    logSuccess(`Nome do arquivo contém checklist_item_id: checklist-${checklistItem.id}`);
    validacoes.push({ nome: 'Nome arquivo com checklist_id', sucesso: true });
  } else {
    logError(`Nome do arquivo NÃO contém checklist_item_id esperado`);
    logDetail(`  Esperado: checklist-${checklistItem.id}`);
    logDetail(`  Recebido: ${fotoNoBanco?.url_arquivo || 'null'}`);
    validacoes.push({ nome: 'Nome arquivo com checklist_id', sucesso: false });
  }
  
  // 3. Verificar se o checklist foi atualizado
  logDetail('3. Verificando se checklist foi atualizado...');
  await checklistItem.reload();
  
  if (checklistItem.status === 'CONCLUIDO' && checklistItem.foto_id === fotoResponse.id) {
    logSuccess('Checklist atualizado corretamente');
    logDetail(`  - Status: ${checklistItem.status}`);
    logDetail(`  - Foto ID vinculada: ${checklistItem.foto_id}`);
    logDetail(`  - Concluído em: ${checklistItem.concluido_em}`);
    validacoes.push({ nome: 'Checklist atualizado', sucesso: true });
  } else {
    logError('Checklist NÃO foi atualizado corretamente!');
    logDetail(`  - Status atual: ${checklistItem.status} (esperado: CONCLUIDO)`);
    logDetail(`  - Foto ID vinculada: ${checklistItem.foto_id || 'null'} (esperado: ${fotoResponse.id})`);
    validacoes.push({ nome: 'Checklist atualizado', sucesso: false });
  }
  
  // 4. Verificar no banco diretamente
  logDetail('4. Verificando diretamente no banco...');
  const itemVerificado = await VistoriaChecklistItem.findByPk(checklistItem.id);
  if (itemVerificado && itemVerificado.foto_id === fotoResponse.id && itemVerificado.status === 'CONCLUIDO') {
    logSuccess('Verificação no banco: OK');
    logDetail(`  - ID: ${itemVerificado.id}`);
    logDetail(`  - Status: ${itemVerificado.status}`);
    logDetail(`  - Foto ID: ${itemVerificado.foto_id}`);
    validacoes.push({ nome: 'Verificação direta no banco', sucesso: true });
  } else {
    logError('Verificação no banco: FALHOU');
    if (itemVerificado) {
      logDetail(`  - Status: ${itemVerificado.status}`);
      logDetail(`  - Foto ID: ${itemVerificado.foto_id || 'null'}`);
    }
    validacoes.push({ nome: 'Verificação direta no banco', sucesso: false });
  }
  
  // 5. Verificar se o ID enviado corresponde ao ID atualizado
  logDetail('5. Verificando se ID enviado corresponde ao ID atualizado...');
  if (fotoResponse.checklist_item_id_enviado) {
    const idEnviado = parseInt(fotoResponse.checklist_item_id_enviado);
    const idAtualizado = checklistItem.id;
    if (idEnviado === idAtualizado) {
      logSuccess(`IDs correspondem: ${idEnviado} === ${idAtualizado}`);
      validacoes.push({ nome: 'IDs correspondem', sucesso: true });
    } else {
      logError(`IDs NÃO correspondem: ${idEnviado} !== ${idAtualizado}`);
      validacoes.push({ nome: 'IDs correspondem', sucesso: false });
    }
  } else {
    logError('checklist_item_id_enviado não está na resposta');
    validacoes.push({ nome: 'IDs correspondem', sucesso: false });
  }
  
  return validacoes;
}

async function limparDadosTeste(vistoria, checklistItem) {
  logStep(6, 'Limpando dados de teste...');
  
  try {
    // Buscar e deletar fotos
    const fotos = await Foto.findAll({ where: { vistoria_id: vistoria.id } });
    for (const foto of fotos) {
      await foto.destroy();
      logDetail(`Foto ${foto.id} deletada`);
    }
    
    // Deletar checklist item
    await checklistItem.destroy();
    logDetail(`Checklist item ${checklistItem.id} deletado`);
    
    // Deletar vistoria
    await vistoria.destroy();
    logDetail(`Vistoria ${vistoria.id} deletada`);
    
    logSuccess('Dados de teste limpos');
  } catch (error) {
    logError(`Erro ao limpar dados: ${error.message}`);
  }
}

async function main() {
  logSection('TESTE COMPLETO DE VALIDAÇÃO DE UPLOAD DE FOTO');
  
  try {
    // Limpar dados antigos
    await limparDadosAntigos();
    
    // Criar dados de teste
    dadosTeste = await criarDadosTeste();
    const { usuario, vistoria, checklistItem, tipoFoto } = dadosTeste;
    
    // Fazer login
    const token = await fazerLogin(usuario);
    
    // Testar upload
    const fotoResponse = await testarUpload(token, vistoria, checklistItem, tipoFoto);
    
    // Validar no banco
    const validacoes = await validarNoBanco(fotoResponse, vistoria, checklistItem);
    
    // Mostrar resumo
    logSection('RESUMO DAS VALIDAÇÕES');
    
    let todasPassaram = true;
    validacoes.forEach((validacao, index) => {
      if (validacao.sucesso) {
        logSuccess(`${index + 1}. ${validacao.nome}`);
      } else {
        logError(`${index + 1}. ${validacao.nome}`);
        todasPassaram = false;
      }
    });
    
    logSection('RESULTADO FINAL');
    
    if (todasPassaram) {
      logSuccess('✓ TODAS AS VALIDAÇÕES PASSARAM!', 'green');
      logSuccess('O sistema está funcionando corretamente!', 'green');
    } else {
      logError('✗ ALGUMAS VALIDAÇÕES FALHARAM!', 'red');
      logError('Verifique os logs acima para identificar o problema.', 'red');
    }
    
    // Limpar dados
    await limparDadosTeste(vistoria, checklistItem);
    
    process.exit(todasPassaram ? 0 : 1);
    
  } catch (error) {
    logError(`\nErro durante o teste: ${error.message}`);
    if (error.stack) {
      logDetail(`Stack: ${error.stack}`);
    }
    
    // Tentar limpar dados mesmo em caso de erro
    if (dadosTeste) {
      try {
        await limparDadosTeste(dadosTeste.vistoria, dadosTeste.checklistItem);
      } catch (cleanupError) {
        logError(`Erro ao limpar dados: ${cleanupError.message}`);
      }
    }
    
    process.exit(1);
  }
}

// Executar teste
if (require.main === module) {
  main();
}

module.exports = { testarUpload, validarNoBanco };

