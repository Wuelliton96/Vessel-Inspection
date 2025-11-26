// Helpers para testes
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../../models');
const { 
  Usuario, 
  NivelAcesso, 
  Embarcacao, 
  Local, 
  StatusVistoria, 
  Vistoria,
  Foto,
  Laudo,
  TipoFotoChecklist
} = require('../../models');

/**
 * Cria dados de teste padrão para o sistema
 */
const createTestData = async () => {
  // Criar níveis de acesso
  const nivelAdmin = await NivelAcesso.create({
    nome: 'ADMINISTRADOR',
    descricao: 'Administrador do sistema'
  });

  const nivelVistoriador = await NivelAcesso.create({
    nome: 'VISTORIADOR',
    descricao: 'Vistoriador'
  });

  const nivelAprovador = await NivelAcesso.create({
    nome: 'APROVADOR',
    descricao: 'Aprovador de vistorias'
  });

  // Criar usuários
  const senhaHash = await bcrypt.hash('Teste@123', 10);
  
  const usuarioAdmin = await Usuario.create({
    cpf: '12345678901',
    nome: 'Admin Teste',
    email: 'admin@teste.com',
    senha_hash: senhaHash,
    nivel_acesso_id: nivelAdmin.id
  });

  const usuarioVistoriador = await Usuario.create({
    cpf: '12345678902',
    nome: 'Vistoriador Teste',
    email: 'vistoriador@teste.com',
    senha_hash: senhaHash,
    nivel_acesso_id: nivelVistoriador.id
  });

  const usuarioAprovador = await Usuario.create({
    cpf: '12345678903',
    nome: 'Aprovador Teste',
    email: 'aprovador@teste.com',
    senha_hash: senhaHash,
    nivel_acesso_id: nivelAprovador.id
  });

  // Criar embarcações
  const embarcacao1 = await Embarcacao.create({
    nome: 'Barco Teste 1',
    nr_inscricao_barco: 'TEST001',
    proprietario_nome: 'Proprietário 1',
    proprietario_email: 'proprietario1@teste.com'
  });

  const embarcacao2 = await Embarcacao.create({
    nome: 'Barco Teste 2',
    nr_inscricao_barco: 'TEST002',
    proprietario_nome: 'Proprietário 2',
    proprietario_email: 'proprietario2@teste.com'
  });

  // Criar locais
  const local1 = await Local.create({
    tipo: 'MARINA',
    nome_local: 'Marina Teste',
    cep: '12345-678',
    logradouro: 'Rua das Marinhas',
    numero: '123',
    bairro: 'Centro',
    cidade: 'Rio de Janeiro',
    estado: 'RJ'
  });

  const local2 = await Local.create({
    tipo: 'RESIDENCIA',
    nome_local: 'Residência Teste',
    cep: '87654-321',
    logradouro: 'Rua das Residências',
    numero: '456',
    bairro: 'Copacabana',
    cidade: 'Rio de Janeiro',
    estado: 'RJ'
  });

  // Criar status de vistoria
  const statusPendente = await StatusVistoria.create({
    nome: 'PENDENTE',
    descricao: 'Vistoria pendente'
  });

  const statusEmAndamento = await StatusVistoria.create({
    nome: 'EM_ANDAMENTO',
    descricao: 'Vistoria em andamento'
  });

  const statusConcluida = await StatusVistoria.create({
    nome: 'CONCLUIDA',
    descricao: 'Vistoria concluída'
  });

  const statusAprovada = await StatusVistoria.create({
    nome: 'APROVADA',
    descricao: 'Vistoria aprovada'
  });

  const statusRejeitada = await StatusVistoria.create({
    nome: 'REJEITADA',
    descricao: 'Vistoria rejeitada'
  });

  // Criar tipos de foto
  const tipoFotoCasco = await TipoFotoChecklist.create({
    codigo: 'CASCO',
    nome_exibicao: 'Foto do Casco',
    descricao: 'Foto obrigatória do casco da embarcação',
    obrigatorio: true
  });

  const tipoFotoMotor = await TipoFotoChecklist.create({
    codigo: 'MOTOR',
    nome_exibicao: 'Foto do Motor',
    descricao: 'Foto do motor da embarcação',
    obrigatorio: true
  });

  const tipoFotoInterior = await TipoFotoChecklist.create({
    codigo: 'INTERIOR',
    nome_exibicao: 'Foto do Interior',
    descricao: 'Foto do interior da embarcação',
    obrigatorio: false
  });

  // Criar vistorias
  const vistoria1 = await Vistoria.create({
    embarcacao_id: embarcacao1.id,
    local_id: local1.id,
    vistoriador_id: usuarioVistoriador.id,
    administrador_id: usuarioAdmin.id,
    status_id: statusPendente.id,
    dados_rascunho: { campo1: 'valor1', campo2: 'valor2' }
  });

  const vistoria2 = await Vistoria.create({
    embarcacao_id: embarcacao2.id,
    local_id: local2.id,
    vistoriador_id: usuarioVistoriador.id,
    administrador_id: usuarioAdmin.id,
    status_id: statusEmAndamento.id,
    dados_rascunho: { campo3: 'valor3' }
  });

  // Criar fotos
  const foto1 = await Foto.create({
    url_arquivo: 'https://example.com/foto1.jpg',
    observacao: 'Foto do casco em boas condições',
    vistoria_id: vistoria1.id,
    tipo_foto_id: tipoFotoCasco.id
  });

  const foto2 = await Foto.create({
    url_arquivo: 'https://example.com/foto2.jpg',
    observacao: 'Foto do motor funcionando',
    vistoria_id: vistoria1.id,
    tipo_foto_id: tipoFotoMotor.id
  });

  // Criar laudos
  const laudo1 = await Laudo.create({
    url_pdf: 'https://example.com/laudo1.pdf',
    vistoria_id: vistoria1.id
  });

  return {
    niveisAcesso: {
      admin: nivelAdmin,
      vistoriador: nivelVistoriador,
      aprovador: nivelAprovador
    },
    usuarios: {
      admin: usuarioAdmin,
      vistoriador: usuarioVistoriador,
      aprovador: usuarioAprovador
    },
    embarcacoes: {
      embarcacao1,
      embarcacao2
    },
    locais: {
      local1,
      local2
    },
    statusVistoria: {
      pendente: statusPendente,
      emAndamento: statusEmAndamento,
      concluida: statusConcluida,
      aprovada: statusAprovada,
      rejeitada: statusRejeitada
    },
    tiposFoto: {
      casco: tipoFotoCasco,
      motor: tipoFotoMotor,
      interior: tipoFotoInterior
    },
    vistorias: {
      vistoria1,
      vistoria2
    },
    fotos: {
      foto1,
      foto2
    },
    laudos: {
      laudo1
    }
  };
};

/**
 * Limpa todos os dados de teste
 */
const cleanupTestData = async () => {
  // Deletar em ordem para respeitar foreign keys
  await Laudo.destroy({ where: {}, force: true });
  await Foto.destroy({ where: {}, force: true });
  await Vistoria.destroy({ where: {}, force: true });
  await TipoFotoChecklist.destroy({ where: {}, force: true });
  await StatusVistoria.destroy({ where: {}, force: true });
  await Local.destroy({ where: {}, force: true });
  await Embarcacao.destroy({ where: {}, force: true });
  await Usuario.destroy({ where: {}, force: true });
  await NivelAcesso.destroy({ where: {}, force: true });
};

/**
 * Cria um usuário de teste com dados específicos
 */
const createTestUser = async (overrides = {}) => {
  const senhaHash = await bcrypt.hash('Teste@123', 10);
  const defaultData = {
    cpf: '12345678900',
    nome: 'Usuário Teste',
    email: 'teste@teste.com',
    senha_hash: senhaHash,
    nivel_acesso_id: 1,
    ativo: true
  };

  const userData = { ...defaultData, ...overrides };
  // Se cpf não foi fornecido, gerar um único
  if (!userData.cpf || userData.cpf === defaultData.cpf) {
    userData.cpf = `${Date.now()}`.slice(-11).padStart(11, '0');
  }
  return await Usuario.create(userData);
};

/**
 * Cria uma embarcação de teste com dados específicos
 */
const createTestEmbarcacao = async (overrides = {}) => {
  const defaultData = {
    nome: 'Barco Teste',
    nr_inscricao_barco: 'TEST001',
    proprietario_nome: 'Proprietário Teste',
    proprietario_email: 'proprietario@teste.com'
  };

  const embarcacaoData = { ...defaultData, ...overrides };
  return await Embarcacao.create(embarcacaoData);
};

/**
 * Cria um local de teste com dados específicos
 */
const createTestLocal = async (overrides = {}) => {
  const defaultData = {
    tipo: 'MARINA',
    nome_local: 'Local Teste',
    cep: '12345-678',
    cidade: 'Rio de Janeiro',
    estado: 'RJ'
  };

  const localData = { ...defaultData, ...overrides };
  return await Local.create(localData);
};

/**
 * Cria um status de vistoria de teste
 */
const createTestStatusVistoria = async (overrides = {}) => {
  const defaultData = {
    nome: 'PENDENTE',
    descricao: 'Vistoria pendente'
  };

  const statusData = { ...defaultData, ...overrides };
  return await StatusVistoria.create(statusData);
};

/**
 * Cria uma vistoria de teste com dados específicos
 */
const createTestVistoria = async (overrides = {}) => {
  const defaultData = {
    embarcacao_id: 1,
    local_id: 1,
    vistoriador_id: 1,
    administrador_id: 1,
    status_id: 1,
    dados_rascunho: { teste: 'dados' }
  };

  const vistoriaData = { ...defaultData, ...overrides };
  return await Vistoria.create(vistoriaData);
};

/**
 * Cria uma vistoria completa com todos os dados relacionados
 * Útil para testes que precisam de uma vistoria completa
 */
const createTestVistoriaCompleta = async (options = {}) => {
  const {
    vistoriador,
    administrador,
    statusNome = 'EM_ANDAMENTO',
    embarcacaoOverrides = {},
    localOverrides = {},
    vistoriaOverrides = {}
  } = options;

  if (!vistoriador || !administrador) {
    throw new Error('vistoriador e administrador são obrigatórios');
  }

  // Criar status, embarcação e local
  const status = await createTestStatusVistoria({ nome: statusNome });
  const embarcacao = await createTestEmbarcacao(embarcacaoOverrides);
  const local = await createTestLocal(localOverrides);

  // Criar vistoria
  const vistoria = await Vistoria.create({
    embarcacao_id: embarcacao.id,
    local_id: local.id,
    vistoriador_id: vistoriador.id,
    administrador_id: administrador.id,
    status_id: status.id,
    ...vistoriaOverrides
  });

  return { vistoria, status, embarcacao, local };
};

/**
 * Mock de dados para requisições
 */
const mockRequestData = {
  usuario: {
    id: 1,
    email: 'teste@teste.com',
    nome: 'Usuário Teste',
    cpf: '12345678900'
  },
  vistoria: {
    embarcacao_nome: 'Barco Teste',
    embarcacao_nr_inscricao_barco: 'TEST001',
    local_tipo: 'MARINA',
    local_cep: '12345-678',
    vistoriador_id: 1
  }
};

/**
 * Setup básico do ambiente de teste (sequelize sync + níveis de acesso)
 */
const setupTestEnvironment = async () => {
  await sequelize.sync({ force: true });
  
  const nivelAdmin = await NivelAcesso.create({ 
    id: 1, 
    nome: 'ADMINISTRADOR', 
    descricao: 'Admin' 
  });
  
  const nivelVistoriador = await NivelAcesso.create({ 
    id: 2, 
    nome: 'VISTORIADOR', 
    descricao: 'Vistoriador' 
  });
  
  return { nivelAdmin, nivelVistoriador };
};

/**
 * Cria usuários de teste (admin e vistoriador)
 */
const createTestUsers = async (senhaHash, nivelAdmin, nivelVistoriador, suffix = '') => {
  const timestamp = Date.now();
  const randomSuffix = suffix || Math.floor(Math.random() * 1000);
  
  const admin = await Usuario.create({
    cpf: `123456789${String(randomSuffix).padStart(2, '0')}`,
    nome: 'Admin',
    email: `admin${suffix}@test${timestamp}.com`,
    senha_hash: senhaHash,
    nivel_acesso_id: nivelAdmin.id
  });
  
  const vistoriador = await Usuario.create({
    cpf: `123456789${String(randomSuffix + 1).padStart(2, '0')}`,
    nome: 'Vistoriador',
    email: `vist${suffix}@test${timestamp}.com`,
    senha_hash: senhaHash,
    nivel_acesso_id: nivelVistoriador.id
  });
  
  return { admin, vistoriador };
};

/**
 * Gera tokens JWT para os usuários
 */
const generateTokens = (admin, vistoriador) => {
  const adminToken = jwt.sign(
    { userId: admin.id, cpf: admin.cpf, nivelAcessoId: 1 },
    process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
  );
  
  const vistoriadorToken = jwt.sign(
    { userId: vistoriador.id, cpf: vistoriador.cpf, nivelAcessoId: 2 },
    process.env.JWT_SECRET || 'sua-chave-secreta-jwt'
  );
  
  return { adminToken, vistoriadorToken };
};

/**
 * Setup completo do ambiente de teste (recomendado para a maioria dos testes)
 */
const setupCompleteTestEnvironment = async (suffix = '') => {
  const { nivelAdmin, nivelVistoriador } = await setupTestEnvironment();
  const senhaHash = await bcrypt.hash('Teste@123', 10);
  const { admin, vistoriador } = await createTestUsers(senhaHash, nivelAdmin, nivelVistoriador, suffix);
  const { adminToken, vistoriadorToken } = generateTokens(admin, vistoriador);
  
  return {
    nivelAdmin,
    nivelVistoriador,
    admin,
    vistoriador,
    adminToken,
    vistoriadorToken
  };
};

/**
 * Cria uma instância do Express app configurada para testes
 */
const createTestApp = (routes) => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  if (Array.isArray(routes)) {
    for (const route of routes) {
      app.use(route.path, route.router);
    }
  } else if (routes.path && routes.router) {
    app.use(routes.path, routes.router);
  }
  
  return app;
};

module.exports = {
  createTestData,
  cleanupTestData,
  createTestUser,
  createTestEmbarcacao,
  createTestLocal,
  createTestVistoria,
  createTestVistoriaCompleta,
  createTestStatusVistoria,
  mockRequestData,
  // Novos helpers reutilizáveis
  setupTestEnvironment,
  createTestUsers,
  generateTokens,
  setupCompleteTestEnvironment,
  createTestApp
};
