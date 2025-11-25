const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, NivelAcesso } = require('../models');
const { requireAuth, requireAdmin, requireAuthAllowPasswordUpdate } = require('../middleware/auth');
const { loginValidation, registerValidation } = require('../middleware/validator');
const { loginRateLimiter } = require('../middleware/rateLimiting');
const { registrarAuditoria } = require('../middleware/auditoria');
const { validarCPF, limparCPF, validatePassword } = require('../utils/validators');
const { getJwtSecret, getJwtExpiration } = require('../config/jwt');
const logger = require('../utils/logger');

router.post('/register', registerValidation, async (req, res) => {
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
      cpf: usuarioCompleto.cpf,
      email: usuarioCompleto.email,
      nome: usuarioCompleto.nome,
      nivelAcesso: usuarioCompleto.NivelAcesso.nome,
      nivelAcessoId: usuarioCompleto.NivelAcesso.id
    };

    const jwtSecret = getJwtSecret();
    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: getJwtExpiration()
    });

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      token,
      user: {
        id: usuarioCompleto.id,
        nome: usuarioCompleto.nome,
        email: usuarioCompleto.email,
        cpf: usuarioCompleto.cpf,
        nivelAcesso: usuarioCompleto.NivelAcesso.nome,
        nivelAcessoId: usuarioCompleto.NivelAcesso.id
      }
    });
  } catch (error) {
    logger.error('Erro no registro', { error: error.message, stack: error.stack });
    
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

router.post('/login', loginRateLimiter, loginValidation, async (req, res) => {
  try {
    logger.info('[AUTH] Requisição de login recebida', { 
      origin: req.headers.origin,
      hasCpf: !!req.body.cpf,
      hasSenha: !!req.body.senha
    });
    
    const { cpf, senha } = req.body;

    if (!cpf || !senha) {
      logger.warn('[AUTH] Campos obrigatórios faltando');
      return res.status(400).json({ 
        error: 'Campos obrigatórios',
        message: 'Por favor, preencha o CPF e a senha para continuar.',
        code: 'CAMPOS_OBRIGATORIOS'
      });
    }

    // Limpar e validar CPF
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      return res.status(400).json({ 
        error: 'CPF inválido',
        message: 'Por favor, digite um CPF válido.',
        code: 'CPF_INVALIDO'
      });
    }

    logger.debug('[AUTH] Buscando usuário no banco pelo CPF');
    const usuario = await Usuario.findOne({
      where: { cpf: cpfLimpo },
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      }
    });

    if (!usuario) {
      logger.warn('[AUTH] Usuário não encontrado com CPF', { cpf: cpfLimpo });
      
      // Registrar tentativa de login falhada
      await registrarAuditoria({
        req,
        acao: 'LOGIN_FAILED',
        entidade: 'Usuario',
        nivelCritico: true,
        detalhes: `Tentativa de login com CPF não cadastrado: ${cpfLimpo}`
      });
      
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        message: 'CPF não encontrado no sistema. Verifique se digitou corretamente ou entre em contato com o administrador.',
        code: 'CPF_NAO_ENCONTRADO'
      });
    }

    logger.debug('[AUTH] Usuário encontrado', { userId: usuario.id, nome: usuario.nome });
    
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    
    if (!senhaValida) {
      logger.warn('[AUTH] Senha incorreta', { userId: usuario.id, cpf: cpfLimpo });
      
      // Registrar tentativa de login falhada
      await registrarAuditoria({
        req,
        acao: 'LOGIN_FAILED',
        entidade: 'Usuario',
        entidadeId: usuario.id,
        nivelCritico: true,
        detalhes: `Tentativa de login com senha incorreta para CPF: ${cpfLimpo}`
      });
      
      return res.status(401).json({ 
        error: 'Credenciais inválidas',
        message: 'Senha incorreta. Por favor, verifique sua senha e tente novamente.',
        code: 'SENHA_INCORRETA'
      });
    }

    const tokenPayload = {
      userId: usuario.id,
      cpf: usuario.cpf,
      email: usuario.email,
      nome: usuario.nome,
      nivelAcesso: usuario.NivelAcesso.nome,
      nivelAcessoId: usuario.NivelAcesso.id
    };

    const jwtSecret = getJwtSecret();
    const token = jwt.sign(tokenPayload, jwtSecret, {
      expiresIn: getJwtExpiration()
    });

    logger.info('[AUTH] Login bem-sucedido', { userId: usuario.id, nome: usuario.nome });

    // Registrar login bem-sucedido
    await registrarAuditoria({
      req,
      acao: 'LOGIN_SUCCESS',
      entidade: 'Usuario',
      entidadeId: usuario.id,
      nivelCritico: false,
      detalhes: `Login bem-sucedido: ${usuario.nome} (CPF: ${cpfLimpo})`
    });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        nivelAcesso: usuario.NivelAcesso.nome,
        nivelAcessoId: usuario.NivelAcesso.id,
        deveAtualizarSenha: usuario.deve_atualizar_senha
      }
    });
  } catch (error) {
    logger.error('[AUTH] Erro no login', { error: error.message, stack: error.stack });
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
        cpf: req.user.cpf,
        nivelAcesso: req.user.NivelAcesso.nome,
        nivelAcessoId: req.user.NivelAcesso.id,
        nivelAcessoDescricao: req.user.NivelAcesso.descricao
      }
    });
  } catch (error) {
    logger.error('Erro ao obter dados do usuário', { error: error.message, stack: error.stack });
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
    logger.error('Erro ao atualizar nível de acesso', { error: error.message, stack: error.stack });
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
    logger.error('Erro ao listar usuários', { error: error.message, stack: error.stack });
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

    // Validar critérios da nova senha primeiro (antes de verificar senha atual)
    const senhaValidation = validatePassword(novaSenha);
    if (!senhaValidation.isValid) {
      return res.status(400).json({ 
        error: 'Senha não atende aos critérios',
        details: senhaValidation.errors
      });
    }

    // Verificar senha atual (retornar 400 ao invés de 401 para não fazer logout)
    const senhaAtualValida = await bcrypt.compare(senhaAtual, req.user.senha_hash);
    if (!senhaAtualValida) {
      return res.status(400).json({ 
        error: 'Senha atual incorreta',
        message: 'A senha atual informada está incorreta. Verifique e tente novamente.'
      });
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
    logger.error('Erro ao atualizar senha', { error: error.message, stack: error.stack });
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
    const jwtSecret = getJwtSecret();
    const decoded = jwt.verify(token, jwtSecret);
    
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
      cpf: usuario.cpf,
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
        cpf: usuario.cpf,
        nivelAcesso: usuario.NivelAcesso.nome,
        nivelAcessoId: usuario.NivelAcesso.id,
        deveAtualizarSenha: false
      }
    });
  } catch (error) {
    logger.error('Erro na atualização obrigatória de senha', { error: error.message, stack: error.stack });
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido.' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


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
    logger.error('Erro ao atualizar senha do usuário', { error: error.message, stack: error.stack });
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
    logger.error('Erro ao definir senha temporária', { error: error.message, stack: error.stack });
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
    logger.error('Erro ao verificar status da senha', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
