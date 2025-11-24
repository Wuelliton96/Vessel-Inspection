/**
 * Script para testar se o servidor pode ser iniciado sem erros
 */

try {
  console.log('=== TESTE: INICIALIZAÇÃO DO SERVIDOR ===\n');
  
  // Tentar carregar todas as rotas
  console.log('1. Carregando rotas...');
  require('../routes/userRoutes');
  require('../routes/vistoriaRoutes');
  require('../routes/authRoutes');
  require('../routes/embarcacaoRoutes');
  require('../routes/localRoutes');
  require('../routes/fotoRoutes');
  require('../routes/tipoFotoChecklistRoutes');
  require('../routes/vistoriadorRoutes');
  require('../routes/pagamentoRoutes');
  require('../routes/dashboardRoutes');
  require('../routes/seguradoraRoutes');
  require('../routes/clienteRoutes');
  require('../routes/checklistRoutes');
  require('../routes/laudoRoutes');
  require('../routes/cepRoutes');
  require('../routes/auditoriaRoutes');
  console.log('   OK: Todas as rotas carregadas com sucesso\n');

  // Tentar carregar modelos
  console.log('2. Carregando modelos...');
  require('../models');
  console.log('   OK: Modelos carregados com sucesso\n');

  // Tentar carregar configurações
  console.log('3. Carregando configurações...');
  require('../config/database');
  console.log('   OK: Configurações carregadas com sucesso\n');

  console.log('=== TESTE CONCLUÍDO ===');
  console.log('OK: Servidor pode ser iniciado sem erros de sintaxe\n');
  process.exit(0);
} catch (error) {
  console.error('ERRO: Falha ao carregar módulos:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}

