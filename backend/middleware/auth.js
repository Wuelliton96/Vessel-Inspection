// backend/middleware/auth.js

const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const { Usuario, NivelAcesso } = require('../models'); // Importamos os models

// Middleware do Clerk que verifica se o usuário está logado
// Ele injeta as informações do usuário em 'req.auth'
const requireAuth = ClerkExpressRequireAuth();

// Nosso middleware customizado que verifica se o usuário é um Administrador
const requireAdmin = async (req, res, next) => {
  try {
    // req.auth é preenchido pelo middleware 'requireAuth' que roda antes
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: 'Autenticação necessária.' });
    }

    const clerkUserId = req.auth.userId;

    // Buscamos o usuário no nosso banco de dados usando o ID do Clerk
    const usuario = await Usuario.findOne({
      where: { clerk_user_id: clerkUserId },
      // Incluímos a tabela NivelAcesso para já trazer o nome do papel
      include: {
        model: NivelAcesso,
        attributes: ['nome']
      }
    });

    // Se não encontrarmos o usuário no nosso DB ou o papel dele não for 'ADMINISTRADOR'
    if (!usuario || usuario.NivelAcesso.nome !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acesso negado. Permissão de administrador necessária.' });
    }

    // Se chegou até aqui, o usuário é um admin.
    // Anexamos o usuário do nosso banco à requisição para usá-lo depois
    req.user = usuario;

    // Permite que a requisição continue para a próxima etapa (a rota em si)
    next();

  } catch (error) {
    console.error("Erro no middleware de admin:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
};

module.exports = { requireAuth, requireAdmin };