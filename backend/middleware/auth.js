const jwt = require('jsonwebtoken');
const { Usuario, NivelAcesso } = require('../models');
const { getJwtSecret } = require('../config/jwt');
const logger = require('../utils/logger');

/**
 * Função base para autenticação de token JWT
 * Elimina duplicação entre requireAuth e requireAuthAllowPasswordUpdate
 * @param {boolean} allowPasswordUpdate - Se true, permite acesso mesmo se deve_atualizar_senha = true
 * @returns {Function} Middleware Express
 */
const createAuthMiddleware = (allowPasswordUpdate = false) => {
  return async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido.' });
      }

      const jwtSecret = getJwtSecret();
      const decoded = jwt.verify(token, jwtSecret);
      
      const usuario = await Usuario.findByPk(decoded.userId, {
        include: {
          model: NivelAcesso,
          attributes: ['id', 'nome', 'descricao']
        }
      });

      if (!usuario) {
        return res.status(401).json({ error: 'Usuário não encontrado.' });
      }

      // Verificar se deve atualizar senha (apenas se não permitir atualização)
      if (!allowPasswordUpdate && usuario.deve_atualizar_senha) {
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
      logger.error('Erro na verificação do token', { error: error.message });
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token inválido.' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado.' });
      }
      res.status(401).json({ error: 'Token inválido.' });
    }
  };
};

const requireAuth = createAuthMiddleware(false);
const requireAuthAllowPasswordUpdate = createAuthMiddleware(true);

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
    logger.error('Erro no middleware de admin', { error: error.message, stack: error.stack });
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
    logger.error('Erro no middleware de vistoriador', { error: error.message, stack: error.stack });
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};


module.exports = { requireAuth, requireAdmin, requireVistoriador, requireAuthAllowPasswordUpdate };