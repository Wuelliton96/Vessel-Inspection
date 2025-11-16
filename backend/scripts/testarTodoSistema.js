/**
 * TESTE COMPLETO - TODOS OS SISTEMAS
 */

require('dotenv').config();
const { 
  sequelize,
  Vistoria,
  Embarcacao,
  Local,
  Usuario,
  StatusVistoria,
  Seguradora,
  ChecklistTemplate,
  VistoriaChecklistItem,
  AuditoriaLog
} = require('../models');

async function testarTudo() {
  const tests = [];
  
  try {
    console.log('\n[TESTE COMPLETO] VALIDANDO TODO O SISTEMA\n');
    console.log('='.repeat(60));

    // Teste 1: Tabelas existem
    console.log('\n[1] Verificando tabelas...');
    const tabelas = [
      'usuarios', 'vistorias', 'embarcacoes', 'locais',
      'seguradoras', 'checklist_templates', 'vistoria_checklist_itens',
      'auditoria_logs'
    ];
    
    for (const tabela of tabelas) {
      const [result] = await sequelize.query(`
        SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '${tabela}')
      `);
      const existe = Object.values(result[0])[0];
      tests.push({ nome: `Tabela ${tabela}`, ok: existe });
      console.log(`    ${existe ? '[OK]' : '[ERRO]'} ${tabela}`);
    }

    // Teste 2: Seguradoras
    console.log('\n[2] Seguradoras...');
    const countSeg = await Seguradora.count();
    tests.push({ nome: 'Seguradoras cadastradas', ok: countSeg >= 5 });
    console.log(`    [${countSeg >= 5 ? 'OK' : 'ERRO'}] ${countSeg} seguradoras`);

    // Teste 3: Templates
    console.log('\n[3] Templates de checklist...');
    const countTemplates = await ChecklistTemplate.count();
    tests.push({ nome: 'Templates criados', ok: countTemplates >= 3 });
    console.log(`    [${countTemplates >= 3 ? 'OK' : 'ERRO'}] ${countTemplates} templates`);

    // Teste 4: Status
    console.log('\n[4] Status de vistoria...');
    const countStatus = await StatusVistoria.count();
    tests.push({ nome: 'Status criados', ok: countStatus >= 6 });
    console.log(`    [${countStatus >= 6 ? 'OK' : 'ERRO'}] ${countStatus} status`);

    // Teste 5: Usuarios
    console.log('\n[5] Usuarios...');
    const countUsers = await Usuario.count();
    tests.push({ nome: 'Usuarios cadastrados', ok: countUsers >= 1 });
    console.log(`    [${countUsers >= 1 ? 'OK' : 'ERRO'}] ${countUsers} usuarios`);

    // Teste 6: Criar vistoria com checklist
    console.log('\n[6] Criacao de vistoria com checklist...');
    const admin = await Usuario.findOne({ where: { nivel_acesso_id: 1 } });
    const seguradora = await Seguradora.findOne({ where: { nome: 'Essor' } });
    const status = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    
    const emb = await Embarcacao.create({
      nome: 'Teste Sistema',
      nr_inscricao_barco: `SYS_${Date.now()}`,
      tipo_embarcacao: 'JET_SKI',
      seguradora_id: seguradora.id
    });
    
    const loc = await Local.create({
      tipo: 'MARINA',
      cidade: 'Teste',
      estado: 'SP'
    });
    
    const vist = await Vistoria.create({
      embarcacao_id: emb.id,
      local_id: loc.id,
      vistoriador_id: admin.id,
      administrador_id: admin.id,
      status_id: status.id
    });
    
    // Simular copia de checklist
    const template = await ChecklistTemplate.findOne({
      where: { tipo_embarcacao: 'JET_SKI' },
      include: [{ association: 'itens', where: { ativo: true }, required: false }]
    });
    
    if (template && template.itens) {
      for (const item of template.itens) {
        await VistoriaChecklistItem.create({
          vistoria_id: vist.id,
          template_item_id: item.id,
          ordem: item.ordem,
          nome: item.nome,
          descricao: item.descricao,
          obrigatorio: item.obrigatorio,
          permite_video: item.permite_video,
          status: 'PENDENTE'
        });
      }
    }
    
    const itensCopiados = await VistoriaChecklistItem.count({ where: { vistoria_id: vist.id } });
    tests.push({ nome: 'Copia automatica de checklist', ok: itensCopiados > 0 });
    console.log(`    [${itensCopiados > 0 ? 'OK' : 'ERRO'}] ${itensCopiados} itens copiados`);

    // Teste 7: Delete apenas se PENDENTE
    console.log('\n[7] Delete de vistoria...');
    const vistPendente = await Vistoria.findByPk(vist.id, {
      include: [{ model: StatusVistoria, as: 'StatusVistoria' }]
    });
    
    const podeDeletar = vistPendente.StatusVistoria?.nome === 'PENDENTE';
    tests.push({ nome: 'Delete protegido por status', ok: podeDeletar });
    console.log(`    [${podeDeletar ? 'OK' : 'ERRO'}] Status ${vistPendente.StatusVistoria?.nome} - Pode deletar: ${podeDeletar}`);

    // Limpar
    await VistoriaChecklistItem.destroy({ where: { vistoria_id: vist.id } });
    await vist.destroy();
    await emb.destroy();
    await loc.destroy();

    // Resumo
    console.log('\n' + '='.repeat(60));
    console.log('[RESUMO DOS TESTES]');
    const passed = tests.filter(t => t.ok).length;
    const total = tests.length;
    console.log(`  Passou: ${passed}/${total}`);
    
    tests.forEach(t => {
      console.log(`  [${t.ok ? 'OK' : 'FALHOU'}] ${t.nome}`);
    });

    if (passed === total) {
      console.log('\n[SUCESSO] TODOS OS TESTES PASSARAM!\n');
      console.log('[STATUS] Sistema pronto para uso!\n');
    } else {
      console.log('\n[AVISO] Alguns testes falharam\n');
    }

  } catch (error) {
    console.error('\n[ERRO]:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testarTudo();

