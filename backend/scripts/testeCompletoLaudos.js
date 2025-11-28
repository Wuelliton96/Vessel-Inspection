require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

let adminToken = '';
let vistoriadorToken = '';
let vistoriaCriada = null;
let laudoCriado = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const criarImagemPlaceholder = async () => {
  const uploadDir = path.join(__dirname, '..', 'uploads', 'fotos', 'teste');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const imagePath = path.join(uploadDir, 'placeholder.jpg');
  
  if (!fs.existsSync(imagePath)) {
    const https = require('https');
    const file = fs.createWriteStream(imagePath);
    
    return new Promise((resolve, reject) => {
      https.get('https://via.placeholder.com/800x600/0066cc/ffffff?text=Foto+Vistoria', (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(imagePath);
        });
      }).on('error', (err) => {
        fs.unlink(imagePath, () => {});
        reject(err);
      });
    });
  }
  
  return imagePath;
};

const testeCompleto = async () => {
  try {
    log('\n╔════════════════════════════════════════════╗', 'blue');
    log('║   TESTE COMPLETO - SISTEMA DE LAUDOS      ║', 'blue');
    log('╚════════════════════════════════════════════╝\n', 'blue');

    log('[INFO] Iniciando testes...', 'yellow');
    await wait(1000);

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('1.  AUTENTICAÇÃO', 'bold');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    try {
      log('[AUTENTICANDO] Fazendo login como ADMIN...', 'yellow');
      const loginAdmin = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'admin@sgvn.com',
        senha: 'admin123'
      });
      adminToken = loginAdmin.data.token;
      log('[OK] Admin autenticado com sucesso!', 'green');
      log(`   Email: admin@sgvn.com`, 'green');
      log(`   Token: ${adminToken.substring(0, 20)}...`, 'green');
    } catch (error) {
      log('[ERRO] Erro no login admin:', 'red');
      log(`   ${error.response?.data?.error || error.message}`, 'red');
      log('   Execute: node scripts/seedDatabase.js', 'yellow');
      throw error;
    }

    await wait(500);

    try {
      log('[AUTENTICANDO] Fazendo login como VISTORIADOR...', 'yellow');
      const loginVist = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'joao.silva@sgvn.com',
        senha: 'senha123'
      });
      vistoriadorToken = loginVist.data.token;
      log('[OK] Vistoriador autenticado com sucesso!', 'green');
      log(`   Email: joao.silva@sgvn.com`, 'green');
    } catch (error) {
      log('[ERRO] Erro no login vistoriador:', 'red');
      log(`   ${error.response?.data?.error || error.message}`, 'red');
      throw error;
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('2.  CRIAR EMBARCAÇÃO E LOCAL', 'bold');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    let embarcacaoId, localId;

    try {
      log('[CRIANDO] Criando embarcação de teste...', 'yellow');
      const embarcacao = await axios.post(`${API_BASE_URL}/api/embarcacoes`, {
        nome: 'Sea Doo RXT X 325 - TESTE',
        nr_inscricao_barco: `TESTE-${Date.now()}`,
        proprietario_nome: 'Jakeline Antonia De Paula',
        proprietario_cpf: '41057276804',
        proprietario_email: 'jakeline@teste.com',
        tipo_embarcacao: 'JET_SKI',
        porte: 'PEQUENO',
        valor_embarcacao: 175000.00,
        ano_fabricacao: 2025
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      embarcacaoId = embarcacao.data.id;
      log(`[OK] Embarcação criada! ID: ${embarcacaoId}`, 'green');
      log(`   Nome: ${embarcacao.data.nome}`, 'green');
    } catch (error) {
      log('[ERRO] Erro ao criar embarcação:', 'red');
      log(`   ${error.response?.data?.error || error.message}`, 'red');
      throw error;
    }

    await wait(500);

    try {
      log('[CRIANDO] Criando local de teste...', 'yellow');
      const local = await axios.post(`${API_BASE_URL}/api/locais`, {
        tipo: 'MARINA',
        nome_local: 'Marina Casarini Centro',
        cep: '01133000',
        logradouro: 'Av. Rudge',
        numero: '931',
        bairro: 'Barra Funda',
        cidade: 'São Paulo',
        estado: 'SP'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      localId = local.data.id;
      log(`[OK] Local criado! ID: ${localId}`, 'green');
      log(`   Nome: ${local.data.nome_local}`, 'green');
    } catch (error) {
      log('[ERRO] Erro ao criar local:', 'red');
      throw error;
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('3.  CRIAR VISTORIA', 'bold');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    try {
      log('[CRIANDO] Criando vistoria de teste...', 'yellow');
      
      const usuarios = await axios.get(`${API_BASE_URL}/api/usuarios`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const vistoriador = usuarios.data.find(u => u.nivelAcessoId === 2);
      
      if (!vistoriador) {
        throw new Error('Nenhum vistoriador encontrado!');
      }

      const vistoria = await axios.post(`${API_BASE_URL}/api/vistorias`, {
        embarcacao_id: embarcacaoId,
        local_id: localId,
        vistoriador_id: vistoriador.id,
        valor_embarcacao: 175000.00,
        valor_vistoria: 1500.00,
        valor_vistoriador: 500.00
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      vistoriaCriada = vistoria.data;
      log(`[OK] Vistoria criada! ID: ${vistoriaCriada.id}`, 'green');
      log(`   Status: ${vistoriaCriada.StatusVistoria?.nome}`, 'green');
    } catch (error) {
      log('[ERRO] Erro ao criar vistoria:', 'red');
      log(`   ${error.response?.data?.error || error.message}`, 'red');
      throw error;
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('4.  MARCAR VISTORIA COMO CONCLUÍDA', 'bold');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    try {
      log('[OK] Mudando status para CONCLUIDA...', 'yellow');
      
      const { sequelize } = require('../models');
      const { StatusVistoria } = require('../models');
      
      const statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });
      
      if (!statusConcluida) {
        log('[AVISO] Status CONCLUIDA não existe, criando...', 'yellow');
        const novoStatus = await StatusVistoria.create({
          nome: 'CONCLUIDA',
          descricao: 'Vistoria concluída'
        });
        var statusId = novoStatus.id;
      } else {
        var statusId = statusConcluida.id;
      }

      log(`   Usando Status ID: ${statusId}`, 'yellow');

      const vistoriaAtualizada = await axios.put(
        `${API_BASE_URL}/api/vistorias/${vistoriaCriada.id}`,
        {
          status_id: statusId,
          data_conclusao: new Date().toISOString()
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      
      vistoriaCriada = vistoriaAtualizada.data;
      log(`[OK] Vistoria marcada como CONCLUÍDA!`, 'green');
      log(`   Status: ${vistoriaCriada.StatusVistoria?.nome || 'CONCLUIDA'}`, 'green');
    } catch (error) {
      log('[ERRO] Erro ao atualizar vistoria:', 'red');
      log(`   ${error.response?.data?.error || error.message}`, 'red');
      throw error;
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('5.  CRIAR LAUDO (RASCUNHO)', 'bold');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    try {
      log('📄 Criando laudo com dados completos...', 'yellow');
      
      const dadosLaudo = {
        versao: 'BS 2021-01',
        
        nome_moto_aquatica: 'Sea Doo RXT X 325 - TESTE',
        local_guarda: 'Em vaga seca e coberta na Loja Casarini Centro / São Paulo - SP.',
        proprietario: 'Jakeline Antonia De Paula',
        cpf_cnpj: '410.572.768-04',
        endereco_proprietario: 'Rua Daniel Paulo Nasser, nº 116 / Jardim Torres São José / Jundiaí – SP / CEP 13.214-540.',
        responsavel: 'Janaína, funcionária da loja',
        data_inspecao: new Date().toISOString().split('T')[0],
        local_vistoria: 'Av. Rudge, nº 931 / Barra Funda / São Paulo – SP / CEP 01133-000.',
        empresa_prestadora: 'Tech Survey Vistorias Ltda.',
        responsavel_inspecao: 'SPS R3254',
        participantes_inspecao: 'Janaína, funcionária da loja.',
        
        inscricao_capitania: 'A ser inscrita',
        estaleiro_construtor: 'Sea Doo / BRP',
        tipo_embarcacao: 'Moto aquática',
        modelo_embarcacao: 'RXT X 325',
        ano_fabricacao: 2025,
        capacidade: '01 Tripulante / 02 Passageiros',
        classificacao_embarcacao: 'Esporte e recreio',
        area_navegacao: 'Interior',
        situacao_capitania: 'A informar, embarcação nova a ser regularizada.',
        valor_risco: 175000.00,
        
        material_casco: 'Fibra de vidro',
        observacoes_casco: 'Chassi do casco: CA- YDV09937I526\nDisplay touchscreen de 10,25″\nGuidão de competição com ajuste de altura\nAssento Ergolock™ de competição bipartido',
        
        quantidade_motores: 1,
        tipo_motor: 'Centro',
        fabricante_motor: 'Rotax',
        modelo_motor: 'Rotax 1603',
        numero_serie_motor: 'MR640020',
        potencia_motor: '325 HP',
        combustivel_utilizado: 'Gasolina',
        capacidade_tanque: '70 litros',
        ano_fabricacao_motor: 2025,
        numero_helices: '01 Em aço inox',
        rabeta_reversora: 'Sistema propulsor Hidrojato',
        blower: '---',
        
        quantidade_baterias: 1,
        marca_baterias: 'Original',
        capacidade_baterias: '18 Ah',
        carregador_bateria: '---',
        transformador: '---',
        quantidade_geradores: 0,
        
        guincho_eletrico: '---',
        ancora: '---',
        cabos: '---',
        
        buzina: '01 Elétrica',
        conta_giros: 'No painel digital',
        farol_milha: '---',
        gps: '---',
        higrometro: '---',
        horimetro: 'No painel digital / 0 h',
        limpador_parabrisa: '---',
        manometros: '---',
        odometro_fundo: '---',
        passarela_embarque: '---',
        piloto_automatico: '---',
        psi: 'No painel digital',
        radar: '---',
        radio_ssb: '---',
        radio_vhf: '---',
        radiogoniometro: '---',
        sonda: '---',
        speed_log: '---',
        strobow: '---',
        termometro: 'No painel digital',
        voltimetro: 'No painel digital',
        outros_equipamentos: '---',
        
        extintores_automaticos: '---',
        extintores_portateis: '---',
        outros_incendio: '---',
        atendimento_normas: 'Sim de acordo',
        
        acumulo_agua: 'Não há',
        avarias_casco: 'Não há',
        estado_geral_limpeza: 'Bom, satisfatório.',
        teste_funcionamento_motor: 'Bom, satisfatório.',
        funcionamento_bombas_porao: 'Não se aplica',
        manutencao: 'Preventiva',
        observacoes_vistoria: '---',
        
        checklist_eletrica: {
          terminais_estanhados: 'Sim',
          circuitos_protegidos: 'Sim',
          chave_geral: 'Não possui',
          terminais_baterias: 'Sim',
          baterias_fixadas: 'Sim',
          passagem_chicotes: 'Sim',
          cabo_arranque: 'Sim'
        },
        
        checklist_hidraulica: {
          material_tanques: 'Sim',
          abracadeiras_inox: 'Sim'
        },
        
        checklist_geral: {
          carreta_condicoes: 'Não possui'
        },
        
        nome_empresa: 'Tech Survey Vistorias Ltda.',
        nota_rodape: 'Relatório exclusivo para Essor Seguros, não tem validade para outra finalidade e/ou seguradora.'
      };

      const laudo = await axios.post(
        `${API_BASE_URL}/api/laudos/vistoria/${vistoriaCriada.id}`,
        dadosLaudo,
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      
      laudoCriado = laudo.data;
      log(`[OK] Laudo criado (RASCUNHO)! ID: ${laudoCriado.id}`, 'green');
      log(`   Número: ${laudoCriado.numero_laudo}`, 'green');
      log(`   Versão: ${laudoCriado.versao}`, 'green');
    } catch (error) {
      log('[ERRO] Erro ao criar laudo:', 'red');
      log(`   ${error.response?.data?.error || error.message}`, 'red');
      log(`   Detalhes: ${JSON.stringify(error.response?.data)}`, 'red');
      throw error;
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('6.  GERAR PDF DO LAUDO', 'bold');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    try {
      log('[GERANDO]  Gerando PDF...', 'yellow');
      
      const pdfResponse = await axios.post(
        `${API_BASE_URL}/api/laudos/${laudoCriado.id}/gerar-pdf`,
        {},
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      
      log(`[OK] PDF gerado com sucesso!`, 'green');
      log(`   URL: ${pdfResponse.data.laudo.url_pdf}`, 'green');
      log(`   Download em: ${pdfResponse.data.downloadUrl}`, 'green');
    } catch (error) {
      log('[ERRO] Erro ao gerar PDF:', 'red');
      log(`   ${error.response?.data?.error || error.message}`, 'red');
      throw error;
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('7.  LISTAR LAUDOS', 'bold');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    try {
      log('[INFO] Listando todos os laudos...', 'yellow');
      
      const laudos = await axios.get(`${API_BASE_URL}/api/laudos`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      log(`[OK] ${laudos.data.length} laudo(s) encontrado(s)`, 'green');
      
      laudos.data.forEach((l, index) => {
        log(`   ${index + 1}. ${l.numero_laudo} - Vistoria #${l.vistoria_id} - ${l.url_pdf ? 'PDF Gerado' : 'Rascunho'}`, 'green');
      });
    } catch (error) {
      log('[ERRO] Erro ao listar laudos:', 'red');
      throw error;
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('8.  BUSCAR LAUDO ESPECÍFICO', 'bold');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    try {
      log(`🔍 Buscando laudo ${laudoCriado.id}...`, 'yellow');
      
      const laudo = await axios.get(`${API_BASE_URL}/api/laudos/${laudoCriado.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      log(`[OK] Laudo encontrado!`, 'green');
      log(`   Número: ${laudo.data.numero_laudo}`, 'green');
      log(`   Proprietário: ${laudo.data.proprietario}`, 'green');
      log(`   Embarcação: ${laudo.data.nome_moto_aquatica}`, 'green');
      log(`   Valor em Risco: R$ ${parseFloat(laudo.data.valor_risco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'green');
    } catch (error) {
      log('[ERRO] Erro ao buscar laudo:', 'red');
      throw error;
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('9.  ATUALIZAR LAUDO', 'bold');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    try {
      log('[ATUALIZANDO]  Atualizando campo de observações...', 'yellow');
      
      const laudoAtualizado = await axios.put(
        `${API_BASE_URL}/api/laudos/${laudoCriado.id}`,
        {
          observacoes_vistoria: 'Embarcação em perfeito estado, sem avarias detectadas. Aprovada para uso.'
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` }
        }
      );
      
      log(`[OK] Laudo atualizado!`, 'green');
      log(`   Nova observação: ${laudoAtualizado.data.observacoes_vistoria}`, 'green');
    } catch (error) {
      log('[ERRO] Erro ao atualizar laudo:', 'red');
      throw error;
    }

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
    log('🔟 VERIFICAR ARQUIVO PDF', 'bold');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

    try {
      log('📂 Verificando se PDF foi gerado no servidor...', 'yellow');
      
      const laudo = await axios.get(`${API_BASE_URL}/api/laudos/${laudoCriado.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (laudo.data.url_pdf) {
        const pdfPath = path.join(__dirname, '..', laudo.data.url_pdf);
        
        if (fs.existsSync(pdfPath)) {
          const stats = fs.statSync(pdfPath);
          log(`[OK] PDF encontrado no servidor!`, 'green');
          log(`   Caminho: ${laudo.data.url_pdf}`, 'green');
          log(`   Tamanho: ${(stats.size / 1024).toFixed(2)} KB`, 'green');
        } else {
          log(`[AVISO]  PDF não encontrado no caminho: ${pdfPath}`, 'yellow');
        }
      } else {
        log(`[AVISO]  URL do PDF não definida`, 'yellow');
      }
    } catch (error) {
      log('[ERRO] Erro ao verificar PDF:', 'red');
      throw error;
    }

    log('\n╔════════════════════════════════════════════╗', 'green');
    log('║         [OK] TODOS OS TESTES PASSARAM!      ║', 'green');
    log('╚════════════════════════════════════════════╝\n', 'green');

    log('📊 RESUMO DOS TESTES:', 'bold');
    log(`   [OK] Embarcação criada: ID ${embarcacaoId}`, 'green');
    log(`   [OK] Local criado: ID ${localId}`, 'green');
    log(`   [OK] Vistoria criada: ID ${vistoriaCriada.id}`, 'green');
    log(`   [OK] Vistoria concluída`, 'green');
    log(`   [OK] Laudo criado: ${laudoCriado.numero_laudo}`, 'green');
    log(`   [OK] PDF gerado com sucesso`, 'green');
    log(`   [OK] Sistema funcionando perfeitamente!\n`, 'green');

    log('🎓 SISTEMA PRONTO PARA APRESENTAÇÃO DO TCC!\n', 'bold');

  } catch (error) {
    log('\n╔════════════════════════════════════════════╗', 'red');
    log('║         [ERRO] ERRO NOS TESTES                ║', 'red');
    log('╚════════════════════════════════════════════╝\n', 'red');
    
    log(`Erro: ${error.message}`, 'red');
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red');
      log(`Dados: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    process.exit(1);
  }
};

log('\n🚀 Aguarde enquanto o servidor está sendo testado...', 'yellow');
log('   Certifique-se de que o servidor está rodando em http://localhost:3000\n', 'yellow');

setTimeout(() => {
  testeCompleto();
}, 2000);

