// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Usuario, NivelAcesso } = require('../models'); // Importamos os models
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Rota: POST /api/usuarios/sync
// Sincroniza um novo usuário do Clerk com o banco de dados local.
router.post('/sync', async (req, res) => {
  try {
    // Garante que o corpo é um objeto antes de desestruturar (evita erro com corpo malformado)
    const safeBody = (req && req.body && typeof req.body === 'object') ? req.body : {};
    const { id: clerk_user_id, email, nome } = safeBody;

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

// ===== ROTAS CRUD PARA USUÁRIOS =====

// GET /api/usuarios - Listar todos os usuários (apenas admin)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      attributes: ['id', 'nome', 'email', 'nivel_acesso_id', 'ativo', 'createdAt', 'updatedAt']
    });

    res.json(usuarios.map(user => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
      nivelAcessoId: user.nivel_acesso_id,
      nivelAcesso: user.NivelAcesso,
      ativo: user.ativo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })));
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/usuarios/:id - Obter usuário por ID (apenas admin)
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      attributes: ['id', 'nome', 'email', 'ativo', 'createdAt', 'updatedAt']
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      nivelAcessoId: usuario.nivel_acesso_id,
      nivelAcesso: usuario.NivelAcesso,
      ativo: usuario.ativo,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt
    });
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/usuarios - Criar novo usuário (apenas admin)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { nome, email, nivelAcessoId } = req.body;

    // Validações básicas
    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido.' });
    }

    // Verificar se o email já existe
    const usuarioExistente = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    // Verificar se o nível de acesso existe
    const nivelAcesso = await NivelAcesso.findByPk(nivelAcessoId);
    if (!nivelAcesso) {
      return res.status(400).json({ error: 'Nível de acesso não encontrado.' });
    }

    // Senha padrão para todos os usuários
    const senhaPadrao = 'mudar123';
    const senhaHash = await bcrypt.hash(senhaPadrao, 10);

    // Criar usuário
    const usuario = await Usuario.create({
      nome,
      email: email.toLowerCase(),
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAcessoId,
      ativo: true,
      deve_atualizar_senha: true // Usuário deve alterar senha no primeiro login
    });

    // Buscar usuário com associações
    const usuarioCompleto = await Usuario.findByPk(usuario.id, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      attributes: ['id', 'nome', 'email', 'ativo', 'createdAt', 'updatedAt']
    });

    res.status(201).json({
      id: usuarioCompleto.id,
      nome: usuarioCompleto.nome,
      email: usuarioCompleto.email,
      nivelAcessoId: usuarioCompleto.nivel_acesso_id,
      nivelAcesso: usuarioCompleto.NivelAcesso,
      ativo: usuarioCompleto.ativo,
      createdAt: usuarioCompleto.createdAt,
      updatedAt: usuarioCompleto.updatedAt
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }
    
    if (error.name === 'SequelizeValidationError') {
      const mensagens = error.errors.map(err => err.message);
      return res.status(400).json({ error: mensagens.join(', ') });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/usuarios/:id - Atualizar usuário (apenas admin)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { nome, email, nivelAcessoId, ativo } = req.body;
    const userId = req.params.id;

    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Verificar se o email já existe em outro usuário
    if (email && email !== usuario.email) {
      // Validação de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido.' });
      }

      const usuarioExistente = await Usuario.findOne({ 
        where: { 
          email: email.toLowerCase(),
          id: { [require('sequelize').Op.ne]: userId }
        } 
      });
      if (usuarioExistente) {
        return res.status(400).json({ error: 'Email já cadastrado.' });
      }
    }

    // Verificar se o nível de acesso existe
    if (nivelAcessoId) {
      const nivelAcesso = await NivelAcesso.findByPk(nivelAcessoId);
      if (!nivelAcesso) {
        return res.status(400).json({ error: 'Nível de acesso não encontrado.' });
      }
    }

    // Atualizar usuário
    await usuario.update({
      nome: nome || usuario.nome,
      email: email ? email.toLowerCase() : usuario.email,
      nivel_acesso_id: nivelAcessoId || usuario.nivel_acesso_id,
      ativo: ativo !== undefined ? ativo : usuario.ativo
    });

    // Buscar usuário atualizado com associações
    const usuarioAtualizado = await Usuario.findByPk(userId, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      attributes: ['id', 'nome', 'email', 'ativo', 'createdAt', 'updatedAt']
    });

    res.json({
      id: usuarioAtualizado.id,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      nivelAcessoId: usuarioAtualizado.nivel_acesso_id,
      nivelAcesso: usuarioAtualizado.NivelAcesso,
      ativo: usuarioAtualizado.ativo,
      createdAt: usuarioAtualizado.createdAt,
      updatedAt: usuarioAtualizado.updatedAt
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }
    
    if (error.name === 'SequelizeValidationError') {
      const mensagens = error.errors.map(err => err.message);
      return res.status(400).json({ error: mensagens.join(', ') });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/usuarios/:id - Excluir usuário (apenas admin)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await usuario.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função para validar critérios de senha
const validatePassword = (senha) => {
  const errors = [];
  
  if (senha.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(senha)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(senha)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(senha)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// POST /api/usuarios/:id/reset-password - Redefinir senha (apenas admin)
router.post('/:id/reset-password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { novaSenha } = req.body;
    const userId = req.params.id;

    if (!novaSenha) {
      return res.status(400).json({ error: 'Nova senha é obrigatória.' });
    }

    // Validar critérios da nova senha
    const senhaValidation = validatePassword(novaSenha);
    if (!senhaValidation.isValid) {
      return res.status(400).json({ 
        error: 'Senha não atende aos critérios',
        details: senhaValidation.errors
      });
    }

    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await usuario.update({ 
      senha_hash: senhaHash,
      deve_atualizar_senha: true
    });

    res.json({ message: 'Senha redefinida com sucesso.' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/usuarios/:id/toggle-status - Ativar/Desativar usuário (apenas admin)
router.patch('/:id/toggle-status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    await usuario.update({ ativo: !usuario.ativo });

    // Buscar usuário atualizado com associações
    const usuarioAtualizado = await Usuario.findByPk(req.params.id, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      },
      attributes: ['id', 'nome', 'email', 'ativo', 'createdAt', 'updatedAt']
    });

    res.json({
      id: usuarioAtualizado.id,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      nivelAcessoId: usuarioAtualizado.nivel_acesso_id,
      nivelAcesso: usuarioAtualizado.NivelAcesso,
      ativo: usuarioAtualizado.ativo,
      createdAt: usuarioAtualizado.createdAt,
      updatedAt: usuarioAtualizado.updatedAt
    });
  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;