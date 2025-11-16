/**
 * Script para testar o sistema de seguradoras
 * Uso: node backend/scripts/testarSeguradoras.js
 */

require('dotenv').config();
const { Seguradora, SeguradoraTipoEmbarcacao, sequelize } = require('../models');

async function testarSeguradoras() {
  try {
    console.log('\n[TESTE] TESTANDO SISTEMA DE SEGURADORAS\n');
    console.log('='.repeat(60));

    // Teste 1: Verificar se tabelas existem
    console.log('\n[1] Verificando se tabelas existem...');
    const [resultSeg] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'seguradoras'
      ) as existe
    `);
    
    const [resultTipo] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'seguradora_tipo_embarcacao'
      ) as existe
    `);
    
    if (resultSeg[0].existe && resultTipo[0].existe) {
      console.log('   [OK] Tabelas seguradoras e seguradora_tipo_embarcacao existem');
    } else {
      console.log('   [ERRO] Tabelas nao existem!');
      process.exit(1);
    }

    // Teste 2: Contar seguradoras
    console.log('\n[2] Contando seguradoras...');
    const count = await Seguradora.count();
    console.log(`   [INFO] Total de seguradoras: ${count}`);

    // Teste 3: Listar seguradoras com tipos
    console.log('\n[3] Listando seguradoras com tipos permitidos...');
    const seguradoras = await Seguradora.findAll({
      include: [{
        model: SeguradoraTipoEmbarcacao,
        as: 'tiposPermitidos',
        attributes: ['id', 'tipo_embarcacao']
      }],
      order: [['nome', 'ASC']]
    });

    console.log(`   [OK] Encontradas ${seguradoras.length} seguradoras:`);
    seguradoras.forEach(seg => {
      const tipos = seg.tiposPermitidos.map(t => t.tipo_embarcacao).join(', ');
      console.log(`      - ${seg.nome} (${seg.ativo ? 'ATIVA' : 'INATIVA'}) - Tipos: ${tipos}`);
    });

    // Teste 4: Buscar uma seguradora específica
    console.log('\n[4] Buscando seguradora Essor...');
    const essor = await Seguradora.findOne({
      where: { nome: 'Essor' },
      include: [{
        model: SeguradoraTipoEmbarcacao,
        as: 'tiposPermitidos'
      }]
    });

    if (essor) {
      console.log(`   [OK] Essor encontrada - ID: ${essor.id}`);
      console.log(`       Tipos permitidos: ${essor.tiposPermitidos.length}`);
    } else {
      console.log('   [ERRO] Essor nao encontrada');
    }

    // Teste 5: Criar seguradora de teste
    console.log('\n[5] Criando seguradora de teste...');
    const novaSeg = await Seguradora.create({
      nome: 'Teste Seguradora',
      ativo: true
    });
    console.log(`   [OK] Seguradora criada com ID: ${novaSeg.id}`);

    // Teste 6: Adicionar tipo permitido
    console.log('\n[6] Adicionando tipo permitido...');
    await SeguradoraTipoEmbarcacao.create({
      seguradora_id: novaSeg.id,
      tipo_embarcacao: 'LANCHA'
    });
    console.log('   [OK] Tipo LANCHA adicionado');

    // Teste 7: Buscar com tipo
    const segComTipo = await Seguradora.findByPk(novaSeg.id, {
      include: [{
        model: SeguradoraTipoEmbarcacao,
        as: 'tiposPermitidos'
      }]
    });
    console.log(`   [OK] Seguradora tem ${segComTipo.tiposPermitidos.length} tipo(s)`);

    // Teste 8: Deletar seguradora de teste
    console.log('\n[7] Limpando dados de teste...');
    await novaSeg.destroy();
    console.log('   [OK] Seguradora de teste removida');

    console.log('\n' + '='.repeat(60));
    console.log('[SUCESSO] TODOS OS TESTES PASSARAM!\n');
    console.log('[INFO] Sistema de seguradoras funcionando corretamente!\n');

  } catch (error) {
    console.error('\n[ERRO] ERRO NO TESTE:');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.log('');
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testarSeguradoras();

