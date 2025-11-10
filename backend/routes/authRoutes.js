const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, NivelAcesso } = require('../models');
const { requireAuth, requireAdmin, requireAuthAllowPasswordUpdate } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, nivelAcessoId } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios.' });
    }

    if (req.body.id !== undefined) {
      return res.status(400).json({ error: 'Campo ID não deve ser enviado. O ID é gerado automaticamente.' });
    }

    const usuarioExistente = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    let nivelAcessoFinal = nivelAcessoId;
    if (!nivelAcessoFinal) {
      nivelAcessoFinal = 2;
    }

    const usuario = await Usuario.create({
      nome,
      email: email.toLowerCase(),
      senha_hash: senhaHash,
      nivel_acesso_id: nivelAcessoFinal
    });

    const usuarioCompleto = await Usuario.findByPk(usuario.id, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      }
    });

    const tokenPayload = {
      userId: usuarioCompleto.id,
      email: usuarioCompleto.email,
      nome: usuarioCompleto.nome,
      nivelAcesso: usuarioCompleto.NivelAcesso.nome,
      nivelAcessoId: usuarioCompleto.NivelAcesso.id
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'sua-chave-secreta-jwt', {
      expiresIn: '24h'
    });

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      token,
      user: {
        id: usuarioCompleto.id,
        nome: usuarioCompleto.nome,
        email: usuarioCompleto.email,
        nivelAcesso: usuarioCompleto.NivelAcesso.nome,
        nivelAcessoId: usuarioCompleto.NivelAcesso.id
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    
    // Verificar se é erro de email duplicado do Sequelize
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }
    
    // Verificar se é erro de validação
    if (error.name === 'SequelizeValidationError') {
      const mensagens = error.errors.map(err => err.message);
      return res.status(400).json({ error: mensagens.join(', ') });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios',
        message: 'Por favor, preencha o email e a senha para continuar.',
        code: 'CAMPOS_OBRIGATORIOS'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Email inválido',
        message: 'Por favor, digite um email válido no formato: exemplo@email.com',
        code: 'EMAIL_INVALIDO'
      });
    }

    const usuario = await Usuario.findOne({
      where: { email: email.toLowerCase() },
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      }
    });

    if (!usuario) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        message: 'Email não encontrado no sistema. Verifique se digitou corretamente ou entre em contato com o administrador.',
        code: 'EMAIL_NAO_ENCONTRADO'
      });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        message: 'Senha incorreta. Por favor, verifique sua senha e tente novamente.',
        code: 'SENHA_INCORRETA'
      });
    }

    const tokenPayload = {
      userId: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      nivelAcesso: usuario.NivelAcesso.nome,
      nivelAcessoId: usuario.NivelAcesso.id
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'sua-chave-secreta-jwt', {
      expiresIn: '24h'
    });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        nivelAcesso: usuario.NivelAcesso.nome,
        nivelAcessoId: usuario.NivelAcesso.id,
        deveAtualizarSenha: usuario.deve_atualizar_senha
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
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
      }
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
router.put('/user/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
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
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
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

// Rota para o usuário atualizar sua própria senha
router.put('/change-password', requireAuthAllowPasswordUpdate, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    // Validações básicas
    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias.' });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres.' });
    }

    // Verificar senha atual
    const senhaAtualValida = await bcrypt.compare(senhaAtual, req.user.senha_hash);
    if (!senhaAtualValida) {
      return res.status(401).json({ error: 'Senha atual incorreta.' });
    }

    // Hash da nova senha
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    // Atualizar senha e remover flag de atualização obrigatória
    await req.user.update({
      senha_hash: novaSenhaHash,
      deve_atualizar_senha: false
    });

    res.json({
      success: true,
      message: 'Senha atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualização obrigatória de senha (quando deve_atualizar_senha = true)
router.put('/force-password-update', async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    // Validações básicas
    if (!token || !novaSenha) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios.' });
    }

    // Validar critérios da nova senha
    const senhaValidation = validatePassword(novaSenha);
    if (!senhaValidation.isValid) {
      return res.status(400).json({ 
        error: 'Senha não atende aos critérios',
        details: senhaValidation.errors
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-jwt');
    
    // Buscar usuário
    const usuario = await Usuario.findByPk(decoded.userId, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Verificar se realmente deve atualizar senha
    if (!usuario.deve_atualizar_senha) {
      return res.status(400).json({ error: 'Usuário não precisa atualizar senha.' });
    }

    // Hash da nova senha
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    // Atualizar senha e remover flag de atualização obrigatória
    await usuario.update({
      senha_hash: novaSenhaHash,
      deve_atualizar_senha: false
    });

    // Gerar novo token
    const tokenPayload = {
      userId: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      nivelAcesso: usuario.NivelAcesso.nome,
      nivelAcessoId: usuario.NivelAcesso.id
    };

    const newToken = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'sua-chave-secreta-jwt', {
      expiresIn: '24h'
    });

    res.json({
      success: true,
      message: 'Senha atualizada com sucesso',
      token: newToken,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        nivelAcesso: usuario.NivelAcesso.nome,
        nivelAcessoId: usuario.NivelAcesso.id
      }
    });
  } catch (error) {
    console.error('Erro na atualização obrigatória de senha:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
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

// Rota para administrador atualizar senha de outro usuário
router.put('/user/:id/password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { novaSenha } = req.body;
    const userId = req.params.id;

    // Validações básicas
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

    // Buscar usuário
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Hash da nova senha
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    // Atualizar senha e marcar como obrigatório atualizar
    await usuario.update({
      senha_hash: novaSenhaHash,
      deve_atualizar_senha: true
    });

    res.json({
      success: true,
      message: 'Senha atualizada com sucesso. O usuário deve atualizar a senha no próximo login.'
    });
  } catch (error) {
    console.error('Erro ao atualizar senha do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para administrador definir senha temporária (força atualização)
router.post('/user/:id/temp-password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { senhaTemporaria } = req.body;
    const userId = req.params.id;

    // Validações básicas
    if (!senhaTemporaria) {
      return res.status(400).json({ error: 'Senha temporária é obrigatória.' });
    }

    // Buscar usuário
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Hash da senha temporária
    const senhaTemporariaHash = await bcrypt.hash(senhaTemporaria, 10);

    // Definir senha temporária e marcar como obrigatório atualizar
    await usuario.update({
      senha_hash: senhaTemporariaHash,
      deve_atualizar_senha: true
    });

    res.json({
      success: true,
      message: 'Senha temporária definida com sucesso. O usuário deve atualizar a senha no próximo login.',
      senhaTemporaria: senhaTemporaria // Retornar para o admin saber qual senha definir
    });
  } catch (error) {
    console.error('Erro ao definir senha temporária:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para verificar se deve atualizar senha (sem bloquear acesso)
router.get('/password-status', requireAuthAllowPasswordUpdate, async (req, res) => {
  try {
    res.json({
      success: true,
      deveAtualizarSenha: req.user.deve_atualizar_senha,
      message: req.user.deve_atualizar_senha ? 
        'Você deve atualizar sua senha antes de continuar' : 
        'Senha está atualizada'
    });
  } catch (error) {
    console.error('Erro ao verificar status da senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
