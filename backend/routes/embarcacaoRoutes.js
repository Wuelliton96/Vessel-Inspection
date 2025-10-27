// backend/routes/embarcacaoRoutes.js

const express = require('express');
const router = express.Router();
const { Embarcacao } = require('../models');
const { requireAuth, requireVistoriador } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth, requireVistoriador);

// GET /api/embarcacoes - Listar todas as embarcações
router.get('/', async (req, res) => {
  try {
    const embarcacoes = await Embarcacao.findAll({
      order: [['nome', 'ASC']]
    });
    res.json(embarcacoes);
  } catch (error) {
    console.error('Erro ao listar embarcações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/embarcacoes/:id - Buscar embarcação por ID
router.get('/:id', async (req, res) => {
  try {
    const embarcacao = await Embarcacao.findByPk(req.params.id);
    
    if (!embarcacao) {
      return res.status(404).json({ error: 'Embarcação não encontrada' });
    }
    
    res.json(embarcacao);
  } catch (error) {
    console.error('Erro ao buscar embarcação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/embarcacoes - Criar nova embarcação
router.post('/', async (req, res) => {
  try {
    const { nome, tipo, comprimento, largura, altura, proprietario, telefone, email } = req.body;
    
    // Validações básicas
    if (!nome || !tipo || !comprimento || !largura || !altura || !proprietario) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, tipo, comprimento, largura, altura, proprietario' });
    }
    
    const embarcacao = await Embarcacao.create({
      nome,
      tipo,
      comprimento: parseFloat(comprimento),
      largura: parseFloat(largura),
      altura: parseFloat(altura),
      proprietario,
      telefone: telefone || null,
      email: email || null
    });
    
    res.status(201).json(embarcacao);
  } catch (error) {
    console.error('Erro ao criar embarcação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/embarcacoes/:id - Atualizar embarcação
router.put('/:id', async (req, res) => {
  try {
    const embarcacao = await Embarcacao.findByPk(req.params.id);
    
    if (!embarcacao) {
      return res.status(404).json({ error: 'Embarcação não encontrada' });
    }
    
    const { nome, tipo, comprimento, largura, altura, proprietario, telefone, email } = req.body;
    
    await embarcacao.update({
      nome: nome || embarcacao.nome,
      tipo: tipo || embarcacao.tipo,
      comprimento: comprimento ? parseFloat(comprimento) : embarcacao.comprimento,
      largura: largura ? parseFloat(largura) : embarcacao.largura,
      altura: altura ? parseFloat(altura) : embarcacao.altura,
      proprietario: proprietario || embarcacao.proprietario,
      telefone: telefone !== undefined ? telefone : embarcacao.telefone,
      email: email !== undefined ? email : embarcacao.email
    });
    
    res.json(embarcacao);
  } catch (error) {
    console.error('Erro ao atualizar embarcação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/embarcacoes/:id - Excluir embarcação
router.delete('/:id', async (req, res) => {
  try {
    const embarcacao = await Embarcacao.findByPk(req.params.id);
    
    if (!embarcacao) {
      return res.status(404).json({ error: 'Embarcação não encontrada' });
    }
    
    await embarcacao.destroy();
    res.json({ message: 'Embarcação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir embarcação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
