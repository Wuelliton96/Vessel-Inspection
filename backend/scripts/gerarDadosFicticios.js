/**
 * Gerar dados ficticios completos para demonstracao
 * Cria: Vistoriadores, Embarcacoes, Vistorias, Checklists
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { 
  Usuario,
  NivelAcesso,
  Embarcacao,
  Local,
  Vistoria,
  StatusVistoria,
  Seguradora,
  Cliente,
  ChecklistTemplate,
  ChecklistTemplateItem,
  VistoriaChecklistItem,
  sequelize 
} = require('../models');

async function gerarDados() {
  try {
    console.log('\n[GERACAO] DADOS FICTICIOS PARA DEMONSTRACAO\n');
    console.log('='.repeat(60));

    // Buscar nivel de acesso vistoriador
    const nivelVistoriador = await NivelAcesso.findOne({ where: { nome: 'VISTORIADOR' } });
    const nivelAdmin = await NivelAcesso.findOne({ where: { nome: 'ADMINISTRADOR' } });
    
    if (!nivelVistoriador) {
      console.log('[ERRO] Nivel VISTORIADOR nao encontrado');
      process.exit(1);
    }

    // 1. Criar Vistoriadores (5)
    console.log('\n[1] Criando vistoriadores...');
    const senhaHash = await bcrypt.hash('senha123', 10);
    
    const vistoriadores = [];
    const nomesVistoriadores = [
      'Carlos Silva',
      'Ana Santos',
      'Roberto Lima',
      'Patricia Costa',
      'Fernando Oliveira'
    ];

    for (const nome of nomesVistoriadores) {
      const email = nome.toLowerCase().replace(' ', '.') + '@vistoriador.com';
      const [vistoriador] = await Usuario.findOrCreate({
        where: { email },
        defaults: {
          nome,
          email,
          senha_hash: senhaHash,
          nivel_acesso_id: nivelVistoriador.id,
          ativo: true
        }
      });
      vistoriadores.push(vistoriador);
      console.log(`    [OK] ${nome} (ID: ${vistoriador.id})`);
    }

    // 2. Criar Clientes (10)
    console.log('\n[2] Criando clientes...');
    const clientes = [];
    const dadosClientes = [
      { nome: 'Joao Pedro Martins', cpf: '12345678901', email: 'joao.martins@email.com', telefone: '+5511987654321' },
      { nome: 'Maria Fernanda Silva', cpf: '23456789012', email: 'maria.silva@email.com', telefone: '+5511987654322' },
      { nome: 'Antonio Carlos Souza', cpf: '34567890123', email: 'antonio.souza@email.com', telefone: '+5511987654323' },
      { nome: 'Claudia Regina Lima', cpf: '45678901234', email: 'claudia.lima@email.com', telefone: '+5511987654324' },
      { nome: 'Ricardo Mendes Costa', cpf: '56789012345', email: 'ricardo.costa@email.com', telefone: '+5511987654325' },
      { nome: 'Juliana Alves Pereira', cpf: '67890123456', email: 'juliana.pereira@email.com', telefone: '+5511987654326' },
      { nome: 'Marcos Paulo Santos', cpf: '78901234567', email: 'marcos.santos@email.com', telefone: '+5511987654327' },
      { nome: 'Fernanda Costa Rocha', cpf: '89012345678', email: 'fernanda.rocha@email.com', telefone: '+5511987654328' },
      { nome: 'Paulo Sergio Almeida', cpf: '90123456789', email: 'paulo.almeida@email.com', telefone: '+5511987654329' },
      { nome: 'Beatriz Helena Cardoso', cpf: '01234567890', email: 'beatriz.cardoso@email.com', telefone: '+5511987654330' }
    ];

    for (const dados of dadosClientes) {
      const [cliente] = await Cliente.findOrCreate({
        where: { cpf: dados.cpf },
        defaults: {
          tipo_pessoa: 'FISICA',
          nome: dados.nome,
          cpf: dados.cpf,
          email: dados.email,
          telefone_e164: dados.telefone,
          ativo: true
        }
      });
      clientes.push(cliente);
    }
    console.log(`    [OK] ${clientes.length} clientes criados`);

    // 3. Buscar Seguradoras
    console.log('\n[3] Buscando seguradoras...');
    const seguradoras = await Seguradora.findAll({
      include: [{ association: 'tiposPermitidos' }]
    });
    console.log(`    [OK] ${seguradoras.length} seguradoras encontradas`);

    // 4. Criar Locais (8)
    console.log('\n[4] Criando locais...');
    const locais = [];
    const dadosLocais = [
      { tipo: 'MARINA', nome: 'Marina Guaruja', cep: '11410000', cidade: 'Guaruja', estado: 'SP' },
      { tipo: 'MARINA', nome: 'Marina Santos', cep: '11010000', cidade: 'Santos', estado: 'SP' },
      { tipo: 'MARINA', nome: 'Marina Angra', cep: '23900000', cidade: 'Angra dos Reis', estado: 'RJ' },
      { tipo: 'MARINA', nome: 'Marina Ilhabela', cep: '11630000', cidade: 'Ilhabela', estado: 'SP' },
      { tipo: 'RESIDENCIA', cep: '01310000', logradouro: 'Av Paulista', numero: '1000', cidade: 'Sao Paulo', estado: 'SP' },
      { tipo: 'RESIDENCIA', cep: '04543000', logradouro: 'Av Faria Lima', numero: '2500', cidade: 'Sao Paulo', estado: 'SP' },
      { tipo: 'MARINA', nome: 'Marina Bertioga', cep: '11250000', cidade: 'Bertioga', estado: 'SP' },
      { tipo: 'MARINA', nome: 'Marina Paraty', cep: '23970000', cidade: 'Paraty', estado: 'RJ' }
    ];

    for (const dados of dadosLocais) {
      const local = await Local.create({
        tipo: dados.tipo,
        nome_local: dados.nome || null,
        cep: dados.cep,
        logradouro: dados.logradouro || null,
        numero: dados.numero || null,
        cidade: dados.cidade,
        estado: dados.estado
      });
      locais.push(local);
    }
    console.log(`    [OK] ${locais.length} locais criados`);

    // 5. Criar Embarcacoes (20 - distribuidas entre seguradoras)
    console.log('\n[5] Criando embarcacoes...');
    const embarcacoes = [];
    
    const embarcacoesData = [
      // Essor - Jet Ski
      { nome: 'Yamaha VX Cruiser', nr: 'YMH001', tipo: 'JET_SKI', seguradora: 'Essor', ano: 2022, valor: 45000 },
      { nome: 'Sea-Doo GTI 130', nr: 'SD002', tipo: 'JET_SKI', seguradora: 'Essor', ano: 2023, valor: 52000 },
      { nome: 'Kawasaki Ultra 310', nr: 'KWS003', tipo: 'JET_SKI', seguradora: 'Essor', ano: 2021, valor: 68000 },
      
      // Essor - Lancha
      { nome: 'Phantom 303', nr: 'PH004', tipo: 'LANCHA', seguradora: 'Essor', ano: 2020, valor: 280000 },
      { nome: 'Focker 255', nr: 'FK005', tipo: 'LANCHA', seguradora: 'Essor', ano: 2019, valor: 320000 },
      
      // Mapfre - Lancha
      { nome: 'Intermarine 460', nr: 'IN006', tipo: 'LANCHA', seguradora: 'Mapfre', ano: 2021, valor: 850000 },
      { nome: 'Azimut 55', nr: 'AZ007', tipo: 'LANCHA', seguradora: 'Mapfre', ano: 2022, valor: 1200000 },
      { nome: 'Schaefer 375', nr: 'SC008', tipo: 'LANCHA', seguradora: 'Mapfre', ano: 2020, valor: 650000 },
      
      // Mapfre - Embarcacao Comercial
      { nome: 'Traineira Oceano Azul', nr: 'TR009', tipo: 'EMBARCACAO_COMERCIAL', seguradora: 'Mapfre', ano: 2018, valor: 2500000 },
      { nome: 'Barco Pesqueiro Mar Bravo', nr: 'BP010', tipo: 'EMBARCACAO_COMERCIAL', seguradora: 'Mapfre', ano: 2019, valor: 1800000 },
      
      // Swiss RE - Embarcacao Comercial
      { nome: 'Ferry Boat Ilha Grande', nr: 'FB011', tipo: 'EMBARCACAO_COMERCIAL', seguradora: 'Swiss RE', ano: 2017, valor: 5000000 },
      { nome: 'Rebocador Atlantico', nr: 'RB012', tipo: 'EMBARCACAO_COMERCIAL', seguradora: 'Swiss RE', ano: 2016, valor: 3200000 },
      { nome: 'Traineira Netuno', nr: 'TN013', tipo: 'EMBARCACAO_COMERCIAL', seguradora: 'Swiss RE', ano: 2019, valor: 2800000 },
      
      // AXA - Embarcacao Comercial
      { nome: 'Balsa Transporte', nr: 'BT014', tipo: 'EMBARCACAO_COMERCIAL', seguradora: 'AXA Seguros', ano: 2020, valor: 4500000 },
      { nome: 'Empurrador Porto Santos', nr: 'EP015', tipo: 'EMBARCACAO_COMERCIAL', seguradora: 'AXA Seguros', ano: 2018, valor: 3800000 },
      
      // Fairfax - Embarcacao Comercial
      { nome: 'Navio Tanque Petrobras', nr: 'NT016', tipo: 'EMBARCACAO_COMERCIAL', seguradora: 'Fairfax', ano: 2015, valor: 8000000 },
      { nome: 'Cargueiro Costeiro', nr: 'CC017', tipo: 'EMBARCACAO_COMERCIAL', seguradora: 'Fairfax', ano: 2017, valor: 6500000 },
      
      // Mais lanchas diferentes seguradoras
      { nome: 'Regnicoli 290', nr: 'RG018', tipo: 'LANCHA', seguradora: 'Essor', ano: 2023, valor: 420000 },
      { nome: 'Triton 320', nr: 'TT019', tipo: 'LANCHA', seguradora: 'Mapfre', ano: 2022, valor: 580000 },
      { nome: 'Beneteau 46', nr: 'BN020', tipo: 'LANCHA', seguradora: 'Mapfre', ano: 2021, valor: 950000 }
    ];

    for (const emb of embarcacoesData) {
      const seg = seguradoras.find(s => s.nome === emb.seguradora);
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];
      
      const embarcacao = await Embarcacao.create({
        nome: emb.nome,
        nr_inscricao_barco: emb.nr,
        tipo_embarcacao: emb.tipo,
        seguradora_id: seg.id,
        cliente_id: cliente.id,
        proprietario_nome: cliente.nome,
        proprietario_cpf: cliente.cpf,
        proprietario_telefone_e164: cliente.telefone_e164,
        proprietario_email: cliente.email,
        valor_embarcacao: emb.valor,
        ano_fabricacao: emb.ano
      });
      embarcacoes.push(embarcacao);
    }
    console.log(`    [OK] ${embarcacoes.length} embarcacoes criadas`);

    // 6. Criar Vistorias com diferentes status
    console.log('\n[6] Criando vistorias...');
    const admin = await Usuario.findOne({ where: { nivel_acesso_id: 1 } });
    const statusList = await StatusVistoria.findAll();
    
    let totalVistorias = 0;
    let totalChecklist = 0;

    for (let i = 0; i < embarcacoes.length; i++) {
      const embarcacao = embarcacoes[i];
      const vistoriador = vistoriadores[i % vistoriadores.length];
      const local = locais[i % locais.length];
      
      // Variar status
      let status;
      if (i < 5) {
        status = statusList.find(s => s.nome === 'PENDENTE');
      } else if (i < 10) {
        status = statusList.find(s => s.nome === 'EM_ANDAMENTO');
      } else if (i < 15) {
        status = statusList.find(s => s.nome === 'CONCLUIDA');
      } else {
        status = statusList.find(s => s.nome === 'APROVADA');
      }

      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: vistoriador.id,
        administrador_id: admin.id,
        status_id: status.id,
        valor_embarcacao: embarcacao.valor_embarcacao,
        valor_vistoria: embarcacao.tipo_embarcacao === 'JET_SKI' ? 300 : embarcacao.tipo_embarcacao === 'LANCHA' ? 500 : 1000,
        valor_vistoriador: embarcacao.tipo_embarcacao === 'JET_SKI' ? 200 : embarcacao.tipo_embarcacao === 'LANCHA' ? 350 : 700
      });
      totalVistorias++;

      // Copiar checklist
      const template = await ChecklistTemplate.findOne({
        where: { tipo_embarcacao: embarcacao.tipo_embarcacao },
        include: [{ association: 'itens', where: { ativo: true }, required: false }]
      });

      if (template && template.itens) {
        for (const item of template.itens) {
          // Variar status dos itens baseado no status da vistoria
          let statusItem = 'PENDENTE';
          if (status.nome === 'CONCLUIDA' || status.nome === 'APROVADA') {
            statusItem = 'CONCLUIDO';
          } else if (status.nome === 'EM_ANDAMENTO' && Math.random() > 0.5) {
            statusItem = 'CONCLUIDO';
          }

          await VistoriaChecklistItem.create({
            vistoria_id: vistoria.id,
            template_item_id: item.id,
            ordem: item.ordem,
            nome: item.nome,
            descricao: item.descricao,
            obrigatorio: item.obrigatorio,
            permite_video: item.permite_video,
            status: statusItem,
            concluido_em: statusItem === 'CONCLUIDO' ? new Date() : null
          });
          totalChecklist++;
        }
      }
    }
    
    console.log(`    [OK] ${totalVistorias} vistorias criadas`);
    console.log(`    [OK] ${totalChecklist} itens de checklist criados`);

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('[RESUMO DOS DADOS GERADOS]\n');
    console.log(`  Vistoriadores: ${vistoriadores.length}`);
    console.log(`  Clientes: ${clientes.length}`);
    console.log(`  Embarcacoes: ${embarcacoes.length}`);
    console.log(`  Locais: ${locais.length}`);
    console.log(`  Vistorias: ${totalVistorias}`);
    console.log(`  Itens Checklist: ${totalChecklist}`);

    // Distribuicao por status
    console.log('\n[DISTRIBUICAO POR STATUS]');
    for (const status of statusList) {
      const count = await Vistoria.count({ where: { status_id: status.id } });
      if (count > 0) {
        console.log(`  ${status.nome}: ${count}`);
      }
    }

    // Distribuicao por tipo
    console.log('\n[DISTRIBUICAO POR TIPO]');
    const tiposCount = await sequelize.query(`
      SELECT e.tipo_embarcacao, COUNT(v.id) as total
      FROM vistorias v
      JOIN embarcacoes e ON v.embarcacao_id = e.id
      GROUP BY e.tipo_embarcacao
    `, { type: sequelize.QueryTypes.SELECT });
    
    tiposCount.forEach(t => {
      console.log(`  ${t.tipo_embarcacao}: ${t.total}`);
    });

    // Distribuicao por seguradora
    console.log('\n[DISTRIBUICAO POR SEGURADORA]');
    const segCount = await sequelize.query(`
      SELECT s.nome, COUNT(v.id) as total
      FROM vistorias v
      JOIN embarcacoes e ON v.embarcacao_id = e.id
      JOIN seguradoras s ON e.seguradora_id = s.id
      GROUP BY s.nome
    `, { type: sequelize.QueryTypes.SELECT });
    
    segCount.forEach(s => {
      console.log(`  ${s.nome}: ${s.total}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('[SUCESSO] Dados ficticios gerados com sucesso!\n');
    console.log('[INFO] O sistema agora tem dados para demonstracao!\n');

  } catch (error) {
    console.error('\n[ERRO]:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

gerarDados();

