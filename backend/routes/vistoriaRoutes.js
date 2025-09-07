// backend/routes/vistoriaRoutes.js
const express = require('express');
const router = express.Router();
// Importamos os dois middlewares
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { Vistoria, Embarcacao, Local, StatusVistoria } = require('../models');

// Rota: POST /api/vistorias
// Agora usamos os dois middlewares em sequência.
// 1º: requireAuth verifica se está logado.
// 2º: requireAdmin verifica se é um admin.
router.post('/', [requireAuth, requireAdmin], async (req, res) => {
  try {
    const {
      embarcacao_nome,
      embarcacao_numero_casco,
      local_tipo,
      local_cep,
      vistoriador_id
    } = req.body;

    // Encontrar ou criar a embarcação
    const [embarcacao] = await Embarcacao.findOrCreate({
      where: { numero_casco: embarcacao_numero_casco },
      defaults: { nome: embarcacao_nome }
    });

    // Criar o local
    const local = await Local.create({
      tipo: local_tipo,
      cep: local_cep
    });

    // Pegar o status inicial 'PENDENTE'
    const statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });

    // Criar a vistoria
    const novaVistoria = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: vistoriador_id,
      // AGORA USAMOS O ID DO USUÁRIO LOGADO!
      administrador_id: req.user.id,
      status_id: statusPendente.id
    });

    res.status(201).json(novaVistoria);

  } catch (error) {
    console.error("Erro ao criar vistoria:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

module.exports = router;