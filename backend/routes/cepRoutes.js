const express = require('express');
const router = express.Router();
const { buscarEnderecoPorCEP, buscarCEPPorEndereco } = require('../services/cepService');
const { requireAuth } = require('../middleware/auth');

// Aplicar autenticacao em todas as rotas
router.use(requireAuth);

// GET /api/cep/:cep - Buscar endereco por CEP
router.get('/:cep', async (req, res) => {
  try {
    const { cep } = req.params;
    
    console.log('[CEP API] Buscando CEP:', cep);
    
    const endereco = await buscarEnderecoPorCEP(cep);
    
    res.json({
      success: true,
      data: endereco
    });
  } catch (error) {
    console.error('[CEP API] Erro:', error.message);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET /api/cep/buscar/:uf/:cidade/:logradouro - Buscar CEP por endereco
router.get('/buscar/:uf/:cidade/:logradouro', async (req, res) => {
  try {
    const { uf, cidade, logradouro } = req.params;
    
    console.log('[CEP API] Buscando endereco:', uf, cidade, logradouro);
    
    const enderecos = await buscarCEPPorEndereco(uf, cidade, logradouro);
    
    res.json({
      success: true,
      data: enderecos,
      count: enderecos.length
    });
  } catch (error) {
    console.error('[CEP API] Erro:', error.message);
    res.status(400).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;


