/**
 * Script de teste para geração de laudos PDF
 * Testa a seleção de templates e preenchimento de dados
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { obterTemplatePDF, gerarLaudoPDF } = require('../services/laudoService');
const { Laudo, Vistoria, Embarcacao, Local, StatusVistoria, Cliente } = require('../models');
const fs = require('fs');

async function testarGeracaoPDF() {
  try {
    console.log('=== TESTE DE GERAÇÃO DE PDF ===\n');
    
    // Testar seleção de templates
    console.log('1. Testando seleção de templates:');
    console.log('   JET_SKI:', obterTemplatePDF('JET_SKI'));
    console.log('   LANCHA:', obterTemplatePDF('LANCHA'));
    console.log('   EMBARCACAO_COMERCIAL:', obterTemplatePDF('EMBARCACAO_COMERCIAL'));
    console.log('   Default:', obterTemplatePDF(null));
    
    // Verificar se templates existem
    console.log('\n2. Verificando existência dos templates:');
    const templateJetski = obterTemplatePDF('JET_SKI');
    const templateLancha = obterTemplatePDF('LANCHA');
    console.log('   jetski.pdf existe?', fs.existsSync(templateJetski));
    console.log('   lancha_embarcação.pdf existe?', fs.existsSync(templateLancha));
    
    // Buscar uma vistoria concluída para teste
    console.log('\n3. Buscando vistoria concluída para teste:');
    const statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });
    
    if (!statusConcluida) {
      console.log('   Nenhuma vistoria concluída encontrada. Criando dados de teste...');
      // Criar dados de teste seria muito complexo, vamos apenas informar
      console.log('   Por favor, conclua uma vistoria primeiro para testar a geração de PDF.');
      return;
    }
    
    const vistoria = await Vistoria.findOne({
      where: { status_id: statusConcluida.id },
      include: [
        {
          model: Embarcacao,
          as: 'Embarcacao',
          include: [
            { model: Cliente, as: 'Cliente' }
          ]
        },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' }
      ],
      limit: 1
    });
    
    if (!vistoria) {
      console.log('   Nenhuma vistoria concluída encontrada.');
      return;
    }
    
    console.log('   Vistoria encontrada:', vistoria.id);
    console.log('   Tipo de embarcação:', vistoria.Embarcacao?.tipo_embarcacao);
    console.log('   Nome da embarcação:', vistoria.Embarcacao?.nome);
    
    // Buscar ou criar laudo
    let laudo = await Laudo.findOne({ where: { vistoria_id: vistoria.id } });
    
    if (!laudo) {
      console.log('\n4. Criando laudo de teste...');
      const { gerarNumeroLaudo } = require('../services/laudoService');
      laudo = await Laudo.create({
        vistoria_id: vistoria.id,
        numero_laudo: gerarNumeroLaudo(),
        nome_moto_aquatica: vistoria.Embarcacao?.nome,
        proprietario: vistoria.Embarcacao?.proprietario_nome || vistoria.Embarcacao?.Cliente?.nome,
        cpf_cnpj: vistoria.Embarcacao?.proprietario_cpf || vistoria.Embarcacao?.Cliente?.cpf || vistoria.Embarcacao?.Cliente?.cnpj,
        data_inspecao: vistoria.data_conclusao || vistoria.data_inicio,
        valor_risco: vistoria.valor_embarcacao || vistoria.Embarcacao?.valor_embarcacao,
        inscricao_capitania: vistoria.Embarcacao?.nr_inscricao_barco,
        tipo_embarcacao: vistoria.Embarcacao?.tipo_embarcacao,
        ano_fabricacao: vistoria.Embarcacao?.ano_fabricacao
      });
      console.log('   Laudo criado:', laudo.id);
    } else {
      console.log('\n4. Laudo existente encontrado:', laudo.id);
    }
    
    // Testar geração de PDF
    console.log('\n5. Testando geração de PDF...');
    const resultado = await gerarLaudoPDF(laudo, vistoria, []);
    
    console.log('   PDF gerado com sucesso!');
    console.log('   Arquivo:', resultado.filePath);
    console.log('   URL relativa:', resultado.urlRelativa);
    console.log('   Arquivo existe?', fs.existsSync(resultado.filePath));
    
    if (fs.existsSync(resultado.filePath)) {
      const stats = fs.statSync(resultado.filePath);
      console.log('   Tamanho do arquivo:', (stats.size / 1024).toFixed(2), 'KB');
    }
    
    console.log('\n=== TESTE CONCLUÍDO COM SUCESSO ===');
    
  } catch (error) {
    console.error('\n=== ERRO NO TESTE ===');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Executar teste
testarGeracaoPDF()
  .then(() => {
    console.log('\nTeste finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });

