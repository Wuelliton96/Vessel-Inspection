// backend/middleware/errorHandler.js
// Middleware centralizado para tratamento de erros
// Reduz duplicação de código de tratamento de erro

const logger = require('../utils/logger');

/**
 * Middleware de tratamento de erro centralizado
 * Captura erros de rotas e retorna respostas padronizadas
 */
const errorHandler = (err, req, res, next) => {
  // Log do erro
  logger.error('Erro na rota', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Erros do Sequelize
  if (err.name === 'SequelizeValidationError') {
    const mensagens = err.errors.map(e => e.message);
    return res.status(400).json({
      error: 'Erro de validação',
      details: mensagens
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      error: 'Violação de constraint única',
      message: 'Já existe um registro com esses dados'
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      error: 'Erro no banco de dados',
      message: 'Erro interno do servidor'
    });
  }

  // Erros de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado'
    });
  }

  // Erro genérico
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : err.message;

  res.status(statusCode).json({
    error: message
  });
};

/**
 * Wrapper para rotas async que captura erros automaticamente
 * Elimina necessidade de try/catch em cada rota
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  asyncHandler
};

