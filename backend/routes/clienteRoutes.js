// backend/routes/clienteRoutes.js

const express = require('express');
const router = express.Router();
const { Cliente, Embarcacao } = require('../models');
const { requireAuth, requireVistoriador } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth, requireVistoriador);

// GET /api/clientes - Listar todos os clientes
router.get('/', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/clientes ===');
    
    const { ativo, tipo_pessoa, cpf, cnpj } = req.query;
    
    const whereClause = {};
    if (ativo !== undefined) whereClause.ativo = ativo === 'true';
    if (tipo_pessoa) whereClause.tipo_pessoa = tipo_pessoa;
    if (cpf) whereClause.cpf = cpf.replace(/\D/g, '');
    if (cnpj) whereClause.cnpj = cnpj.replace(/\D/g, '');
    
    const clientes = await Cliente.findAll({
      where: whereClause,
      include: [
        {
          model: Embarcacao,
          as: 'embarcacoes',
          attributes: ['id', 'nome', 'nr_inscricao_barco']
        }
      ],
      order: [['nome', 'ASC']]
    });
    
    console.log('Clientes encontrados:', clientes.length);
    res.json(clientes);
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/clientes/buscar/:documento - Buscar cliente por CPF ou CNPJ
router.get('/buscar/:documento', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/clientes/buscar/:documento ===');
    const documento = req.params.documento.replace(/\D/g, '');
    
    const whereClause = {};
    if (documento.length === 11) {
      whereClause.cpf = documento;
    } else if (documento.length === 14) {
      whereClause.cnpj = documento;
    } else {
      return res.status(400).json({ error: 'Documento inválido. Use CPF (11 dígitos) ou CNPJ (14 dígitos)' });
    }
    
    const cliente = await Cliente.findOne({
      where: whereClause,
      include: [
        {
          model: Embarcacao,
          as: 'embarcacoes',
          attributes: ['id', 'nome', 'nr_inscricao_barco', 'tipo_embarcacao', 'porte', 'valor_embarcacao', 'ano_fabricacao']
        }
      ]
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    console.log('Cliente encontrado:', cliente.nome);
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/clientes/:id - Buscar cliente por ID
router.get('/:id', async (req, res) => {
  try {
    console.log('=== ROTA GET /api/clientes/:id ===');
    
    const cliente = await Cliente.findByPk(req.params.id, {
      include: [
        {
          model: Embarcacao,
          as: 'embarcacoes'
        }
      ]
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/clientes - Criar novo cliente
router.post('/', async (req, res) => {
  try {
    console.log('=== ROTA POST /api/clientes ===');
    console.log('Dados recebidos:', req.body);
    
    const {
      tipo_pessoa,
      nome,
      cpf,
      cnpj,
      telefone_e164,
      email,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      observacoes
    } = req.body;
    
    // Validações
    if (!nome) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    const tipoPessoa = tipo_pessoa || 'FISICA';
    
    if (tipoPessoa === 'FISICA' && !cpf) {
      return res.status(400).json({ error: 'CPF é obrigatório para pessoa física' });
    }
    
    if (tipoPessoa === 'JURIDICA' && !cnpj) {
      return res.status(400).json({ error: 'CNPJ é obrigatório para pessoa jurídica' });
    }
    
    const cliente = await Cliente.create({
      tipo_pessoa: tipoPessoa,
      nome,
      cpf: cpf || null,
      cnpj: cnpj || null,
      telefone_e164: telefone_e164 || null,
      email: email || null,
      cep: cep || null,
      logradouro: logradouro || null,
      numero: numero || null,
      complemento: complemento || null,
      bairro: bairro || null,
      cidade: cidade || null,
      estado: estado || null,
      observacoes: observacoes || null
    });
    
    console.log('Cliente criado:', cliente.id);
    res.status(201).json(cliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'CPF/CNPJ já cadastrado' });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/clientes/:id - Atualizar cliente
router.put('/:id', async (req, res) => {
  try {
    console.log('=== ROTA PUT /api/clientes/:id ===');
    
    const cliente = await Cliente.findByPk(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    const {
      nome,
      telefone_e164,
      email,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      observacoes,
      ativo
    } = req.body;
    
    await cliente.update({
      nome: nome !== undefined ? nome : cliente.nome,
      telefone_e164: telefone_e164 !== undefined ? telefone_e164 : cliente.telefone_e164,
      email: email !== undefined ? email : cliente.email,
      cep: cep !== undefined ? cep : cliente.cep,
      logradouro: logradouro !== undefined ? logradouro : cliente.logradouro,
      numero: numero !== undefined ? numero : cliente.numero,
      complemento: complemento !== undefined ? complemento : cliente.complemento,
      bairro: bairro !== undefined ? bairro : cliente.bairro,
      cidade: cidade !== undefined ? cidade : cliente.cidade,
      estado: estado !== undefined ? estado : cliente.estado,
      observacoes: observacoes !== undefined ? observacoes : cliente.observacoes,
      ativo: ativo !== undefined ? ativo : cliente.ativo
    });
    
    console.log('Cliente atualizado com sucesso');
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/clientes/:id - Excluir cliente
router.delete('/:id', async (req, res) => {
  try {
    console.log('=== ROTA DELETE /api/clientes/:id ===');
    
    const cliente = await Cliente.findByPk(req.params.id, {
      include: [
        {
          model: Embarcacao,
          as: 'embarcacoes'
        }
      ]
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    // Verificar se tem embarcações vinculadas
    if (cliente.embarcacoes && cliente.embarcacoes.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir cliente com embarcações vinculadas',
        message: `Este cliente possui ${cliente.embarcacoes.length} embarcação(ões) cadastrada(s).`
      });
    }
    
    await cliente.destroy();
    
    console.log('Cliente excluído com sucesso');
    res.json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /api/clientes/:id/toggle-status - Ativar/Desativar cliente
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    cliente.ativo = !cliente.ativo;
    await cliente.save();
    
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;


