/**
 * Script para recuperar usuário deletado (soft delete)
 * 
 * Uso: node backend/scripts/recuperarUsuario.js usuario@email.com
 */

require('dotenv').config();
const { Usuario, NivelAcesso } = require('../models');

async function recuperarUsuario(email) {
  try {
    console.log(`\n[PROCURANDO] Procurando usuário: ${email}...\n`);

    const usuario = await Usuario.findOne({
      where: { email: email.toLowerCase() },
      paranoid: false, // Incluir deletados
      include: { 
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      }
    });

    if (!usuario) {
      console.log('[ERRO] Usuário não encontrado no sistema');
      console.log('   Verifique se o email está correto\n');
      return;
    }

    if (!usuario.deleted_at) {
      console.log('[INFO] Este usuário NAO está deletado');
      console.log(`   Nome: ${usuario.nome}`);
      console.log(`   Email: ${usuario.email}`);
      console.log(`   Status: ${usuario.ativo ? 'ATIVO' : 'INATIVO'}`);
      console.log(`   Nível: ${usuario.NivelAcesso.nome}\n`);
      return;
    }

    console.log('[INFO] Informações do usuário deletado:');
    console.log(`   ID: ${usuario.id}`);
    console.log(`   Nome: ${usuario.nome}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Nível: ${usuario.NivelAcesso.nome}`);
    console.log(`   Deletado em: ${usuario.deleted_at.toLocaleString('pt-BR')}`);
    console.log('');

    // Restaurar usuário
    await usuario.restore();

    console.log('[OK] Usuário restaurado com sucesso!');
    console.log(`   ${usuario.nome} (${usuario.email}) está novamente ativo no sistema\n`);
    
  } catch (error) {
    console.error('❌ Erro ao recuperar usuário:', error.message);
    console.error('   Detalhes:', error);
    console.log('');
  } finally {
    process.exit();
  }
}

// Verificar argumentos
const email = process.argv[2];
if (!email) {
  console.log('\n📖 Uso do script:');
  console.log('   node backend/scripts/recuperarUsuario.js usuario@email.com\n');
  console.log('📝 Exemplo:');
  console.log('   node backend/scripts/recuperarUsuario.js joao.silva@example.com\n');
  process.exit(1);
}

// Executar
recuperarUsuario(email);

