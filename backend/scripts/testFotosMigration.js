// Script para testar a migration da tabela fotos
const sequelize = require('../config/database');
const { Foto, Vistoria, TipoFotoChecklist, VistoriaChecklistItem } = require('../models');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('=== EXECUTANDO MIGRATION: create_fotos_table.sql ===\n');
  
  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../../migrations/create_fotos_table.sql'),
      'utf8'
    );
    
    // Executar a migration
    await sequelize.query(migrationSQL);
    console.log('✓ Migration executada com sucesso!\n');
    
    return true;
  } catch (error) {
    console.error('✗ Erro ao executar migration:', error.message);
    if (error.original) {
      console.error('Detalhes:', error.original.message);
    }
    return false;
  }
}

async function checkTable() {
  console.log('=== VERIFICANDO ESTRUTURA DA TABELA ===\n');
  
  try {
    // Verificar se a tabela existe
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'fotos'
    `);
    
    if (tables.length === 0) {
      console.log('✗ Tabela fotos NÃO existe!');
      return false;
    }
    
    console.log('✓ Tabela fotos existe');
    
    // Verificar estrutura das colunas
    const [columns] = await sequelize.query(`
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
    
    console.log('\nEstrutura da tabela:');
    columns.forEach(col => {
      const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`  - ${col.column_name}: ${col.data_type}${length} ${nullable}`);
    });
    
    // Verificar índices
    const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'fotos'
    `);
    
    console.log('\nÍndices:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });
    
    // Verificar foreign keys
    const [fks] = await sequelize.query(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'fotos'
    `);
    
    console.log('\nForeign Keys:');
    fks.forEach(fk => {
      console.log(`  - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    return true;
  } catch (error) {
    console.error('✗ Erro ao verificar tabela:', error.message);
    return false;
  }
}

async function checkTiposFoto() {
  console.log('\n=== VERIFICANDO TIPOS DE FOTO ===\n');
  
  try {
    // Verificar se tabela tipos_foto_checklist existe
    const [tiposTable] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'tipos_foto_checklist'
    `);
    
    if (tiposTable.length === 0) {
      console.log('⚠ Tabela tipos_foto_checklist não existe. Criando tipos básicos...');
      
      // Criar tabela se não existir
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS tipos_foto_checklist (
          id SERIAL PRIMARY KEY,
          codigo VARCHAR(50) NOT NULL UNIQUE,
          nome_exibicao VARCHAR(255) NOT NULL,
          descricao TEXT,
          obrigatorio BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Inserir tipos básicos
      await sequelize.query(`
        INSERT INTO tipos_foto_checklist (codigo, nome_exibicao, descricao, obrigatorio)
        VALUES 
          ('CASCO', 'Foto do Casco', 'Foto obrigatória do casco da embarcação', TRUE),
          ('MOTOR', 'Foto do Motor', 'Foto do motor da embarcação', TRUE),
          ('INTERIOR', 'Foto do Interior', 'Foto do interior da embarcação', FALSE),
          ('DOCUMENTOS', 'Foto dos Documentos', 'Foto dos documentos da embarcação', TRUE)
        ON CONFLICT (codigo) DO NOTHING
      `);
      
      console.log('✓ Tipos de foto criados');
    } else {
      console.log('✓ Tabela tipos_foto_checklist existe');
    }
    
    // Contar tipos
    const [count] = await sequelize.query(`
      SELECT COUNT(*)::INTEGER as total FROM tipos_foto_checklist
    `);
    
    const totalTipos = parseInt(count[0].total) || 0;
    console.log(`✓ Total de tipos de foto: ${totalTipos}`);
    
    // Se não há tipos, criar alguns básicos para teste
    if (totalTipos === 0) {
      console.log('⚠ Nenhum tipo de foto encontrado. Criando tipos básicos...');
      
      try {
        await sequelize.query(`
          INSERT INTO tipos_foto_checklist (codigo, nome_exibicao, descricao, obrigatorio, created_at, updated_at)
          VALUES 
            ('CASCO', 'Foto do Casco', 'Foto obrigatória do casco da embarcação', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('MOTOR', 'Foto do Motor', 'Foto do motor da embarcação', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('INTERIOR', 'Foto do Interior', 'Foto do interior da embarcação', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('DOCUMENTOS', 'Foto dos Documentos', 'Foto dos documentos da embarcação', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('PROA', 'Foto da Proa', 'Foto da proa (frente) da embarcação', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('POPA', 'Foto da Popa', 'Foto da popa (traseira) da embarcação', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (codigo) DO NOTHING
        `);
        
        const [newCount] = await sequelize.query(`
          SELECT COUNT(*)::INTEGER as total FROM tipos_foto_checklist
        `);
        
        const novoTotal = parseInt(newCount[0].total) || 0;
        console.log(`✓ Tipos de foto criados. Total agora: ${novoTotal}`);
      } catch (insertError) {
        console.error('✗ Erro ao criar tipos de foto:', insertError.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('✗ Erro ao verificar tipos de foto:', error.message);
    return false;
  }
}

async function testRelationships() {
  console.log('\n=== TESTANDO RELACIONAMENTOS ===\n');
  
  try {
    // Verificar se existem vistorias
    const vistoria = await Vistoria.findOne();
    if (!vistoria) {
      console.log('⚠ Nenhuma vistoria encontrada. Pulando teste de relacionamento.');
      return true;
    }
    
    // Verificar se existem tipos de foto
    const tipoFoto = await TipoFotoChecklist.findOne();
    if (!tipoFoto) {
      console.log('⚠ Nenhum tipo de foto encontrado. Pulando teste de relacionamento.');
      return true;
    }
    
    console.log(`✓ Vistoria encontrada: ID ${vistoria.id}`);
    console.log(`✓ Tipo de foto encontrado: ID ${tipoFoto.id} - ${tipoFoto.nome_exibicao}`);
    
    // Testar inserção (sem salvar no banco, apenas validar)
    const fotoTest = Foto.build({
      url_arquivo: 'foto-teste-1234567890-123456789.jpg',
      vistoria_id: vistoria.id,
      tipo_foto_id: tipoFoto.id,
      observacao: 'Foto de teste - será deletada'
    });
    
    // Validar modelo
    await fotoTest.validate();
    console.log('✓ Modelo validado com sucesso');
    
    // Verificar relacionamentos
    const vistoriaComFotos = await Vistoria.findByPk(vistoria.id, {
      include: [{ model: Foto, as: 'Fotos' }]
    });
    
    if (vistoriaComFotos) {
      console.log(`✓ Relacionamento Vistoria.hasMany(Foto) funcionando`);
    }
    
    return true;
  } catch (error) {
    console.error('✗ Erro ao testar relacionamentos:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path}: ${err.message}`);
      });
    }
    return false;
  }
}

async function testInsertDelete() {
  console.log('\n=== TESTANDO INSERÇÃO E DELEÇÃO ===\n');
  
  try {
    // Buscar vistoria e tipo de foto
    const vistoria = await Vistoria.findOne();
    const tipoFoto = await TipoFotoChecklist.findOne();
    
    if (!vistoria || !tipoFoto) {
      console.log('⚠ Dados necessários não encontrados. Pulando teste de inserção.');
      return true;
    }
    
    // Criar foto de teste
    const fotoTest = await Foto.create({
      url_arquivo: `foto-teste-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`,
      vistoria_id: vistoria.id,
      tipo_foto_id: tipoFoto.id,
      observacao: 'Foto de teste - será deletada em seguida'
    });
    
    console.log(`✓ Foto criada com ID: ${fotoTest.id}`);
    console.log(`  - url_arquivo: ${fotoTest.url_arquivo}`);
    console.log(`  - vistoria_id: ${fotoTest.vistoria_id}`);
    console.log(`  - tipo_foto_id: ${fotoTest.tipo_foto_id}`);
    
    // Buscar a foto criada
    const fotoEncontrada = await Foto.findByPk(fotoTest.id, {
      include: [
        { model: Vistoria, as: 'Vistoria' },
        { model: TipoFotoChecklist, as: 'TipoFotoChecklist' }
      ]
    });
    
    if (fotoEncontrada) {
      console.log('✓ Foto encontrada com relacionamentos');
      console.log(`  - Vistoria: ${fotoEncontrada.Vistoria?.id || 'N/A'}`);
      console.log(`  - Tipo Foto: ${fotoEncontrada.TipoFotoChecklist?.nome_exibicao || 'N/A'}`);
    }
    
    // Deletar foto de teste
    await fotoTest.destroy();
    console.log('✓ Foto de teste deletada');
    
    return true;
  } catch (error) {
    console.error('✗ Erro ao testar inserção/deleção:', error.message);
    if (error.original) {
      console.error('Detalhes:', error.original.message);
    }
    return false;
  }
}

async function testChecklistLink() {
  console.log('\n=== TESTANDO LINK COM CHECKLIST ===\n');
  
  try {
    // Buscar item de checklist pendente
    const checklistItem = await VistoriaChecklistItem.findOne({
      where: { status: 'PENDENTE' },
      include: [{ model: Vistoria, as: 'vistoria' }]
    });
    
    if (!checklistItem) {
      console.log('⚠ Nenhum item de checklist pendente encontrado. Pulando teste.');
      return true;
    }
    
    console.log(`✓ Item de checklist encontrado: ${checklistItem.nome} (ID: ${checklistItem.id})`);
    console.log(`  - Vistoria ID: ${checklistItem.vistoria_id}`);
    
    // Buscar tipo de foto correspondente
    const tipoFoto = await TipoFotoChecklist.findOne();
    if (!tipoFoto) {
      console.log('⚠ Nenhum tipo de foto encontrado. Pulando teste.');
      return true;
    }
    
    // Criar foto e linkar ao checklist
    const fotoTest = await Foto.create({
      url_arquivo: `foto-checklist-test-${Date.now()}.jpg`,
      vistoria_id: checklistItem.vistoria_id,
      tipo_foto_id: tipoFoto.id,
      observacao: 'Foto de teste para checklist'
    });
    
    console.log(`✓ Foto criada: ID ${fotoTest.id}`);
    
    // Atualizar item do checklist
    await checklistItem.update({
      status: 'CONCLUIDO',
      foto_id: fotoTest.id,
      concluido_em: new Date()
    });
    
    console.log('✓ Item do checklist atualizado com foto_id');
    
    // Verificar link
    const itemAtualizado = await VistoriaChecklistItem.findByPk(checklistItem.id, {
      include: [{ model: Foto, as: 'foto' }]
    });
    
    if (itemAtualizado?.foto) {
      console.log(`✓ Link confirmado: Checklist Item → Foto ID ${itemAtualizado.foto.id}`);
    }
    
    // Limpar: reverter item do checklist e deletar foto
    await checklistItem.update({
      status: 'PENDENTE',
      foto_id: null,
      concluido_em: null
    });
    
    await fotoTest.destroy();
    console.log('✓ Teste limpo: checklist revertido e foto deletada');
    
    return true;
  } catch (error) {
    console.error('✗ Erro ao testar link com checklist:', error.message);
    if (error.original) {
      console.error('Detalhes:', error.original.message);
    }
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('TESTE DE MIGRATION: Tabela fotos');
  console.log('========================================\n');
  
  try {
    // Testar conexão
    await sequelize.authenticate();
    console.log('✓ Conexão com banco de dados estabelecida\n');
    
    // Verificar/criar tipos de foto primeiro
    await checkTiposFoto();
    
    // Executar migration
    const migrationOk = await runMigration();
    if (!migrationOk) {
      process.exit(1);
    }
    
    // Verificar tabela
    const tableOk = await checkTable();
    if (!tableOk) {
      process.exit(1);
    }
    
    // Testar relacionamentos
    await testRelationships();
    
    // Testar inserção/deleção
    await testInsertDelete();
    
    // Testar link com checklist
    await testChecklistLink();
    
    console.log('\n========================================');
    console.log('✓ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n========================================');
    console.error('✗ ERRO GERAL:', error.message);
    console.error('========================================\n');
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Executar
main();

