/**
 * Script para criar template de EMBARCACAO_COMERCIAL
 */

require('dotenv').config();
const { ChecklistTemplate, ChecklistTemplateItem, sequelize } = require('../models');

async function criarTemplate() {
  try {
    console.log('\n[SCRIPT] Criando Template - EMBARCACAO_COMERCIAL\n');
    console.log('='.repeat(60));

    const tipoEmbarcacao = 'EMBARCACAO_COMERCIAL';

    // Verificar se já existe
    let template = await ChecklistTemplate.findOne({
      where: { tipo_embarcacao: tipoEmbarcacao }
    });

    if (template) {
      console.log(`\n[INFO] Template ja existe (ID: ${template.id})`);
      console.log('[INFO] Removendo itens antigos...');
      await ChecklistTemplateItem.destroy({
        where: { checklist_template_id: template.id }
      });
    } else {
      console.log('\n[INFO] Criando novo template...');
      template = await ChecklistTemplate.create({
        tipo_embarcacao: tipoEmbarcacao,
        nome: 'Checklist Padrao - Embarcacao Comercial',
        descricao: 'Checklist padrao para vistorias de Embarcacoes Comerciais',
        ativo: true
      });
      console.log(`[OK] Template criado (ID: ${template.id})`);
    }

    // Itens do checklist
    const itens = [
      { ordem: 1, nome: 'Casco - Vista Geral', descricao: 'Foto geral do casco', obrigatorio: true },
      { ordem: 2, nome: 'Proa', descricao: 'Parte frontal', obrigatorio: true },
      { ordem: 3, nome: 'Popa', descricao: 'Parte traseira', obrigatorio: true },
      { ordem: 4, nome: 'Laterais (Bombordo)', descricao: 'Lateral esquerda', obrigatorio: true },
      { ordem: 5, nome: 'Laterais (Boreste)', descricao: 'Lateral direita', obrigatorio: true },
      { ordem: 6, nome: 'Conves Principal', descricao: 'Deck principal', obrigatorio: true },
      { ordem: 7, nome: 'Casa de Maquinas', descricao: 'Sala de maquinas/motores', obrigatorio: true },
      { ordem: 8, nome: 'Motor(es) Principal(is)', descricao: 'Motores de propulsao', obrigatorio: true },
      { ordem: 9, nome: 'Ponte de Comando', descricao: 'Cabine de comando/timoneria', obrigatorio: true },
      { ordem: 10, nome: 'Painel de Instrumentos', descricao: 'Instrumentacao nautica', obrigatorio: true },
      { ordem: 11, nome: 'Equipamentos de Navegacao', descricao: 'GPS, Radar, Radio', obrigatorio: true },
      { ordem: 12, nome: 'Equipamentos de Seguranca', descricao: 'Coletes, botes, extintores', obrigatorio: true },
      { ordem: 13, nome: 'Sistema Hidraulico', descricao: 'Bombas, tubulacoes', obrigatorio: false },
      { ordem: 14, nome: 'Sistema Eletrico', descricao: 'Quadros eletricos, geradores', obrigatorio: true },
      { ordem: 15, nome: 'Helice(s) e Leme', descricao: 'Sistema de propulsao e direcao', obrigatorio: true },
      { ordem: 16, nome: 'Documentacao', descricao: 'Certificados e documentos', obrigatorio: true },
      { ordem: 17, nome: 'Numero de Inscricao/Plaqueta', descricao: 'Identificacao oficial', obrigatorio: true },
      { ordem: 18, nome: 'Area de Carga/Passageiros', descricao: 'Area comercial', obrigatorio: false }
    ];

    console.log('\n[INFO] Criando itens do checklist...');
    
    for (const itemData of itens) {
      await ChecklistTemplateItem.create({
        checklist_template_id: template.id,
        ...itemData
      });
    }

    console.log(`[OK] ${itens.length} itens criados`);

    console.log('\n' + '='.repeat(60));
    console.log('[SUCESSO] Template EMBARCACAO_COMERCIAL criado!\n');

    // Mostrar resumo final
    const todosTemplates = await ChecklistTemplate.findAll({
      include: [{
        model: ChecklistTemplateItem,
        as: 'itens'
      }]
    });

    console.log('[RESUMO GERAL]');
    todosTemplates.forEach(t => {
      console.log(`  ${t.tipo_embarcacao}: ${t.itens.length} itens`);
    });
    console.log('');

  } catch (error) {
    console.error('\n[ERRO]:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

criarTemplate();

