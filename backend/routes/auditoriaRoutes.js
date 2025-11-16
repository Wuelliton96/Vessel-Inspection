const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Rota de teste simples SEM banco de dados
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Rota de auditoria funcionando!',
    timestamp: new Date()
  });
});

// Rota principal - SIMPLIFICADA ao máximo
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('[AUDITORIA] Requisição recebida');
    
    // Importar aqui dentro para evitar erros de inicialização
    const { AuditoriaLog } = require('../models');
    
    console.log('[AUDITORIA] Modelo carregado:', !!AuditoriaLog);
    
    // Consulta mais simples possível
    const logs = await AuditoriaLog.findAll({
      limit: 20,
      order: [['id', 'DESC']],
      raw: true
    });
    
    console.log('[AUDITORIA] Logs encontrados:', logs.length);
    
    res.json({
      logs: logs || [],
      pagination: {
        total: logs.length,
        page: 1,
        limit: 20,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('[AUDITORIA] ERRO COMPLETO:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      stack: error.stack
    });
  }
});

// Estatísticas - SIMPLIFICADA
router.get('/estatisticas', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { AuditoriaLog } = require('../models');
    
    const total = await AuditoriaLog.count();
    
    res.json({
      acoesPorTipo: [],
      acoesCriticas: 0,
      usuariosMaisAtivos: [],
      loginsFalhados: 0,
      operacoesBloqueadas: 0,
      totalAcoes: total
    });
  } catch (error) {
    console.error('[AUDITORIA] Erro em estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro interno',
      message: error.message 
    });
  }
});

module.exports = router;
