const { sequelize } = require('../models')
const { 
  Usuario, 
  Embarcacao, 
  Local, 
  StatusVistoria, 
  Vistoria,
  Laudo,
  NivelAcesso,
  ChecklistTemplate,
  ChecklistTemplateItem
} = require('../models')
const bcrypt = require('bcryptjs')
const { criarTemplateCompleto } = require('./helpers/templateHelper')

async function seedDatabase() {
  try {
    console.log('Iniciando seed do banco de dados...')

    // Sincronizar banco
    await sequelize.sync({ force: true })
    console.log('[OK] Banco sincronizado')

    // Criar Status de Vistoria
    const statusAprovada = await StatusVistoria.create({
      nome: 'APROVADA',
      descricao: 'Vistoria aprovada'
    })

    const statusPendente = await StatusVistoria.create({
      nome: 'PENDENTE',
      descricao: 'Vistoria pendente de análise'
    })

    const statusReprovada = await StatusVistoria.create({
      nome: 'REPROVADA',
      descricao: 'Vistoria reprovada'
    })

    console.log('[OK] Status de vistorias criados')

    // Criar Níveis de Acesso (IDs fixos para consistência)
    const nivelAdmin = await NivelAcesso.create({
      id: 1, // ID fixo para ADMINISTRADOR
      nome: 'ADMINISTRADOR',
      descricao: 'Acesso completo ao sistema'
    })

    const nivelVistoriador = await NivelAcesso.create({
      id: 2, // ID fixo para VISTORIADOR
      nome: 'VISTORIADOR',
      descricao: 'Acesso limitado às vistorias'
    })

    // Criar Usuários
    const adminSenhaHash = await bcrypt.hash('admin123', 10)
    const admin = await Usuario.create({
      nome: 'Administrador Sistema',
      email: 'admin@sgvn.com',
      senha_hash: adminSenhaHash,
      nivel_acesso_id: nivelAdmin.id,
      ativo: true
    })

    const vistoriador1SenhaHash = await bcrypt.hash('senha123', 10)
    const vistoriador1 = await Usuario.create({
      nome: 'João Silva',
      email: 'joao.silva@sgvn.com',
      senha_hash: vistoriador1SenhaHash,
      nivel_acesso_id: nivelVistoriador.id,
      ativo: true
    })

    const vistoriador2SenhaHash = await bcrypt.hash('senha123', 10)
    const vistoriador2 = await Usuario.create({
      nome: 'Maria Santos',
      email: 'maria.santos@sgvn.com',
      senha_hash: vistoriador2SenhaHash,
      nivel_acesso_id: nivelVistoriador.id,
      ativo: true
    })

    console.log('[OK] Usuários criados')

    // Criar Locais
    const portoCentral = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Porto Central',
      cep: '20000-000',
      logradouro: 'Av. Beira Mar',
      numero: '1000',
      bairro: 'Centro',
      cidade: 'Rio de Janeiro',
      estado: 'RJ'
    })

    const marinaSul = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Marina Sul',
      cep: '11000-000',
      logradouro: 'Rua das Palmeiras',
      numero: '500',
      bairro: 'Centro',
      cidade: 'Santos',
      estado: 'SP'
    })

    const portoNorte = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Porto Norte',
      cep: '40000-000',
      logradouro: 'Av. Portuária',
      numero: '200',
      bairro: 'Centro',
      cidade: 'Salvador',
      estado: 'BA'
    })

    console.log('[OK] Locais criados')

    // Criar Embarcações
    const barcoAzul = await Embarcacao.create({
      nome: 'Barco Azul',
      nr_inscricao_barco: 'BR-2020-001',
      proprietario_nome: 'João Silva',
      proprietario_email: 'joao.silva@email.com'
    })

    const iateBranco = await Embarcacao.create({
      nome: 'Iate Branco',
      nr_inscricao_barco: 'BR-2018-045',
      proprietario_nome: 'Maria Santos',
      proprietario_email: 'maria.santos@email.com'
    })

    const lanchaVerde = await Embarcacao.create({
      nome: 'Lancha Verde',
      nr_inscricao_barco: 'BR-2021-012',
      proprietario_nome: 'Pedro Costa',
      proprietario_email: 'pedro.costa@email.com'
    })

    const veleiroAmarelo = await Embarcacao.create({
      nome: 'Veleiro Amarelo',
      nr_inscricao_barco: 'BR-2019-078',
      proprietario_nome: 'Ana Oliveira',
      proprietario_email: 'ana.oliveira@email.com'
    })

    console.log('[OK] Embarcações criadas')

    // Criar Vistorias
    const vistoria1 = await Vistoria.create({
      dados_rascunho: { observacoes: 'Vistoria realizada com sucesso' },
      data_conclusao: new Date('2024-01-15'),
      vistoriador_id: vistoriador1.id,
      embarcacao_id: barcoAzul.id,
      local_id: portoCentral.id,
      status_id: statusAprovada.id
    })

    const vistoria2 = await Vistoria.create({
      dados_rascunho: { observacoes: 'Aguardando documentação' },
      data_conclusao: new Date('2024-01-14'),
      vistoriador_id: vistoriador2.id,
      embarcacao_id: iateBranco.id,
      local_id: marinaSul.id,
      status_id: statusPendente.id
    })

    const vistoria3 = await Vistoria.create({
      dados_rascunho: { observacoes: 'Problemas encontrados na estrutura' },
      data_conclusao: new Date('2024-01-13'),
      vistoriador_id: vistoriador1.id,
      embarcacao_id: lanchaVerde.id,
      local_id: portoNorte.id,
      status_id: statusReprovada.id
    })

    const vistoria4 = await Vistoria.create({
      dados_rascunho: { observacoes: 'Vistoria de rotina' },
      data_conclusao: new Date('2024-01-12'),
      vistoriador_id: vistoriador2.id,
      embarcacao_id: veleiroAmarelo.id,
      local_id: portoCentral.id,
      status_id: statusAprovada.id
    })

    console.log('[OK] Vistorias criadas')

    // Criar Templates de Checklist Padrão
    console.log('\n[Criando Templates de Checklist...]')
    
    const TEMPLATES_PADRAO = {
      JET_SKI: {
        nome: 'Checklist Padrão - Jet Ski',
        descricao: 'Checklist padrão para vistorias de Jet Ski',
        itens: [
          { ordem: 1, nome: 'Casco - Vista Geral', descricao: 'Foto geral do casco', obrigatorio: true },
          { ordem: 2, nome: 'Proa', descricao: 'Foto da parte frontal', obrigatorio: true },
          { ordem: 3, nome: 'Popa', descricao: 'Foto da parte traseira', obrigatorio: true },
          { ordem: 4, nome: 'Laterais (Bombordo)', descricao: 'Lateral esquerda', obrigatorio: true },
          { ordem: 5, nome: 'Laterais (Boreste)', descricao: 'Lateral direita', obrigatorio: true },
          { ordem: 6, nome: 'Motor', descricao: 'Foto do motor', obrigatorio: true },
          { ordem: 7, nome: 'Número de Série/Plaqueta', descricao: 'Plaqueta de identificação', obrigatorio: true },
          { ordem: 8, nome: 'Painel de Instrumentos', descricao: 'Painel e controles', obrigatorio: true },
          { ordem: 9, nome: 'Assento', descricao: 'Banco/assento', obrigatorio: false },
          { ordem: 10, nome: 'Sistema de Propulsão', descricao: 'Hélice e bomba', obrigatorio: true }
        ]
      },
      LANCHA: {
        nome: 'Checklist Padrão - Lancha',
        descricao: 'Checklist padrão para vistorias de Lanchas',
        itens: [
          { ordem: 1, nome: 'Casco - Vista Geral', descricao: 'Foto geral do casco', obrigatorio: true },
          { ordem: 2, nome: 'Proa', descricao: 'Foto da parte frontal', obrigatorio: true },
          { ordem: 3, nome: 'Popa', descricao: 'Foto da parte traseira', obrigatorio: true },
          { ordem: 4, nome: 'Laterais (Bombordo)', descricao: 'Lateral esquerda', obrigatorio: true },
          { ordem: 5, nome: 'Laterais (Boreste)', descricao: 'Lateral direita', obrigatorio: true },
          { ordem: 6, nome: 'Convés', descricao: 'Deck/área superior', obrigatorio: true },
          { ordem: 7, nome: 'Cockpit/Cabine de Comando', descricao: 'Área de pilotagem', obrigatorio: true },
          { ordem: 8, nome: 'Motor(es)', descricao: 'Motores de propulsão', obrigatorio: true },
          { ordem: 9, nome: 'Painel de Instrumentos', descricao: 'Painel e instrumentação', obrigatorio: true },
          { ordem: 10, nome: 'Número de Inscrição/Plaqueta', descricao: 'Identificação da embarcação', obrigatorio: true },
          { ordem: 11, nome: 'Equipamentos de Segurança', descricao: 'Coletes, extintores, etc', obrigatorio: true },
          { ordem: 12, nome: 'Interior/Cabine', descricao: 'Área interna (se houver)', obrigatorio: false },
          { ordem: 13, nome: 'Sistema Elétrico', descricao: 'Quadro elétrico e baterias', obrigatorio: false },
          { ordem: 14, nome: 'Hélice(s)', descricao: 'Sistema de propulsão', obrigatorio: true }
        ]
      },
      EMBARCACAO_COMERCIAL: {
        nome: 'Checklist Padrão - Embarcação Comercial',
        descricao: 'Checklist padrão para vistorias de Embarcações Comerciais',
        itens: [
          { ordem: 1, nome: 'Casco - Vista Geral', descricao: 'Foto geral do casco', obrigatorio: true },
          { ordem: 2, nome: 'Proa', descricao: 'Parte frontal', obrigatorio: true },
          { ordem: 3, nome: 'Popa', descricao: 'Parte traseira', obrigatorio: true },
          { ordem: 4, nome: 'Laterais (Bombordo)', descricao: 'Lateral esquerda', obrigatorio: true },
          { ordem: 5, nome: 'Laterais (Boreste)', descricao: 'Lateral direita', obrigatorio: true },
          { ordem: 6, nome: 'Convés Principal', descricao: 'Deck principal', obrigatorio: true },
          { ordem: 7, nome: 'Casa de Máquinas', descricao: 'Sala de máquinas/motores', obrigatorio: true },
          { ordem: 8, nome: 'Motor(es) Principal(is)', descricao: 'Motores de propulsão', obrigatorio: true },
          { ordem: 9, nome: 'Ponte de Comando', descricao: 'Cabine de comando/timoneria', obrigatorio: true },
          { ordem: 10, nome: 'Painel de Instrumentos', descricao: 'Instrumentação náutica', obrigatorio: true },
          { ordem: 11, nome: 'Equipamentos de Navegação', descricao: 'GPS, Radar, Rádio', obrigatorio: true },
          { ordem: 12, nome: 'Equipamentos de Segurança', descricao: 'Coletes, botes, extintores', obrigatorio: true },
          { ordem: 13, nome: 'Sistema Hidráulico', descricao: 'Bombas, tubulações', obrigatorio: false },
          { ordem: 14, nome: 'Sistema Elétrico', descricao: 'Quadros elétricos, geradores', obrigatorio: true },
          { ordem: 15, nome: 'Hélice(s) e Leme', descricao: 'Sistema de propulsão e direção', obrigatorio: true },
          { ordem: 16, nome: 'Documentação', descricao: 'Certificados e documentos', obrigatorio: true },
          { ordem: 17, nome: 'Número de Inscrição/Plaqueta', descricao: 'Identificação oficial', obrigatorio: true },
          { ordem: 18, nome: 'Área de Carga/Passageiros', descricao: 'Área comercial', obrigatorio: false }
        ]
      }
    };

    for (const [tipoEmbarcacao, templateData] of Object.entries(TEMPLATES_PADRAO)) {
      await criarTemplateCompleto(
        tipoEmbarcacao,
        templateData.nome,
        templateData.descricao,
        templateData.itens
      );
    }

    console.log('[OK] Templates de checklist criados')

    console.log('[INFO] Laudos não são criados no seed - devem ser criados via API após vistoria concluída')

    console.log('\nSeed do banco de dados concluído com sucesso!')
    console.log('\nResumo dos dados criados:')
    console.log(`- ${await NivelAcesso.count()} níveis de acesso`)
    console.log(`- ${await Usuario.count()} usuários`)
    console.log(`- ${await Embarcacao.count()} embarcações`)
    console.log(`- ${await Local.count()} locais`)
    console.log(`- ${await StatusVistoria.count()} status de vistoria`)
    console.log(`- ${await Vistoria.count()} vistorias`)
    console.log(`- ${await ChecklistTemplate.count()} templates de checklist`)

  } catch (error) {
    console.error('[ERRO] Erro durante o seed:', error)
  } finally {
    await sequelize.close()
  }
}

// Executar seed se chamado diretamente
if (require.main === module) {
  seedDatabase()
}

module.exports = { seedDatabase }
