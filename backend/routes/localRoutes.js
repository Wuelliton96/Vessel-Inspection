// backend/routes/localRoutes.js

const express = require('express');
const router = express.Router();
const { Local } = require('../models');
const { requireAuth, requireVistoriador } = require('../middleware/auth');
const logger = require('../utils/logger');

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth, requireVistoriador);

// GET /api/locais - Listar todos os locais
router.get('/', async (req, res) => {
  try {
    logger.debug('GET /api/locais', { userId: req.user?.id });
    
    const locais = await Local.findAll({
      order: [['nome_local', 'ASC']]
    });
    
    logger.debug('Locais encontrados', { count: locais.length });
    
    res.json(locais);
  } catch (error) {
    logger.error('Erro ao listar locais', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/locais/:id - Buscar local por ID
router.get('/:id', async (req, res) => {
  try {
    logger.debug('GET /api/locais/:id', { localId: req.params.id, userId: req.user?.id });
    
    const local = await Local.findByPk(req.params.id);
    
    if (!local) {
      logger.warn('Local não encontrado', { localId: req.params.id });
      return res.status(404).json({ error: 'Local não encontrado' });
    }
    
    logger.debug('Local encontrado', { localId: local.id });
    res.json(local);
  } catch (error) {
    logger.error('Erro ao buscar local', { error: error.message, stack: error.stack, localId: req.params.id });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/locais - Criar novo local
router.post('/', async (req, res) => {
  try {
    logger.debug('POST /api/locais', { userId: req.user?.id });
    
    const { tipo, nome_local, cep, logradouro, numero, complemento, bairro, cidade, estado } = req.body;
    
    // Validações básicas
    if (!tipo) {
      logger.warn('Validação falhou - tipo é obrigatório');
      return res.status(400).json({ error: 'Campo obrigatório: tipo' });
    }
    
    const local = await Local.create({
      tipo,
      nome_local: nome_local || null,
      cep: cep || null,
      logradouro: logradouro || null,
      numero: numero || null,
      complemento: complemento || null,
      bairro: bairro || null,
      cidade: cidade || null,
      estado: estado || null
    });
    
    logger.info('Local criado', { localId: local.id, tipo });
    res.status(201).json(local);
  } catch (error) {
    logger.error('Erro ao criar local', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/locais/:id - Atualizar local
router.put('/:id', async (req, res) => {
  try {
    logger.debug('PUT /api/locais/:id', { localId: req.params.id, userId: req.user?.id });
    
    const local = await Local.findByPk(req.params.id);
    
    if (!local) {
      logger.warn('Local não encontrado para atualização', { localId: req.params.id });
      return res.status(404).json({ error: 'Local não encontrado' });
    }
    
    const { tipo, nome_local, cep, logradouro, numero, complemento, bairro, cidade, estado } = req.body;
    
    await local.update({
      tipo: tipo || local.tipo,
      nome_local: nome_local !== undefined ? nome_local : local.nome_local,
      cep: cep !== undefined ? cep : local.cep,
      logradouro: logradouro !== undefined ? logradouro : local.logradouro,
      numero: numero !== undefined ? numero : local.numero,
      complemento: complemento !== undefined ? complemento : local.complemento,
      bairro: bairro !== undefined ? bairro : local.bairro,
      cidade: cidade !== undefined ? cidade : local.cidade,
      estado: estado !== undefined ? estado : local.estado
    });
    
    logger.info('Local atualizado', { localId: local.id });
    res.json(local);
  } catch (error) {
    logger.error('Erro ao atualizar local', { error: error.message, stack: error.stack, localId: req.params.id });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/locais/:id - Excluir local
router.delete('/:id', async (req, res) => {
  try {
    logger.debug('DELETE /api/locais/:id', { localId: req.params.id, userId: req.user?.id });
    
    const local = await Local.findByPk(req.params.id);
    
    if (!local) {
      logger.warn('Local não encontrado para exclusão', { localId: req.params.id });
      return res.status(404).json({ error: 'Local não encontrado' });
    }
    
    logger.info('Excluindo local', { localId: local.id });
    await local.destroy();
    logger.info('Local excluído com sucesso', { localId: local.id });
    
    res.json({ message: 'Local excluído com sucesso' });
  } catch (error) {
    logger.error('Erro ao excluir local', { error: error.message, stack: error.stack, localId: req.params.id });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
