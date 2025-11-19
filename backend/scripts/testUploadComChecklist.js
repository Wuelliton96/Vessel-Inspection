/**
 * Script de teste para validar upload de foto com checklist_item_id
 * Testa:
 * 1. Upload de foto com checklist_item_id
 * 2. Verificação se o nome do arquivo contém o checklist_item_id
 * 3. Verificação se a foto foi salva no banco de dados
 * 4. Verificação se o checklist foi marcado como concluído
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
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logError = (message) => log(`✗ ${message}`, 'red');
const logSuccess = (message) => log(`✓ ${message}`, 'green');
const logInfo = (message) => log(`ℹ ${message}`, 'blue');
const logWarning = (message) => log(`⚠ ${message}`, 'yellow');

async function criarDadosTeste() {
  logInfo('Criando dados de teste...');
  
  // Criar nível de acesso
  const [nivelAcesso] = await NivelAcesso.findOrCreate({
    where: { id: 2 },
    defaults: { nome: 'VISTORIADOR', descricao: 'Vistoriador' }
  });
  
  // Criar usuário vistoriador
  const bcrypt = require('bcryptjs');
  const senhaHash = await bcrypt.hash('senha123', 10);
  const [usuario] = await Usuario.findOrCreate({
    where: { cpf: '12345678901' },
    defaults: {
      nome: 'Vistoriador Teste',
      email: 'vistoriador@teste.com',
      cpf: '12345678901',
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAcesso.id,
      ativo: true
    }
  });
  
  // Criar embarcação
  const [embarcacao] = await Embarcacao.findOrCreate({
    where: { nr_inscricao_barco: 'TEST-001' },
    defaults: {
      nome: 'Embarcação Teste',
      nr_inscricao_barco: 'TEST-001',
      tipo_embarcacao: 'MOTO_AQUATICA'
    }
  });
  
  // Criar local
  const [local] = await Local.findOrCreate({
    where: { tipo: 'MARINA', nome_local: 'Marina Teste' },
    defaults: {
      tipo: 'MARINA',
      nome_local: 'Marina Teste',
      cidade: 'Rio de Janeiro',
      estado: 'RJ'
    }
  });
  
  // Criar status
  const [status] = await StatusVistoria.findOrCreate({
    where: { nome: 'PENDENTE' },
    defaults: { nome: 'PENDENTE', descricao: 'Vistoria pendente' }
  });
  
  // Criar vistoria
  const vistoria = await Vistoria.create({
    embarcacao_id: embarcacao.id,
    local_id: local.id,
    vistoriador_id: usuario.id,
    status_id: status.id,
    administrador_id: usuario.id
  });
  
  // Criar tipo de foto
  const [tipoFoto] = await TipoFotoChecklist.findOrCreate({
    where: { codigo: 'CASCO_TEST' },
    defaults: {
      codigo: 'CASCO_TEST',
      nome_exibicao: 'Foto do Casco',
      descricao: 'Foto do casco da embarcação',
      obrigatorio: true
    }
  });
  
  // Criar item do checklist
  const checklistItem = await VistoriaChecklistItem.create({
    vistoria_id: vistoria.id,
    nome: 'Foto do Casco',
    descricao: 'Tirar foto do casco',
    obrigatorio: true,
    status: 'PENDENTE',
    ordem: 1
  });
  
  logSuccess(`Dados de teste criados:`);
  logInfo(`  - Vistoria ID: ${vistoria.id}`);
  logInfo(`  - Checklist Item ID: ${checklistItem.id}`);
  logInfo(`  - Tipo Foto ID: ${tipoFoto.id}`);
  logInfo(`  - Usuário ID: ${usuario.id}`);
  
  return { usuario, vistoria, checklistItem, tipoFoto };
}

async function fazerLogin(usuario) {
  logInfo('Fazendo login...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      cpf: usuario.cpf,
      senha: 'senha123'
    });
    
    if (response.data.token) {
      logSuccess('Login realizado com sucesso');
      return response.data.token;
    } else {
      throw new Error('Token não recebido');
    }
  } catch (error) {
    logError(`Erro no login: ${error.response?.data?.error || error.message}`);
    throw error;
  }
}

async function criarImagemTeste() {
  // Criar uma imagem PNG simples (1x1 pixel)
  const imagemBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  
  const tempPath = path.join(__dirname, 'temp_test_image.png');
  fs.writeFileSync(tempPath, imagemBuffer);
  
  return tempPath;
}

async function testarUploadComChecklist(token, vistoria, checklistItem, tipoFoto) {
  logInfo('\n=== TESTE DE UPLOAD COM CHECKLIST_ITEM_ID ===');
  
  const imagemPath = await criarImagemTeste();
  
  try {
    const formData = new FormData();
    formData.append('foto', fs.createReadStream(imagemPath), {
      filename: 'test_image.png',
      contentType: 'image/png'
    });
    formData.append('vistoria_id', vistoria.id.toString());
    formData.append('tipo_foto_id', tipoFoto.id.toString());
    formData.append('checklist_item_id', checklistItem.id.toString());
    formData.append('observacao', 'Foto de teste com checklist_item_id');
    
    logInfo('Enviando requisição de upload...');
    logInfo(`  - vistoria_id: ${vistoria.id}`);
    logInfo(`  - tipo_foto_id: ${tipoFoto.id}`);
    logInfo(`  - checklist_item_id: ${checklistItem.id}`);
    
    const response = await axios.post(`${API_BASE_URL}/api/fotos`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    logSuccess('Upload realizado com sucesso!');
    logInfo(`  - Foto ID: ${response.data.id}`);
    logInfo(`  - URL arquivo: ${response.data.url_arquivo}`);
    
    // Verificações
    const verificacoes = [];
    
    // 1. Verificar se o nome do arquivo contém checklist_item_id
    if (response.data.url_arquivo.includes(`checklist-${checklistItem.id}`)) {
      logSuccess(`✓ Nome do arquivo contém checklist_item_id: checklist-${checklistItem.id}`);
      verificacoes.push(true);
    } else {
      logError(`✗ Nome do arquivo NÃO contém checklist_item_id esperado`);
      logError(`  Esperado: checklist-${checklistItem.id}`);
      logError(`  Recebido: ${response.data.url_arquivo}`);
      verificacoes.push(false);
    }
    
    // 2. Verificar se a foto foi salva no banco
    const fotoNoBanco = await Foto.findByPk(response.data.id);
    if (fotoNoBanco) {
      logSuccess(`✓ Foto encontrada no banco de dados (ID: ${fotoNoBanco.id})`);
      logInfo(`  - url_arquivo: ${fotoNoBanco.url_arquivo}`);
      logInfo(`  - vistoria_id: ${fotoNoBanco.vistoria_id}`);
      logInfo(`  - tipo_foto_id: ${fotoNoBanco.tipo_foto_id}`);
      verificacoes.push(true);
    } else {
      logError(`✗ Foto NÃO encontrada no banco de dados`);
      verificacoes.push(false);
    }
    
    // 3. Verificar se o checklist foi marcado como concluído
    await checklistItem.reload();
    if (checklistItem.status === 'CONCLUIDO' && checklistItem.foto_id === response.data.id) {
      logSuccess(`✓ Checklist marcado como CONCLUIDO`);
      logInfo(`  - Item ID: ${checklistItem.id}`);
      logInfo(`  - Status: ${checklistItem.status}`);
      logInfo(`  - Foto ID vinculada: ${checklistItem.foto_id}`);
      verificacoes.push(true);
    } else {
      logError(`✗ Checklist NÃO foi marcado como concluído corretamente`);
      logError(`  - Status atual: ${checklistItem.status}`);
      logError(`  - Foto ID vinculada: ${checklistItem.foto_id}`);
      logError(`  - Foto ID esperada: ${response.data.id}`);
      verificacoes.push(false);
    }
    
    // 4. Verificar se o nome do arquivo no banco contém checklist_item_id
    if (fotoNoBanco && fotoNoBanco.url_arquivo.includes(`checklist-${checklistItem.id}`)) {
      logSuccess(`✓ Nome do arquivo no banco contém checklist_item_id`);
      verificacoes.push(true);
    } else {
      logError(`✗ Nome do arquivo no banco NÃO contém checklist_item_id`);
      verificacoes.push(false);
    }
    
    // Resultado final
    const todasVerificacoes = verificacoes.every(v => v === true);
    
    if (todasVerificacoes) {
      logSuccess('\n✓ TODAS AS VERIFICAÇÕES PASSARAM!');
      return { success: true, foto: response.data, checklistItem };
    } else {
      logError('\n✗ ALGUMAS VERIFICAÇÕES FALHARAM!');
      return { success: false, foto: response.data, checklistItem };
    }
    
  } catch (error) {
    logError(`Erro no upload: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      logError(`Detalhes: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  } finally {
    // Limpar arquivo temporário
    if (fs.existsSync(imagemPath)) {
      fs.unlinkSync(imagemPath);
    }
  }
}

async function limparDadosTeste(vistoria, checklistItem) {
  logInfo('\nLimpando dados de teste...');
  
  try {
    // Buscar e deletar fotos
    const fotos = await Foto.findAll({ where: { vistoria_id: vistoria.id } });
    for (const foto of fotos) {
      await foto.destroy();
    }
    
    // Deletar checklist item
    await checklistItem.destroy();
    
    // Deletar vistoria
    await vistoria.destroy();
    
    logSuccess('Dados de teste limpos');
  } catch (error) {
    logError(`Erro ao limpar dados: ${error.message}`);
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('TESTE DE UPLOAD COM CHECKLIST_ITEM_ID', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  let dadosTeste = null;
  
  try {
    // 1. Criar dados de teste
    dadosTeste = await criarDadosTeste();
    const { usuario, vistoria, checklistItem, tipoFoto } = dadosTeste;
    
    // 2. Fazer login
    const token = await fazerLogin(usuario);
    
    // 3. Testar upload
    const resultado = await testarUploadComChecklist(token, vistoria, checklistItem, tipoFoto);
    
    // 4. Resultado final
    log('\n' + '='.repeat(60), 'cyan');
    if (resultado.success) {
      log('✓ TESTE CONCLUÍDO COM SUCESSO!', 'green');
    } else {
      log('✗ TESTE FALHOU!', 'red');
    }
    log('='.repeat(60) + '\n', 'cyan');
    
    // 5. Limpar dados
    await limparDadosTeste(vistoria, checklistItem);
    
    process.exit(resultado.success ? 0 : 1);
    
  } catch (error) {
    logError(`\nErro durante o teste: ${error.message}`);
    if (error.stack) {
      logError(`Stack: ${error.stack}`);
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

module.exports = { testarUploadComChecklist };

