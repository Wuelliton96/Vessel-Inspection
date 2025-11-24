// backend/routes/checklistRoutes.js

const express = require('express');
const router = express.Router();
const { 
  ChecklistTemplate, 
  ChecklistTemplateItem, 
  VistoriaChecklistItem,
  Vistoria,
  Embarcacao,
  Foto
} = require('../models');
const { requireAuth, requireAdmin, requireVistoriador } = require('../middleware/auth');

// ==========================================
// ROTAS DE TEMPLATES (Admin)
// ==========================================

// GET /api/checklists/templates - Listar templates
router.get('/templates', requireAuth, requireVistoriador, async (req, res) => {
  try {
    const templates = await ChecklistTemplate.findAll({
      include: [{
        model: ChecklistTemplateItem,
        as: 'itens',
        where: { ativo: true },
        required: false,
        order: [['ordem', 'ASC']]
      }],
      order: [['tipo_embarcacao', 'ASC']]
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/checklists/templates/:tipo_embarcacao - Buscar template por tipo
router.get('/templates/:tipo_embarcacao', requireAuth, requireVistoriador, async (req, res) => {
  try {
    const template = await ChecklistTemplate.findOne({
      where: { tipo_embarcacao: req.params.tipo_embarcacao },
      include: [{
        model: ChecklistTemplateItem,
        as: 'itens',
        where: { ativo: true },
        required: false,
        order: [['ordem', 'ASC']]
      }]
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Erro ao buscar template:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/checklists/templates - Criar template (Admin)
router.post('/templates', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { tipo_embarcacao, nome, descricao, itens } = req.body;
    
    if (!tipo_embarcacao || !nome) {
      return res.status(400).json({ error: 'Tipo e nome são obrigatórios' });
    }
    
    const template = await ChecklistTemplate.create({
      tipo_embarcacao,
      nome,
      descricao: descricao || null
    });
    
    // Criar itens se fornecidos
    if (itens && Array.isArray(itens)) {
      for (const item of itens) {
        await ChecklistTemplateItem.create({
          checklist_template_id: template.id,
          ordem: item.ordem,
          nome: item.nome,
          descricao: item.descricao || null,
          obrigatorio: item.obrigatorio !== false,
          permite_video: item.permite_video || false
        });
      }
    }
    
    // Recarregar com itens
    const templateCompleto = await ChecklistTemplate.findByPk(template.id, {
      include: [{ model: ChecklistTemplateItem, as: 'itens' }]
    });
    
    res.status(201).json(templateCompleto);
  } catch (error) {
    console.error('Erro ao criar template:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/checklists/templates/:id - Atualizar template (Admin)
router.put('/templates/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const template = await ChecklistTemplate.findByPk(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    const { nome, descricao, ativo } = req.body;
    
    await template.update({
      nome: nome || template.nome,
      descricao: descricao !== undefined ? descricao : template.descricao,
      ativo: ativo !== undefined ? ativo : template.ativo
    });
    
    res.json(template);
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==========================================
// ROTAS DE ITENS DE TEMPLATE (Admin)
// ==========================================

// POST /api/checklists/templates/:id/itens - Adicionar item ao template
router.post('/templates/:id/itens', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { ordem, nome, descricao, obrigatorio, permite_video } = req.body;
    
    const item = await ChecklistTemplateItem.create({
      checklist_template_id: req.params.id,
      ordem,
      nome,
      descricao: descricao || null,
      obrigatorio: obrigatorio !== false,
      permite_video: permite_video || false
    });
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Erro ao criar item:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/checklists/itens/:id - Atualizar item do template
router.put('/itens/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await ChecklistTemplateItem.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    
    const { ordem, nome, descricao, obrigatorio, permite_video, ativo } = req.body;
    
    await item.update({
      ordem: ordem !== undefined ? ordem : item.ordem,
      nome: nome || item.nome,
      descricao: descricao !== undefined ? descricao : item.descricao,
      obrigatorio: obrigatorio !== undefined ? obrigatorio : item.obrigatorio,
      permite_video: permite_video !== undefined ? permite_video : item.permite_video,
      ativo: ativo !== undefined ? ativo : item.ativo
    });
    
    res.json(item);
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/checklists/itens/:id - Excluir item do template
router.delete('/itens/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await ChecklistTemplateItem.findByPk(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    
    await item.destroy();
    res.json({ message: 'Item excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir item:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ==========================================
// ROTAS DE CHECKLIST DE VISTORIA
// ==========================================

// POST /api/checklists/vistoria/:vistoria_id/copiar-template
// Copia itens do template para a vistoria
router.post('/vistoria/:vistoria_id/copiar-template', requireAuth, requireVistoriador, async (req, res) => {
  try {
    const vistoria = await Vistoria.findByPk(req.params.vistoria_id, {
      include: [{ model: Embarcacao, as: 'Embarcacao' }]
    });
    
    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }
    
    const tipoEmbarcacao = vistoria.Embarcacao?.tipo_embarcacao;
    
    if (!tipoEmbarcacao) {
      return res.status(400).json({ error: 'Tipo de embarcação não definido' });
    }
    
    // Buscar template
    const template = await ChecklistTemplate.findOne({
      where: { tipo_embarcacao: tipoEmbarcacao },
      include: [{
        model: ChecklistTemplateItem,
        as: 'itens',
        where: { ativo: true },
        required: false,
        order: [['ordem', 'ASC']]
      }]
    });
    
    if (!template || !template.itens || template.itens.length === 0) {
      return res.status(404).json({ error: 'Template de checklist não encontrado para este tipo de embarcação' });
    }
    
    // Copiar itens para a vistoria
    const itensCopiados = [];
    for (const itemTemplate of template.itens) {
      const item = await VistoriaChecklistItem.create({
        vistoria_id: vistoria.id,
        template_item_id: itemTemplate.id,
        ordem: itemTemplate.ordem,
        nome: itemTemplate.nome,
        descricao: itemTemplate.descricao,
        obrigatorio: itemTemplate.obrigatorio,
        permite_video: itemTemplate.permite_video,
        status: 'PENDENTE'
      });
      itensCopiados.push(item);
    }
    
    res.status(201).json({
      message: `${itensCopiados.length} itens copiados para a vistoria`,
      itens: itensCopiados
    });
  } catch (error) {
    console.error('Erro ao copiar template:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/checklists/vistoria/:vistoria_id - Listar checklist da vistoria
router.get('/vistoria/:vistoria_id', requireAuth, requireVistoriador, async (req, res) => {
  try {
    console.log(`=== ROTA GET /api/checklists/vistoria/${req.params.vistoria_id} ===`);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const itens = await VistoriaChecklistItem.findAll({
      where: { vistoria_id: req.params.vistoria_id },
      include: [{
        model: Foto,
        as: 'foto',
        required: false,
        attributes: ['id', 'url_arquivo', 'observacao', 'created_at', 'vistoria_id']
      }],
      order: [['ordem', 'ASC']]
    });
    
    console.log(`Checklist da vistoria ${req.params.vistoria_id}: ${itens.length} itens`);
    
    // Adicionar url_completa para cada foto
    const { getFullPath } = require('../services/uploadService');
    const itensComUrlCompleta = itens.map(item => {
      const itemObj = item.toJSON();
      if (itemObj.foto) {
        itemObj.foto.url_completa = getFullPath(itemObj.foto.url_arquivo, parseInt(req.params.vistoria_id));
        console.log(`  Item "${itemObj.nome}" - Foto ID: ${itemObj.foto.id}, URL: ${itemObj.foto.url_completa}`);
      }
      return itemObj;
    });
    
    const itensComFoto = itensComUrlCompleta.filter(item => item.foto);
    console.log(`  Itens com foto: ${itensComFoto.length}`);
    console.log(`  Itens concluídos: ${itensComUrlCompleta.filter(i => i.status === 'CONCLUIDO').length}`);
    console.log(`=== FIM ROTA GET /api/checklists/vistoria/${req.params.vistoria_id} ===\n`);
    
    res.json(itensComUrlCompleta);
  } catch (error) {
    console.error('Erro ao listar checklist:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/checklists/vistoria/item/:id/status - Atualizar status do item
router.patch('/vistoria/item/:id/status', requireAuth, requireVistoriador, async (req, res) => {
  try {
    console.log('=== ROTA PATCH /api/checklists/vistoria/item/:id/status ===');
    console.log('Item ID:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Dados recebidos:', req.body);
    
    const item = await VistoriaChecklistItem.findByPk(req.params.id, {
      include: [
        {
          model: Vistoria,
          as: 'vistoria',
          attributes: ['id', 'vistoriador_id']
        }
      ]
    });
    
    if (!item) {
      console.log('Item não encontrado');
      console.log('=== FIM ROTA PATCH (404) ===\n');
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    
    // Verificar se o vistoriador pode atualizar este item
    const isAdmin = req.user.NivelAcesso?.id === 1;
    const isOwner = item.vistoria?.vistoriador_id === req.user.id;
    
    if (!isAdmin && !isOwner) {
      console.log('Acesso negado - usuário não é admin nem dono da vistoria');
      console.log('Vistoria vistoriador_id:', item.vistoria?.vistoriador_id);
      console.log('Usuário ID:', req.user.id);
      console.log('=== FIM ROTA PATCH (403) ===\n');
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para atualizar este item.' });
    }
    
    const { status, foto_id, observacao } = req.body;
    
    console.log('Atualizando item com:');
    console.log('  - status:', status);
    console.log('  - foto_id:', foto_id);
    console.log('  - observacao:', observacao);
    
    const updateData = {};
    if (status) {
      updateData.status = status;
      // Se está marcando como CONCLUIDO, definir concluido_em
      if (status === 'CONCLUIDO') {
        updateData.concluido_em = new Date();
      } else if (status === 'PENDENTE') {
        // Se está voltando para PENDENTE, limpar concluido_em
        updateData.concluido_em = null;
      }
    }
    if (foto_id !== undefined) {
      updateData.foto_id = foto_id;
    }
    // Se status é CONCLUIDO e foto_id não foi fornecido, limpar foto_id (concluir sem foto)
    if (status === 'CONCLUIDO' && foto_id === undefined) {
      updateData.foto_id = null;
    }
    if (observacao !== undefined) {
      updateData.observacao = observacao;
    }
    
    console.log('Dados para atualização:', updateData);
    
    await item.update(updateData);
    
    // Recarregar item atualizado
    await item.reload();
    
    console.log('Item atualizado com sucesso:');
    console.log('  - ID:', item.id);
    console.log('  - Status:', item.status);
    console.log('  - Foto ID:', item.foto_id);
    console.log('  - Concluído em:', item.concluido_em);
    console.log('=== FIM ROTA PATCH (200) ===\n');
    
    res.json(item);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    console.error('Stack:', error.stack);
    console.log('=== FIM ROTA PATCH (500) ===\n');
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// POST /api/checklists/vistoria/:vistoria_id/itens - Adicionar item customizado
router.post('/vistoria/:vistoria_id/itens', requireAuth, requireVistoriador, async (req, res) => {
  try {
    const { ordem, nome, descricao, obrigatorio } = req.body;
    
    const item = await VistoriaChecklistItem.create({
      vistoria_id: req.params.vistoria_id,
      ordem,
      nome,
      descricao: descricao || null,
      obrigatorio: obrigatorio !== false,
      permite_video: false,
      status: 'PENDENTE'
    });
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Erro ao criar item:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/checklists/vistoria/:vistoria_id/progresso - Obter progresso do checklist
router.get('/vistoria/:vistoria_id/progresso', requireAuth, requireVistoriador, async (req, res) => {
  try {
    const itens = await VistoriaChecklistItem.findAll({
      where: { vistoria_id: req.params.vistoria_id },
      attributes: ['status', 'obrigatorio']
    });
    
    const total = itens.length;
    const concluidos = itens.filter(i => i.status === 'CONCLUIDO').length;
    const pendentes = itens.filter(i => i.status === 'PENDENTE').length;
    const naoAplicaveis = itens.filter(i => i.status === 'NAO_APLICAVEL').length;
    const obrigatoriosPendentes = itens.filter(i => i.obrigatorio && i.status === 'PENDENTE').length;
    
    const percentual = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    const podeAprovar = obrigatoriosPendentes === 0;
    
    res.json({
      total,
      concluidos,
      pendentes,
      naoAplicaveis,
      obrigatoriosPendentes,
      percentual,
      podeAprovar
    });
  } catch (error) {
    console.error('Erro ao calcular progresso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

