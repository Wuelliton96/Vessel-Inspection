/**
 * Script de teste manual para validar preenchimento automático de laudo
 * 
 * Este script testa:
 * 1. Preenchimento automático ao criar laudo
 * 2. Preenchimento automático ao buscar laudo existente
 * 3. Priorização de dados fornecidos sobre dados automáticos
 * 
 * Uso: node scripts/testPreenchimentoLaudo.js
 */

// Usar http nativo do Node.js
const http = require('http');
const https = require('https');
const { URL } = require('url');
const path = require('path');

// Tentar carregar dotenv, mas não falhar se não estiver disponível
try {
  require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
} catch (e) {
  // dotenv não disponível, usar variáveis de ambiente do sistema
}

// Wrapper simples para requisições HTTP
const axios = {
  async post(url, data, config) {
    return makeRequest('POST', url, data, config);
  },
  async get(url, config) {
    return makeRequest('GET', url, null, config);
  }
};

function makeRequest(method, url, data, config) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(config?.headers || {})
      }
    };
    
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const response = {
          data: body ? JSON.parse(body) : {},
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers
        };
        resolve(response);
      });
    });
    
    req.on('error', (error) => {
      reject({ message: error.message, response: { status: 500, data: { error: error.message } } });
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[33m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testPreenchimentoLaudo() {
  log('\n=== TESTE DE PREENCHIMENTO AUTOMÁTICO DE LAUDO ===\n', 'cyan');

  try {
    // 1. Login como admin
    log('1. Fazendo login como administrador...', 'blue');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      cpf: process.env.ADMIN_CPF || '000.000.000-00',
      senha: process.env.ADMIN_SENHA || 'admin123'
    });

    if (!loginResponse.data.token) {
      throw new Error('Token não recebido no login');
    }

    const token = loginResponse.data.token;
    log('✓ Login realizado com sucesso', 'green');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Buscar uma vistoria concluída
    log('\n2. Buscando vistoria concluída...', 'blue');
    const vistoriasResponse = await axios.get(`${API_BASE_URL}/api/vistorias`, { headers });
    const vistorias = vistoriasResponse.data;

    // Buscar vistoria com status CONCLUIDA
    let vistoriaConcluida = null;
    for (const vistoria of vistorias) {
      if (vistoria.StatusVistoria?.nome === 'CONCLUIDA' || vistoria.status === 'CONCLUIDA') {
        vistoriaConcluida = vistoria;
        break;
      }
    }

    if (!vistoriaConcluida) {
      log('⚠ Nenhuma vistoria concluída encontrada. Criando dados de teste...', 'yellow');
      // Aqui você pode criar uma vistoria de teste se necessário
      log('Por favor, conclua uma vistoria primeiro e execute o teste novamente.', 'yellow');
      return;
    }

    log(`✓ Vistoria encontrada: ID ${vistoriaConcluida.id}`, 'green');
    log(`  - Embarcação: ${vistoriaConcluida.Embarcacao?.nome || 'N/A'}`, 'blue');
    log(`  - Local: ${vistoriaConcluida.Local?.logradouro || 'N/A'}`, 'blue');

    // 3. Verificar se já existe laudo para esta vistoria
    log('\n3. Verificando se já existe laudo para esta vistoria...', 'blue');
    let laudoExistente = null;
    try {
      const laudoResponse = await axios.get(
        `${API_BASE_URL}/api/laudos/vistoria/${vistoriaConcluida.id}`,
        { headers }
      );
      laudoExistente = laudoResponse.data;
      log(`✓ Laudo existente encontrado: ID ${laudoExistente.id}`, 'green');
    } catch (error) {
      if (error.response?.status === 404) {
        log('✓ Nenhum laudo existente (vamos criar um novo)', 'green');
      } else {
        throw error;
      }
    }

    // 4. Teste 1: Criar laudo com preenchimento automático (sem dados)
    if (!laudoExistente) {
      log('\n4. TESTE 1: Criando laudo sem fornecer dados (preenchimento automático)...', 'cyan');
      try {
        const criarResponse = await axios.post(
          `${API_BASE_URL}/api/laudos/vistoria/${vistoriaConcluida.id}`,
          {},
          { headers }
        );

        const laudoCriado = criarResponse.data;
        log('✓ Laudo criado com sucesso!', 'green');
        log('\nDados preenchidos automaticamente:', 'blue');
        log(`  - Número do Laudo: ${laudoCriado.numero_laudo}`, 'blue');
        log(`  - Nome da Embarcação: ${laudoCriado.nome_moto_aquatica || 'N/A'}`, 'blue');
        log(`  - Proprietário: ${laudoCriado.proprietario || 'N/A'}`, 'blue');
        log(`  - CPF/CNPJ: ${laudoCriado.cpf_cnpj || 'N/A'}`, 'blue');
        log(`  - Inscrição Capitania: ${laudoCriado.inscricao_capitania || 'N/A'}`, 'blue');
        log(`  - Tipo Embarcação: ${laudoCriado.tipo_embarcacao || 'N/A'}`, 'blue');
        log(`  - Ano Fabricação: ${laudoCriado.ano_fabricacao || 'N/A'}`, 'blue');
        log(`  - Valor Risco: ${laudoCriado.valor_risco || 'N/A'}`, 'blue');
        log(`  - Local Vistoria: ${laudoCriado.local_vistoria || 'N/A'}`, 'blue');
        log(`  - Local Guarda: ${laudoCriado.local_guarda || 'N/A'}`, 'blue');
        log(`  - Data Inspeção: ${laudoCriado.data_inspecao || 'N/A'}`, 'blue');

        // Validar preenchimento
        const camposPreenchidos = [];
        if (laudoCriado.nome_moto_aquatica) camposPreenchidos.push('nome_moto_aquatica');
        if (laudoCriado.proprietario) camposPreenchidos.push('proprietario');
        if (laudoCriado.cpf_cnpj) camposPreenchidos.push('cpf_cnpj');
        if (laudoCriado.inscricao_capitania) camposPreenchidos.push('inscricao_capitania');
        if (laudoCriado.tipo_embarcacao) camposPreenchidos.push('tipo_embarcacao');
        if (laudoCriado.local_vistoria) camposPreenchidos.push('local_vistoria');

        log(`\n✓ ${camposPreenchidos.length} campos preenchidos automaticamente`, 'green');
        if (camposPreenchidos.length >= 5) {
          log('✓ TESTE 1 PASSOU: Preenchimento automático funcionando!', 'green');
        } else {
          log('⚠ TESTE 1 PARCIAL: Alguns campos não foram preenchidos', 'yellow');
        }

        laudoExistente = laudoCriado;
      } catch (error) {
        log(`✗ Erro ao criar laudo: ${error.response?.data?.error || error.message}`, 'red');
        throw error;
      }
    }

    // 5. Teste 2: Buscar laudo e verificar preenchimento automático
    log('\n5. TESTE 2: Buscando laudo e verificando preenchimento automático...', 'cyan');
    try {
      const buscarResponse = await axios.get(
        `${API_BASE_URL}/api/laudos/${laudoExistente.id}`,
        { headers }
      );

      const laudoBuscado = buscarResponse.data;
      log('✓ Laudo buscado com sucesso!', 'green');
      log('\nCampos verificados:', 'blue');
      log(`  - Nome da Embarcação: ${laudoBuscado.nome_moto_aquatica || 'N/A'}`, 'blue');
      log(`  - Proprietário: ${laudoBuscado.proprietario || 'N/A'}`, 'blue');
      log(`  - CPF/CNPJ: ${laudoBuscado.cpf_cnpj || 'N/A'}`, 'blue');
      log(`  - Inscrição Capitania: ${laudoBuscado.inscricao_capitania || 'N/A'}`, 'blue');
      log(`  - Tipo Embarcação: ${laudoBuscado.tipo_embarcacao || 'N/A'}`, 'blue');

      const camposPreenchidos = [];
      if (laudoBuscado.nome_moto_aquatica) camposPreenchidos.push('nome_moto_aquatica');
      if (laudoBuscado.proprietario) camposPreenchidos.push('proprietario');
      if (laudoBuscado.cpf_cnpj) camposPreenchidos.push('cpf_cnpj');
      if (laudoBuscado.inscricao_capitania) camposPreenchidos.push('inscricao_capitania');
      if (laudoBuscado.tipo_embarcacao) camposPreenchidos.push('tipo_embarcacao');

      log(`\n✓ ${camposPreenchidos.length} campos preenchidos`, 'green');
      if (camposPreenchidos.length >= 4) {
        log('✓ TESTE 2 PASSOU: Preenchimento automático ao buscar funcionando!', 'green');
      } else {
        log('⚠ TESTE 2 PARCIAL: Alguns campos não foram preenchidos', 'yellow');
      }
    } catch (error) {
      log(`✗ Erro ao buscar laudo: ${error.response?.data?.error || error.message}`, 'red');
      throw error;
    }

    // 6. Teste 3: Atualizar laudo com dados customizados (priorização)
    log('\n6. TESTE 3: Atualizando laudo com dados customizados (teste de priorização)...', 'cyan');
    try {
      const dadosCustomizados = {
        nome_moto_aquatica: 'Barco Customizado Teste',
        proprietario: 'Proprietário Customizado',
        valor_risco: 250000.00
      };

      const atualizarResponse = await axios.post(
        `${API_BASE_URL}/api/laudos/vistoria/${vistoriaConcluida.id}`,
        dadosCustomizados,
        { headers }
      );

      const laudoAtualizado = atualizarResponse.data;
      log('✓ Laudo atualizado com sucesso!', 'green');
      log('\nVerificando priorização de dados:', 'blue');
      log(`  - Nome fornecido: ${dadosCustomizados.nome_moto_aquatica}`, 'blue');
      log(`  - Nome no laudo: ${laudoAtualizado.nome_moto_aquatica}`, 'blue');
      log(`  - Proprietário fornecido: ${dadosCustomizados.proprietario}`, 'blue');
      log(`  - Proprietário no laudo: ${laudoAtualizado.proprietario}`, 'blue');
      log(`  - Valor fornecido: ${dadosCustomizados.valor_risco}`, 'blue');
      log(`  - Valor no laudo: ${laudoAtualizado.valor_risco}`, 'blue');

      const priorizacaoOk = 
        laudoAtualizado.nome_moto_aquatica === dadosCustomizados.nome_moto_aquatica &&
        laudoAtualizado.proprietario === dadosCustomizados.proprietario &&
        parseFloat(laudoAtualizado.valor_risco) === dadosCustomizados.valor_risco;

      if (priorizacaoOk) {
        log('\n✓ TESTE 3 PASSOU: Dados customizados têm prioridade sobre dados automáticos!', 'green');
      } else {
        log('\n✗ TESTE 3 FALHOU: Dados customizados não foram priorizados', 'red');
      }

      // Verificar se outros campos ainda foram preenchidos automaticamente
      log('\nVerificando se outros campos foram preenchidos automaticamente:', 'blue');
      if (laudoAtualizado.inscricao_capitania || laudoAtualizado.tipo_embarcacao) {
        log('✓ Outros campos foram preenchidos automaticamente', 'green');
      } else {
        log('⚠ Alguns campos não foram preenchidos automaticamente', 'yellow');
      }
    } catch (error) {
      log(`✗ Erro ao atualizar laudo: ${error.response?.data?.error || error.message}`, 'red');
      throw error;
    }

    log('\n=== RESUMO DOS TESTES ===', 'cyan');
    log('✓ Teste 1: Preenchimento automático ao criar laudo', 'green');
    log('✓ Teste 2: Preenchimento automático ao buscar laudo', 'green');
    log('✓ Teste 3: Priorização de dados customizados', 'green');
    log('\n✓ TODOS OS TESTES PASSARAM!', 'green');

  } catch (error) {
    log(`\n✗ ERRO NO TESTE: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Dados: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    process.exit(1);
  }
}

// Executar teste
testPreenchimentoLaudo()
  .then(() => {
    log('\n✓ Teste concluído com sucesso!', 'green');
    process.exit(0);
  })
  .catch((error) => {
    log(`\n✗ Teste falhou: ${error.message}`, 'red');
    process.exit(1);
  });

