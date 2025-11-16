const bcrypt = require('bcryptjs');
const { Usuario } = require('../models');

async function resetarSenha() {
  try {
    console.log('[RESET] Procurando usuário teste@email.com...');
    
    const usuario = await Usuario.findOne({ 
      where: { email: 'teste@email.com' } 
    });

    if (!usuario) {
      console.log('[RESET] Usuário não encontrado!');
      console.log('[RESET] Criando novo usuário...');
      
      const senhaHash = await bcrypt.hash('123456', 10);
      const novoUsuario = await Usuario.create({
        nome: 'Usuário Teste',
        email: 'teste@email.com',
        senha_hash: senhaHash,
        nivel_acesso_id: 1
      });
      
      console.log('[RESET] OK - Usuário criado com sucesso!');
      console.log('[RESET]   Email: teste@email.com');
      console.log('[RESET]   Senha: 123456');
      process.exit(0);
    }

    console.log('[RESET] OK - Usuário encontrado:', usuario.email);
    console.log('[RESET] Testando senha "123456"...');
    
    const senhaCorreta = await bcrypt.compare('123456', usuario.senha_hash);
    
    if (senhaCorreta) {
      console.log('[RESET] OK - Senha está CORRETA!');
      console.log('[RESET]   O problema deve ser outro.');
    } else {
      console.log('[RESET] ERRO - Senha está INCORRETA!');
      console.log('[RESET] Atualizando senha para "123456"...');
      
      const novoHash = await bcrypt.hash('123456', 10);
      await usuario.update({ senha_hash: novoHash });
      
      console.log('[RESET] OK - Senha atualizada com sucesso!');
      console.log('[RESET]   Email: teste@email.com');
      console.log('[RESET]   Senha: 123456');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('[RESET] ERRO:', error.message);
    process.exit(1);
  }
}

resetarSenha();

