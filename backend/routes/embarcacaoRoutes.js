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
    console.log('=== ROTA GET /api/embarcacoes ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Nível de acesso:', req.user?.NivelAcesso?.nome);
    
    const embarcacoes = await Embarcacao.findAll({
      order: [['nome', 'ASC']]
    });
    
    console.log('Embarcações encontradas:', embarcacoes.length);
    console.log('Primeira embarcação:', embarcacoes[0]?.nome || 'Nenhuma');
    console.log('=== FIM ROTA GET /api/embarcacoes ===\n');
    
    res.json(embarcacoes);
  } catch (error) {
    console.error('Erro ao listar embarcações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/embarcacoes/:id - Buscar embarcação por ID
router.get('/:id', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/embarcacoes/:id ===');
    console.log('ID solicitado:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const embarcacao = await Embarcacao.findByPk(req.params.id);
    
    if (!embarcacao) {
      console.log('Embarcação não encontrada para ID:', req.params.id);
      console.log('=== FIM ROTA GET /api/embarcacoes/:id (404) ===\n');
      return res.status(404).json({ error: 'Embarcação não encontrada' });
    }
    
    console.log('Embarcação encontrada:', embarcacao.nome);
    console.log('=== FIM ROTA GET /api/embarcacoes/:id ===\n');
    res.json(embarcacao);
  } catch (error) {
    console.error('Erro ao buscar embarcação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/embarcacoes - Criar nova embarcação
router.post('/', async (req, res) => {
  try {
    console.log('=== ROTA POST /api/embarcacoes ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Dados recebidos:', req.body);
    
    const { nome, numero_casco, proprietario_nome, proprietario_email } = req.body;
    
    // Validações básicas
    if (!nome || !numero_casco) {
      console.log('Validação falhou - campos obrigatórios ausentes');
      console.log('=== FIM ROTA POST /api/embarcacoes (400) ===\n');
      return res.status(400).json({ error: 'Campos obrigatórios: nome, numero_casco' });
    }
    
    console.log('Criando embarcação:', nome);
    const embarcacao = await Embarcacao.create({
      nome,
      numero_casco,
      proprietario_nome: proprietario_nome || null,
      proprietario_email: proprietario_email || null
    });
    
    console.log('Embarcação criada com ID:', embarcacao.id);
    console.log('=== FIM ROTA POST /api/embarcacoes ===\n');
    res.status(201).json(embarcacao);
  } catch (error) {
    console.error('Erro ao criar embarcação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/embarcacoes/:id - Atualizar embarcação
router.put('/:id', async (req, res) => {
  try {
    console.log('=== ROTA PUT /api/embarcacoes/:id ===');
    console.log('ID da embarcação:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Dados recebidos para atualização:', req.body);
    
    const embarcacao = await Embarcacao.findByPk(req.params.id);
    
    if (!embarcacao) {
      console.log('Embarcação não encontrada para ID:', req.params.id);
      console.log('=== FIM ROTA PUT /api/embarcacoes/:id (404) ===\n');
      return res.status(404).json({ error: 'Embarcação não encontrada' });
    }
    
    console.log('Embarcação encontrada:', embarcacao.nome);
    console.log('Dados atuais:', {
      nome: embarcacao.nome,
      numero_casco: embarcacao.numero_casco,
      proprietario_nome: embarcacao.proprietario_nome,
      proprietario_email: embarcacao.proprietario_email
    });
    
    const { nome, numero_casco, proprietario_nome, proprietario_email } = req.body;
    
    console.log('Atualizando com dados:', {
      nome: nome || embarcacao.nome,
      numero_casco: numero_casco || embarcacao.numero_casco,
      proprietario_nome: proprietario_nome !== undefined ? proprietario_nome : embarcacao.proprietario_nome,
      proprietario_email: proprietario_email !== undefined ? proprietario_email : embarcacao.proprietario_email
    });
    
    await embarcacao.update({
      nome: nome || embarcacao.nome,
      numero_casco: numero_casco || embarcacao.numero_casco,
      proprietario_nome: proprietario_nome !== undefined ? proprietario_nome : embarcacao.proprietario_nome,
      proprietario_email: proprietario_email !== undefined ? proprietario_email : embarcacao.proprietario_email
    });
    
    console.log('Embarcação atualizada com sucesso');
    console.log('Dados finais:', {
      nome: embarcacao.nome,
      numero_casco: embarcacao.numero_casco,
      proprietario_nome: embarcacao.proprietario_nome,
      proprietario_email: embarcacao.proprietario_email
    });
    console.log('=== FIM ROTA PUT /api/embarcacoes/:id ===\n');
    
    res.json(embarcacao);
  } catch (error) {
    console.error('Erro ao atualizar embarcação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/embarcacoes/:id - Excluir embarcação
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== ROTA DELETE /api/embarcacoes/:id ===');
    console.log('ID da embarcação:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const embarcacao = await Embarcacao.findByPk(req.params.id);
    
    if (!embarcacao) {
      console.log('Embarcação não encontrada para ID:', req.params.id);
      console.log('=== FIM ROTA DELETE /api/embarcacoes/:id (404) ===\n');
      return res.status(404).json({ error: 'Embarcação não encontrada' });
    }
    
    console.log('Excluindo embarcação:', embarcacao.nome);
    await embarcacao.destroy();
    console.log('Embarcação excluída com sucesso');
    console.log('=== FIM ROTA DELETE /api/embarcacoes/:id ===\n');
    
    res.json({ message: 'Embarcação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir embarcação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
