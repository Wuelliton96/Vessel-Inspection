/**
 * Utilitário para preencher automaticamente campos do laudo
 * com dados da vistoria, embarcação e cliente
 */

/**
 * Preenche dados do laudo com informações da vistoria e embarcação
 */
function preencherDadosLaudo(vistoria, dadosIniciais = {}) {
  const embarcacao = vistoria?.Embarcacao || {};
  const cliente = embarcacao?.Cliente || {};
  const local = vistoria?.Local || {};
  // Tentar ambos os nomes de associação (vistoriador minúscula e Vistoriador maiúscula)
  const vistoriador = vistoria?.vistoriador || vistoria?.Vistoriador || {};
  
  console.log('[preencherDadosLaudo] Vistoriador encontrado:', vistoriador);
  console.log('[preencherDadosLaudo] Nome do vistoriador:', vistoriador?.nome || 'NÃO ENCONTRADO');
  
  // Construir endereço completo do local de vistoria
  const construirEnderecoLocal = (localObj) => {
    if (!localObj) return '';
    
    const partes = [];
    if (localObj.logradouro) partes.push(localObj.logradouro);
    if (localObj.numero) partes.push(localObj.numero);
    if (localObj.complemento) partes.push(localObj.complemento);
    if (localObj.bairro) partes.push(localObj.bairro);
    if (localObj.cidade) partes.push(localObj.cidade);
    if (localObj.estado) partes.push(localObj.estado);
    if (localObj.cep) partes.push(`CEP: ${localObj.cep}`);
    
    return partes.join(', ').replace(/^,\s*/, '').replace(/,\s*,/g, ',');
  };
  
  // Construir endereço do proprietário/cliente
  const construirEnderecoProprietario = () => {
    if (!cliente || Object.keys(cliente).length === 0) return '';
    
    const partes = [];
    if (cliente.logradouro) partes.push(cliente.logradouro);
    if (cliente.numero) partes.push(cliente.numero);
    if (cliente.complemento) partes.push(cliente.complemento);
    if (cliente.bairro) partes.push(cliente.bairro);
    if (cliente.cidade) partes.push(cliente.cidade);
    if (cliente.estado) partes.push(cliente.estado);
    if (cliente.cep) partes.push(`CEP: ${cliente.cep}`);
    
    return partes.join(', ').replace(/^,\s*/, '').replace(/,\s*,/g, ',');
  };
  
  // Dados básicos
  const dadosPreenchidos = {
    // Dados gerais
    nome_moto_aquatica: dadosIniciais.nome_moto_aquatica || embarcacao.nome || '',
    proprietario: dadosIniciais.proprietario || embarcacao.proprietario_nome || cliente.nome || '',
    cpf_cnpj: dadosIniciais.cpf_cnpj || embarcacao.proprietario_cpf || cliente.cpf || cliente.cnpj || '',
    endereco_proprietario: dadosIniciais.endereco_proprietario || construirEnderecoProprietario(),
    data_inspecao: dadosIniciais.data_inspecao || vistoria.data_conclusao || vistoria.data_inicio || null,
    local_vistoria: dadosIniciais.local_vistoria || construirEnderecoLocal(local),
    local_guarda: dadosIniciais.local_guarda || construirEnderecoLocal(local),
    
    // Dados da embarcação
    inscricao_capitania: dadosIniciais.inscricao_capitania || embarcacao.nr_inscricao_barco || '',
    tipo_embarcacao: dadosIniciais.tipo_embarcacao || embarcacao.tipo_embarcacao || '',
    ano_fabricacao: dadosIniciais.ano_fabricacao || embarcacao.ano_fabricacao || null,
    valor_risco: dadosIniciais.valor_risco || vistoria.valor_embarcacao || embarcacao.valor_embarcacao || null,
    
    // Dados da empresa/vistoria
    empresa_prestadora: dadosIniciais.empresa_prestadora || 'Vessel Inspection',
    responsavel_inspecao: dadosIniciais.responsavel_inspecao || vistoriador?.nome || '',
    nome_empresa: dadosIniciais.nome_empresa || '',
    logo_empresa_url: dadosIniciais.logo_empresa_url || '',
    nota_rodape: dadosIniciais.nota_rodape || '',
    participantes_inspecao: dadosIniciais.participantes_inspecao || '',
    
    // Versão padrão
    versao: dadosIniciais.versao || 'BS 2021-01',
  };
  
  // Não remover campos vazios - deixar como estão para que possam ser preenchidos depois
  // Apenas garantir que não sejam undefined
  Object.keys(dadosPreenchidos).forEach(key => {
    if (dadosPreenchidos[key] === undefined) {
      dadosPreenchidos[key] = null;
    }
  });
  
  return dadosPreenchidos;
}

/**
 * Preenche dados do laudo quando já existe (atualização)
 */
function preencherDadosLaudoExistente(laudo, vistoria, dadosAtualizados = {}) {
  // Mesmo processo, mas preserva dados existentes do laudo
  const dadosPreenchidos = preencherDadosLaudo(vistoria, {
    ...laudo.toJSON ? laudo.toJSON() : laudo,
    ...dadosAtualizados
  });
  
  return dadosPreenchidos;
}

module.exports = {
  preencherDadosLaudo,
  preencherDadosLaudoExistente
};

