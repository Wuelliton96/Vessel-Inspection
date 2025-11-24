const express = require('express');
const router = express.Router();
const { Laudo, Vistoria, Embarcacao, StatusVistoria, Foto, TipoFotoChecklist, Seguradora } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { gerarNumeroLaudo, gerarLaudoPDF, deletarLaudoPDF } = require('../services/laudoService');
const path = require('path');
const fs = require('fs');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const laudos = await Laudo.findAll({
      include: [
        {
          model: Vistoria,
          as: 'Vistoria',
          required: false, // LEFT JOIN para não excluir laudos sem vistoria
          include: [
            { 
              model: Embarcacao, 
              as: 'Embarcacao',
              required: false 
            },
            { 
              model: StatusVistoria, 
              as: 'StatusVistoria',
              required: false 
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json(laudos || []);
  } catch (error) {
    console.error('Erro ao listar laudos:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const laudo = await Laudo.findByPk(req.params.id, {
      include: [
        {
          model: Vistoria,
          as: 'Vistoria',
          include: [
            { model: Embarcacao, as: 'Embarcacao' },
            { model: StatusVistoria, as: 'StatusVistoria' }
          ]
        }
      ]
    });
    
    if (!laudo) {
      return res.status(404).json({ error: 'Laudo não encontrado' });
    }
    
    res.json(laudo);
  } catch (error) {
    console.error('Erro ao buscar laudo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/vistoria/:vistoriaId', async (req, res) => {
  try {
    const laudo = await Laudo.findOne({
      where: { vistoria_id: req.params.vistoriaId },
      include: [
        {
          model: Vistoria,
          as: 'Vistoria',
          include: [
            { model: Embarcacao, as: 'Embarcacao' },
            { model: StatusVistoria, as: 'StatusVistoria' }
          ]
        }
      ]
    });
    
    if (!laudo) {
      return res.status(404).json({ error: 'Laudo não encontrado para esta vistoria' });
    }
    
    res.json(laudo);
  } catch (error) {
    console.error('Erro ao buscar laudo da vistoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/vistoria/:vistoriaId', requireAdmin, async (req, res) => {
  try {
    const vistoriaId = req.params.vistoriaId;
    
    const vistoria = await Vistoria.findByPk(vistoriaId, {
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: StatusVistoria, as: 'StatusVistoria' }
      ]
    });
    
    if (!vistoria) {
      return res.status(404).json({ error: 'Vistoria não encontrada' });
    }

    const statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });
    if (!statusConcluida || vistoria.status_id !== statusConcluida.id) {
      return res.status(400).json({ 
        error: 'Vistoria não concluída',
        message: 'O laudo só pode ser criado após a conclusão da vistoria.'
      });
    }

    const laudoExistente = await Laudo.findOne({ where: { vistoria_id: vistoriaId } });
    
    const dadosLaudo = {
      ...req.body,
      vistoria_id: vistoriaId
    };

    let laudo;
    if (laudoExistente) {
      await laudoExistente.update(dadosLaudo);
      laudo = laudoExistente;
    } else {
      const numeroLaudo = gerarNumeroLaudo();
      dadosLaudo.numero_laudo = numeroLaudo;
      
      dadosLaudo.nome_moto_aquatica = dadosLaudo.nome_moto_aquatica || vistoria.Embarcacao?.nome;
      dadosLaudo.proprietario = dadosLaudo.proprietario || vistoria.Embarcacao?.proprietario_nome;
      dadosLaudo.cpf_cnpj = dadosLaudo.cpf_cnpj || vistoria.Embarcacao?.proprietario_cpf;
      dadosLaudo.data_inspecao = dadosLaudo.data_inspecao || vistoria.data_conclusao;
      dadosLaudo.valor_risco = dadosLaudo.valor_risco || vistoria.valor_embarcacao;
      
      laudo = await Laudo.create(dadosLaudo);
    }

    const laudoCompleto = await Laudo.findByPk(laudo.id, {
      include: [
        {
          model: Vistoria,
          as: 'Vistoria',
          include: [
            { model: Embarcacao, as: 'Embarcacao' }
          ]
        }
      ]
    });
    
    res.json(laudoCompleto);
  } catch (error) {
    console.error('Erro ao criar/atualizar laudo:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Já existe um laudo para esta vistoria' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/:id/gerar-pdf', requireAdmin, async (req, res) => {
  try {
    const laudo = await Laudo.findByPk(req.params.id, {
      include: [
        {
          model: Vistoria,
          as: 'Vistoria',
          include: [
            { model: Embarcacao, as: 'Embarcacao' },
            { model: StatusVistoria, as: 'StatusVistoria' }
          ]
        }
      ]
    });
    
    if (!laudo) {
      return res.status(404).json({ error: 'Laudo não encontrado' });
    }

    const fotos = await Foto.findAll({
      where: { vistoria_id: laudo.vistoria_id },
      include: [
        { model: TipoFotoChecklist, as: 'TipoFotoChecklist' }
      ],
      order: [['created_at', 'ASC']]
    });

    if (laudo.url_pdf) {
      deletarLaudoPDF(laudo.url_pdf);
    }

    const { urlRelativa } = await gerarLaudoPDF(laudo, laudo.Vistoria, fotos);

    await laudo.update({
      url_pdf: urlRelativa,
      data_geracao: new Date()
    });

    const laudoAtualizado = await Laudo.findByPk(laudo.id, {
      include: [
        {
          model: Vistoria,
          as: 'Vistoria',
          include: [
            { model: Embarcacao, as: 'Embarcacao' }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Laudo gerado com sucesso',
      laudo: laudoAtualizado,
      downloadUrl: `/api/laudos/${laudo.id}/download`
    });
  } catch (error) {
    console.error('Erro ao gerar PDF do laudo:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao gerar PDF do laudo',
      details: error.message 
    });
  }
});

router.get('/:id/download', async (req, res) => {
  try {
    const laudo = await Laudo.findByPk(req.params.id);
    
    if (!laudo) {
      return res.status(404).json({ error: 'Laudo não encontrado' });
    }
    
    if (!laudo.url_pdf) {
      return res.status(404).json({ error: 'PDF do laudo ainda não foi gerado' });
    }

    const filePath = path.join(__dirname, '..', laudo.url_pdf);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo PDF não encontrado no servidor' });
    }

    res.download(filePath, `laudo-${laudo.numero_laudo}.pdf`);
  } catch (error) {
    console.error('Erro ao fazer download do laudo:', error);
    res.status(500).json({ error: 'Erro ao fazer download do laudo' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const laudo = await Laudo.findByPk(req.params.id);
    
    if (!laudo) {
      return res.status(404).json({ error: 'Laudo não encontrado' });
    }

    await laudo.update(req.body);

    const laudoAtualizado = await Laudo.findByPk(laudo.id, {
      include: [
        {
          model: Vistoria,
          as: 'Vistoria',
          include: [
            { model: Embarcacao, as: 'Embarcacao' }
          ]
        }
      ]
    });

    res.json(laudoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar laudo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const laudo = await Laudo.findByPk(req.params.id);
    
    if (!laudo) {
      return res.status(404).json({ error: 'Laudo não encontrado' });
    }

    if (laudo.url_pdf) {
      deletarLaudoPDF(laudo.url_pdf);
    }

    await laudo.destroy();

    res.json({ message: 'Laudo excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir laudo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

