const express = require('express');
const router = express.Router();
const { ConfiguracaoLaudo } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/configuracoes-laudo - Buscar configuração padrão
router.get('/', async (req, res) => {
  try {
    // Buscar configuração padrão (apenas uma pode ser padrão)
    let config = await ConfiguracaoLaudo.findOne({
      where: { padrao: true },
      order: [['updated_at', 'DESC']]
    });

    // Se não existir configuração padrão, criar uma vazia
    if (!config) {
      config = await ConfiguracaoLaudo.create({
        padrao: true,
        usuario_id: req.user.id
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/configuracoes-laudo - Atualizar configuração padrão
router.put('/', requireAdmin, async (req, res) => {
  try {
    const { nome_empresa, logo_empresa_url, nota_rodape, empresa_prestadora } = req.body;

    // Buscar ou criar configuração padrão
    let config = await ConfiguracaoLaudo.findOne({
      where: { padrao: true }
    });

    if (config) {
      // Atualizar configuração existente
      await config.update({
        nome_empresa: nome_empresa || config.nome_empresa,
        logo_empresa_url: logo_empresa_url || config.logo_empresa_url,
        nota_rodape: nota_rodape || config.nota_rodape,
        empresa_prestadora: empresa_prestadora || config.empresa_prestadora,
        usuario_id: req.user.id
      });
    } else {
      // Criar nova configuração padrão
      config = await ConfiguracaoLaudo.create({
        nome_empresa,
        logo_empresa_url,
        nota_rodape,
        empresa_prestadora,
        padrao: true,
        usuario_id: req.user.id
      });
    }

    res.json(config);
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

