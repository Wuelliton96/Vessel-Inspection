const { sequelize } = require('../models')
const { 
  Usuario, 
  Embarcacao, 
  Local, 
  StatusVistoria, 
  Vistoria,
  Laudo,
  NivelAcesso
} = require('../models')
const bcrypt = require('bcryptjs')

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

    // Criar Laudos
    await Laudo.create({
      url_pdf: '/laudos/LAU-2024-001.pdf',
      data_geracao: new Date('2024-01-15'),
      vistoria_id: vistoria1.id
    })

    await Laudo.create({
      url_pdf: '/laudos/LAU-2024-002.pdf',
      data_geracao: new Date('2024-01-12'),
      vistoria_id: vistoria4.id
    })

    console.log('[OK] Laudos criados')

    console.log('Seed do banco de dados concluído com sucesso!')
    console.log('\nResumo dos dados criados:')
    console.log(`- ${await NivelAcesso.count()} níveis de acesso`)
    console.log(`- ${await Usuario.count()} usuários`)
    console.log(`- ${await Embarcacao.count()} embarcações`)
    console.log(`- ${await Local.count()} locais`)
    console.log(`- ${await StatusVistoria.count()} status de vistoria`)
    console.log(`- ${await Vistoria.count()} vistorias`)
    console.log(`- ${await Laudo.count()} laudos`)

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
