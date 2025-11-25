// backend/routes/embarcacaoRoutes.js

const express = require('express');
const router = express.Router();
const { Embarcacao, Seguradora, Cliente } = require('../models');
const { requireAuth, requireVistoriador } = require('../middleware/auth');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth, requireVistoriador);

// GET /api/embarcacoes - Listar todas as embarcações (com filtro opcional por CPF)
router.get('/', asyncHandler(async (req, res) => {
  logger.debug('GET /api/embarcacoes', { 
    userId: req.user?.id,
    nivelAcesso: req.user?.NivelAcesso?.nome,
    hasProprietarioCpf: !!req.query.proprietario_cpf
  });
  
  const { proprietario_cpf } = req.query;
  
  const whereClause = {};
  if (proprietario_cpf) {
    whereClause.proprietario_cpf = proprietario_cpf;
    logger.debug('Filtrando por CPF', { proprietario_cpf });
  }
  
  const embarcacoes = await Embarcacao.findAll({
    where: whereClause,
    include: [
      {
        model: Seguradora,
        as: 'Seguradora',
        attributes: ['id', 'nome', 'ativo']
      },
      {
        model: Cliente,
        as: 'Cliente',
        attributes: ['id', 'tipo_pessoa', 'nome', 'cpf', 'cnpj', 'telefone_e164', 'email', 'cidade', 'estado']
      }
    ],
    order: [['nome', 'ASC']]
  });
  
  logger.debug('Embarcações encontradas', { count: embarcacoes.length });
  res.json(embarcacoes);
}));

// GET /api/embarcacoes/:id - Buscar embarcação por ID
router.get('/:id', asyncHandler(async (req, res) => {
  logger.debug('GET /api/embarcacoes/:id', { 
    embarcacaoId: req.params.id,
    userId: req.user?.id 
  });
  
  const embarcacao = await Embarcacao.findByPk(req.params.id, {
    include: [
      {
        model: Seguradora,
        as: 'Seguradora',
        attributes: ['id', 'nome', 'ativo']
      },
      {
        model: Cliente,
        as: 'Cliente'
      }
    ]
  });
  
  if (!embarcacao) {
    logger.warn('Embarcação não encontrada', { embarcacaoId: req.params.id });
    return res.status(404).json({ error: 'Embarcação não encontrada' });
  }
  
  logger.debug('Embarcação encontrada', { embarcacaoId: embarcacao.id });
  res.json(embarcacao);
}));

// POST /api/embarcacoes - Criar nova embarcação
router.post('/', asyncHandler(async (req, res) => {
  logger.debug('POST /api/embarcacoes', { userId: req.user?.id });
  
  const { 
    nome, 
    nr_inscricao_barco, 
    cliente_id,
    tipo_embarcacao,
    porte,
    seguradora_id,
    valor_embarcacao,
    ano_fabricacao
  } = req.body;
  
  // Validações básicas
  if (!nome || !nr_inscricao_barco) {
    logger.warn('Validação falhou - campos obrigatórios ausentes');
    return res.status(400).json({ error: 'Campos obrigatórios: nome, nr_inscricao_barco' });
  }
  
  const embarcacao = await Embarcacao.create({
    nome,
    nr_inscricao_barco,
    cliente_id: cliente_id || null,
    tipo_embarcacao: tipo_embarcacao || null,
    porte: porte || null,
    seguradora_id: seguradora_id || null,
    valor_embarcacao: valor_embarcacao || null,
    ano_fabricacao: ano_fabricacao || null
  });
  
  logger.info('Embarcação criada', { embarcacaoId: embarcacao.id, nome });
  res.status(201).json(embarcacao);
}));

// PUT /api/embarcacoes/:id - Atualizar embarcação
router.put('/:id', asyncHandler(async (req, res) => {
  logger.debug('PUT /api/embarcacoes/:id', { 
    embarcacaoId: req.params.id,
    userId: req.user?.id 
  });
  
  const embarcacao = await Embarcacao.findByPk(req.params.id);
  
  if (!embarcacao) {
    logger.warn('Embarcação não encontrada para atualização', { embarcacaoId: req.params.id });
    return res.status(404).json({ error: 'Embarcação não encontrada' });
  }
  
  const { 
    nome, 
    nr_inscricao_barco, 
    cliente_id,
    tipo_embarcacao,
    porte,
    seguradora_id,
    valor_embarcacao,
    ano_fabricacao
  } = req.body;
  
  await embarcacao.update({
    nome: nome || embarcacao.nome,
    nr_inscricao_barco: nr_inscricao_barco || embarcacao.nr_inscricao_barco,
    cliente_id: cliente_id !== undefined ? cliente_id : embarcacao.cliente_id,
    tipo_embarcacao: tipo_embarcacao !== undefined ? tipo_embarcacao : embarcacao.tipo_embarcacao,
    porte: porte !== undefined ? porte : embarcacao.porte,
    seguradora_id: seguradora_id !== undefined ? seguradora_id : embarcacao.seguradora_id,
    valor_embarcacao: valor_embarcacao !== undefined ? valor_embarcacao : embarcacao.valor_embarcacao,
    ano_fabricacao: ano_fabricacao !== undefined ? ano_fabricacao : embarcacao.ano_fabricacao
  });
  
  // Recarregar com associações
  await embarcacao.reload({
    include: [
      {
        model: Seguradora,
        as: 'Seguradora',
        attributes: ['id', 'nome', 'ativo']
      },
      {
        model: Cliente,
        as: 'Cliente'
      }
    ]
  });
  
  logger.info('Embarcação atualizada', { embarcacaoId: embarcacao.id });
  res.json(embarcacao);
}));

// DELETE /api/embarcacoes/:id - Excluir embarcação
router.delete('/:id', asyncHandler(async (req, res) => {
  logger.debug('DELETE /api/embarcacoes/:id', { 
    embarcacaoId: req.params.id,
    userId: req.user?.id 
  });
  
  const embarcacao = await Embarcacao.findByPk(req.params.id);
  
  if (!embarcacao) {
    logger.warn('Embarcação não encontrada para exclusão', { embarcacaoId: req.params.id });
    return res.status(404).json({ error: 'Embarcação não encontrada' });
  }
  
  logger.info('Excluindo embarcação', { embarcacaoId: embarcacao.id });
  await embarcacao.destroy();
  logger.info('Embarcação excluída com sucesso', { embarcacaoId: embarcacao.id });
  
  res.json({ message: 'Embarcação excluída com sucesso' });
}));

module.exports = router;
