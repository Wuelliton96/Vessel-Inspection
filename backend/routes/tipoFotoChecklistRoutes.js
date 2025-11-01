// backend/routes/tipoFotoChecklistRoutes.js
const express = require('express');
const router = express.Router();
const { TipoFotoChecklist } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth, requireAdmin);

// GET /api/tipos-foto-checklist - Listar todos os tipos de foto
router.get('/', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/tipos-foto-checklist ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const tipos = await TipoFotoChecklist.findAll({
      order: [['codigo', 'ASC']]
    });
    
    console.log('Tipos encontrados:', tipos.length);
    console.log('=== FIM ROTA GET /api/tipos-foto-checklist ===\n');
    
    res.json(tipos);
  } catch (error) {
    console.error('Erro ao listar tipos de foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/tipos-foto-checklist/:id - Buscar tipo por ID
router.get('/:id', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/tipos-foto-checklist/:id ===');
    console.log('ID solicitado:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const tipo = await TipoFotoChecklist.findByPk(req.params.id);
    
    if (!tipo) {
      console.log('Tipo não encontrado para ID:', req.params.id);
      console.log('=== FIM ROTA GET /api/tipos-foto-checklist/:id (404) ===\n');
      return res.status(404).json({ error: 'Tipo de foto não encontrado' });
    }
    
    console.log('Tipo encontrado:', tipo.codigo);
    console.log('=== FIM ROTA GET /api/tipos-foto-checklist/:id ===\n');
    res.json(tipo);
  } catch (error) {
    console.error('Erro ao buscar tipo de foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/tipos-foto-checklist - Criar novo tipo de foto
router.post('/', async (req, res) => {
  try {
    console.log('=== ROTA POST /api/tipos-foto-checklist ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Dados recebidos:', req.body);
    
    const { codigo, nome_exibicao, descricao, obrigatorio } = req.body;
    
    // Validações básicas
    if (!codigo || !nome_exibicao) {
      console.log('Validação falhou - campos obrigatórios ausentes');
      console.log('=== FIM ROTA POST /api/tipos-foto-checklist (400) ===\n');
      return res.status(400).json({ error: 'Código e nome de exibição são obrigatórios' });
    }
    
    console.log('Criando tipo de foto:', codigo);
    const tipo = await TipoFotoChecklist.create({
      codigo,
      nome_exibicao,
      descricao: descricao || null,
      obrigatorio: obrigatorio !== undefined ? obrigatorio : true
    });
    
    console.log('Tipo criado com ID:', tipo.id);
    console.log('=== FIM ROTA POST /api/tipos-foto-checklist ===\n');
    res.status(201).json(tipo);
  } catch (error) {
    console.error('Erro ao criar tipo de foto:', error);
    
    // Verificar se é erro de código duplicado
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Código já existe' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/tipos-foto-checklist/:id - Atualizar tipo de foto
router.put('/:id', async (req, res) => {
  try {
    console.log('=== ROTA PUT /api/tipos-foto-checklist/:id ===');
    console.log('ID do tipo:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Dados recebidos para atualização:', req.body);
    
    const tipo = await TipoFotoChecklist.findByPk(req.params.id);
    
    if (!tipo) {
      console.log('Tipo não encontrado para ID:', req.params.id);
      console.log('=== FIM ROTA PUT /api/tipos-foto-checklist/:id (404) ===\n');
      return res.status(404).json({ error: 'Tipo de foto não encontrado' });
    }
    
    const { codigo, nome_exibicao, descricao, obrigatorio } = req.body;
    
    console.log('Atualizando tipo:', tipo.codigo);
    await tipo.update({
      codigo: codigo || tipo.codigo,
      nome_exibicao: nome_exibicao || tipo.nome_exibicao,
      descricao: descricao !== undefined ? descricao : tipo.descricao,
      obrigatorio: obrigatorio !== undefined ? obrigatorio : tipo.obrigatorio
    });
    
    console.log('Tipo atualizado com sucesso');
    console.log('=== FIM ROTA PUT /api/tipos-foto-checklist/:id ===\n');
    
    res.json(tipo);
  } catch (error) {
    console.error('Erro ao atualizar tipo de foto:', error);
    
    // Verificar se é erro de código duplicado
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Código já existe' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/tipos-foto-checklist/:id - Excluir tipo de foto
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== ROTA DELETE /api/tipos-foto-checklist/:id ===');
    console.log('ID do tipo:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const tipo = await TipoFotoChecklist.findByPk(req.params.id);
    
    if (!tipo) {
      console.log('Tipo não encontrado para ID:', req.params.id);
      console.log('=== FIM ROTA DELETE /api/tipos-foto-checklist/:id (404) ===\n');
      return res.status(404).json({ error: 'Tipo de foto não encontrado' });
    }
    
    console.log('Excluindo tipo:', tipo.codigo);
    await tipo.destroy();
    
    console.log('Tipo excluído com sucesso');
    console.log('=== FIM ROTA DELETE /api/tipos-foto-checklist/:id ===\n');
    
    res.json({ message: 'Tipo de foto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tipo de foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

