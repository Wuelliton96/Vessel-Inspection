// backend/routes/localRoutes.js

const express = require('express');
const router = express.Router();
const { Local } = require('../models');
const { requireAuth, syncUserAndGenerateToken, requireVistoriador } = require('../middleware/authComplete');

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth, syncUserAndGenerateToken, requireVistoriador);

// GET /api/locais - Listar todos os locais
router.get('/', async (req, res) => {
  try {
    const locais = await Local.findAll({
      order: [['nome', 'ASC']]
    });
    res.json(locais);
  } catch (error) {
    console.error('Erro ao listar locais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/locais/:id - Buscar local por ID
router.get('/:id', async (req, res) => {
  try {
    const local = await Local.findByPk(req.params.id);
    
    if (!local) {
      return res.status(404).json({ error: 'Local não encontrado' });
    }
    
    res.json(local);
  } catch (error) {
    console.error('Erro ao buscar local:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/locais - Criar novo local
router.post('/', async (req, res) => {
  try {
    const { nome, endereco, cidade, estado, cep, telefone, email, observacoes } = req.body;
    
    // Validações básicas
    if (!nome || !endereco || !cidade || !estado) {
      return res.status(400).json({ error: 'Campos obrigatórios: nome, endereco, cidade, estado' });
    }
    
    const local = await Local.create({
      nome,
      endereco,
      cidade,
      estado,
      cep: cep || null,
      telefone: telefone || null,
      email: email || null,
      observacoes: observacoes || null
    });
    
    res.status(201).json(local);
  } catch (error) {
    console.error('Erro ao criar local:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/locais/:id - Atualizar local
router.put('/:id', async (req, res) => {
  try {
    const local = await Local.findByPk(req.params.id);
    
    if (!local) {
      return res.status(404).json({ error: 'Local não encontrado' });
    }
    
    const { nome, endereco, cidade, estado, cep, telefone, email, observacoes } = req.body;
    
    await local.update({
      nome: nome || local.nome,
      endereco: endereco || local.endereco,
      cidade: cidade || local.cidade,
      estado: estado || local.estado,
      cep: cep !== undefined ? cep : local.cep,
      telefone: telefone !== undefined ? telefone : local.telefone,
      email: email !== undefined ? email : local.email,
      observacoes: observacoes !== undefined ? observacoes : local.observacoes
    });
    
    res.json(local);
  } catch (error) {
    console.error('Erro ao atualizar local:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/locais/:id - Excluir local
router.delete('/:id', async (req, res) => {
  try {
    const local = await Local.findByPk(req.params.id);
    
    if (!local) {
      return res.status(404).json({ error: 'Local não encontrado' });
    }
    
    await local.destroy();
    res.json({ message: 'Local excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir local:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
