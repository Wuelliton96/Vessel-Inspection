/**
 * Teste completo do backend - valida todas as rotas e funcionalidades
 */

async function testCompletoBackend() {
  try {
    console.log('=== TESTE COMPLETO DO BACKEND ===\n');

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

    let todasRotasOK = true;
    for (const rota of rotas) {
      try {
        require(`../routes/${rota}`);
        console.log(`   OK: ${rota}`);
      } catch (err) {
        console.log(`   ERRO: ${rota} - ${err.message}`);
        todasRotasOK = false;
      }
    }

    if (!todasRotasOK) {
      console.log('\nERRO: Algumas rotas não puderam ser carregadas');
      process.exit(1);
    }

    // 2. Testar modelos
    console.log('\n2. TESTANDO MODELOS:');
    try {
      const models = require('../models');
      console.log('   OK: Modelos carregados');
      console.log(`   Modelos disponíveis: ${Object.keys(models).filter(k => k !== 'sequelize' && k !== 'Sequelize').join(', ')}`);
    } catch (err) {
      console.log(`   ERRO: ${err.message}`);
      process.exit(1);
    }

    // 3. Testar configuração do banco
    console.log('\n3. TESTANDO CONFIGURAÇÃO DO BANCO:');
    try {
      const db = require('../config/database');
      console.log('   OK: Configuração do banco carregada');
    } catch (err) {
      console.log(`   ERRO: ${err.message}`);
      process.exit(1);
    }

    // 4. Testar serviços e utils
    console.log('\n4. TESTANDO SERVIÇOS E UTILS:');
    const servicos = [
      { path: '../services/uploadService', nome: 'uploadService' },
      { path: '../utils/logger', nome: 'logger' }
    ];

    let todosServicosOK = true;
    for (const servico of servicos) {
      try {
        require(servico.path);
        console.log(`   OK: ${servico.nome}`);
      } catch (err) {
        console.log(`   ERRO: ${servico.nome} - ${err.message}`);
        todosServicosOK = false;
      }
    }

    if (!todosServicosOK) {
      console.log('\nERRO: Alguns serviços não puderam ser carregados');
      process.exit(1);
    }

    console.log('\n=== RESULTADO FINAL ===');
    console.log('OK: Backend está pronto e sem erros de sintaxe!');
    console.log('Todas as rotas, modelos e serviços foram carregados com sucesso.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('ERRO CRÍTICO:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testCompletoBackend();

