// backend/routes/vistoriaRoutes.js
const express = require('express');
const router = express.Router();
// Importamos os dois middlewares
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { Vistoria, Embarcacao, Local, StatusVistoria, Usuario } = require('../models');

// Rota: POST /api/vistorias
router.post('/', [requireAuth, requireAdmin], async (req, res) => {
  try {
    console.log('=== ROTA POST /api/vistorias ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Nível de acesso:', req.user?.NivelAcesso?.nome);
    console.log('Dados recebidos:', req.body);
    
    const {
      embarcacao_id,
      local_id,
      vistoriador_id,
      dados_rascunho,
      // Campos para criar nova embarcação (opcional)
      embarcacao_nome,
      embarcacao_numero_casco,
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
      console.log('Criando nova embarcação...');
      if (!embarcacao_nome || !embarcacao_numero_casco) {
        console.log('Validação falhou - campos obrigatórios ausentes');
        console.log('=== FIM ROTA POST /api/vistorias (400) ===\n');
        return res.status(400).json({ error: "Nome e número do casco são obrigatórios para nova embarcação" });
      }

      console.log('Dados da embarcação:', {
        nome: embarcacao_nome,
        numero_casco: embarcacao_numero_casco,
        proprietario_nome: req.body.embarcacao_proprietario_nome,
        proprietario_email: req.body.embarcacao_proprietario_email
      });

      const [embarcacao] = await Embarcacao.findOrCreate({
        where: { numero_casco: embarcacao_numero_casco },
        defaults: { 
          nome: embarcacao_nome,
          proprietario_nome: req.body.embarcacao_proprietario_nome || null,
          proprietario_email: req.body.embarcacao_proprietario_email || null
        }
      });
      embarcacaoId = embarcacao.id;
      console.log('Embarcação criada/encontrada com ID:', embarcacaoId);
    }

    // Se não foi fornecido local_id, criar novo local
    if (!localId) {
      console.log('Criando novo local...');
      if (!local_tipo) {
        console.log('Validação falhou - tipo do local é obrigatório');
        console.log('=== FIM ROTA POST /api/vistorias (400) ===\n');
        return res.status(400).json({ error: "Tipo do local é obrigatório para novo local" });
      }

      console.log('Dados do local:', {
        tipo: local_tipo,
        nome_local: local_nome_local,
        cep: local_cep,
        logradouro: local_logradouro,
        numero: local_numero,
        complemento: req.body.local_complemento,
        bairro: local_bairro,
        cidade: local_cidade,
        estado: local_estado
      });

      const local = await Local.create({
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
      localId = local.id;
      console.log('Local criado com ID:', localId);
    }

    // Pegar o status inicial 'PENDENTE'
    const statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    if (!statusPendente) {
      return res.status(500).json({ error: "Status 'PENDENTE' não encontrado" });
    }

    // Criar a vistoria
    console.log('Criando vistoria com dados:', {
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
      dados_rascunho: dados_rascunho || null
    });

    console.log('Vistoria criada com ID:', novaVistoria.id);

    // Retornar a vistoria com associações
    const vistoriaCompleta = await Vistoria.findByPk(novaVistoria.id, {
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' }
      ]
    });

    console.log('Vistoria completa retornada:', vistoriaCompleta.id);
    console.log('=== FIM ROTA POST /api/vistorias ===\n');
    res.status(201).json(vistoriaCompleta);

  } catch (error) {
    console.error("Erro ao criar vistoria:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

// Rota: GET /api/vistorias
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('=== ROTA GET /api/vistorias ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Nível de acesso:', req.user?.NivelAcesso?.nome);
    
    const vistorias = await Vistoria.findAll({
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' },
        { model: Usuario, as: 'vistoriador', attributes: ['id', 'nome', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    console.log('Vistorias encontradas:', vistorias.length);
    console.log('Primeira vistoria:', vistorias[0]?.id || 'Nenhuma');
    
    if (vistorias.length > 0) {
      console.log('Estrutura da primeira vistoria:');
      console.log('- ID:', vistorias[0].id);
      console.log('- Embarcacao:', vistorias[0].Embarcacao?.nome || 'N/A');
      console.log('- Local:', vistorias[0].Local?.nome_local || 'N/A');
      console.log('- Vistoriador:', vistorias[0].vistoriador?.nome || 'N/A');
      console.log('- Status:', vistorias[0].StatusVistoria?.nome || 'N/A');
    }
    
    console.log('=== FIM ROTA GET /api/vistorias ===\n');
    
    res.json(vistorias);
  } catch (error) {
    console.error("Erro ao buscar vistorias:", error);
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
    console.error("Erro ao buscar vistorias do vistoriador:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota: PUT /api/vistorias/:id - Atualizar vistoria
router.put('/:id', requireAuth, async (req, res) => {
  try {
    console.log('=== ROTA PUT /api/vistorias/:id ===');
    console.log('ID da vistoria:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Nível de acesso:', req.user?.NivelAcesso?.nome);
    console.log('Dados recebidos para atualização:', req.body);
    
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
      console.log('Vistoria não encontrada para ID:', id);
      console.log('=== FIM ROTA PUT /api/vistorias/:id (404) ===\n');
      return res.status(404).json({ error: "Vistoria não encontrada" });
    }

    // Verificar se o usuário pode editar esta vistoria
    // Admin pode editar qualquer vistoria, vistoriador só pode editar as suas
    const isAdmin = req.user.NivelAcesso?.id === 1;
    const isOwner = vistoria.vistoriador_id === req.user.id;

    if (!isAdmin && !isOwner) {
      console.log('Acesso negado - usuário não é admin nem dono da vistoria');
      console.log('=== FIM ROTA PUT /api/vistorias/:id (403) ===\n');
      return res.status(403).json({ error: "Acesso negado" });
    }

    console.log('Atualizando vistoria com dados:', updateData);
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

    console.log('Vistoria atualizada com sucesso:', vistoria.id);
    console.log('=== FIM ROTA PUT /api/vistorias/:id (200) ===\n');
    res.json(vistoria);
  } catch (error) {
    console.error("Erro ao atualizar vistoria:", error);
    console.log('=== FIM ROTA PUT /api/vistorias/:id (500) ===\n');
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota: DELETE /api/vistorias/:id - Excluir vistoria
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    console.log('=== ROTA DELETE /api/vistorias/:id ===');
    console.log('ID da vistoria:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Nível de acesso:', req.user?.NivelAcesso?.nome);
    
    const { id } = req.params;

    const vistoria = await Vistoria.findByPk(id);
    if (!vistoria) {
      console.log('Vistoria não encontrada para ID:', id);
      console.log('=== FIM ROTA DELETE /api/vistorias/:id (404) ===\n');
      return res.status(404).json({ error: "Vistoria não encontrada" });
    }

    console.log('Vistoria encontrada:', vistoria.id);

    // Apenas admin pode excluir vistorias
    const isAdmin = req.user.NivelAcesso?.id === 1;
    console.log('isAdmin:', isAdmin);
    
    if (!isAdmin) {
      console.log('Acesso negado - apenas administradores podem excluir vistorias');
      console.log('=== FIM ROTA DELETE /api/vistorias/:id (403) ===\n');
      return res.status(403).json({ error: "Apenas administradores podem excluir vistorias" });
    }

    console.log('Excluindo vistoria:', vistoria.id);
    await vistoria.destroy();
    console.log('Vistoria excluída com sucesso');
    console.log('=== FIM ROTA DELETE /api/vistorias/:id ===\n');
    
    res.json({ message: "Vistoria excluída com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir vistoria:", error);
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
        { model: StatusVistoria, as: 'StatusVistoria' }
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
    console.error("Erro ao buscar vistoria:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

module.exports = router;