// backend/routes/seguradoraRoutes.js

const express = require('express');
const router = express.Router();
const { Seguradora, SeguradoraTipoEmbarcacao } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth);

// GET /api/seguradoras - Listar todas as seguradoras (todos podem ver)
router.get('/', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/seguradoras ===');
    console.log('Usuário:', req.user?.nome);
    
    const { ativo } = req.query;
    
    const whereClause = {};
    if (ativo !== undefined) {
      whereClause.ativo = ativo === 'true';
    }
    
    const seguradoras = await Seguradora.findAll({
      where: whereClause,
      include: [
        {
          model: SeguradoraTipoEmbarcacao,
          as: 'tiposPermitidos',
          attributes: ['id', 'tipo_embarcacao']
        }
      ],
      order: [['nome', 'ASC']]
    });
    
    console.log('Seguradoras encontradas:', seguradoras.length);
    console.log('=== FIM ROTA GET /api/seguradoras ===\n');
    
    res.json(seguradoras);
  } catch (error) {
    console.error('Erro ao listar seguradoras:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/seguradoras/:id - Buscar seguradora por ID
router.get('/:id', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/seguradoras/:id ===');
    console.log('ID solicitado:', req.params.id);
    
    const seguradora = await Seguradora.findByPk(req.params.id, {
      include: [
        {
          model: SeguradoraTipoEmbarcacao,
          as: 'tiposPermitidos',
          attributes: ['id', 'tipo_embarcacao']
        }
      ]
    });
    
    if (!seguradora) {
      console.log('Seguradora não encontrada para ID:', req.params.id);
      return res.status(404).json({ error: 'Seguradora não encontrada' });
    }
    
    console.log('Seguradora encontrada:', seguradora.nome);
    res.json(seguradora);
  } catch (error) {
    console.error('Erro ao buscar seguradora:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/seguradoras/:id/tipos-permitidos - Buscar tipos permitidos de uma seguradora
router.get('/:id/tipos-permitidos', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/seguradoras/:id/tipos-permitidos ===');
    
    const tipos = await SeguradoraTipoEmbarcacao.findAll({
      where: { seguradora_id: req.params.id },
      attributes: ['tipo_embarcacao']
    });
    
    const tiposArray = tipos.map(t => t.tipo_embarcacao);
    
    console.log('Tipos permitidos:', tiposArray);
    res.json(tiposArray);
  } catch (error) {
    console.error('Erro ao buscar tipos permitidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/seguradoras - Criar nova seguradora (apenas admin)
router.post('/', requireAdmin, async (req, res) => {
  try {
    console.log('=== ROTA POST /api/seguradoras ===');
    console.log('Dados recebidos:', req.body);
    
    const { nome, ativo, tipos_permitidos } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    // Criar seguradora
    const seguradora = await Seguradora.create({
      nome,
      ativo: ativo !== undefined ? ativo : true
    });
    
    // Se tipos permitidos foram fornecidos, criar relacionamentos
    if (tipos_permitidos && Array.isArray(tipos_permitidos) && tipos_permitidos.length > 0) {
      const tiposParaCriar = tipos_permitidos.map(tipo => ({
        seguradora_id: seguradora.id,
        tipo_embarcacao: tipo
      }));
      
      await SeguradoraTipoEmbarcacao.bulkCreate(tiposParaCriar);
    }
    
    // Buscar seguradora completa com tipos
    const seguradoraCompleta = await Seguradora.findByPk(seguradora.id, {
      include: [
        {
          model: SeguradoraTipoEmbarcacao,
          as: 'tiposPermitidos',
          attributes: ['id', 'tipo_embarcacao']
        }
      ]
    });
    
    console.log('Seguradora criada:', seguradoraCompleta.id);
    res.status(201).json(seguradoraCompleta);
  } catch (error) {
    console.error('Erro ao criar seguradora:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Já existe uma seguradora com este nome' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/seguradoras/:id - Atualizar seguradora (apenas admin)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    console.log('=== ROTA PUT /api/seguradoras/:id ===');
    console.log('ID:', req.params.id);
    console.log('Dados recebidos:', req.body);
    
    const seguradora = await Seguradora.findByPk(req.params.id);
    
    if (!seguradora) {
      return res.status(404).json({ error: 'Seguradora não encontrada' });
    }
    
    const { nome, ativo, tipos_permitidos } = req.body;
    
    // Atualizar dados básicos
    if (nome !== undefined) seguradora.nome = nome;
    if (ativo !== undefined) seguradora.ativo = ativo;
    
    await seguradora.save();
    
    // Se tipos permitidos foram fornecidos, atualizar
    if (tipos_permitidos && Array.isArray(tipos_permitidos)) {
      // Remover tipos antigos
      await SeguradoraTipoEmbarcacao.destroy({
        where: { seguradora_id: seguradora.id }
      });
      
      // Criar novos tipos
      if (tipos_permitidos.length > 0) {
        const tiposParaCriar = tipos_permitidos.map(tipo => ({
          seguradora_id: seguradora.id,
          tipo_embarcacao: tipo
        }));
        
        await SeguradoraTipoEmbarcacao.bulkCreate(tiposParaCriar);
      }
    }
    
    // Buscar seguradora completa atualizada
    const seguradoraAtualizada = await Seguradora.findByPk(seguradora.id, {
      include: [
        {
          model: SeguradoraTipoEmbarcacao,
          as: 'tiposPermitidos',
          attributes: ['id', 'tipo_embarcacao']
        }
      ]
    });
    
    console.log('Seguradora atualizada com sucesso');
    res.json(seguradoraAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar seguradora:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Já existe uma seguradora com este nome' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/seguradoras/:id - Excluir seguradora (apenas admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    console.log('=== ROTA DELETE /api/seguradoras/:id ===');
    console.log('ID:', req.params.id);
    
    const seguradora = await Seguradora.findByPk(req.params.id);
    
    if (!seguradora) {
      return res.status(404).json({ error: 'Seguradora não encontrada' });
    }
    
    await seguradora.destroy();
    
    console.log('Seguradora excluída com sucesso');
    res.json({ message: 'Seguradora excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir seguradora:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/seguradoras/:id/toggle-status - Ativar/Desativar seguradora (apenas admin)
router.patch('/:id/toggle-status', requireAdmin, async (req, res) => {
  try {
    console.log('=== ROTA PATCH /api/seguradoras/:id/toggle-status ===');
    
    const seguradora = await Seguradora.findByPk(req.params.id);
    
    if (!seguradora) {
      return res.status(404).json({ error: 'Seguradora não encontrada' });
    }
    
    seguradora.ativo = !seguradora.ativo;
    await seguradora.save();
    
    console.log('Status alterado para:', seguradora.ativo);
    res.json(seguradora);
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;


