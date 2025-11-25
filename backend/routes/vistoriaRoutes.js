// backend/routes/vistoriaRoutes.js
const express = require('express');
const router = express.Router();
// Importamos os dois middlewares
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { Vistoria, Embarcacao, Local, StatusVistoria, Usuario, ChecklistTemplate, ChecklistTemplateItem, VistoriaChecklistItem } = require('../models');
const logger = require('../utils/logger');

// Rota: POST /api/vistorias
router.post('/', [requireAuth, requireAdmin], async (req, res) => {
  try {
    logger.info('POST /api/vistorias', { 
      userId: req.user?.id, 
      userName: req.user?.nome,
      nivelAcesso: req.user?.NivelAcesso?.nome 
    });
    
    const {
      embarcacao_id,
      local_id,
      vistoriador_id,
      dados_rascunho,
      // Campos financeiros
      valor_embarcacao,
      valor_vistoria,
      valor_vistoriador,
      // Campos de contato/acompanhante
      contato_acompanhante_tipo,
      contato_acompanhante_nome,
      contato_acompanhante_telefone_e164,
      contato_acompanhante_email,
      // Campos da corretora
      corretora_nome,
      corretora_telefone_e164,
      corretora_email_laudo,
      // Campos para criar nova embarcação (opcional)
      embarcacao_nome,
      embarcacao_nr_inscricao_barco,
      // Campos para criar novo local (opcional)
      local_tipo,
      local_cep,
      local_nome_local,
      local_logradouro,
      local_numero,
      local_bairro,
      local_cidade,
      local_estado
    } = req.body;

    // Validações básicas
    if (!vistoriador_id) {
      return res.status(400).json({ error: "Vistoriador é obrigatório" });
    }

    let embarcacaoId = embarcacao_id;
    let localId = local_id;

    // Se não foi fornecido embarcacao_id, criar nova embarcação
    if (!embarcacaoId) {
      logger.debug('Criando nova embarcação');
      if (!embarcacao_nome || !embarcacao_nr_inscricao_barco) {
        logger.warn('Validação falhou - campos obrigatórios ausentes para nova embarcação');
        return res.status(400).json({ error: "Nome e NF de Inscrição são obrigatórios para nova embarcação" });
      }

      logger.debug('Dados da embarcação', {
        nome: embarcacao_nome,
        nr_inscricao_barco: embarcacao_nr_inscricao_barco,
        hasProprietario: !!req.body.embarcacao_proprietario_nome
      });

      // Validar tipo de embarcação com seguradora
      const seguradoraId = req.body.seguradora_id;
      const tipoEmbarcacao = req.body.embarcacao_tipo || req.body.tipo_embarcacao;
      
      if (seguradoraId && tipoEmbarcacao) {
        const { Seguradora, SeguradoraTipoEmbarcacao } = require('../models');
        
        const tipoPermitido = await SeguradoraTipoEmbarcacao.findOne({
          where: {
            seguradora_id: seguradoraId,
            tipo_embarcacao: tipoEmbarcacao
          }
        });
        
        if (!tipoPermitido) {
          const seguradora = await Seguradora.findByPk(seguradoraId);
          logger.warn('Validação falhou - tipo de embarcação não permitido', {
            seguradoraId: seguradoraId,
            seguradoraNome: seguradora?.nome,
            tipoEmbarcacao
          });
          return res.status(400).json({ 
            error: "Tipo de embarcação não permitido",
            message: `A seguradora ${seguradora?.nome} não aceita vistorias de ${tipoEmbarcacao}`
          });
        }
        logger.debug('Validação OK - seguradora permite este tipo');
      }

      const [embarcacao] = await Embarcacao.findOrCreate({
        where: { nr_inscricao_barco: embarcacao_nr_inscricao_barco },
        defaults: { 
          nome: embarcacao_nome,
          proprietario_nome: req.body.embarcacao_proprietario_nome || null,
          proprietario_cpf: req.body.embarcacao_proprietario_cpf || null,
          proprietario_telefone_e164: req.body.embarcacao_proprietario_telefone_e164 || null,
          proprietario_email: req.body.embarcacao_proprietario_email || null,
          tipo_embarcacao: tipoEmbarcacao,
          seguradora_id: seguradoraId,
          valor_embarcacao: req.body.embarcacao_valor || null,
          ano_fabricacao: req.body.embarcacao_ano_fabricacao || null,
          cliente_id: req.body.cliente_id || null
        }
      });
      embarcacaoId = embarcacao.id;
      logger.debug('Embarcação criada/encontrada', { 
        embarcacaoId, 
        tipo: embarcacao.tipo_embarcacao,
        seguradoraId: embarcacao.seguradora_id 
      });
    }

    // Se não foi fornecido local_id, buscar ou criar local
    if (!localId) {
      if (!local_tipo) {
        logger.warn('Validação falhou - tipo do local é obrigatório');
        return res.status(400).json({ error: "Tipo do local é obrigatório" });
      }

      logger.debug('Buscando local existente');
      
      // Buscar local existente com os mesmos dados
      const whereClause = {
        tipo: local_tipo
      };
      
      // Adicionar campos para busca (se preenchidos)
      if (local_cep) whereClause.cep = local_cep;
      if (local_logradouro) whereClause.logradouro = local_logradouro;
      if (local_numero) whereClause.numero = local_numero;
      if (local_cidade) whereClause.cidade = local_cidade;
      if (local_estado) whereClause.estado = local_estado;
      
      // Se for MARINA, buscar também por nome
      if (local_tipo === 'MARINA' && local_nome_local) {
        whereClause.nome_local = local_nome_local;
      }

      const localExistente = await Local.findOne({ where: whereClause });

      if (localExistente) {
        localId = localExistente.id;
        logger.debug('Local existente encontrado', { localId, nome: localExistente.nome_local });
      } else {
        logger.debug('Local não encontrado, criando novo', { tipo: local_tipo });

        const novoLocal = await Local.create({
          tipo: local_tipo,
          nome_local: local_nome_local || null,
          cep: local_cep || null,
          logradouro: local_logradouro || null,
          numero: local_numero || null,
          complemento: req.body.local_complemento || null,
          bairro: local_bairro || null,
          cidade: local_cidade || null,
          estado: local_estado || null
        });
        localId = novoLocal.id;
        logger.debug('Novo local criado', { localId });
      }
    }

    // Pegar o status inicial 'PENDENTE'
    const statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    if (!statusPendente) {
      return res.status(500).json({ error: "Status 'PENDENTE' não encontrado" });
    }

    // Criar a vistoria
    logger.debug('Criando vistoria', {
      embarcacao_id: embarcacaoId,
      local_id: localId,
      vistoriador_id: vistoriador_id,
      administrador_id: req.user.id,
      status_id: statusPendente.id,
      dados_rascunho: dados_rascunho
    });

    const novaVistoria = await Vistoria.create({
      embarcacao_id: embarcacaoId,
      local_id: localId,
      vistoriador_id: vistoriador_id,
      administrador_id: req.user.id,
      status_id: statusPendente.id,
      dados_rascunho: dados_rascunho || null,
      valor_embarcacao: valor_embarcacao || null,
      valor_vistoria: valor_vistoria || null,
      valor_vistoriador: valor_vistoriador || null,
      contato_acompanhante_tipo: contato_acompanhante_tipo || null,
      contato_acompanhante_nome: contato_acompanhante_nome || null,
      contato_acompanhante_telefone_e164: contato_acompanhante_telefone_e164 || null,
      contato_acompanhante_email: contato_acompanhante_email || null,
      corretora_nome: corretora_nome || null,
      corretora_telefone_e164: corretora_telefone_e164 || null,
      corretora_email_laudo: corretora_email_laudo || null
    });

    logger.info('Vistoria criada', { vistoriaId: novaVistoria.id });

    // Copiar checklist automaticamente se a embarcação tiver tipo definido
    try {
      const embarcacao = await Embarcacao.findByPk(embarcacaoId);
      if (embarcacao && embarcacao.tipo_embarcacao) {
        logger.debug('Copiando checklist para tipo', { tipo: embarcacao.tipo_embarcacao });
        
        const template = await ChecklistTemplate.findOne({
          where: { tipo_embarcacao: embarcacao.tipo_embarcacao },
          include: [{
            model: ChecklistTemplateItem,
            as: 'itens',
            where: { ativo: true },
            required: false
          }]
        });
        
        if (template && template.itens && template.itens.length > 0) {
          for (const itemTemplate of template.itens) {
            await VistoriaChecklistItem.create({
              vistoria_id: novaVistoria.id,
              template_item_id: itemTemplate.id,
              ordem: itemTemplate.ordem,
              nome: itemTemplate.nome,
              descricao: itemTemplate.descricao,
              obrigatorio: itemTemplate.obrigatorio,
              permite_video: itemTemplate.permite_video,
              status: 'PENDENTE'
            });
          }
          logger.info('Checklist copiado automaticamente', { 
            vistoriaId: novaVistoria.id,
            itensCount: template.itens.length 
          });
        } else {
          logger.debug('Nenhum template de checklist encontrado', { tipo: embarcacao.tipo_embarcacao });
        }
      }
    } catch (checklistError) {
      logger.warn('Erro ao copiar checklist (não crítico)', { 
        error: checklistError.message,
        vistoriaId: novaVistoria.id 
      });
      // Não falha a criação da vistoria se houver erro no checklist
    }

    // Retornar a vistoria com associações
    const vistoriaCompleta = await Vistoria.findByPk(novaVistoria.id, {
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' }
      ]
    });

    res.status(201).json(vistoriaCompleta);

  } catch (error) {
    logger.error("Erro ao criar vistoria", { error: error.message, stack: error.stack });
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// Rota: GET /api/vistorias
router.get('/', requireAuth, async (req, res) => {
  try {
    logger.debug('GET /api/vistorias', { 
      userId: req.user?.id,
      nivelAcesso: req.user?.NivelAcesso?.nome 
    });
    
    const vistorias = await Vistoria.findAll({
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    logger.debug('Vistorias encontradas', { count: vistorias.length });
    
    res.json(vistorias);
  } catch (error) {
    logger.error("Erro ao buscar vistorias", { error: error.message, stack: error.stack });
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota: GET /api/vistorias/vistoriador - Vistorias atribuídas ao vistoriador logado
router.get('/vistoriador', requireAuth, async (req, res) => {
  try {
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
    res.json(vistorias);
  } catch (error) {
    logger.error("Erro ao buscar vistorias do vistoriador", { error: error.message, stack: error.stack });
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota: PUT /api/vistorias/:id - Atualizar vistoria
router.put('/:id', requireAuth, async (req, res) => {
  try {
    logger.debug('PUT /api/vistorias/:id', { 
      vistoriaId: req.params.id,
      userId: req.user?.id,
      nivelAcesso: req.user?.NivelAcesso?.nome 
    });
    
    const { id } = req.params;
    const updateData = req.body;

    const vistoria = await Vistoria.findByPk(id, {
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' }
      ]
    });

    if (!vistoria) {
      logger.warn('Vistoria não encontrada', { vistoriaId: id });
      return res.status(404).json({ error: "Vistoria não encontrada" });
    }

    // Verificar se o usuário pode editar esta vistoria
    // Admin pode editar qualquer vistoria, vistoriador só pode editar as suas
    const isAdmin = req.user.NivelAcesso?.id === 1;
    const isOwner = vistoria.vistoriador_id === req.user.id;

    if (!isAdmin && !isOwner) {
      logger.warn('Acesso negado - usuário não é admin nem dono da vistoria', { 
        userId: req.user?.id,
        vistoriaId: id 
      });
      return res.status(403).json({ error: "Acesso negado" });
    }

    logger.debug('Atualizando vistoria', { vistoriaId: id });
    await vistoria.update(updateData);
    
    // Recarregar com associações
    await vistoria.reload({
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome', 'email'] }
      ]
    });

    logger.info('Vistoria atualizada com sucesso', { vistoriaId: vistoria.id });
    res.json(vistoria);
  } catch (error) {
    logger.error("Erro ao atualizar vistoria", { error: error.message, stack: error.stack, vistoriaId: req.params.id });
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota: DELETE /api/vistorias/:id - Excluir vistoria (apenas se PENDENTE)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    logger.debug('DELETE /api/vistorias/:id', { 
      vistoriaId: req.params.id,
      userId: req.user?.id,
      nivelAcesso: req.user?.NivelAcesso?.nome 
    });
    
    const { id } = req.params;

    const vistoria = await Vistoria.findByPk(id, {
      include: [{ model: StatusVistoria, as: 'StatusVistoria' }]
    });
    
    if (!vistoria) {
      logger.warn('Vistoria não encontrada para exclusão', { vistoriaId: id });
      return res.status(404).json({ error: "Vistoria não encontrada" });
    }

    logger.debug('Vistoria encontrada', { 
      vistoriaId: vistoria.id,
      status: vistoria.StatusVistoria?.nome 
    });

    // Apenas admin pode excluir vistorias
    const isAdmin = req.user.NivelAcesso?.id === 1;
    
    if (!isAdmin) {
      logger.warn('Acesso negado - apenas administradores podem excluir vistorias', { 
        userId: req.user?.id,
        vistoriaId: id 
      });
      return res.status(403).json({ error: "Apenas administradores podem excluir vistorias" });
    }

    // NOVA VALIDACAO: Apenas permitir deletar se status for PENDENTE
    if (vistoria.StatusVistoria?.nome !== 'PENDENTE') {
      logger.warn('Tentativa bloqueada - status não permite exclusão', { 
        vistoriaId: id,
        status: vistoria.StatusVistoria?.nome 
      });
      return res.status(403).json({ 
        error: "Operação não permitida",
        message: `Apenas vistorias com status PENDENTE podem ser excluídas. Status atual: ${vistoria.StatusVistoria?.nome}` 
      });
    }

    logger.info('Excluindo vistoria', { vistoriaId: vistoria.id });
    await vistoria.destroy();
    logger.info('Vistoria excluída com sucesso', { vistoriaId: vistoria.id });
    
    res.json({ message: "Vistoria excluída com sucesso" });
  } catch (error) {
    logger.error("Erro ao excluir vistoria", { error: error.message, stack: error.stack, vistoriaId: req.params.id });
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota: GET /api/vistorias/:id - Buscar vistoria por ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const vistoria = await Vistoria.findByPk(id, {
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome', 'email', 'cpf'] }
      ]
    });

    if (!vistoria) {
      return res.status(404).json({ error: "Vistoria não encontrada" });
    }

    // Verificar se o usuário pode ver esta vistoria
    const isAdmin = req.user.NivelAcesso?.id === 1;
    const isOwner = vistoria.vistoriador_id === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    res.json(vistoria);
  } catch (error) {
    logger.error("Erro ao buscar vistoria", { error: error.message, stack: error.stack, vistoriaId: req.params.id });
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;