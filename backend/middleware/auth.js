// backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const { Usuario, NivelAcesso } = require('../models');

// Middleware que verifica o token JWT
const requireAuth = async (req, res, next) => {
  try {
    console.log('=== MIDDLEWARE AUTH INICIADO ===');
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Token recebido:', token ? '[PRESENTE]' : '[AUSENTE]');
    
    if (!token) {
      console.log('Token não fornecido');
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-jwt');
    console.log('Token decodificado:', { userId: decoded.userId, email: decoded.email });
    
    // Buscar usuário no banco de dados
    console.log('Buscando usuário no banco com ID:', decoded.userId);
    const usuario = await Usuario.findByPk(decoded.userId, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      }
    });

    if (!usuario) {
      console.log('Usuário não encontrado no banco com ID:', decoded.userId);
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    console.log('Usuário encontrado:', {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      nivelAcesso: usuario.NivelAcesso?.nome,
      deveAtualizarSenha: usuario.deve_atualizar_senha
    });

    // Verificar se o usuário deve atualizar a senha
    if (usuario.deve_atualizar_senha) {
      console.log('Usuário deve atualizar senha');
      return res.status(403).json({ 
        error: 'Senha deve ser atualizada',
        code: 'PASSWORD_UPDATE_REQUIRED',
        message: 'Você deve atualizar sua senha antes de continuar'
      });
    }

    // Anexar informações do usuário à requisição
    req.user = usuario;
    req.userInfo = decoded;

    console.log('=== MIDDLEWARE AUTH CONCLUÍDO COM SUCESSO ===');
    next();
  } catch (error) {
    console.log('=== ERRO NO MIDDLEWARE AUTH ===');
    console.error("Erro na verificação do token:", error);
    console.log('=== FIM DO ERRO ===');
    res.status(401).json({ error: 'Token inválido.' });
  }
};

// Middleware que verifica se o usuário é um Administrador
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.NivelAcesso) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (req.user.NivelAcesso.id !== 1) { // ID 1 = ADMINISTRADOR
      return res.status(403).json({ error: 'Acesso negado. Permissão de administrador necessária.' });
    }

    next();
  } catch (error) {
    console.error("Erro no middleware de admin:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

// Middleware que verifica se o usuário é Vistoriador ou Administrador
const requireVistoriador = async (req, res, next) => {
  try {
    if (!req.user || !req.user.NivelAcesso) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const nivelId = req.user.NivelAcesso.id;
    if (nivelId !== 1 && nivelId !== 2) { // ID 1 = ADMINISTRADOR, ID 2 = VISTORIADOR
      return res.status(403).json({ error: 'Acesso negado. Permissão de vistoriador necessária.' });
    }

    next();
  } catch (error) {
    console.error("Erro no middleware de vistoriador:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

// Middleware que permite acesso mesmo quando deve atualizar senha
const requireAuthAllowPasswordUpdate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-jwt');
    
    // Buscar usuário no banco de dados
    const usuario = await Usuario.findByPk(decoded.userId, {
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    // Anexar informações do usuário à requisição (sem verificar deve_atualizar_senha)
    req.user = usuario;
    req.userInfo = decoded;

    next();
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    res.status(401).json({ error: 'Token inválido.' });
  }
};

module.exports = { requireAuth, requireAdmin, requireVistoriador, requireAuthAllowPasswordUpdate };