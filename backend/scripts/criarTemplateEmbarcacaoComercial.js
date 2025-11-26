/**
 * Script para criar template de EMBARCACAO_COMERCIAL
 */

require('dotenv').config();
const { sequelize } = require('../models');
const { criarTemplateCompleto, exibirResumoTemplates } = require('./helpers/templateHelper');

async function criarTemplate() {
  try {
    console.log('\n[SCRIPT] Criando Template - EMBARCACAO_COMERCIAL\n');
    console.log('='.repeat(60));

    const tipoEmbarcacao = 'EMBARCACAO_COMERCIAL';
    const nome = 'Checklist Padrao - Embarcacao Comercial';
    const descricao = 'Checklist padrao para vistorias de Embarcacoes Comerciais';

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

    await criarTemplateCompleto(tipoEmbarcacao, nome, descricao, itens);

    console.log('\n' + '='.repeat(60));
    console.log('[SUCESSO] Template EMBARCACAO_COMERCIAL criado!\n');

    await exibirResumoTemplates();

  } catch (error) {
    console.error('\n[ERRO]:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

criarTemplate();

