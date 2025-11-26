/**
 * Funções auxiliares para rotas
 * Reduz duplicação de código em arquivos de rotas
 */

/**
 * Handler padrão para erros em rotas
 */
function handleRouteError(error, res, message = 'Erro interno do servidor') {
  console.error(message, error);
  if (!res.headersSent) {
    res.status(500).json({ 
      error: message,
      ...(process.env.NODE_ENV !== 'production' && { details: error.message })
    });
  }
}

/**
 * Resposta padrão para recurso não encontrado
 */
function notFoundResponse(res, resourceName = 'Recurso') {
  if (!res.headersSent) {
    return res.status(404).json({ error: `${resourceName} não encontrado` });
  }
}

/**
 * Resposta padrão para validação falhada
 */
function validationErrorResponse(res, message) {
  if (!res.headersSent) {
    return res.status(400).json({ error: message });
  }
}

/**
 * Wrapper para rotas async com tratamento de erro padrão
 */
function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      handleRouteError(error, res);
    }
  };
}

/**
 * Log de início de rota
 */
function logRouteStart(method, path, req) {
  console.log(`=== ROTA ${method} ${path} ===`);
  if (req.user) {
    console.log('Usuário:', req.user.nome, '(ID:', req.user.id, ')');
    if (req.user.NivelAcesso) {
      console.log('Nível de acesso:', req.user.NivelAcesso.nome);
    }
  }
}

/**
 * Log de fim de rota
 */
function logRouteEnd(method, path, statusCode = 200) {
  console.log(`=== FIM ROTA ${method} ${path} (${statusCode}) ===\n`);
}

/**
 * Includes padrão para Vistoria
 */
function getVistoriaIncludes() {
  const { Embarcacao, Cliente, StatusVistoria, Local, Usuario } = require('../models');
  return [
    {
      model: Embarcacao,
      as: 'Embarcacao',
      include: [
        { model: Cliente, as: 'Cliente', required: false }
      ],
      required: false
    },
    { 
      model: StatusVistoria, 
      as: 'StatusVistoria',
      required: false
    },
    { 
      model: Local, 
      as: 'Local',
      required: false
    },
    {
      model: Usuario,
      as: 'vistoriador',
      attributes: ['id', 'nome', 'cpf'],
      required: false
    }
  ];
}

/**
 * Includes padrão para Laudo com Vistoria
 */
function getLaudoIncludes() {
  const { Vistoria } = require('../models');
  return [
    {
      model: Vistoria,
      as: 'Vistoria',
      include: getVistoriaIncludes(),
      required: false
    }
  ];
}

module.exports = {
  handleRouteError,
  notFoundResponse,
  validationErrorResponse,
  asyncHandler,
  logRouteStart,
  logRouteEnd,
  getVistoriaIncludes,
  getLaudoIncludes
};

