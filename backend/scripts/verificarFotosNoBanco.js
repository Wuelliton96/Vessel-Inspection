// Script para verificar fotos no banco de dados
const sequelize = require('../config/database');
const { Foto, Vistoria, TipoFotoChecklist } = require('../models');

async function verificarFotos() {
  console.log('=== VERIFICAÇÃO DE FOTOS NO BANCO DE DADOS ===\n');
  
  try {
    await sequelize.authenticate();
    console.log('[OK] Conexão com banco estabelecida\n');
    
    // 1. Contar total de fotos
    const totalFotos = await Foto.count();
    console.log(`1. Total de fotos no banco: ${totalFotos}\n`);
    
    // 2. Listar últimas 10 fotos
    console.log('2. Últimas 10 fotos criadas:');
    const ultimasFotos = await Foto.findAll({
      order: [['created_at', 'DESC']],
      limit: 10,
      include: [
        { model: Vistoria, as: 'Vistoria', attributes: ['id'] },
        { model: TipoFotoChecklist, as: 'TipoFotoChecklist', attributes: ['id', 'nome_exibicao'] }
      ]
    });
    
    if (ultimasFotos.length === 0) {
      console.log('  [AVISO] Nenhuma foto encontrada no banco\n');
    } else {
      ultimasFotos.forEach((foto, index) => {
        console.log(`  ${index + 1}. Foto ID: ${foto.id}`);
        console.log(`     - url_arquivo: ${foto.url_arquivo}`);
        console.log(`     - vistoria_id: ${foto.vistoria_id}`);
        console.log(`     - tipo_foto_id: ${foto.tipo_foto_id}`);
        console.log(`     - Tipo: ${foto.TipoFotoChecklist?.nome_exibicao || 'N/A'}`);
        console.log(`     - Vistoria: ${foto.Vistoria?.id || 'N/A'}`);
        console.log(`     - Criada em: ${foto.created_at}`);
        console.log('');
      });
    }
    
    // 3. Fotos por vistoria
    console.log('3. Fotos por vistoria:');
    const fotosPorVistoria = await sequelize.query(`
      SELECT 
        vistoria_id,
        COUNT(*) as total
      FROM fotos
      GROUP BY vistoria_id
      ORDER BY total DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (fotosPorVistoria.length === 0) {
      console.log('  ⚠ Nenhuma vistoria com fotos\n');
    } else {
      fotosPorVistoria.forEach((item, index) => {
        console.log(`  ${index + 1}. Vistoria ID ${item.vistoria_id}: ${item.total} foto(s)`);
      });
      console.log('');
    }
    
    // 4. Verificar se há fotos com 'unknown' na url_arquivo
    console.log('4. Verificando fotos com "unknown" na url_arquivo:');
    const fotosUnknown = await Foto.findAll({
      where: {
        url_arquivo: {
          [sequelize.Sequelize.Op.like]: '%/unknown/%'
        }
      }
    });
    
    if (fotosUnknown.length === 0) {
      console.log('  ✓ Nenhuma foto com "unknown" encontrada\n');
    } else {
      console.log(`  ⚠ ${fotosUnknown.length} foto(s) com "unknown" encontrada(s):\n`);
      fotosUnknown.forEach((foto, index) => {
        console.log(`  ${index + 1}. Foto ID: ${foto.id}`);
        console.log(`     - url_arquivo: ${foto.url_arquivo}`);
        console.log(`     - vistoria_id: ${foto.vistoria_id}`);
        console.log(`     - Criada em: ${foto.created_at}`);
        console.log('');
      });
    }
    
    // 5. Verificar estrutura da tabela
    console.log('5. Verificando estrutura da tabela fotos:');
    const [estrutura] = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'fotos'
      ORDER BY ordinal_position
    `);
    
    estrutura.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    console.log('');
    
    // 6. Verificar se a tabela existe
    const [tabela] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'fotos'
      ) as existe
    `);
    
    if (!tabela[0].existe) {
      console.error('✗ Tabela "fotos" NÃO existe!');
      console.log('  Execute a migration: migrations/create_fotos_table.sql\n');
    } else {
      console.log('✓ Tabela "fotos" existe\n');
    }
    
    console.log('========================================');
    console.log('✓ VERIFICAÇÃO CONCLUÍDA');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n✗ ERRO:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

verificarFotos();

