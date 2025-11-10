// backend/routes/vistoriadorRoutes.js
const express = require('express');
const router = express.Router();
const { Vistoria, Embarcacao, Local, StatusVistoria, Usuario, Foto, TipoFotoChecklist, Cliente } = require('../models');
const { requireAuth, requireVistoriador } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth, requireVistoriador);

// GET /api/vistoriador/vistorias - Vistorias atribuídas ao vistoriador logado
router.get('/vistorias', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/vistoriador/vistorias ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Nível de acesso:', req.user?.NivelAcesso?.nome);
    
    const vistorias = await Vistoria.findAll({
      where: {
        vistoriador_id: req.user.id
      },
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log('Vistorias encontradas:', vistorias.length);
    console.log('=== FIM ROTA GET /api/vistoriador/vistorias ===\n');
    
    res.json(vistorias);
  } catch (error) {
    console.error('Erro ao buscar vistorias do vistoriador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/vistoriador/vistorias/:id - Buscar vistoria específica com fotos
router.get('/vistorias/:id', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/vistoriador/vistorias/:id ===');
    console.log('ID da vistoria:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const vistoria = await Vistoria.findByPk(req.params.id, {
      include: [
        { 
          model: Embarcacao, 
          as: 'Embarcacao',
          include: [
            { model: Cliente, as: 'Cliente' }
          ]
        },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome', 'email'] },
        { 
          model: Foto, 
          as: 'Fotos',
          include: [
            { model: TipoFotoChecklist, as: 'TipoFotoChecklist' }
          ]
        }
      ]
    });
    
    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }
    
    // Verificar se o vistoriador pode acessar esta vistoria
    if (vistoria.vistoriador_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    console.log('Vistoria encontrada:', vistoria.id);
    console.log('Fotos encontradas:', vistoria.Fotos?.length || 0);
    console.log('=== FIM ROTA GET /api/vistoriador/vistorias/:id ===\n');
    
    res.json(vistoria);
  } catch (error) {
    console.error('Erro ao buscar vistoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/vistoriador/tipos-foto-checklist - Listar tipos de foto para checklist
router.get('/tipos-foto-checklist', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/vistoriador/tipos-foto-checklist ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const tipos = await TipoFotoChecklist.findAll({
      order: [['codigo', 'ASC']]
    });
    
    console.log('Tipos encontrados:', tipos.length);
    console.log('=== FIM ROTA GET /api/vistoriador/tipos-foto-checklist ===\n');
    
    res.json(tipos);
  } catch (error) {
    console.error('Erro ao listar tipos de foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/vistoriador/vistorias/:id/iniciar - Iniciar vistoria
router.put('/vistorias/:id/iniciar', async (req, res) => {
  try {
    console.log('=== ROTA PUT /api/vistoriador/vistorias/:id/iniciar ===');
    console.log('ID da vistoria:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const vistoria = await Vistoria.findByPk(req.params.id);
    
    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }
    
    // Verificar se o vistoriador pode iniciar esta vistoria
    if (vistoria.vistoriador_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Verificar se a vistoria já foi iniciada
    if (vistoria.data_inicio) {
      return res.status(400).json({ error: 'Esta vistoria já foi iniciada' });
    }
    
    // Buscar status PENDENTE e EM_ANDAMENTO
    const statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    const statusEmAndamento = await StatusVistoria.findOne({ where: { nome: 'EM_ANDAMENTO' } });
    
    if (!statusPendente || !statusEmAndamento) {
      return res.status(500).json({ error: 'Status de vistoria não encontrados no sistema' });
    }
    
    // Verificar se o status permite iniciar (deve estar PENDENTE)
    if (vistoria.status_id !== statusPendente.id) {
      return res.status(400).json({ error: 'Esta vistoria não pode ser iniciada no status atual' });
    }
    
    // Atualizar vistoria: definir data de início e mudar status para EM_ANDAMENTO
    await vistoria.update({
      data_inicio: new Date(),
      status_id: statusEmAndamento.id
    });
    
    // Recarregar com associações
    await vistoria.reload({
      include: [
        { 
          model: Embarcacao, 
          as: 'Embarcacao',
          include: [
            { model: Cliente, as: 'Cliente' }
          ]
        },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome', 'email'] }
      ]
    });
    
    console.log('Vistoria iniciada com sucesso:', vistoria.id);
    console.log('Data de início:', vistoria.data_inicio);
    console.log('=== FIM ROTA PUT /api/vistoriador/vistorias/:id/iniciar ===\n');
    
    res.json({
      message: 'Vistoria iniciada com sucesso',
      vistoria: vistoria,
      data_inicio: vistoria.data_inicio
    });
  } catch (error) {
    console.error('Erro ao iniciar vistoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/vistoriador/vistorias/:id/status - Atualizar status da vistoria
router.put('/vistorias/:id/status', async (req, res) => {
  try {
    console.log('=== ROTA PUT /api/vistoriador/vistorias/:id/status ===');
    console.log('ID da vistoria:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Dados recebidos:', req.body);
    
    const { 
      status_id, 
      dados_rascunho, 
      valor_embarcacao, 
      valor_vistoria, 
      valor_vistoriador,
      contato_acompanhante_tipo,
      contato_acompanhante_nome,
      contato_acompanhante_telefone_e164,
      contato_acompanhante_email
    } = req.body;
    
    const vistoria = await Vistoria.findByPk(req.params.id);
    
    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }
    
    // Verificar se o vistoriador pode atualizar esta vistoria
    if (vistoria.vistoriador_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Atualizar dados da vistoria
    const updateData = {};
    if (status_id !== undefined) {
      updateData.status_id = status_id;
    }
    if (dados_rascunho !== undefined) {
      updateData.dados_rascunho = dados_rascunho;
    }
    if (valor_embarcacao !== undefined) {
      updateData.valor_embarcacao = valor_embarcacao;
    }
    if (valor_vistoria !== undefined) {
      updateData.valor_vistoria = valor_vistoria;
    }
    if (valor_vistoriador !== undefined) {
      updateData.valor_vistoriador = valor_vistoriador;
    }
    if (contato_acompanhante_tipo !== undefined) {
      updateData.contato_acompanhante_tipo = contato_acompanhante_tipo;
    }
    if (contato_acompanhante_nome !== undefined) {
      updateData.contato_acompanhante_nome = contato_acompanhante_nome;
    }
    if (contato_acompanhante_telefone_e164 !== undefined) {
      updateData.contato_acompanhante_telefone_e164 = contato_acompanhante_telefone_e164;
    }
    if (contato_acompanhante_email !== undefined) {
      updateData.contato_acompanhante_email = contato_acompanhante_email;
    }
    
    // Se mudando para concluída, definir data de conclusão
    if (status_id) {
      const statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });
      if (statusConcluida && status_id === statusConcluida.id) {
        updateData.data_conclusao = new Date();
      }
    }
    
    await vistoria.update(updateData);
    
    // Recarregar com associações
    await vistoria.reload({
      include: [
        { 
          model: Embarcacao, 
          as: 'Embarcacao',
          include: [
            { model: Cliente, as: 'Cliente' }
          ]
        },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome', 'email'] }
      ]
    });
    
    console.log('Vistoria atualizada com sucesso');
    console.log('=== FIM ROTA PUT /api/vistoriador/vistorias/:id/status ===\n');
    
    res.json(vistoria);
  } catch (error) {
    console.error('Erro ao atualizar status da vistoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/vistoriador/vistorias/:id/checklist-status - Verificar status do checklist
router.get('/vistorias/:id/checklist-status', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/vistoriador/vistorias/:id/checklist-status ===');
    console.log('ID da vistoria:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const vistoria = await Vistoria.findByPk(req.params.id);
    
    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }
    
    // Verificar se o vistoriador pode acessar esta vistoria
    if (vistoria.vistoriador_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Buscar todos os tipos de foto obrigatórios
    const tiposObrigatorios = await TipoFotoChecklist.findAll({
      where: { obrigatorio: true },
      order: [['codigo', 'ASC']]
    });
    
    // Buscar fotos já tiradas para esta vistoria
    const fotosTiradas = await Foto.findAll({
      where: { vistoria_id: req.params.id },
      include: [
        { model: TipoFotoChecklist, as: 'TipoFotoChecklist' }
      ]
    });
    
    // Verificar quais tipos obrigatórios já foram fotografados
    const checklistStatus = tiposObrigatorios.map(tipo => {
      const fotoTirada = fotosTiradas.find(foto => foto.tipo_foto_id === tipo.id);
      return {
        tipo_id: tipo.id,
        codigo: tipo.codigo,
        nome_exibicao: tipo.nome_exibicao,
        descricao: tipo.descricao,
        obrigatorio: tipo.obrigatorio,
        foto_tirada: !!fotoTirada,
        foto_url: fotoTirada?.url_arquivo || null,
        foto_observacao: fotoTirada?.observacao || null
      };
    });
    
    const totalObrigatorios = tiposObrigatorios.length;
    const fotosObrigatoriasTiradas = fotosTiradas.filter(foto => 
      tiposObrigatorios.some(tipo => tipo.id === foto.tipo_foto_id)
    ).length;
    
    const checklistCompleto = fotosObrigatoriasTiradas >= totalObrigatorios;
    
    console.log('Checklist status calculado:', {
      totalObrigatorios,
      fotosObrigatoriasTiradas,
      checklistCompleto
    });
    console.log('=== FIM ROTA GET /api/vistoriador/vistorias/:id/checklist-status ===\n');
    
    res.json({
      checklistStatus,
      resumo: {
        totalObrigatorios,
        fotosObrigatoriasTiradas,
        checklistCompleto,
        progresso: totalObrigatorios > 0 ? (fotosObrigatoriasTiradas / totalObrigatorios) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status do checklist:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
