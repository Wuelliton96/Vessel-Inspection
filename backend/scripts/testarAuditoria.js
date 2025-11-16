/**
 * Script para testar a funcionalidade de auditoria
 * Uso: node backend/scripts/testarAuditoria.js
 */

require('dotenv').config();
const { AuditoriaLog, Usuario, sequelize } = require('../models');

async function testarAuditoria() {
  try {
    console.log('\n[TESTE] TESTANDO SISTEMA DE AUDITORIA\n');
    console.log('═'.repeat(60));

    // Teste 1: Verificar se tabela existe
    console.log('\n[1] Verificando se tabela existe...');
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'auditoria_logs'
      ) as existe
    `);
    
    if (results[0].existe) {
      console.log('   [OK] Tabela auditoria_logs existe');
    } else {
      console.log('   [ERRO] Tabela auditoria_logs NAO existe!');
      console.log('   Execute: psql -U postgres -d vessel_inspection -f migrations/create_tabela_auditoria.sql');
      process.exit(1);
    }

    // Teste 2: Verificar modelo
    console.log('\n[2] Verificando modelo AuditoriaLog...');
    if (AuditoriaLog) {
      console.log('   [OK] Modelo AuditoriaLog carregado');
    } else {
      console.log('   [ERRO] Modelo AuditoriaLog nao esta carregado!');
      process.exit(1);
    }

    // Teste 3: Contar registros
    console.log('\n[3] Contando registros existentes...');
    const count = await AuditoriaLog.count();
    console.log(`   [INFO] Total de logs: ${count}`);

    // Teste 4: Criar log de teste
    console.log('\n[4] Criando log de teste...');
    const logTeste = await AuditoriaLog.create({
      usuario_email: 'teste@sistema.com',
      usuario_nome: 'Sistema de Teste',
      acao: 'TEST',
      entidade: 'Sistema',
      nivel_critico: false,
      detalhes: 'Log de teste criado pelo script de validacao'
    });
    console.log('   [OK] Log de teste criado com ID:', logTeste.id);

    // Teste 5: Buscar logs
    console.log('\n[5] Buscando ultimos 5 logs...');
    const logs = await AuditoriaLog.findAll({
      limit: 5,
      order: [['id', 'DESC']],
      raw: true
    });
    console.log(`   [OK] Encontrados ${logs.length} logs:`);
    logs.forEach(log => {
      console.log(`      - [${log.acao}] ${log.entidade} por ${log.usuario_nome}`);
    });

    // Teste 6: Deletar log de teste
    console.log('\n[6] Limpando log de teste...');
    await AuditoriaLog.destroy({ where: { id: logTeste.id } });
    console.log('   [OK] Log de teste removido');

    console.log('\n' + '═'.repeat(60));
    console.log('[SUCESSO] TODOS OS TESTES PASSARAM!\n');
    console.log('[INFO] Sistema de auditoria esta funcionando corretamente!\n');

  } catch (error) {
    console.error('\n[ERRO] ERRO NO TESTE:');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.log('\n');
  } finally {
    await sequelize.close();
    process.exit();
  }
}

// Executar testes
testarAuditoria();

