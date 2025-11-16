const { AuditoriaLog } = require('../models');

/**
 * Função auxiliar para registrar ações de auditoria
 * @param {Object} params - Parâmetros da auditoria
 * @param {Object} params.req - Objeto de requisição do Express
 * @param {string} params.acao - Tipo de ação (CREATE, UPDATE, DELETE, etc)
 * @param {string} params.entidade - Nome da entidade afetada
 * @param {number} params.entidadeId - ID da entidade afetada
 * @param {Object} params.dadosAnteriores - Dados antes da modificação
 * @param {Object} params.dadosNovos - Dados após a modificação
 * @param {boolean} params.nivelCritico - Se é uma ação crítica
 * @param {string} params.detalhes - Detalhes adicionais
 */
async function registrarAuditoria({ 
  req, 
  acao, 
  entidade, 
  entidadeId = null, 
  dadosAnteriores = null, 
  dadosNovos = null, 
  nivelCritico = false, 
  detalhes = null 
}) {
  try {
    const usuario = req.user || {};
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    const userAgent = req.get('user-agent');

    // Remover dados sensíveis antes de salvar
    const sanitizeDados = (dados) => {
      if (!dados) return null;
      const sanitized = { ...dados };
      delete sanitized.senha_hash;
      delete sanitized.senha;
      delete sanitized.password;
      return JSON.stringify(sanitized);
    };

    await AuditoriaLog.create({
      usuario_id: usuario.id || null,
      usuario_email: usuario.email || 'sistema',
      usuario_nome: usuario.nome || 'Sistema',
      acao,
      entidade,
      entidade_id: entidadeId,
      dados_anteriores: sanitizeDados(dadosAnteriores),
      dados_novos: sanitizeDados(dadosNovos),
      ip_address: ip,
      user_agent: userAgent,
      nivel_critico: nivelCritico,
      detalhes
    });

    console.log(`[AUDITORIA] ${acao} em ${entidade} (ID: ${entidadeId}) por ${usuario.email || 'sistema'}`);
  } catch (error) {
    // Não deixar erro de auditoria quebrar a aplicação
    console.error('[AUDITORIA] Erro ao registrar auditoria:', error);
  }
}

/**
 * Middleware para auditoria automática de ações críticas
 * Usar após requireAuth para capturar informações do usuário
 */
const auditoriaMiddleware = (acao, entidade, options = {}) => {
  return async (req, res, next) => {
    // Armazenar método original de response para interceptar
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Flag para garantir que auditoria seja registrada apenas uma vez
    let auditoriaRegistrada = false;

    const registrar = async (statusCode) => {
      if (auditoriaRegistrada) return;
      auditoriaRegistrada = true;

      // Só registrar se a operação foi bem sucedida
      if (statusCode >= 200 && statusCode < 300) {
        const entidadeId = req.params.id || req.body.id || null;
        
        await registrarAuditoria({
          req,
          acao,
          entidade,
          entidadeId,
          dadosAnteriores: options.dadosAnteriores || req.originalData,
          dadosNovos: options.dadosNovos || req.body,
          nivelCritico: options.nivelCritico || false,
          detalhes: options.detalhes || null
        });
      }
    };

    // Interceptar res.json
    res.json = function(data) {
      registrar(res.statusCode);
      return originalJson(data);
    };

    // Interceptar res.send
    res.send = function(data) {
      registrar(res.statusCode);
      return originalSend(data);
    };

    next();
  };
};

/**
 * Middleware para salvar dados originais antes da modificação
 * Útil para UPDATE e DELETE
 */
const salvarDadosOriginais = (Model) => {
  return async (req, res, next) => {
    try {
      const id = req.params.id;
      if (id) {
        const registro = await Model.findByPk(id);
        if (registro) {
          req.originalData = registro.toJSON();
        }
      }
      next();
    } catch (error) {
      console.error('[AUDITORIA] Erro ao salvar dados originais:', error);
      next();
    }
  };
};

module.exports = {
  registrarAuditoria,
  auditoriaMiddleware,
  salvarDadosOriginais
};

