const express = require('express');
const router = express.Router();
const { Laudo, Vistoria, Embarcacao, StatusVistoria, Foto, TipoFotoChecklist, Seguradora, Cliente, Local } = require('../models');
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
            { 
              model: Embarcacao, 
              as: 'Embarcacao',
              include: [
                { model: Cliente, as: 'Cliente' }
              ]
            },
            { model: StatusVistoria, as: 'StatusVistoria' },
            { model: Local, as: 'Local' }
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
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
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
            { 
              model: Embarcacao, 
              as: 'Embarcacao',
              include: [
                { model: Cliente, as: 'Cliente' }
              ]
            },
            { model: StatusVistoria, as: 'StatusVistoria' },
            { model: Local, as: 'Local' }
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
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.post('/vistoria/:vistoriaId', requireAdmin, async (req, res) => {
  try {
    const vistoriaId = req.params.vistoriaId;
    
    const vistoria = await Vistoria.findByPk(vistoriaId, {
      include: [
        { 
          model: Embarcacao, 
          as: 'Embarcacao',
          include: [
            { model: Cliente, as: 'Cliente' }
          ]
        },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Local, as: 'Local' }
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
      
      // Preencher dados iniciais do laudo com base na vistoria e embarcação
      dadosLaudo.nome_moto_aquatica = dadosLaudo.nome_moto_aquatica || vistoria.Embarcacao?.nome;
      dadosLaudo.proprietario = dadosLaudo.proprietario || vistoria.Embarcacao?.proprietario_nome || vistoria.Embarcacao?.Cliente?.nome;
      dadosLaudo.cpf_cnpj = dadosLaudo.cpf_cnpj || vistoria.Embarcacao?.proprietario_cpf || vistoria.Embarcacao?.Cliente?.cpf || vistoria.Embarcacao?.Cliente?.cnpj;
      dadosLaudo.data_inspecao = dadosLaudo.data_inspecao || vistoria.data_conclusao || vistoria.data_inicio;
      dadosLaudo.valor_risco = dadosLaudo.valor_risco || vistoria.valor_embarcacao || vistoria.Embarcacao?.valor_embarcacao;
      
      // Construir endereço completo do local de vistoria
      const localVistoria = vistoria.Local ? 
        `${vistoria.Local.logradouro || ''}, ${vistoria.Local.numero || ''} - ${vistoria.Local.bairro || ''}, ${vistoria.Local.cidade || ''}/${vistoria.Local.estado || ''}`.trim().replace(/^,\s*-\s*,?\s*\/?,?/, '') : 
        '';
      
      dadosLaudo.local_vistoria = dadosLaudo.local_vistoria || localVistoria;
      dadosLaudo.local_guarda = dadosLaudo.local_guarda || localVistoria; // Local da guarda = Local de vistoria
      dadosLaudo.inscricao_capitania = dadosLaudo.inscricao_capitania || vistoria.Embarcacao?.nr_inscricao_barco;
      dadosLaudo.tipo_embarcacao = dadosLaudo.tipo_embarcacao || vistoria.Embarcacao?.tipo_embarcacao;
      dadosLaudo.ano_fabricacao = dadosLaudo.ano_fabricacao || vistoria.Embarcacao?.ano_fabricacao;
      
      laudo = await Laudo.create(dadosLaudo);
    }

    const laudoCompleto = await Laudo.findByPk(laudo.id, {
      include: [
        {
          model: Vistoria,
          as: 'Vistoria',
          include: [
            { 
              model: Embarcacao, 
              as: 'Embarcacao',
              include: [
                { model: Cliente, as: 'Cliente' }
              ]
            },
            { model: StatusVistoria, as: 'StatusVistoria' },
            { model: Local, as: 'Local' }
          ]
        }
      ]
    });
    
    res.json(laudoCompleto);
  } catch (error) {
    console.error('Erro ao criar/atualizar laudo:', error);
    console.error('Stack trace:', error.stack);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Já existe um laudo para esta vistoria' });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/:id/preview', requireAuth, async (req, res) => {
  try {
    const laudo = await Laudo.findByPk(req.params.id, {
      include: [
        {
          model: Vistoria,
          as: 'Vistoria',
          include: [
            { 
              model: Embarcacao, 
              as: 'Embarcacao',
              include: [
                { model: Cliente, as: 'Cliente' }
              ]
            },
            { model: StatusVistoria, as: 'StatusVistoria' },
            { model: Local, as: 'Local' }
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

    // Preparar dados para preview
    const embarcacao = laudo.Vistoria?.Embarcacao || {};
    const local = laudo.Vistoria?.Local || {};
    const tipoEmbarcacao = laudo.Vistoria?.Embarcacao?.tipo_embarcacao;
    
    // Formatações
    const formatarCPFCNPJ = (cpfCnpj) => {
      if (!cpfCnpj) return '';
      const limpo = cpfCnpj.replace(/\D/g, '');
      if (limpo.length === 11) {
        return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (limpo.length === 14) {
        return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      }
      return cpfCnpj;
    };

    const formatarData = (data) => {
      if (!data) return '';
      try {
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
      } catch {
        return data;
      }
    };

    const formatarValor = (valor) => {
      if (!valor) return '';
      return parseFloat(valor).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    };

    const dadosPreview = {
      template: tipoEmbarcacao === 'JET_SKI' ? 'jetski.pdf' : 'lancha_embarcação.pdf',
      tipoEmbarcacao: tipoEmbarcacao || 'NÃO DEFINIDO',
      numero_laudo: laudo.numero_laudo || '',
      versao: laudo.versao || 'BS 2021-01',
      nome_embarcacao: laudo.nome_moto_aquatica || embarcacao.nome || '',
      proprietario: laudo.proprietario || embarcacao.proprietario_nome || embarcacao.Cliente?.nome || '',
      cpf_cnpj: formatarCPFCNPJ(laudo.cpf_cnpj || embarcacao.proprietario_cpf || embarcacao.Cliente?.cpf || embarcacao.Cliente?.cnpj || ''),
      data_inspecao: formatarData(laudo.data_inspecao || laudo.Vistoria?.data_conclusao || laudo.Vistoria?.data_inicio),
      local_vistoria: laudo.local_vistoria || local.logradouro || '',
      inscricao_capitania: laudo.inscricao_capitania || embarcacao.nr_inscricao_barco || '',
      tipo_embarcacao: laudo.tipo_embarcacao || embarcacao.tipo_embarcacao || '',
      ano_fabricacao: laudo.ano_fabricacao || embarcacao.ano_fabricacao || '',
      valor_risco: formatarValor(laudo.valor_risco || laudo.Vistoria?.valor_embarcacao || embarcacao.valor_embarcacao),
      fotos: fotos.map(foto => ({
        id: foto.id,
        tipo: foto.TipoFotoChecklist?.nome_exibicao || 'Foto',
        descricao: foto.TipoFotoChecklist?.descricao || '',
        observacao: foto.observacao || '',
        url: foto.url_arquivo || ''
      })),
      totalFotos: fotos.length
    };

    res.json(dadosPreview);
  } catch (error) {
    console.error('Erro ao gerar preview do laudo:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar preview do laudo',
      details: error.message 
    });
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

router.get('/:id/download-pdf', requireAuth, async (req, res) => {
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

// Manter rota antiga para compatibilidade
router.get('/:id/download', requireAuth, async (req, res) => {
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
            { 
              model: Embarcacao, 
              as: 'Embarcacao',
              include: [
                { model: Cliente, as: 'Cliente' }
              ]
            },
            { model: StatusVistoria, as: 'StatusVistoria' },
            { model: Local, as: 'Local' }
          ]
        }
      ]
    });

    res.json(laudoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar laudo:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
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

