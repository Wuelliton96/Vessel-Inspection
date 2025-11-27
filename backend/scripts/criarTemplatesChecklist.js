/**
 * Script para criar templates de checklist padrão
 * Cria templates para: JET_SKI, LANCHA, EMBARCACAO_COMERCIAL
 */

require('dotenv').config();
const { ChecklistTemplate, ChecklistTemplateItem, sequelize } = require('../models');

// Templates padrão para cada tipo
const TEMPLATES = {
  JET_SKI: {
    nome: 'Checklist Padrão - Jet Ski',
    descricao: 'Checklist padrão para vistorias de Jet Ski',
    itens: [
      { ordem: 1, nome: 'Casco - Vista Geral', descricao: 'Foto geral do casco', obrigatorio: true },
      { ordem: 2, nome: 'Proa', descricao: 'Foto da parte frontal', obrigatorio: true },
      { ordem: 3, nome: 'Popa', descricao: 'Foto da parte traseira', obrigatorio: true },
      { ordem: 4, nome: 'Laterais (Bombordo)', descricao: 'Lateral esquerda', obrigatorio: true },
      { ordem: 5, nome: 'Laterais (Boreste)', descricao: 'Lateral direita', obrigatorio: true },
      { ordem: 6, nome: 'Motor', descricao: 'Foto do motor', obrigatorio: true },
      { ordem: 7, nome: 'Número de Série/Plaqueta', descricao: 'Plaqueta de identificação', obrigatorio: true },
      { ordem: 8, nome: 'Painel de Instrumentos', descricao: 'Painel e controles', obrigatorio: true },
      { ordem: 9, nome: 'Assento', descricao: 'Banco/assento', obrigatorio: false },
      { ordem: 10, nome: 'Sistema de Propulsão', descricao: 'Hélice e bomba', obrigatorio: true }
    ]
  },
  LANCHA: {
    nome: 'Checklist Padrão - Lancha',
    descricao: 'Checklist padrão para vistorias de Lanchas',
    itens: [
      { ordem: 1, nome: 'Casco - Vista Geral', descricao: 'Foto geral do casco', obrigatorio: true },
      { ordem: 2, nome: 'Proa', descricao: 'Foto da parte frontal', obrigatorio: true },
      { ordem: 3, nome: 'Popa', descricao: 'Foto da parte traseira', obrigatorio: true },
      { ordem: 4, nome: 'Laterais (Bombordo)', descricao: 'Lateral esquerda', obrigatorio: true },
      { ordem: 5, nome: 'Laterais (Boreste)', descricao: 'Lateral direita', obrigatorio: true },
      { ordem: 6, nome: 'Convés', descricao: 'Deck/área superior', obrigatorio: true },
      { ordem: 7, nome: 'Cockpit/Cabine de Comando', descricao: 'Área de pilotagem', obrigatorio: true },
      { ordem: 8, nome: 'Motor(es)', descricao: 'Motores de propulsão', obrigatorio: true },
      { ordem: 9, nome: 'Painel de Instrumentos', descricao: 'Painel e instrumentação', obrigatorio: true },
      { ordem: 10, nome: 'Número de Inscrição/Plaqueta', descricao: 'Identificação da embarcação', obrigatorio: true },
      { ordem: 11, nome: 'Equipamentos de Segurança', descricao: 'Coletes, extintores, etc', obrigatorio: true },
      { ordem: 12, nome: 'Interior/Cabine', descricao: 'Área interna (se houver)', obrigatorio: false },
      { ordem: 13, nome: 'Sistema Elétrico', descricao: 'Quadro elétrico e baterias', obrigatorio: false },
      { ordem: 14, nome: 'Hélice(s)', descricao: 'Sistema de propulsão', obrigatorio: true }
    ]
  },
  EMBARCACAO_COMERCIAL: {
    nome: 'Checklist Padrão - Embarcação Comercial',
    descricao: 'Checklist padrão para vistorias de Embarcações Comerciais',
    itens: [
      { ordem: 1, nome: 'Casco - Vista Geral', descricao: 'Foto geral do casco', obrigatorio: true },
      { ordem: 2, nome: 'Proa', descricao: 'Parte frontal', obrigatorio: true },
      { ordem: 3, nome: 'Popa', descricao: 'Parte traseira', obrigatorio: true },
      { ordem: 4, nome: 'Laterais (Bombordo)', descricao: 'Lateral esquerda', obrigatorio: true },
      { ordem: 5, nome: 'Laterais (Boreste)', descricao: 'Lateral direita', obrigatorio: true },
      { ordem: 6, nome: 'Convés Principal', descricao: 'Deck principal', obrigatorio: true },
      { ordem: 7, nome: 'Casa de Máquinas', descricao: 'Sala de máquinas/motores', obrigatorio: true },
      { ordem: 8, nome: 'Motor(es) Principal(is)', descricao: 'Motores de propulsão', obrigatorio: true },
      { ordem: 9, nome: 'Ponte de Comando', descricao: 'Cabine de comando/timoneria', obrigatorio: true },
      { ordem: 10, nome: 'Painel de Instrumentos', descricao: 'Instrumentação náutica', obrigatorio: true },
      { ordem: 11, nome: 'Equipamentos de Navegação', descricao: 'GPS, Radar, Rádio', obrigatorio: true },
      { ordem: 12, nome: 'Equipamentos de Segurança', descricao: 'Coletes, botes, extintores', obrigatorio: true },
      { ordem: 13, nome: 'Sistema Hidráulico', descricao: 'Bombas, tubulações', obrigatorio: false },
      { ordem: 14, nome: 'Sistema Elétrico', descricao: 'Quadros elétricos, geradores', obrigatorio: true },
      { ordem: 15, nome: 'Hélice(s) e Leme', descricao: 'Sistema de propulsão e direção', obrigatorio: true },
      { ordem: 16, nome: 'Documentação', descricao: 'Certificados e documentos', obrigatorio: true },
      { ordem: 17, nome: 'Número de Inscrição/Plaqueta', descricao: 'Identificação oficial', obrigatorio: true },
      { ordem: 18, nome: 'Área de Carga/Passageiros', descricao: 'Área comercial', obrigatorio: false }
    ]
  }
};

async function criarTemplates() {
  try {
    console.log('\n[SCRIPT] CRIANDO TEMPLATES DE CHECKLIST\n');
    console.log('='.repeat(60));

    for (const [tipoEmbarcacao, templateData] of Object.entries(TEMPLATES)) {
      console.log(`\n[${tipoEmbarcacao}] Processando...`);

      // Verificar se template já existe
      let template = await ChecklistTemplate.findOne({
        where: { tipo_embarcacao: tipoEmbarcacao }
      });

      if (template) {
        console.log(`  [INFO] Template ja existe (ID: ${template.id})`);
        
        // Atualizar nome e descrição
        await template.update({
          nome: templateData.nome,
          descricao: templateData.descricao,
          ativo: true
        });
        console.log(`  [OK] Template atualizado`);
      } else {
        // Criar novo template
        template = await ChecklistTemplate.create({
          tipo_embarcacao: tipoEmbarcacao,
          nome: templateData.nome,
          descricao: templateData.descricao,
          ativo: true
        });
        console.log(`  [OK] Template criado (ID: ${template.id})`);
      }

      // Remover itens antigos
      await ChecklistTemplateItem.destroy({
        where: { checklist_template_id: template.id }
      });
      console.log(`  [INFO] Itens antigos removidos`);

      // Criar novos itens
      for (const itemData of templateData.itens) {
        await ChecklistTemplateItem.create({
          checklist_template_id: template.id,
          ...itemData
        });
      }
      console.log(`  [OK] ${templateData.itens.length} itens criados`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('[SUCESSO] Templates criados com sucesso!\n');

    // Mostrar resumo
    console.log('[RESUMO]');
    const templates = await ChecklistTemplate.findAll({
      include: [{
        model: ChecklistTemplateItem,
        as: 'itens'
      }]
    });

    for (const template of templates) {
      console.log(`  ${template.tipo_embarcacao}: ${template.itens.length} itens`);
    }
    console.log('');

  } catch (error) {
    console.error('\n[ERRO] Erro ao criar templates:');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

criarTemplates();

