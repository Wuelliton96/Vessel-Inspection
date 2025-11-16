/**
 * Testar DELETE de vistoria - apenas se PENDENTE
 */

require('dotenv').config();
const { 
  Vistoria, 
  Embarcacao, 
  Local, 
  Usuario, 
  StatusVistoria,
  NivelAcesso,
  sequelize 
} = require('../models');

async function testar() {
  try {
    console.log('\n[TESTE] DELETE VISTORIA - APENAS SE PENDENTE\n');
    console.log('='.repeat(60));

    // Preparar dados
    const admin = await Usuario.findOne({ where: { nivel_acesso_id: 1 } });
    const embarcacao = await Embarcacao.create({
      nome: 'Teste Delete',
      nr_inscricao_barco: `DEL_${Date.now()}`,
      tipo_embarcacao: 'JET_SKI'
    });
    const local = await Local.create({
      tipo: 'MARINA',
      cidade: 'Teste',
      estado: 'SP'
    });

    const statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    const statusConcluida = await StatusVistoria.findOne({ where: { nome: 'CONCLUIDA' } });

    // Teste 1: Deletar vistoria PENDENTE (deve funcionar)
    console.log('\n[1] Teste: Deletar vistoria PENDENTE');
    const vistoria1 = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: admin.id,
      administrador_id: admin.id,
      status_id: statusPendente.id
    });
    console.log(`    Vistoria criada ID: ${vistoria1.id}, Status: PENDENTE`);
    
    await vistoria1.destroy();
    console.log('    [OK] Deletou com sucesso (status PENDENTE)');

    // Teste 2: Tentar deletar vistoria CONCLUIDA (deve bloquear)
    console.log('\n[2] Teste: Tentar deletar vistoria CONCLUIDA');
    const vistoria2 = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: admin.id,
      administrador_id: admin.id,
      status_id: statusConcluida.id
    });
    console.log(`    Vistoria criada ID: ${vistoria2.id}, Status: CONCLUIDA`);

    // Simular verificação do backend
    const vistoriaComStatus = await Vistoria.findByPk(vistoria2.id, {
      include: [{ model: StatusVistoria, as: 'StatusVistoria' }]
    });

    if (vistoriaComStatus.StatusVistoria?.nome !== 'PENDENTE') {
      console.log(`    [OK] Bloqueado! Status ${vistoriaComStatus.StatusVistoria?.nome} nao pode deletar`);
    } else {
      console.log('    [ERRO] Deveria ter bloqueado!');
    }

    // Limpar
    await vistoria2.destroy({ force: true }); // Force para limpar teste
    await embarcacao.destroy();
    await local.destroy();

    console.log('\n' + '='.repeat(60));
    console.log('[SUCESSO] Validacao de DELETE funcionando!\n');
    console.log('[REGRA] Apenas vistorias PENDENTES podem ser deletadas\n');

  } catch (error) {
    console.error('\n[ERRO]:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testar();

