/**
 * Remover todos os dados ficticios criados
 */

require('dotenv').config();
const { 
  VistoriaChecklistItem,
  Vistoria,
  Embarcacao,
  Local,
  Usuario,
  Cliente,
  sequelize 
} = require('../models');

async function removerDados() {
  try {
    console.log('\n[LIMPEZA] REMOVENDO DADOS FICTICIOS\n');
    console.log('='.repeat(60));

    // 1. Remover itens de checklist
    console.log('\n[1] Removendo itens de checklist...');
    const deletedChecklist = await VistoriaChecklistItem.destroy({ where: {} });
    console.log(`    [OK] ${deletedChecklist} itens removidos`);

    // 2. Remover vistorias
    console.log('\n[2] Removendo vistorias...');
    const deletedVistorias = await Vistoria.destroy({ where: {} });
    console.log(`    [OK] ${deletedVistorias} vistorias removidas`);

    // 3. Remover embarcacoes
    console.log('\n[3] Removendo embarcacoes...');
    const deletedEmbarcacoes = await Embarcacao.destroy({ where: {} });
    console.log(`    [OK] ${deletedEmbarcacoes} embarcacoes removidas`);

    // 4. Remover locais
    console.log('\n[4] Removendo locais...');
    const deletedLocais = await Local.destroy({ where: {} });
    console.log(`    [OK] ${deletedLocais} locais removidos`);

    // 5. Remover clientes
    console.log('\n[5] Removendo clientes...');
    const deletedClientes = await Cliente.destroy({ where: {} });
    console.log(`    [OK] ${deletedClientes} clientes removidos`);

    // 6. Remover vistoriadores (exceto admin ID=1)
    console.log('\n[6] Removendo vistoriadores (mantendo admin)...');
    const deletedVistoriadores = await Usuario.destroy({
      where: {
        nivel_acesso_id: 2,
        id: { [require('sequelize').Op.gt]: 1 }
      }
    });
    console.log(`    [OK] ${deletedVistoriadores} vistoriadores removidos`);

    console.log('\n' + '='.repeat(60));
    console.log('[SUCESSO] Dados ficticios removidos!\n');
    console.log('[INFO] Banco limpo e pronto para uso!\n');

    // Verificar o que sobrou
    console.log('[CONTADORES FINAIS]');
    console.log(`  Vistorias: ${await Vistoria.count()}`);
    console.log(`  Embarcacoes: ${await Embarcacao.count()}`);
    console.log(`  Locais: ${await Local.count()}`);
    console.log(`  Clientes: ${await Cliente.count()}`);
    console.log(`  Vistoriadores: ${await Usuario.count({ where: { nivel_acesso_id: 2 } })}`);
    console.log(`  Itens Checklist: ${await VistoriaChecklistItem.count()}\n`);

  } catch (error) {
    console.error('\n[ERRO]:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

removerDados();

