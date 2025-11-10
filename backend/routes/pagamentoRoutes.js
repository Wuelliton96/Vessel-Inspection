// backend/routes/pagamentoRoutes.js

const express = require('express');
const router = express.Router();
const { LotePagamento, VistoriaLotePagamento, Vistoria, Usuario, Embarcacao, StatusVistoria } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');

// Aplicar middleware de autenticação de admin em todas as rotas
router.use(requireAuth, requireAdmin);

// GET /api/pagamentos - Listar todos os lotes de pagamento
router.get('/', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/pagamentos ===');
    console.log('Usuário:', req.user?.nome);
    console.log('Query params:', req.query);

    const { periodo_tipo, status, vistoriador_id, data_inicio, data_fim } = req.query;
    
    const whereClause = {};
    if (periodo_tipo) whereClause.periodo_tipo = periodo_tipo;
    if (status) whereClause.status = status;
    if (vistoriador_id) whereClause.vistoriador_id = vistoriador_id;
    if (data_inicio) whereClause.data_inicio = { [Op.gte]: data_inicio };
    if (data_fim) whereClause.data_fim = { [Op.lte]: data_fim };

    const lotes = await LotePagamento.findAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          as: 'vistoriador',
          attributes: ['id', 'nome', 'email', 'telefone_e164']
        },
        {
          model: Usuario,
          as: 'pagoPor',
          attributes: ['id', 'nome', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log('Lotes encontrados:', lotes.length);
    res.json(lotes);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ error: 'Erro ao listar pagamentos' });
  }
});

// GET /api/pagamentos/:id - Buscar lote específico com vistorias
router.get('/:id', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/pagamentos/:id ===');
    
    const lote = await LotePagamento.findByPk(req.params.id, {
      include: [
        {
          model: Usuario,
          as: 'vistoriador',
          attributes: ['id', 'nome', 'email', 'telefone_e164']
        },
        {
          model: Usuario,
          as: 'pagoPor',
          attributes: ['id', 'nome', 'email']
        }
      ]
    });

    if (!lote) {
      return res.status(404).json({ error: 'Lote de pagamento não encontrado' });
    }

    // Buscar vistorias vinculadas a este lote
    const vistoriasLote = await VistoriaLotePagamento.findAll({
      where: { lote_pagamento_id: lote.id },
      include: [
        {
          model: Vistoria,
          as: 'vistoria',
          include: [
            { model: Embarcacao, as: 'Embarcacao' },
            { model: StatusVistoria, as: 'StatusVistoria' }
          ]
        }
      ]
    });

    const resultado = {
      ...lote.toJSON(),
      vistorias: vistoriasLote
    };

    console.log('Lote encontrado com', vistoriasLote.length, 'vistorias');
    res.json(resultado);
  } catch (error) {
    console.error('Erro ao buscar lote:', error);
    res.status(500).json({ error: 'Erro ao buscar lote de pagamento' });
  }
});

// POST /api/pagamentos/gerar - Gerar lote de pagamento para um período
router.post('/gerar', async (req, res) => {
  try {
    console.log('=== ROTA POST /api/pagamentos/gerar ===');
    console.log('Dados recebidos:', req.body);

    const { vistoriador_id, periodo_tipo, data_inicio, data_fim } = req.body;

    if (!vistoriador_id || !periodo_tipo || !data_inicio || !data_fim) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: vistoriador_id, periodo_tipo, data_inicio, data_fim' 
      });
    }

    // Buscar vistorias concluídas do vistoriador no período que ainda não foram pagas
    const vistoriasConcluidas = await Vistoria.findAll({
      where: {
        vistoriador_id,
        data_conclusao: {
          [Op.between]: [data_inicio, data_fim]
        },
        valor_vistoriador: {
          [Op.not]: null,
          [Op.gt]: 0
        }
      },
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: StatusVistoria, as: 'StatusVistoria' }
      ]
    });

    // Filtrar apenas vistorias que NÃO estão em nenhum lote PAGO ou PENDENTE
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
    const vistoriasDisponiveis = vistoriasConcluidas.filter(v => !idsJaPagos.includes(v.id));

    if (vistoriasDisponiveis.length === 0) {
      return res.status(400).json({ 
        error: 'Não há vistorias disponíveis para pagamento neste período',
        message: 'Todas as vistorias concluídas já foram pagas ou estão em lotes pendentes.'
      });
    }

    // Calcular valor total
    const valorTotal = vistoriasDisponiveis.reduce((sum, v) => {
      return sum + parseFloat(v.valor_vistoriador || 0);
    }, 0);

    // Criar lote de pagamento
    const novoLote = await LotePagamento.create({
      vistoriador_id,
      periodo_tipo,
      data_inicio,
      data_fim,
      quantidade_vistorias: vistoriasDisponiveis.length,
      valor_total: valorTotal,
      status: 'PENDENTE'
    });

    // Vincular vistorias ao lote
    const vinculacoes = vistoriasDisponiveis.map(v => ({
      lote_pagamento_id: novoLote.id,
      vistoria_id: v.id,
      valor_vistoriador: v.valor_vistoriador
    }));

    await VistoriaLotePagamento.bulkCreate(vinculacoes);

    console.log('Lote criado:', novoLote.id, 'com', vistoriasDisponiveis.length, 'vistorias');
    console.log('Valor total:', valorTotal);

    // Retornar lote completo
    const loteCompleto = await LotePagamento.findByPk(novoLote.id, {
      include: [
        {
          model: Usuario,
          as: 'vistoriador',
          attributes: ['id', 'nome', 'email']
        }
      ]
    });

    res.status(201).json(loteCompleto);
  } catch (error) {
    console.error('Erro ao gerar lote de pagamento:', error);
    res.status(500).json({ error: 'Erro ao gerar lote de pagamento' });
  }
});

// PUT /api/pagamentos/:id/pagar - Marcar lote como PAGO
router.put('/:id/pagar', async (req, res) => {
  try {
    console.log('=== ROTA PUT /api/pagamentos/:id/pagar ===');
    console.log('ID do lote:', req.params.id);
    console.log('Dados recebidos:', req.body);

    const { forma_pagamento, comprovante_url, observacoes } = req.body;

    const lote = await LotePagamento.findByPk(req.params.id);

    if (!lote) {
      return res.status(404).json({ error: 'Lote de pagamento não encontrado' });
    }

    if (lote.status === 'PAGO') {
      return res.status(400).json({ error: 'Este lote já foi pago' });
    }

    if (lote.status === 'CANCELADO') {
      return res.status(400).json({ error: 'Este lote foi cancelado' });
    }

    await lote.update({
      status: 'PAGO',
      data_pagamento: new Date(),
      forma_pagamento: forma_pagamento || null,
      comprovante_url: comprovante_url || null,
      observacoes: observacoes || null,
      pago_por_id: req.user.id
    });

    console.log('Lote marcado como PAGO:', lote.id);
    res.json(lote);
  } catch (error) {
    console.error('Erro ao marcar lote como pago:', error);
    res.status(500).json({ error: 'Erro ao processar pagamento' });
  }
});

// PUT /api/pagamentos/:id/cancelar - Cancelar lote de pagamento
router.put('/:id/cancelar', async (req, res) => {
  try {
    console.log('=== ROTA PUT /api/pagamentos/:id/cancelar ===');

    const lote = await LotePagamento.findByPk(req.params.id);

    if (!lote) {
      return res.status(404).json({ error: 'Lote de pagamento não encontrado' });
    }

    if (lote.status === 'PAGO') {
      return res.status(400).json({ 
        error: 'Não é possível cancelar um lote já pago',
        message: 'Para reverter um pagamento, entre em contato com o suporte.'
      });
    }

    await lote.update({ status: 'CANCELADO' });

    console.log('Lote cancelado:', lote.id);
    res.json(lote);
  } catch (error) {
    console.error('Erro ao cancelar lote:', error);
    res.status(500).json({ error: 'Erro ao cancelar lote' });
  }
});

// DELETE /api/pagamentos/:id - Excluir lote (apenas se PENDENTE ou CANCELADO)
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== ROTA DELETE /api/pagamentos/:id ===');

    const lote = await LotePagamento.findByPk(req.params.id);

    if (!lote) {
      return res.status(404).json({ error: 'Lote de pagamento não encontrado' });
    }

    if (lote.status === 'PAGO') {
      return res.status(400).json({ 
        error: 'Não é possível excluir um lote já pago',
        message: 'Lotes pagos devem ser mantidos para auditoria.'
      });
    }

    await lote.destroy();

    console.log('Lote excluído:', req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir lote:', error);
    res.status(500).json({ error: 'Erro ao excluir lote' });
  }
});

// GET /api/pagamentos/vistoriador/:id/disponiveis - Buscar vistorias disponíveis para pagamento
router.get('/vistoriador/:id/disponiveis', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/pagamentos/vistoriador/:id/disponiveis ===');
    console.log('Vistoriador ID:', req.params.id);
    console.log('Query params:', req.query);

    const { data_inicio, data_fim } = req.query;
    const vistoriadorId = req.params.id;

    const whereVistoria = {
      vistoriador_id: vistoriadorId,
      valor_vistoriador: {
        [Op.not]: null,
        [Op.gt]: 0
      }
    };

    // Filtrar por período se fornecido
    if (data_inicio && data_fim) {
      whereVistoria.data_conclusao = {
        [Op.between]: [data_inicio, data_fim]
      };
    } else if (data_inicio) {
      whereVistoria.data_conclusao = {
        [Op.gte]: data_inicio
      };
    } else if (data_fim) {
      whereVistoria.data_conclusao = {
        [Op.lte]: data_fim
      };
    }

    // Buscar vistorias concluídas
    const vistoriasConcluidas = await Vistoria.findAll({
      where: whereVistoria,
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: StatusVistoria, as: 'StatusVistoria' }
      ],
      order: [['data_conclusao', 'DESC']]
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
    const vistoriasDisponiveis = vistoriasConcluidas.filter(v => !idsJaPagos.includes(v.id));

    const valorTotal = vistoriasDisponiveis.reduce((sum, v) => {
      return sum + parseFloat(v.valor_vistoriador || 0);
    }, 0);

    console.log('Vistorias disponíveis:', vistoriasDisponiveis.length);
    console.log('Valor total disponível:', valorTotal);

    res.json({
      vistorias: vistoriasDisponiveis,
      quantidade: vistoriasDisponiveis.length,
      valor_total: valorTotal
    });
  } catch (error) {
    console.error('Erro ao buscar vistorias disponíveis:', error);
    res.status(500).json({ error: 'Erro ao buscar vistorias disponíveis' });
  }
});

// GET /api/pagamentos/resumo/geral - Resumo geral de pagamentos
router.get('/resumo/geral', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/pagamentos/resumo/geral ===');

    const { periodo_inicio, periodo_fim } = req.query;

    const whereClause = {};
    if (periodo_inicio && periodo_fim) {
      whereClause.data_inicio = {
        [Op.between]: [periodo_inicio, periodo_fim]
      };
    }

    // Total pendente
    const totalPendente = await LotePagamento.sum('valor_total', {
      where: { ...whereClause, status: 'PENDENTE' }
    });

    // Total pago
    const totalPago = await LotePagamento.sum('valor_total', {
      where: { ...whereClause, status: 'PAGO' }
    });

    // Quantidade de lotes
    const qtdPendente = await LotePagamento.count({
      where: { ...whereClause, status: 'PENDENTE' }
    });

    const qtdPago = await LotePagamento.count({
      where: { ...whereClause, status: 'PAGO' }
    });

    res.json({
      pendente: {
        quantidade: qtdPendente || 0,
        valor_total: parseFloat(totalPendente || 0)
      },
      pago: {
        quantidade: qtdPago || 0,
        valor_total: parseFloat(totalPago || 0)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    res.status(500).json({ error: 'Erro ao buscar resumo' });
  }
});

module.exports = router;

