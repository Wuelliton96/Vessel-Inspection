/**
 * Script para verificar templates de checklist existentes
 */

require('dotenv').config();
const { ChecklistTemplate, ChecklistTemplateItem, sequelize } = require('../models');

async function verificarTemplates() {
  try {
    console.log('\n[VERIFICACAO] Templates de Checklist\n');
    console.log('='.repeat(60));

    const templates = await ChecklistTemplate.findAll({
      include: [{
        model: ChecklistTemplateItem,
        as: 'itens',
        where: { ativo: true },
        required: false
      }],
      order: [['tipo_embarcacao', 'ASC']]
    });

    console.log(`\n[INFO] Total de templates: ${templates.length}\n`);

    if (templates.length === 0) {
      console.log('[AVISO] Nenhum template encontrado!');
      console.log('[INFO] Execute: node scripts/criarTemplatesChecklist.js\n');
    } else {
      templates.forEach(template => {
        console.log(`[${template.tipo_embarcacao}]`);
        console.log(`  Nome: ${template.nome}`);
        console.log(`  Ativo: ${template.ativo ? 'SIM' : 'NAO'}`);
        console.log(`  Itens: ${template.itens.length}`);
        
        if (template.itens.length > 0) {
          console.log('  Primeiros 5 itens:');
          template.itens.slice(0, 5).forEach(item => {
            console.log(`    ${item.ordem}. ${item.nome} ${item.obrigatorio ? '(obrigatorio)' : '(opcional)'}`);
          });
        }
        console.log('');
      });
    }

    console.log('='.repeat(60));
    console.log('\n[INFO] Tipos que precisam ter template:');
    console.log('  - JET_SKI');
    console.log('  - LANCHA');
    console.log('  - EMBARCACAO_COMERCIAL\n');

  } catch (error) {
    console.error('\n[ERRO]:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

verificarTemplates();

