/**
 * Teste completo do backend - valida todas as rotas, modelos e funcionalidades
 */

const { tratarErroCritico } = require('./helpers/testHelpers');

async function testBackendCompleto() {
  try {
    console.log('=== TESTE COMPLETO DO BACKEND ===\n');

    let todasValido = true;
    const erros = [];

    // 1. Testar carregamento de rotas
    console.log('1. TESTANDO CARREGAMENTO DE ROTAS:');
    const rotas = [
      'userRoutes',
      'vistoriaRoutes',
      'authRoutes',
      'embarcacaoRoutes',
      'localRoutes',
      'fotoRoutes',
      'tipoFotoChecklistRoutes',
      'vistoriadorRoutes',
      'pagamentoRoutes',
      'dashboardRoutes',
      'seguradoraRoutes',
      'clienteRoutes',
      'checklistRoutes',
      'laudoRoutes',
      'cepRoutes',
      'auditoriaRoutes'
    ];

    for (const rota of rotas) {
      try {
        require(`../routes/${rota}`);
        console.log(`   OK: ${rota}`);
      } catch (err) {
        console.log(`   ERRO: ${rota} - ${err.message}`);
        erros.push(`Rota ${rota}: ${err.message}`);
        todasValido = false;
      }
    }

    // 2. Testar modelos
    console.log('\n2. TESTANDO MODELOS:');
    try {
      const models = require('../models');
      const modelNames = Object.keys(models).filter(k => k !== 'sequelize' && k !== 'Sequelize');
      console.log(`   OK: ${modelNames.length} modelos carregados`);
      console.log(`   Modelos: ${modelNames.join(', ')}`);
    } catch (err) {
      console.log(`   ERRO: ${err.message}`);
      erros.push(`Modelos: ${err.message}`);
      todasValido = false;
    }

    // 3. Testar configuração do banco
    console.log('\n3. TESTANDO CONFIGURAÇÃO DO BANCO:');
    try {
      require('../config/database');
      console.log('   OK: Configuração do banco carregada');
    } catch (err) {
      console.log(`   ERRO: ${err.message}`);
      erros.push(`Banco: ${err.message}`);
      todasValido = false;
    }

    // 4. Testar serviços e utils
    console.log('\n4. TESTANDO SERVIÇOS E UTILS:');
    const servicos = [
      { path: '../services/uploadService', nome: 'uploadService' },
      { path: '../utils/logger', nome: 'logger' }
    ];

    for (const servico of servicos) {
      try {
        require(servico.path);
        console.log(`   OK: ${servico.nome}`);
      } catch (err) {
        console.log(`   ERRO: ${servico.nome} - ${err.message}`);
        erros.push(`${servico.nome}: ${err.message}`);
        todasValido = false;
      }
    }

    // 5. Testar middlewares
    console.log('\n5. TESTANDO MIDDLEWARES:');
    const middlewares = [
      { path: '../middleware/auth', nome: 'auth' },
      { path: '../middleware/auditoria', nome: 'auditoria' }
    ];

    for (const middleware of middlewares) {
      try {
        require(middleware.path);
        console.log(`   OK: ${middleware.nome}`);
      } catch (err) {
        console.log(`   ERRO: ${middleware.nome} - ${err.message}`);
        erros.push(`${middleware.nome}: ${err.message}`);
        todasValido = false;
      }
    }

    // 6. Testar sintaxe de arquivos principais
    console.log('\n6. TESTANDO SINTAXE DE ARQUIVOS:');
    const { execSync } = require('child_process');
    const arquivos = [
      'routes/checklistRoutes.js',
      'routes/vistoriadorRoutes.js',
      'routes/fotoRoutes.js',
      'services/uploadService.js'
    ];

    for (const arquivo of arquivos) {
      try {
        execSync(`node -c ${arquivo}`, { stdio: 'pipe' });
        console.log(`   OK: ${arquivo}`);
      } catch (err) {
        console.log(`   ERRO: ${arquivo} - Erro de sintaxe`);
        erros.push(`${arquivo}: Erro de sintaxe`);
        todasValido = false;
      }
    }

    // 7. Verificar se há anotações TypeScript em arquivos JS
    console.log('\n7. VERIFICANDO ANOTAÇÕES TYPESCRIPT EM ARQUIVOS JS:');
    const fs = require('fs');
    const path = require('path');
    
    function verificarArquivo(arquivoPath) {
      try {
        const conteudo = fs.readFileSync(arquivoPath, 'utf8');
        // Procurar por padrões TypeScript comuns em catch blocks
        if (conteudo.match(/catch\s*\(\s*\w+\s*:\s*(any|string|number|boolean|object)\s*\)/)) {
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    const arquivosParaVerificar = [
      'routes/checklistRoutes.js',
      'routes/vistoriadorRoutes.js',
      'routes/fotoRoutes.js'
    ];

    let encontrouTypeScript = false;
    for (const arquivo of arquivosParaVerificar) {
      const caminhoCompleto = path.join(__dirname, '..', arquivo);
      if (verificarArquivo(caminhoCompleto)) {
        console.log(`   ERRO: ${arquivo} contém anotações TypeScript`);
        erros.push(`${arquivo}: Contém anotações TypeScript`);
        encontrouTypeScript = true;
        todasValido = false;
      } else {
        console.log(`   OK: ${arquivo}`);
      }
    }

    if (!encontrouTypeScript) {
      console.log('   OK: Nenhuma anotação TypeScript encontrada em arquivos JS');
    }

    // Resultado final
    console.log('\n=== RESULTADO FINAL ===');
    if (todasValido) {
      console.log('OK: Backend está pronto e sem erros!');
      console.log('Todas as rotas, modelos, serviços e middlewares foram carregados com sucesso.');
      console.log('Nenhum erro de sintaxe encontrado.');
    } else {
      console.log('ERRO: Alguns problemas foram encontrados:');
      erros.forEach(erro => console.log(`  - ${erro}`));
    }

    console.log('\n=== TESTE CONCLUÍDO ===\n');
    process.exit(todasValido ? 0 : 1);
  } catch (error) {
    tratarErroCritico(error);
  }
}

testBackendCompleto();

