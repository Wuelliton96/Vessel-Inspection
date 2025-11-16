/**
 * Script para atualizar ENUM de tipo_embarcacao
 */

require('dotenv').config();
const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

async function atualizarEnum() {
  try {
    console.log('\n[MIGRATION] Atualizando ENUM tipo_embarcacao\n');
    console.log('='.repeat(60));

    // Verificar valores atuais
    console.log('\n[INFO] Valores atuais do ENUM:');
    const [valoresAtuais] = await sequelize.query(`
      SELECT enumlabel as valor
      FROM pg_enum
      WHERE enumtypid = 'enum_embarcacoes_tipo_embarcacao'::regtype
      ORDER BY enumsortorder
    `);
    
    valoresAtuais.forEach(v => console.log(`  - ${v.valor}`));

    // Adicionar novo valor
    console.log('\n[INFO] Adicionando EMBARCACAO_COMERCIAL...');
    
    try {
      await sequelize.query(`
        ALTER TYPE enum_embarcacoes_tipo_embarcacao ADD VALUE IF NOT EXISTS 'EMBARCACAO_COMERCIAL'
      `);
      console.log('[OK] Valor adicionado');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('[INFO] Valor ja existe');
      } else {
        throw error;
      }
    }

    // Verificar valores finais
    console.log('\n[INFO] Valores finais do ENUM:');
    const [valoresFinais] = await sequelize.query(`
      SELECT enumlabel as valor
      FROM pg_enum
      WHERE enumtypid = 'enum_embarcacoes_tipo_embarcacao'::regtype
      ORDER BY enumsortorder
    `);
    
    valoresFinais.forEach(v => console.log(`  - ${v.valor}`));

    console.log('\n' + '='.repeat(60));
    console.log('[SUCESSO] ENUM atualizado!\n');

  } catch (error) {
    console.error('\n[ERRO]:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

atualizarEnum();

