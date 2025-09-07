// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { Usuario, NivelAcesso } = require('../models'); // Importamos os models

// Rota: POST /api/usuarios/sync
// Sincroniza um novo usuário do Clerk com o banco de dados local.
router.post('/sync', async (req, res) => {
  try {
    const { id: clerk_user_id, email, nome } = req.body;

    // Validação básica
    if (!clerk_user_id || !email || !nome) {
      return res.status(400).json({ error: 'Dados do usuário incompletos.' });
    }

    // Busca o Nível de Acesso padrão para 'VISTORIADOR'
    const vistoriadorRole = await NivelAcesso.findOne({ where: { nome: 'VISTORIADOR' } });
    if (!vistoriadorRole) {
      return res.status(500).json({ error: 'Nível de acesso "VISTORIADOR" não encontrado.' });
    }

    // Procura por um usuário com o clerk_id. Se não encontrar, cria um novo.
    const [usuario, criado] = await Usuario.findOrCreate({
      where: { clerk_user_id: clerk_user_id },
      defaults: {
        nome: nome,
        email: email,
        nivel_acesso_id: vistoriadorRole.id
      }
    });

    if (criado) {
      console.log(`Novo usuário sincronizado: ${usuario.email}`);
      return res.status(201).json({ message: 'Usuário sincronizado com sucesso!', usuario });
    }

    console.log(`Usuário já existente: ${usuario.email}`);
    return res.status(200).json({ message: 'Usuário já estava sincronizado.', usuario });

  } catch (error) {
    console.error('Erro ao sincronizar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;