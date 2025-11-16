/**
 * Teste completo de validacao seguradora x tipo
 */

require('dotenv').config();
const { 
  Vistoria,
  Embarcacao,
  Local,
  Usuario,
  StatusVistoria,
  Seguradora,
  SeguradoraTipoEmbarcacao,
  sequelize 
} = require('../models');

async function testar() {
  try {
    console.log('\n[TESTE] VALIDACAO COMPLETA SEGURADORA x TIPO\n');
    console.log('='.repeat(60));

    const admin = await Usuario.findOne({ where: { nivel_acesso_id: 1 } });
    const status = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    const local = await Local.create({ tipo: 'MARINA', cidade: 'Teste', estado: 'SP' });

    const testes = [
      { seguradora: 'Essor', tipo: 'JET_SKI', devePassar: true },
      { seguradora: 'Essor', tipo: 'LANCHA', devePassar: true },
      { seguradora: 'Essor', tipo: 'EMBARCACAO_COMERCIAL', devePassar: false },
      { seguradora: 'Swiss RE', tipo: 'JET_SKI', devePassar: false },
      { seguradora: 'Swiss RE', tipo: 'EMBARCACAO_COMERCIAL', devePassar: true },
      { seguradora: 'Mapfre', tipo: 'LANCHA', devePassar: true },
      { seguradora: 'Mapfre', tipo: 'JET_SKI', devePassar: false }
    ];

    let passou = 0;
    let falhou = 0;

    for (const teste of testes) {
      const seg = await Seguradora.findOne({ where: { nome: teste.seguradora } });
      
      console.log(`\n[TESTE] ${teste.seguradora} + ${teste.tipo}`);
      console.log(`  Esperado: ${teste.devePassar ? 'PERMITIR' : 'BLOQUEAR'}`);

      // Validar
      const tipoPermitido = await SeguradoraTipoEmbarcacao.findOne({
        where: {
          seguradora_id: seg.id,
          tipo_embarcacao: teste.tipo
        }
      });

      const permitido = !!tipoPermitido;
      
      if (permitido === teste.devePassar) {
        console.log(`  [OK] ${permitido ? 'Permitiu' : 'Bloqueou'} corretamente`);
        passou++;
      } else {
        console.log(`  [ERRO] ${permitido ? 'Permitiu' : 'Bloqueou'} mas deveria ${teste.devePassar ? 'permitir' : 'bloquear'}`);
        falhou++;
      }
    }

    // Limpar
    await local.destroy();

    console.log('\n' + '='.repeat(60));
    console.log(`[RESULTADO] ${passou}/${testes.length} testes passaram`);
    
    if (falhou === 0) {
      console.log('[SUCESSO] Validacao funcionando 100%!\n');
    } else {
      console.log(`[AVISO] ${falhou} testes falharam\n`);
    }

  } catch (error) {
    console.error('\n[ERRO]:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testar();

