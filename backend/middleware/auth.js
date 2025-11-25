const jwt = require('jsonwebtoken');
const { Usuario, NivelAcesso } = require('../models');

const requireAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-jwt');
    
    const usuario = await Usuario.findByPk(decoded.userId, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    if (usuario.deve_atualizar_senha) {
      return res.status(403).json({ 
        error: 'Senha deve ser atualizada',
        code: 'PASSWORD_UPDATE_REQUIRED',
        message: 'Você deve atualizar sua senha antes de continuar'
      });
    }

    req.user = usuario;
    req.userInfo = decoded;

    next();
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    res.status(401).json({ error: 'Token inválido.' });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.NivelAcesso) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (req.user.NivelAcesso.id !== 1) {
      return res.status(403).json({ error: 'Acesso negado. Permissão de administrador necessária.' });
    }

    next();
  } catch (error) {
    console.error("Erro no middleware de admin:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

const requireVistoriador = async (req, res, next) => {
  try {
    if (!req.user || !req.user.NivelAcesso) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const nivelId = req.user.NivelAcesso.id;
    if (nivelId !== 1 && nivelId !== 2) {
      return res.status(403).json({ error: 'Acesso negado. Permissão de vistoriador necessária.' });
    }

    next();
  } catch (error) {
    console.error("Erro no middleware de vistoriador:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

const requireAuthAllowPasswordUpdate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-jwt');
    
    const usuario = await Usuario.findByPk(decoded.userId, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    req.user = usuario;
    req.userInfo = decoded;

    next();
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    res.status(401).json({ error: 'Token inválido.' });
  }
};

module.exports = { requireAuth, requireAdmin, requireVistoriador, requireAuthAllowPasswordUpdate };