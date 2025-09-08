// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { Usuario, NivelAcesso } = require('../models');
const { requireAuth, syncUserAndGenerateToken } = require('../middleware/authComplete');

// Rota para login/autenticação
router.post('/login', requireAuth, syncUserAndGenerateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token: req.token,
      user: {
        id: req.user.id,
        nome: req.user.nome,
        email: req.user.email,
        nivelAcesso: req.user.NivelAcesso.nome,
        nivelAcessoId: req.user.NivelAcesso.id
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para obter informações do usuário atual
router.get('/me', requireAuth, syncUserAndGenerateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        nome: req.user.nome,
        email: req.user.email,
        nivelAcesso: req.user.NivelAcesso.nome,
        nivelAcessoId: req.user.NivelAcesso.id,
        nivelAcessoDescricao: req.user.NivelAcesso.descricao
      },
      token: req.token
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para logout (opcional - principalmente para invalidar tokens no frontend)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

// Rota para atualizar nível de acesso do usuário (apenas admin)
router.put('/user/:id/role', requireAuth, syncUserAndGenerateToken, async (req, res) => {
  try {
    // Verificar se o usuário atual é admin
    if (req.user.NivelAcesso.nome !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem alterar níveis de acesso.' });
    }

    const { nivelAcessoId } = req.body;
    const userId = req.params.id;

    // Verificar se o nível de acesso existe
    const nivelAcesso = await NivelAcesso.findByPk(nivelAcessoId);
    if (!nivelAcesso) {
      return res.status(400).json({ error: 'Nível de acesso não encontrado.' });
    }

    // Atualizar usuário
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await usuario.update({ nivel_acesso_id: nivelAcessoId });

    // Buscar usuário atualizado com associações
    const usuarioAtualizado = await Usuario.findByPk(userId, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      }
    });

    res.json({
      success: true,
      message: 'Nível de acesso atualizado com sucesso',
      user: {
        id: usuarioAtualizado.id,
        nome: usuarioAtualizado.nome,
        email: usuarioAtualizado.email,
        nivelAcesso: usuarioAtualizado.NivelAcesso.nome,
        nivelAcessoId: usuarioAtualizado.NivelAcesso.id
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar nível de acesso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar todos os usuários (apenas admin)
router.get('/users', requireAuth, syncUserAndGenerateToken, async (req, res) => {
  try {
    // Verificar se o usuário atual é admin
    if (req.user.NivelAcesso.nome !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem listar usuários.' });
    }

    const usuarios = await Usuario.findAll({
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      attributes: ['id', 'nome', 'email', 'created_at']
    });

    res.json({
      success: true,
      users: usuarios.map(user => ({
        id: user.id,
        nome: user.nome,
        email: user.email,
        nivelAcesso: user.NivelAcesso.nome,
        nivelAcessoId: user.NivelAcesso.id,
        createdAt: user.created_at
      }))
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
