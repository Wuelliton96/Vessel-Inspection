#!/usr/bin/env node

/**
 * Script de teste personalizado para o backend
 * Executa testes com configurações específicas e relatórios detalhados
 */

const { spawn } = require('child_process');
const path = require('path');

// Configurações
const config = {
  testEnvironment: 'node',
  verbose: true,
  coverage: true,
  watch: process.argv.includes('--watch'),
  ci: process.argv.includes('--ci')
};

// Função para executar comandos
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Função principal
async function runTests() {
  console.log('[INICIANDO] Iniciando testes do backend...\n');

  try {
    // Verificar se o banco de dados de teste está disponível
    console.log('[VERIFICANDO] Verificando conexão com banco de dados de teste...');
    
    // Definir variáveis de ambiente para teste
    process.env.NODE_ENV = 'test';
    
    const jestArgs = [
      '--config', path.join(__dirname, '../jest.config.js'),
      '--verbose'
    ];

    if (config.coverage) {
      jestArgs.push('--coverage');
    }

    if (config.watch) {
      jestArgs.push('--watch');
    }

    if (config.ci) {
      jestArgs.push('--ci', '--watchAll=false');
    }

    // Executar Jest
    console.log('[EXECUTANDO] Executando testes...');
    await runCommand('npx', ['jest', ...jestArgs]);

    console.log('\n[OK] Todos os testes passaram com sucesso!');
    
    if (config.coverage) {
      console.log('\n[COVERAGE] Relatório de cobertura gerado em: backend/coverage/index.html');
    }

  } catch (error) {
    console.error('\n[ERRO] Erro ao executar testes:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
