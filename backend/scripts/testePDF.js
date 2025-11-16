require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Laudo, Vistoria, Embarcacao, Foto, TipoFotoChecklist } = require('../models');
const { gerarLaudoPDF } = require('../services/laudoService');

async function testarPDF() {
  try {
    console.log('🧪 Testando geração de PDF diretamente...\n');

    const laudo = await Laudo.findByPk(4, {
      include: [
        {
          model: Vistoria,
          as: 'Vistoria',
          include: [
            { model: Embarcacao, as: 'Embarcacao' }
          ]
        }
      ]
    });

    if (!laudo) {
      console.log('❌ Laudo ID 3 não encontrado');
      console.log('   Execute primeiro: node scripts/testeCompletoLaudos.js');
      process.exit(1);
    }

    console.log('✅ Laudo encontrado:', laudo.numero_laudo);
    console.log('   Vistoria:', laudo.vistoria_id);
    
    const fotos = await Foto.findAll({
      where: { vistoria_id: laudo.vistoria_id },
      include: [
        { model: TipoFotoChecklist, as: 'TipoFotoChecklist' }
      ]
    });

    console.log(`   Fotos: ${fotos.length}\n`);

    console.log('📄 Gerando PDF...');
    
    const resultado = await gerarLaudoPDF(laudo, laudo.Vistoria, fotos);
    
    console.log('\n✅ PDF gerado com sucesso!');
    console.log('   Arquivo:', resultado.filePath);
    console.log('   URL:', resultado.urlRelativa);
    console.log('   Nome:', resultado.fileName);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro ao gerar PDF:');
    console.error('   Mensagem:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

testarPDF();

