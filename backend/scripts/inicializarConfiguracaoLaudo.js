/**
 * Script para inicializar configurações padrão do laudo
 * Executa: node backend/scripts/inicializarConfiguracaoLaudo.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { ConfiguracaoLaudo, Usuario, sequelize } = require('../models');

async function inicializarConfiguracao() {
  try {
    console.log('Inicializando configurações padrão do laudo...');
    
    // Sincronizar apenas o modelo ConfiguracaoLaudo
    console.log('Criando tabela de configurações...');
    try {
      await ConfiguracaoLaudo.sync({ alter: true });
      console.log('[OK] Tabela criada/verificada!');
    } catch (syncError) {
      console.log('[AVISO] Aviso ao sincronizar (pode já existir):', syncError.message);
    }

    // Buscar primeiro admin disponível
    const admin = await Usuario.findOne({
      where: { nivel_acesso_id: 1 }
    });

    if (!admin) {
      console.log('AVISO: Nenhum administrador encontrado. Criando configuração sem usuário.');
    }

    // Verificar se já existe configuração padrão
    const configExistente = await ConfiguracaoLaudo.findOne({
      where: { padrao: true }
    });

    if (configExistente) {
      console.log('Atualizando configuração padrão existente...');
      await configExistente.update({
        nome_empresa: 'Tech Survey Vistorias',
        logo_empresa_url: '/images/logo.png',
        nota_rodape: 'Relatório exclusivo para seguradora, não tem validade para outra finalidade.',
        empresa_prestadora: 'Tech Survey Vistorias',
        usuario_id: admin?.id || null
      });
      console.log('[OK] Configuração atualizada com sucesso!');
      console.log('   - Nome da Empresa: Tech Survey Vistorias');
      console.log('   - Logo: /images/logo.png');
      console.log('   - Empresa Prestadora: Tech Survey Vistorias');
    } else {
      console.log('Criando nova configuração padrão...');
      const config = await ConfiguracaoLaudo.create({
        nome_empresa: 'Tech Survey Vistorias',
        logo_empresa_url: '/images/logo.png',
        nota_rodape: 'Relatório exclusivo para seguradora, não tem validade para outra finalidade.',
        empresa_prestadora: 'Tech Survey Vistorias',
        padrao: true,
        usuario_id: admin?.id || null
      });
      console.log('[OK] Configuração criada com sucesso!');
      console.log('   - Nome da Empresa: Tech Survey Vistorias');
      console.log('   - Logo: /images/logo.png');
      console.log('   - Empresa Prestadora: Tech Survey Vistorias');
    }

    console.log('\n[OK] Inicialização concluída!');
    process.exit(0);
  } catch (error) {
    console.error('[ERRO] Erro ao inicializar configuração:', error);
    process.exit(1);
  }
}

// Executar
inicializarConfiguracao();

