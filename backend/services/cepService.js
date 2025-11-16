const axios = require('axios');

/**
 * Servico de integracao com ViaCEP
 * API externa para buscar dados de endereco por CEP
 * Documentacao: https://viacep.com.br/
 */

const VIACEP_BASE_URL = 'https://viacep.com.br/ws';

/**
 * Busca informacoes de endereco pelo CEP
 * @param {string} cep - CEP no formato 12345678 ou 12345-678
 * @returns {Promise<Object>} Dados do endereco
 */
const buscarEnderecoPorCEP = async (cep) => {
  try {
    // Remover caracteres nao numericos
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Validar formato
    if (cepLimpo.length !== 8) {
      throw new Error('CEP invalido. Deve conter 8 digitos.');
    }
    
    console.log(`[CEP] Buscando endereco para CEP: ${cepLimpo}`);
    
    const response = await axios.get(`${VIACEP_BASE_URL}/${cepLimpo}/json/`, {
      timeout: 5000 // 5 segundos de timeout
    });
    
    if (response.data.erro) {
      throw new Error('CEP nao encontrado');
    }
    
    const endereco = {
      cep: response.data.cep,
      logradouro: response.data.logradouro,
      complemento: response.data.complemento,
      bairro: response.data.bairro,
      cidade: response.data.localidade,
      uf: response.data.uf,
      ibge: response.data.ibge,
      gia: response.data.gia,
      ddd: response.data.ddd,
      siafi: response.data.siafi
    };
    
    console.log(`[CEP] Endereco encontrado: ${endereco.logradouro}, ${endereco.cidade}/${endereco.uf}`);
    
    return endereco;
  } catch (error) {
    if (error.response) {
      console.error('[CEP] Erro na resposta da API:', error.response.status);
      throw new Error('Erro ao consultar CEP. Tente novamente.');
    } else if (error.request) {
      console.error('[CEP] Erro de conexao com ViaCEP');
      throw new Error('Erro de conexao com servico de CEP. Verifique sua internet.');
    } else {
      console.error('[CEP] Erro:', error.message);
      throw error;
    }
  }
};

/**
 * Busca CEP por endereco
 * @param {string} uf - UF com 2 letras (ex: SP)
 * @param {string} cidade - Nome da cidade
 * @param {string} logradouro - Nome da rua/avenida
 * @returns {Promise<Array>} Lista de enderecos encontrados
 */
const buscarCEPPorEndereco = async (uf, cidade, logradouro) => {
  try {
    if (!uf || !cidade || !logradouro) {
      throw new Error('UF, cidade e logradouro sao obrigatorios');
    }
    
    if (uf.length !== 2) {
      throw new Error('UF deve ter 2 letras');
    }
    
    if (logradouro.length < 3) {
      throw new Error('Logradouro deve ter no minimo 3 caracteres');
    }
    
    console.log(`[CEP] Buscando CEP para: ${logradouro}, ${cidade}/${uf}`);
    
    const url = `${VIACEP_BASE_URL}/${uf}/${cidade}/${logradouro}/json/`;
    const response = await axios.get(url, {
      timeout: 5000
    });
    
    if (!Array.isArray(response.data) || response.data.length === 0) {
      throw new Error('Nenhum CEP encontrado para este endereco');
    }
    
    const enderecos = response.data.map(item => ({
      cep: item.cep,
      logradouro: item.logradouro,
      complemento: item.complemento,
      bairro: item.bairro,
      cidade: item.localidade,
      uf: item.uf,
      ibge: item.ibge
    }));
    
    console.log(`[CEP] ${enderecos.length} endereco(s) encontrado(s)`);
    
    return enderecos;
  } catch (error) {
    if (error.response) {
      console.error('[CEP] Erro na resposta da API:', error.response.status);
      throw new Error('Erro ao buscar CEP. Tente novamente.');
    } else if (error.request) {
      console.error('[CEP] Erro de conexao com ViaCEP');
      throw new Error('Erro de conexao com servico de CEP.');
    } else {
      console.error('[CEP] Erro:', error.message);
      throw error;
    }
  }
};

module.exports = {
  buscarEnderecoPorCEP,
  buscarCEPPorEndereco
};


