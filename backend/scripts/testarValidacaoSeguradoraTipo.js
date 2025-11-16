/**
 * Testar validacao de seguradora x tipo
 */

require('dotenv').config();
const { 
  Seguradora, 
  SeguradoraTipoEmbarcacao,
  sequelize 
} = require('../models');

async function testar() {
  try {
    console.log('\n[TESTE] VALIDACAO SEGURADORA x TIPO\n');
    console.log('='.repeat(60));

    const seguradoras = await Seguradora.findAll({
      include: [{
        model: SeguradoraTipoEmbarcacao,
        as: 'tiposPermitidos'
      }]
    });

    console.log('\n[MAPA DE PERMISSOES]\n');

    for (const seg of seguradoras) {
      const tipos = seg.tiposPermitidos.map(t => t.tipo_embarcacao).join(', ');
      console.log(`${seg.nome}:`);
      console.log(`  Tipos: ${tipos}`);
      
      // Testar cada tipo
      const testes = ['JET_SKI', 'LANCHA', 'EMBARCACAO_COMERCIAL'];
      for (const tipo of testes) {
        const permitido = await SeguradoraTipoEmbarcacao.findOne({
          where: {
            seguradora_id: seg.id,
            tipo_embarcacao: tipo
          }
        });
        const status = permitido ? '[OK]' : '[X]';
        console.log(`    ${status} ${tipo}`);
      }
      console.log('');
    }

    console.log('='.repeat(60));
    console.log('\n[EXEMPLOS DE USO]\n');
    console.log('Essor + JET_SKI = [OK]');
    console.log('Essor + EMBARCACAO_COMERCIAL = [BLOQUEADO]');
    console.log('Swiss RE + JET_SKI = [BLOQUEADO]');
    console.log('Swiss RE + EMBARCACAO_COMERCIAL = [OK]\n');

  } catch (error) {
    console.error('[ERRO]:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testar();

