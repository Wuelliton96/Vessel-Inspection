// backend/routes/vistoriadorRoutes.js
const express = require('express');
const router = express.Router();
const { Vistoria, Embarcacao, Local, StatusVistoria, Usuario, Foto, TipoFotoChecklist, Cliente, LotePagamento, VistoriaLotePagamento } = require('../models');
const { requireAuth, requireVistoriador } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth, requireVistoriador);

// GET /api/vistoriador/vistorias - Vistorias atribuídas ao vistoriador logado
router.get('/vistorias', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/vistoriador/vistorias ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Nível de acesso:', req.user?.NivelAcesso?.nome);
    
    // Buscar status PENDENTE, EM_ANDAMENTO e CONCLUIDA
    // Vistoriador deve ver todas as vistorias atribuídas a ele, independente do status
    const statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    const statusEmAndamento = await StatusVistoria.findOne({ where: { nome: 'EM_ANDAMENTO' } });
    const statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });
    
    const statusIds = [];
    if (statusPendente) statusIds.push(statusPendente.id);
    if (statusEmAndamento) statusIds.push(statusEmAndamento.id);
    if (statusConcluida) statusIds.push(statusConcluida.id);
    
    console.log('Status permitidos:', statusIds);
    
    // Filtrar vistorias atribuídas ao vistoriador (PENDENTE, EM_ANDAMENTO ou CONCLUIDA)
    const vistorias = await Vistoria.findAll({
      where: {
        vistoriador_id: req.user.id,
        status_id: statusIds.length > 0 ? statusIds : [0] // Se não encontrar status, retorna vazio
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
    
    let tipos = await TipoFotoChecklist.findAll({
      order: [['codigo', 'ASC']]
    });
    
    // Se não houver tipos, criar tipos padrão automaticamente
    if (tipos.length === 0) {
      console.log('ATENCAO: Nenhum tipo de foto encontrado. Criando tipos padrão...');
      
      const tiposPadrao = [
        {
          codigo: 'CONFIRMACAO_INSCRICAO',
          nome_exibicao: 'Confirmação do nº de inscrição e nome',
          descricao: 'Foto mostrando claramente o número de inscrição e nome da embarcação',
          obrigatorio: true
        },
        {
          codigo: 'NOME_ACOMPANHANTE',
          nome_exibicao: 'Nome do acompanhante',
          descricao: 'Foto ou identificação da pessoa que acompanha a vistoria',
          obrigatorio: true
        },
        {
          codigo: 'PROA',
          nome_exibicao: 'Proa (frente)',
          descricao: 'Foto da parte frontal da embarcação',
          obrigatorio: true
        },
        {
          codigo: 'ANCORA',
          nome_exibicao: 'Âncora',
          descricao: 'Foto da âncora e sistema de ancoragem',
          obrigatorio: true
        },
        {
          codigo: 'COSTADO_DIREITO',
          nome_exibicao: 'Costado direito',
          descricao: 'Foto do lado direito completo',
          obrigatorio: true
        },
        {
          codigo: 'COSTADO_ESQUERDO',
          nome_exibicao: 'Costado esquerdo',
          descricao: 'Foto do lado esquerdo completo',
          obrigatorio: true
        },
        {
          codigo: 'POPA',
          nome_exibicao: 'Popa (traseira)',
          descricao: 'Foto da parte traseira da embarcação',
          obrigatorio: true
        },
        {
          codigo: 'CONVES',
          nome_exibicao: 'Convés',
          descricao: 'Foto do convés da embarcação',
          obrigatorio: true
        },
        {
          codigo: 'CABINE',
          nome_exibicao: 'Cabine',
          descricao: 'Foto da cabine da embarcação',
          obrigatorio: true
        },
        {
          codigo: 'MOTOR',
          nome_exibicao: 'Motor',
          descricao: 'Foto do motor da embarcação',
          obrigatorio: true
        },
        {
          codigo: 'CASCO',
          nome_exibicao: 'Casco',
          descricao: 'Foto do casco da embarcação',
          obrigatorio: true
        },
        {
          codigo: 'DOCUMENTOS',
          nome_exibicao: 'Documentos',
          descricao: 'Foto dos documentos da embarcação',
          obrigatorio: true
        }
      ];

      for (const tipoData of tiposPadrao) {
        try {
          await TipoFotoChecklist.create(tipoData);
          console.log(`  Criado: ${tipoData.codigo}`);
        } catch (err) {
          if (err.name !== 'SequelizeUniqueConstraintError') {
            console.error(`  ERRO ao criar ${tipoData.codigo}:`, err.message);
          }
        }
      }

      // Buscar tipos novamente após criação
      tipos = await TipoFotoChecklist.findAll({
        order: [['codigo', 'ASC']]
      });
      
      console.log(`Tipos padrao criados. Total: ${tipos.length}`);
    }
    
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

// GET /api/vistoriador/financeiro - Resumo financeiro do vistoriador
router.get('/financeiro', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/vistoriador/financeiro ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const { Op } = require('sequelize');
    
    const vistoriadorId = req.user.id;
    
    // Data de início e fim do mês atual
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);
    
    // 1. Pagamentos já recebidos (lotes PAGO)
    const lotesPagos = await LotePagamento.findAll({
      where: {
        vistoriador_id: vistoriadorId,
        status: 'PAGO'
      },
      include: [{
        model: VistoriaLotePagamento,
        as: 'vistoriasLote',
        include: [{
          model: Vistoria,
          as: 'vistoria',
          attributes: ['id']
        }]
      }]
    });
    
    const totalRecebido = lotesPagos.reduce((sum, lote) => sum + parseFloat(lote.valor_total || 0), 0);
    const quantidadeRecebida = lotesPagos.reduce((sum, lote) => sum + (lote.vistoriasLote?.length || 0), 0);
    
    // Pagamentos do mês atual
    const lotesMesAtual = lotesPagos.filter(lote => {
      const dataPagamento = new Date(lote.data_pagamento || lote.updated_at);
      return dataPagamento >= inicioMes && dataPagamento <= fimMes;
    });
    
    const totalRecebidoMes = lotesMesAtual.reduce((sum, lote) => sum + parseFloat(lote.valor_total || 0), 0);
    const quantidadeRecebidaMes = lotesMesAtual.reduce((sum, lote) => sum + (lote.vistoriasLote?.length || 0), 0);
    
    // 2. Pagamentos pendentes (vistorias concluídas mas não pagas)
    const statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });
    
    if (!statusConcluida) {
      return res.json({
        recebido: {
          total: 0,
          quantidade: 0,
          mes: {
            total: 0,
            quantidade: 0
          }
        },
        pendente: {
          total: 0,
          quantidade: 0,
          mes: {
            total: 0,
            quantidade: 0
          }
        }
      });
    }
    
    // Buscar vistorias concluídas do vistoriador que têm valor_vistoriador
    const vistoriasConcluidas = await Vistoria.findAll({
      where: {
        vistoriador_id: vistoriadorId,
        status_id: statusConcluida.id,
        valor_vistoriador: {
          [Op.not]: null,
          [Op.gt]: 0
        }
      },
      attributes: ['id', 'valor_vistoriador', 'data_conclusao']
    });
    
    // Buscar vistorias que já estão em lotes PAGO ou PENDENTE
    const vistoriasJaPagas = await VistoriaLotePagamento.findAll({
      include: [{
        model: LotePagamento,
        as: 'lotePagamento',
        where: {
          status: ['PAGO', 'PENDENTE']
        }
      }],
      attributes: ['vistoria_id']
    });
    
    const idsJaPagos = vistoriasJaPagas.map(v => v.vistoria_id);
    
    // Filtrar vistorias não pagas
    const vistoriasPendentes = vistoriasConcluidas.filter(v => !idsJaPagos.includes(v.id));
    
    const totalPendente = vistoriasPendentes.reduce((sum, v) => sum + parseFloat(v.valor_vistoriador || 0), 0);
    const quantidadePendente = vistoriasPendentes.length;
    
    // Pendentes do mês atual
    const vistoriasPendentesMes = vistoriasPendentes.filter(v => {
      if (!v.data_conclusao) return false;
      const dataConclusao = new Date(v.data_conclusao);
      return dataConclusao >= inicioMes && dataConclusao <= fimMes;
    });
    
    const totalPendenteMes = vistoriasPendentesMes.reduce((sum, v) => sum + parseFloat(v.valor_vistoriador || 0), 0);
    const quantidadePendenteMes = vistoriasPendentesMes.length;
    
    const resultado = {
      recebido: {
        total: totalRecebido,
        quantidade: quantidadeRecebida,
        mes: {
          total: totalRecebidoMes,
          quantidade: quantidadeRecebidaMes
        }
      },
      pendente: {
        total: totalPendente,
        quantidade: quantidadePendente,
        mes: {
          total: totalPendenteMes,
          quantidade: quantidadePendenteMes
        }
      }
    };
    
    console.log('Resumo financeiro:', JSON.stringify(resultado, null, 2));
    console.log('=== FIM ROTA GET /api/vistoriador/financeiro ===\n');
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
