const express = require('express');
const router = express.Router();
const { Laudo, Vistoria, Embarcacao, StatusVistoria, Foto, TipoFotoChecklist, Seguradora, Cliente, Local, ConfiguracaoLaudo } = require('../models');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { gerarNumeroLaudo, gerarLaudoPDF, deletarLaudoPDF } = require('../services/laudoService');
const { handleRouteError, notFoundResponse, logRouteStart, logRouteEnd, getLaudoIncludes, getVistoriaIncludes } = require('../utils/routeHelpers');
const { preencherDadosLaudo, preencherDadosLaudoExistente } = require('../utils/preencherLaudo');
const path = require('path');
const fs = require('fs');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    logRouteStart('GET', '/api/laudos', req);
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
    
    logRouteEnd('GET', '/api/laudos', 200);
    res.json(laudos || []);
  } catch (error) {
    handleRouteError(error, res, 'Erro ao listar laudos');
  }
});

router.get('/:id', async (req, res) => {
  try {
    logRouteStart('GET', `/api/laudos/${req.params.id}`, req);
    
    const laudoId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(laudoId) || laudoId <= 0) {
      if (!res.headersSent) {
        return res.status(400).json({ error: 'ID do laudo inválido' });
      }
      return;
    }
    
    let laudo;
    try {
      laudo = await Laudo.findByPk(laudoId, {
        include: getLaudoIncludes()
      });
    } catch (includeError) {
      console.error('Erro ao buscar laudo com includes:', includeError);
      // Tentar buscar sem includes se houver erro
      laudo = await Laudo.findByPk(laudoId);
    }
    
    if (!laudo) {
      logRouteEnd('GET', `/api/laudos/${req.params.id}`, 404);
      if (!res.headersSent) {
        return notFoundResponse(res, 'Laudo');
      }
      return;
    }
    
    logRouteEnd('GET', `/api/laudos/${req.params.id}`, 200);
    if (!res.headersSent) {
      res.json(laudo);
    }
  } catch (error) {
    console.error('Erro detalhado ao buscar laudo:', error);
    console.error('Stack trace:', error.stack);
    if (!res.headersSent) {
      handleRouteError(error, res, 'Erro ao buscar laudo');
    }
  }
});

router.get('/vistoria/:vistoriaId', async (req, res) => {
  try {
    logRouteStart('GET', `/api/laudos/vistoria/${req.params.vistoriaId}`, req);
    
    const vistoriaId = Number.parseInt(req.params.vistoriaId, 10);
    if (Number.isNaN(vistoriaId) || vistoriaId <= 0) {
      if (!res.headersSent) {
        return res.status(400).json({ error: 'ID da vistoria inválido' });
      }
      return;
    }
    
    let laudo;
    try {
      laudo = await Laudo.findOne({
        where: { vistoria_id: vistoriaId },
        include: getLaudoIncludes()
      });
    } catch (includeError) {
      console.error('Erro ao buscar laudo com includes:', includeError);
      // Tentar buscar sem includes se houver erro
      laudo = await Laudo.findOne({
        where: { vistoria_id: vistoriaId }
      });
    }
    
    if (!laudo) {
      logRouteEnd('GET', `/api/laudos/vistoria/${req.params.vistoriaId}`, 404);
      if (!res.headersSent) {
        return notFoundResponse(res, 'Laudo');
      }
      return;
    }
    
    logRouteEnd('GET', `/api/laudos/vistoria/${req.params.vistoriaId}`, 200);
    if (!res.headersSent) {
      res.json(laudo);
    }
  } catch (error) {
    console.error('Erro detalhado ao buscar laudo por vistoria:', error);
    console.error('Stack trace:', error.stack);
    if (!res.headersSent) {
      handleRouteError(error, res, 'Erro ao buscar laudo da vistoria');
    }
  }
});

router.post('/vistoria/:vistoriaId', requireAdmin, async (req, res) => {
  try {
    logRouteStart('POST', `/api/laudos/vistoria/${req.params.vistoriaId}`, req);
    const vistoriaId = req.params.vistoriaId;
    
    const vistoria = await Vistoria.findByPk(vistoriaId, {
      include: getVistoriaIncludes()
    });
    
    if (!vistoria) {
      logRouteEnd('POST', `/api/laudos/vistoria/${req.params.vistoriaId}`, 404);
      return notFoundResponse(res, 'Vistoria');
    }
    
    // Log para debug
    console.log('[POST /api/laudos/vistoria/:vistoriaId] Vistoriador:', vistoria.vistoriador);
    console.log('[POST /api/laudos/vistoria/:vistoriaId] Nome do Vistoriador:', vistoria.vistoriador?.nome || 'NÃO ENCONTRADO');

    const statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });
    if (!statusConcluida || vistoria.status_id !== statusConcluida.id) {
      return res.status(400).json({ 
        error: 'Vistoria não concluída',
        message: 'O laudo só pode ser criado após a conclusão da vistoria.'
      });
    }

    const laudoExistente = await Laudo.findOne({ where: { vistoria_id: vistoriaId } });
    
    // Garantir que o responsavel_inspecao seja sempre o nome do vistoriador se não foi fornecido
    const nomeVistoriador = vistoria.vistoriador?.nome || '';
    if (!req.body.responsavel_inspecao && nomeVistoriador) {
      req.body.responsavel_inspecao = nomeVistoriador;
    }

    let laudo;
    if (laudoExistente) {
      // Atualizar laudo existente: preencher apenas campos vazios ou não fornecidos
      const dadosPreenchidos = preencherDadosLaudoExistente(laudoExistente, vistoria, req.body);
      
      // Buscar configurações padrão
      let configPadrao = await ConfiguracaoLaudo.findOne({ where: { padrao: true } });
      
      const dadosLaudo = { 
        ...dadosPreenchidos, 
        ...req.body, // req.body tem prioridade
        // Usar configurações padrão se não foram fornecidas e o campo está vazio no laudo existente
        nome_empresa: req.body.nome_empresa || laudoExistente.nome_empresa || configPadrao?.nome_empresa || '',
        logo_empresa_url: req.body.logo_empresa_url || laudoExistente.logo_empresa_url || configPadrao?.logo_empresa_url || '',
        nota_rodape: req.body.nota_rodape || laudoExistente.nota_rodape || configPadrao?.nota_rodape || '',
        empresa_prestadora: req.body.empresa_prestadora || laudoExistente.empresa_prestadora || configPadrao?.empresa_prestadora || 'Vessel Inspection',
        // Garantir que o responsavel_inspecao seja sempre o nome do vistoriador se não foi fornecido explicitamente
        responsavel_inspecao: req.body.responsavel_inspecao || dadosPreenchidos.responsavel_inspecao || nomeVistoriador || ''
      };
      await laudoExistente.update(dadosLaudo);
      laudo = laudoExistente;
    } else {
      // Criar novo laudo: preencher todos os campos possíveis
      const numeroLaudo = await gerarNumeroLaudo();
      const dadosPreenchidos = preencherDadosLaudo(vistoria, req.body);
      
      // Buscar configurações padrão
      let configPadrao = await ConfiguracaoLaudo.findOne({ where: { padrao: true } });
      
      const dadosLaudo = {
        ...dadosPreenchidos,
        ...req.body, // req.body tem prioridade sobre dados preenchidos
        // Usar configurações padrão se não foram fornecidas
        nome_empresa: req.body.nome_empresa || dadosPreenchidos.nome_empresa || configPadrao?.nome_empresa || '',
        logo_empresa_url: req.body.logo_empresa_url || dadosPreenchidos.logo_empresa_url || configPadrao?.logo_empresa_url || '',
        nota_rodape: req.body.nota_rodape || dadosPreenchidos.nota_rodape || configPadrao?.nota_rodape || '',
        empresa_prestadora: req.body.empresa_prestadora || dadosPreenchidos.empresa_prestadora || configPadrao?.empresa_prestadora || 'Vessel Inspection',
        // Garantir que o responsavel_inspecao seja sempre o nome do vistoriador se não foi fornecido explicitamente
        responsavel_inspecao: req.body.responsavel_inspecao || dadosPreenchidos.responsavel_inspecao || nomeVistoriador || '',
        numero_laudo: numeroLaudo,
        vistoria_id: vistoriaId
      };
      
      laudo = await Laudo.create(dadosLaudo);
    }

    const laudoCompleto = await Laudo.findByPk(laudo.id, {
      include: getLaudoIncludes()
    });
    
    logRouteEnd('POST', `/api/laudos/vistoria/${vistoriaId}`, 200);
    res.json(laudoCompleto);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (!res.headersSent) {
        return res.status(400).json({ error: 'Já existe um laudo para esta vistoria' });
      }
      return;
    }
    handleRouteError(error, res, 'Erro ao criar/atualizar laudo');
  }
});

router.get('/:id/preview', requireAuth, async (req, res) => {
  try {
    logRouteStart('GET', `/api/laudos/${req.params.id}/preview`, req);
    const laudo = await Laudo.findByPk(req.params.id, {
      include: getLaudoIncludes()
    });
    
    if (!laudo) {
      logRouteEnd('GET', `/api/laudos/${req.params.id}/preview`, 404);
      return notFoundResponse(res, 'Laudo');
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

    logRouteEnd('GET', `/api/laudos/${req.params.id}/preview`, 200);
    res.json(dadosPreview);
  } catch (error) {
    handleRouteError(error, res, 'Erro ao gerar preview do laudo');
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

    console.log(`[POST /api/laudos/:id/gerar-pdf] Iniciando geração do PDF...`);
    console.log(`[POST /api/laudos/:id/gerar-pdf] Laudo encontrado: ID=${laudo.id}, Vistoria ID=${laudo.vistoria_id}`);
    console.log(`[POST /api/laudos/:id/gerar-pdf] Fotos encontradas: ${fotos.length}`);
    
    const { urlRelativa } = await gerarLaudoPDF(laudo, laudo.Vistoria, fotos);
    
    console.log(`[POST /api/laudos/:id/gerar-pdf] PDF gerado com sucesso: ${urlRelativa}`);

    await laudo.update({
      url_pdf: urlRelativa,
      data_geracao: new Date()
    });

    const laudoAtualizado = await Laudo.findByPk(laudo.id, {
      include: getLaudoIncludes()
    });

    logRouteEnd('POST', `/api/laudos/${req.params.id}/gerar-pdf`, 200);
    res.json({
      success: true,
      message: 'Laudo gerado com sucesso',
      laudo: laudoAtualizado,
      downloadUrl: `/api/laudos/${laudo.id}/download`
    });
  } catch (error) {
    console.error(`[POST /api/laudos/:id/gerar-pdf] ERRO:`, error.message);
    console.error(`[POST /api/laudos/:id/gerar-pdf] Stack:`, error.stack);
    handleRouteError(error, res, 'Erro ao gerar PDF do laudo');
  }
});

// Função auxiliar para download de PDF (reduz duplicação)
async function downloadLaudoPDF(req, res, routePath) {
  try {
    logRouteStart('GET', routePath, req);
    const laudo = await Laudo.findByPk(req.params.id);
    
    if (!laudo) {
      logRouteEnd('GET', routePath, 404);
      return notFoundResponse(res, 'Laudo');
    }
    
    if (!laudo.url_pdf) {
      logRouteEnd('GET', routePath, 404);
      if (!res.headersSent) {
        return res.status(404).json({ error: 'PDF do laudo ainda não foi gerado' });
      }
      return;
    }

    const filePath = path.join(__dirname, '..', laudo.url_pdf);
    
    if (!fs.existsSync(filePath)) {
      logRouteEnd('GET', routePath, 404);
      if (!res.headersSent) {
        return res.status(404).json({ error: 'Arquivo PDF não encontrado no servidor' });
      }
      return;
    }

    logRouteEnd('GET', routePath, 200);
    res.download(filePath, `laudo-${laudo.numero_laudo}.pdf`);
  } catch (error) {
    handleRouteError(error, res, 'Erro ao fazer download do laudo');
  }
}

router.get('/:id/download-pdf', requireAuth, (req, res) => downloadLaudoPDF(req, res, `/api/laudos/${req.params.id}/download-pdf`));

// Manter rota antiga para compatibilidade
router.get('/:id/download', requireAuth, (req, res) => downloadLaudoPDF(req, res, `/api/laudos/${req.params.id}/download`));

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    logRouteStart('PUT', `/api/laudos/${req.params.id}`, req);
    const laudo = await Laudo.findByPk(req.params.id);
    
    if (!laudo) {
      logRouteEnd('PUT', `/api/laudos/${req.params.id}`, 404);
      return notFoundResponse(res, 'Laudo');
    }

    await laudo.update(req.body);

    const laudoAtualizado = await Laudo.findByPk(laudo.id, {
      include: getLaudoIncludes()
    });

    logRouteEnd('PUT', `/api/laudos/${req.params.id}`, 200);
    res.json(laudoAtualizado);
  } catch (error) {
    handleRouteError(error, res, 'Erro ao atualizar laudo');
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    logRouteStart('DELETE', `/api/laudos/${req.params.id}`, req);
    const laudo = await Laudo.findByPk(req.params.id);
    
    if (!laudo) {
      logRouteEnd('DELETE', `/api/laudos/${req.params.id}`, 404);
      return notFoundResponse(res, 'Laudo');
    }

    if (laudo.url_pdf) {
      deletarLaudoPDF(laudo.url_pdf);
    }

    await laudo.destroy();

    logRouteEnd('DELETE', `/api/laudos/${req.params.id}`, 200);
    res.json({ message: 'Laudo excluído com sucesso' });
  } catch (error) {
    handleRouteError(error, res, 'Erro ao excluir laudo');
  }
});

module.exports = router;

