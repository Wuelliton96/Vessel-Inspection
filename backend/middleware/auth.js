const jwt = require('jsonwebtoken');
const { Usuario, NivelAcesso } = require('../models');

/**
 * Função auxiliar para verificar e decodificar token
 */
async function verificarToken(req, res) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    res.status(401).json({ error: 'Token não fornecido.' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-jwt');
    return decoded;
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    res.status(401).json({ error: 'Token inválido.' });
    return null;
  }
}

/**
 * Função auxiliar para buscar usuário pelo ID decodificado
 */
async function buscarUsuarioPorToken(decoded) {
  return await Usuario.findByPk(decoded.userId, {
    include: {
      model: NivelAcesso,
      attributes: ['id', 'nome', 'descricao']
    }
  });
}

const requireAuth = async (req, res, next) => {
  try {
    const decoded = await verificarToken(req, res);
    if (!decoded) return;

    const usuario = await buscarUsuarioPorToken(decoded);
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
    if (!res.headersSent) {
      res.status(401).json({ error: 'Token inválido.' });
    }
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
    if (!res.headersSent) {
      res.status(500).json({ error: "Erro interno do servidor." });
    }
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
    if (!res.headersSent) {
      res.status(500).json({ error: "Erro interno do servidor." });
    }
  }
};

const requireAuthAllowPasswordUpdate = async (req, res, next) => {
  try {
    const decoded = await verificarToken(req, res);
    if (!decoded) return;

    const usuario = await buscarUsuarioPorToken(decoded);
    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    req.user = usuario;
    req.userInfo = decoded;
    next();
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    if (!res.headersSent) {
      res.status(401).json({ error: 'Token inválido.' });
    }
  }
};

module.exports = { requireAuth, requireAdmin, requireVistoriador, requireAuthAllowPasswordUpdate };