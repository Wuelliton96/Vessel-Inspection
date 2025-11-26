/**
 * Helper para criação de templates de checklist
 * Reduz duplicação entre scripts de criação de templates
 */

const { ChecklistTemplate, ChecklistTemplateItem } = require('../../models');

/**
 * Cria ou atualiza um template de checklist
 */
async function criarOuAtualizarTemplate(tipoEmbarcacao, nome, descricao) {
  let template = await ChecklistTemplate.findOne({
    where: { tipo_embarcacao: tipoEmbarcacao }
  });

  if (template) {
    await template.update({
      nome,
      descricao,
      ativo: true
    });
    console.log(`  [OK] Template atualizado (ID: ${template.id})`);
  } else {
    template = await ChecklistTemplate.create({
      tipo_embarcacao: tipoEmbarcacao,
      nome,
      descricao,
      ativo: true
    });
    console.log(`  [OK] Template criado (ID: ${template.id})`);
  }

  return template;
}

/**
 * Remove itens antigos e cria novos itens para um template
 */
async function atualizarItensTemplate(template, itens) {
  await ChecklistTemplateItem.destroy({
    where: { checklist_template_id: template.id }
  });
  console.log(`  [INFO] Itens antigos removidos`);

  for (const itemData of itens) {
    await ChecklistTemplateItem.create({
      checklist_template_id: template.id,
      ...itemData
    });
  }
  console.log(`  [OK] ${itens.length} itens criados`);
}

/**
 * Cria um template completo com seus itens
 */
async function criarTemplateCompleto(tipoEmbarcacao, nome, descricao, itens) {
  console.log(`\n[${tipoEmbarcacao}] Processando...`);
  
  const template = await criarOuAtualizarTemplate(tipoEmbarcacao, nome, descricao);
  await atualizarItensTemplate(template, itens);
  
  return template;
}

/**
 * Exibe resumo de todos os templates
 */
async function exibirResumoTemplates() {
  const templates = await ChecklistTemplate.findAll({
    include: [{
      model: ChecklistTemplateItem,
      as: 'itens'
    }]
  });

  console.log('\n[RESUMO]');
  for (const template of templates) {
    console.log(`  ${template.tipo_embarcacao}: ${template.itens.length} itens`);
  }
  console.log('');
}

module.exports = {
  criarOuAtualizarTemplate,
  atualizarItensTemplate,
  criarTemplateCompleto,
  exibirResumoTemplates
};

