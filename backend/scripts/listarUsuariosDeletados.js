/**
 * Script para listar todos os usuários deletados (soft delete)
 * 
 * Uso: node backend/scripts/listarUsuariosDeletados.js
 */

require('dotenv').config();
const { Usuario, NivelAcesso } = require('../models');
const { Op } = require('sequelize');

async function listarUsuariosDeletados() {
  try {
    console.log('\n🔍 Buscando usuários deletados...\n');

    const deletados = await Usuario.findAll({
      paranoid: false,
      where: {
        deleted_at: { [Op.ne]: null }
      },
      include: { 
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      order: [['deleted_at', 'DESC']]
    });

    if (deletados.length === 0) {
      console.log('✅ Nenhum usuário deletado encontrado\n');
      return;
    }

    console.log(`📋 Total de usuários deletados: ${deletados.length}\n`);
    console.log('━'.repeat(80));

    deletados.forEach((usuario, index) => {
      console.log(`\n${index + 1}. ${usuario.nome}`);
      console.log(`   Email: ${usuario.email}`);
      console.log(`   ID: ${usuario.id}`);
      console.log(`   Nível: ${usuario.NivelAcesso.nome}`);
      console.log(`   Deletado em: ${usuario.deleted_at.toLocaleString('pt-BR')}`);
      
      // Calcular dias desde a deleção
      const diasDesdeDel = Math.floor(
        (new Date() - new Date(usuario.deleted_at)) / (1000 * 60 * 60 * 24)
      );
      console.log(`   Há: ${diasDesdeDel} dia(s)`);
    });

    console.log('\n' + '━'.repeat(80));
    console.log('\n💡 Para recuperar um usuário, use:');
    console.log('   node backend/scripts/recuperarUsuario.js email@usuario.com\n');
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários deletados:', error.message);
    console.error('   Detalhes:', error);
    console.log('');
  } finally {
    process.exit();
  }
}

// Executar
listarUsuariosDeletados();

