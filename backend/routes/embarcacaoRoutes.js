// backend/routes/embarcacaoRoutes.js

const express = require('express');
const router = express.Router();
const { Embarcacao, Seguradora, Cliente } = require('../models');
const { requireAuth, requireVistoriador } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth, requireVistoriador);

// GET /api/embarcacoes - Listar todas as embarcações (com filtro opcional por CPF)
router.get('/', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/embarcacoes ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Nível de acesso:', req.user?.NivelAcesso?.nome);
    console.log('Query params:', req.query);
    
    const { proprietario_cpf } = req.query;
    
    const whereClause = {};
    if (proprietario_cpf) {
      whereClause.proprietario_cpf = proprietario_cpf;
      console.log('Filtrando por CPF:', proprietario_cpf);
    }
    
    const embarcacoes = await Embarcacao.findAll({
      where: whereClause,
      include: [
        {
          model: Seguradora,
          as: 'Seguradora',
          attributes: ['id', 'nome', 'ativo']
        },
        {
          model: Cliente,
          as: 'Cliente',
          attributes: ['id', 'tipo_pessoa', 'nome', 'cpf', 'cnpj', 'telefone_e164', 'email', 'cidade', 'estado']
        }
      ],
      order: [['nome', 'ASC']]
    });
    
    console.log('Embarcações encontradas:', embarcacoes.length);
    console.log('Primeira embarcação:', embarcacoes[0]?.nome || 'Nenhuma');
    console.log('=== FIM ROTA GET /api/embarcacoes ===\n');
    
    res.json(embarcacoes);
  } catch (error) {
    console.error('Erro ao listar embarcações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/embarcacoes/:id - Buscar embarcação por ID
router.get('/:id', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/embarcacoes/:id ===');
    console.log('ID solicitado:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const embarcacao = await Embarcacao.findByPk(req.params.id, {
      include: [
        {
          model: Seguradora,
          as: 'Seguradora',
          attributes: ['id', 'nome', 'ativo']
        },
        {
          model: Cliente,
          as: 'Cliente'
        }
      ]
    });
    
    if (!embarcacao) {
      console.log('Embarcação não encontrada para ID:', req.params.id);
      console.log('=== FIM ROTA GET /api/embarcacoes/:id (404) ===\n');
      return res.status(404).json({ error: 'Embarcação não encontrada' });
    }
    
    console.log('Embarcação encontrada:', embarcacao.nome);
    console.log('=== FIM ROTA GET /api/embarcacoes/:id ===\n');
    res.json(embarcacao);
  } catch (error) {
    console.error('Erro ao buscar embarcação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/embarcacoes - Criar nova embarcação
router.post('/', async (req, res) => {
  try {
    console.log('=== ROTA POST /api/embarcacoes ===');
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Dados recebidos:', req.body);
    
    const { 
      nome, 
      nr_inscricao_barco, 
      cliente_id,
      tipo_embarcacao,
      porte,
      seguradora_id,
      valor_embarcacao,
      ano_fabricacao
    } = req.body;
    
    // Validações básicas
    if (!nome || !nr_inscricao_barco) {
      console.log('Validação falhou - campos obrigatórios ausentes');
      console.log('=== FIM ROTA POST /api/embarcacoes (400) ===\n');
      return res.status(400).json({ error: 'Campos obrigatórios: nome, nr_inscricao_barco' });
    }
    
    console.log('Criando embarcação:', nome);
    const embarcacao = await Embarcacao.create({
      nome,
      nr_inscricao_barco,
      cliente_id: cliente_id || null,
      tipo_embarcacao: tipo_embarcacao || null,
      porte: porte || null,
      seguradora_id: seguradora_id || null,
      valor_embarcacao: valor_embarcacao || null,
      ano_fabricacao: ano_fabricacao || null
    });
    
    console.log('Embarcação criada com ID:', embarcacao.id);
    console.log('=== FIM ROTA POST /api/embarcacoes ===\n');
    res.status(201).json(embarcacao);
  } catch (error) {
    console.error('Erro ao criar embarcação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/embarcacoes/:id - Atualizar embarcação
router.put('/:id', async (req, res) => {
  try {
    console.log('=== ROTA PUT /api/embarcacoes/:id ===');
    console.log('ID da embarcação:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    console.log('Dados recebidos para atualização:', req.body);
    
    let embarcacao;
    try {
      embarcacao = await Embarcacao.findByPk(req.params.id);
    } catch (dbError) {
      // Se a tabela não existir ou houver erro de banco, retornar 500
      console.error('Erro ao buscar embarcação:', dbError);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
    
    if (!embarcacao) {
      console.log('Embarcação não encontrada para ID:', req.params.id);
      console.log('=== FIM ROTA PUT /api/embarcacoes/:id (404) ===\n');
      return res.status(404).json({ error: 'Embarcação não encontrada' });
    }
    
    console.log('Embarcação encontrada:', embarcacao.nome);
    
    const { 
      nome, 
      nr_inscricao_barco, 
      cliente_id,
      tipo_embarcacao,
      porte,
      seguradora_id,
      valor_embarcacao,
      ano_fabricacao
    } = req.body;
    
    await embarcacao.update({
      nome: nome || embarcacao.nome,
      nr_inscricao_barco: nr_inscricao_barco || embarcacao.nr_inscricao_barco,
      cliente_id: cliente_id !== undefined ? cliente_id : embarcacao.cliente_id,
      tipo_embarcacao: tipo_embarcacao !== undefined ? tipo_embarcacao : embarcacao.tipo_embarcacao,
      porte: porte !== undefined ? porte : embarcacao.porte,
      seguradora_id: seguradora_id !== undefined ? seguradora_id : embarcacao.seguradora_id,
      valor_embarcacao: valor_embarcacao !== undefined ? valor_embarcacao : embarcacao.valor_embarcacao,
      ano_fabricacao: ano_fabricacao !== undefined ? ano_fabricacao : embarcacao.ano_fabricacao
    });
    
    // Recarregar com associações
    await embarcacao.reload({
      include: [
        {
          model: Seguradora,
          as: 'Seguradora',
          attributes: ['id', 'nome', 'ativo']
        },
        {
          model: Cliente,
          as: 'Cliente'
        }
      ]
    });
    
    console.log('Embarcação atualizada com sucesso');
    console.log('=== FIM ROTA PUT /api/embarcacoes/:id ===\n');
    
    res.json(embarcacao);
  } catch (error) {
    console.error('Erro ao atualizar embarcação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/embarcacoes/:id - Excluir embarcação
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== ROTA DELETE /api/embarcacoes/:id ===');
    console.log('ID da embarcação:', req.params.id);
    console.log('Usuário:', req.user?.nome, '(ID:', req.user?.id, ')');
    
    const embarcacao = await Embarcacao.findByPk(req.params.id);
    
    if (!embarcacao) {
      console.log('Embarcação não encontrada para ID:', req.params.id);
      console.log('=== FIM ROTA DELETE /api/embarcacoes/:id (404) ===\n');
      return res.status(404).json({ error: 'Embarcação não encontrada' });
    }
    
    console.log('Excluindo embarcação:', embarcacao.nome);
    await embarcacao.destroy();
    console.log('Embarcação excluída com sucesso');
    console.log('=== FIM ROTA DELETE /api/embarcacoes/:id ===\n');
    
    res.json({ message: 'Embarcação excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir embarcação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
