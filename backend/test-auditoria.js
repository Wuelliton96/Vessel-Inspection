// Script de teste para verificar se modelo de auditoria está funcionando
require('dotenv').config();
const { AuditoriaLog, sequelize } = require('./models');

async function testarAuditoria() {
  try {
    console.log('🧪 Testando modelo de Auditoria...\n');
    
    // Teste 1: Conexão com banco
    console.log('1️⃣ Testando conexão com banco...');
    await sequelize.authenticate();
    console.log('✅ Conexão OK!\n');
    
    // Teste 2: Verificar se tabela existe
    console.log('2️⃣ Verificando tabela auditoria_logs...');
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'auditoria_logs'
      ) as existe
    `);
    
    if (!results[0].existe) {
      console.error('❌ Tabela auditoria_logs NÃO EXISTE!');
      console.log('\n💡 Execute esta SQL no pgAdmin:');
      console.log(`
CREATE TABLE auditoria_logs (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER,
  usuario_email VARCHAR(255) NOT NULL,
  usuario_nome VARCHAR(255) NOT NULL,
  acao VARCHAR(100) NOT NULL,
  entidade VARCHAR(100) NOT NULL,
  entidade_id INTEGER,
  dados_anteriores TEXT,
  dados_novos TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  nivel_critico BOOLEAN DEFAULT false,
  detalhes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
      `);
      process.exit(1);
    }
    console.log('✅ Tabela existe!\n');
    
    // Teste 3: Contar registros
    console.log('3️⃣ Contando registros...');
    const count = await AuditoriaLog.count();
    console.log(`✅ Total de logs: ${count}\n`);
    
    // Teste 4: Criar log de teste
    console.log('4️⃣ Criando log de teste...');
    const novoLog = await AuditoriaLog.create({
      usuario_id: 1,
      usuario_email: 'teste@teste.com',
      usuario_nome: 'Teste Sistema',
      acao: 'TESTE',
      entidade: 'Sistema',
      entidade_id: null,
      ip_address: '127.0.0.1',
      nivel_critico: false,
      detalhes: 'Log de teste criado automaticamente'
    });
    console.log('✅ Log criado com ID:', novoLog.id, '\n');
    
    // Teste 5: Buscar logs
    console.log('5️⃣ Buscando todos os logs...');
    const logs = await AuditoriaLog.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      raw: true
    });
    console.log(`✅ Encontrados ${logs.length} logs`);
    if (logs.length > 0) {
      console.log('Último log:', {
        id: logs[0].id,
        acao: logs[0].acao,
        usuario: logs[0].usuario_nome,
        data: logs[0].createdAt
      });
    }
    console.log('\n');
    
    // Teste 6: Deletar log de teste
    console.log('6️⃣ Removendo log de teste...');
    await AuditoriaLog.destroy({ where: { id: novoLog.id } });
    console.log('✅ Log de teste removido\n');
    
    console.log('🎉 TODOS OS TESTES PASSARAM!\n');
    console.log('✅ Modelo de Auditoria está funcionando corretamente!');
    console.log('✅ Backend pode ser iniciado sem problemas!');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('\nDetalhes:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testarAuditoria();

