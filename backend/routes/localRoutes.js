// backend/routes/localRoutes.js

const express = require('express');
const router = express.Router();
const { Local } = require('../models');
const { requireAuth, requireVistoriador } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth, requireVistoriador);

// GET /api/locais - Listar todos os locais
router.get('/', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/locais ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Nível de acesso:', req.user?.NivelAcesso?.nome);
    
    const locais = await Local.findAll({
      order: [['nome_local', 'ASC']]
    });
    
    console.log('Locais encontrados:', locais.length);
    console.log('Primeiro local:', locais[0]?.nome_local || 'Nenhum');
    console.log('=== FIM ROTA GET /api/locais ===\n');
    
    res.json(locais);
  } catch (error) {
    console.error('Erro ao listar locais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/locais/:id - Buscar local por ID
router.get('/:id', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/locais/:id ===');
    console.log('ID solicitado:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const local = await Local.findByPk(req.params.id);
    
    if (!local) {
      console.log('Local não encontrado para ID:', req.params.id);
      console.log('=== FIM ROTA GET /api/locais/:id (404) ===\n');
      return res.status(404).json({ error: 'Local não encontrado' });
    }
    
    console.log('Local encontrado:', local.nome_local || local.tipo);
    console.log('=== FIM ROTA GET /api/locais/:id ===\n');
    res.json(local);
  } catch (error) {
    console.error('Erro ao buscar local:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/locais - Criar novo local
router.post('/', async (req, res) => {
  try {
    console.log('=== ROTA POST /api/locais ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Dados recebidos:', req.body);
    
    const { tipo, nome_local, cep, logradouro, numero, complemento, bairro, cidade, estado } = req.body;
    
    // Validações básicas
    if (!tipo) {
      console.log('Validação falhou - tipo é obrigatório');
      console.log('=== FIM ROTA POST /api/locais (400) ===\n');
      return res.status(400).json({ error: 'Campo obrigatório: tipo' });
    }
    
    console.log('Criando local:', nome_local || tipo);
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
    
    console.log('Local criado com ID:', local.id);
    console.log('=== FIM ROTA POST /api/locais ===\n');
    res.status(201).json(local);
  } catch (error) {
    console.error('Erro ao criar local:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/locais/:id - Atualizar local
router.put('/:id', async (req, res) => {
  try {
    console.log('=== ROTA PUT /api/locais/:id ===');
    console.log('ID do local:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Dados recebidos para atualização:', req.body);
    
    const local = await Local.findByPk(req.params.id);
    
    if (!local) {
      console.log('Local não encontrado para ID:', req.params.id);
      console.log('=== FIM ROTA PUT /api/locais/:id (404) ===\n');
      return res.status(404).json({ error: 'Local não encontrado' });
    }
    
    console.log('Local encontrado:', local.nome_local || local.tipo);
    console.log('Dados atuais:', {
      tipo: local.tipo,
      nome_local: local.nome_local,
      cep: local.cep,
      logradouro: local.logradouro,
      numero: local.numero,
      complemento: local.complemento,
      bairro: local.bairro,
      cidade: local.cidade,
      estado: local.estado
    });
    
    const { tipo, nome_local, cep, logradouro, numero, complemento, bairro, cidade, estado } = req.body;
    
    console.log('Atualizando com dados:', {
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
    
    console.log('Local atualizado com sucesso');
    console.log('Dados finais:', {
      tipo: local.tipo,
      nome_local: local.nome_local,
      cep: local.cep,
      logradouro: local.logradouro,
      numero: local.numero,
      complemento: local.complemento,
      bairro: local.bairro,
      cidade: local.cidade,
      estado: local.estado
    });
    console.log('=== FIM ROTA PUT /api/locais/:id ===\n');
    
    res.json(local);
  } catch (error) {
    console.error('Erro ao atualizar local:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/locais/:id - Excluir local
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== ROTA DELETE /api/locais/:id ===');
    console.log('ID do local:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const local = await Local.findByPk(req.params.id);
    
    if (!local) {
      console.log('Local não encontrado para ID:', req.params.id);
      console.log('=== FIM ROTA DELETE /api/locais/:id (404) ===\n');
      return res.status(404).json({ error: 'Local não encontrado' });
    }
    
    console.log('Excluindo local:', local.nome_local || local.tipo);
    await local.destroy();
    console.log('Local excluído com sucesso');
    console.log('=== FIM ROTA DELETE /api/locais/:id ===\n');
    
    res.json({ message: 'Local excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir local:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
