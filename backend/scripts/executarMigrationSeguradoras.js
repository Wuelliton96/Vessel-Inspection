/**
 * Script para executar migration de seguradoras
 */

require('dotenv').config();
const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

async function executarMigration() {
  try {
    console.log('\n[MIGRATION] Executando sistema de seguradoras...\n');
    console.log('='.repeat(60));

    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, '../../migrations/recriar_sistema_seguradoras.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('[INFO] Arquivo SQL carregado');
    console.log('[INFO] Executando migration...\n');

    // Executar SQL
    await sequelize.query(sql);

    console.log('[SUCESSO] Migration executada com sucesso!\n');

    // Verificar resultados
    const [seguradoras] = await sequelize.query('SELECT COUNT(*) as total FROM seguradoras');
    const [tipos] = await sequelize.query('SELECT COUNT(*) as total FROM seguradora_tipo_embarcacao');

    console.log('='.repeat(60));
    console.log('[RESULTADO]');
    console.log(`  Total de seguradoras: ${seguradoras[0].total}`);
    console.log(`  Total de tipos permitidos: ${tipos[0].total}`);
    console.log('='.repeat(60));

    // Listar seguradoras criadas
    const [listaSeguradoras] = await sequelize.query(`
      SELECT s.id, s.nome, s.ativo, COUNT(st.id) as tipos_permitidos
      FROM seguradoras s
      LEFT JOIN seguradora_tipo_embarcacao st ON s.id = st.seguradora_id
      GROUP BY s.id, s.nome, s.ativo
      ORDER BY s.id
    `);

    console.log('\n[SEGURADORAS CADASTRADAS]');
    listaSeguradoras.forEach(seg => {
      const status = seg.ativo ? 'ATIVA' : 'INATIVA';
      console.log(`  ${seg.id}. ${seg.nome} (${status}) - ${seg.tipos_permitidos} tipo(s) permitido(s)`);
    });

    console.log('\n[INFO] Sistema de seguradoras pronto para uso!\n');

  } catch (error) {
    console.error('\n[ERRO] Erro ao executar migration:');
    console.error('Mensagem:', error.message);
    if (error.original) {
      console.error('Detalhe:', error.original.message);
    }
    console.log('');
  } finally {
    await sequelize.close();
    process.exit();
  }
}

executarMigration();

