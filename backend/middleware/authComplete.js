// backend/middleware/authComplete.js

const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const { Usuario, NivelAcesso } = require('../models');
const jwt = require('jsonwebtoken');

// Middleware do Clerk que verifica se o usuário está logado
const requireAuth = ClerkExpressRequireAuth();

// Middleware que sincroniza usuário do Clerk com nosso banco e gera token JWT
const syncUserAndGenerateToken = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: 'Autenticação necessária.' });
    }

    const clerkUserId = req.auth.userId;
    const clerkUser = req.auth;

    // Buscar ou criar usuário no nosso banco
    let usuario = await Usuario.findOne({
      where: { clerk_user_id: clerkUserId },
      include: {
        model: NivelAcesso,
        attributes: ['id', 'nome', 'descricao']
      }
    });

    // Se usuário não existe, criar com nível padrão (VISTORIADOR)
    if (!usuario) {
      const nivelVistoriador = await NivelAcesso.findOne({
        where: { nome: 'VISTORIADOR' }
      });

      if (!nivelVistoriador) {
        return res.status(500).json({ error: 'Nível de acesso padrão não encontrado.' });
      }

      usuario = await Usuario.create({
        clerk_user_id: clerkUserId,
        nome: clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || 'Usuário',
        email: clerkUser.emailAddresses[0]?.emailAddress,
        nivel_acesso_id: nivelVistoriador.id
      });

      // Recarregar com associações
      usuario = await Usuario.findByPk(usuario.id, {
        include: {
          model: NivelAcesso,
          attributes: ['id', 'nome', 'descricao']
        }
      });
    }

    // Gerar token JWT
    const tokenPayload = {
      userId: usuario.id,
      clerkUserId: clerkUserId,
      email: usuario.email,
      nome: usuario.nome,
      nivelAcesso: usuario.NivelAcesso.nome,
      nivelAcessoId: usuario.NivelAcesso.id
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET || 'sua-chave-secreta-jwt', {
      expiresIn: '24h'
    });

    // Anexar informações do usuário e token à requisição
    req.user = usuario;
    req.token = token;
    req.userInfo = tokenPayload;

    next();
  } catch (error) {
    console.error("Erro no middleware de sincronização:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

// Middleware que verifica se o usuário é Administrador
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.NivelAcesso) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    if (req.user.NivelAcesso.nome !== 'ADMINISTRADOR') {
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

    const nivel = req.user.NivelAcesso.nome;
    if (nivel !== 'VISTORIADOR' && nivel !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acesso negado. Permissão de vistoriador necessária.' });
    }

    next();
  } catch (error) {
    console.error("Erro no middleware de vistoriador:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

// Middleware que verifica token JWT (para uso em rotas específicas)
const verifyJWT = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta-jwt');
    req.userInfo = decoded;
    next();
  } catch (error) {
    console.error("Erro na verificação do token:", error);
    res.status(401).json({ error: 'Token inválido.' });
  }
};

module.exports = {
  requireAuth,
  syncUserAndGenerateToken,
  requireAdmin,
  requireVistoriador,
  verifyJWT
};
