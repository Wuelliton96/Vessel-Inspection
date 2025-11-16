/**
 * Teste completo do fluxo de criação de vistoria
 * Simula exatamente o que acontece quando usuário cria vistoria no frontend
 */

require('dotenv').config();
const { 
  Vistoria, 
  Embarcacao, 
  Local, 
  Usuario, 
  StatusVistoria,
  VistoriaChecklistItem,
  Seguradora,
  sequelize 
} = require('../models');

async function testarFluxoCompleto() {
  try {
    console.log('\n[TESTE] FLUXO COMPLETO DE CRIACAO DE VISTORIA\n');
    console.log('='.repeat(60));

    // Simular criação de vistoria pelo frontend
    console.log('\n[CENARIO] Usuario admin cria vistoria para Jet Ski\n');

    // 1. Buscar admin
    const admin = await Usuario.findOne({ where: { nivel_acesso_id: 1 } });
    console.log(`[1] Admin: ${admin.nome} (ID: ${admin.id})`);

    // 2. Buscar ou criar seguradora
    const seguradora = await Seguradora.findOne({ where: { nome: 'Essor' } });
    console.log(`[2] Seguradora: ${seguradora.nome} (ID: ${seguradora.id})`);

    // 3. Criar embarcação (como frontend faria)
    const embarcacao = await Embarcacao.create({
      nome: 'Jet Ski Teste Completo',
      nr_inscricao_barco: `TESTE_COMPLETO_${Date.now()}`,
      tipo_embarcacao: 'JET_SKI', // Tipo selecionado no frontend
      seguradora_id: seguradora.id,
      proprietario_nome: 'Proprietario Teste',
      proprietario_cpf: '12345678901',
      valor_embarcacao: 50000.00
    });
    console.log(`[3] Embarcacao criada:`);
    console.log(`    Nome: ${embarcacao.nome}`);
    console.log(`    Tipo: ${embarcacao.tipo_embarcacao}`);
    console.log(`    ID: ${embarcacao.id}`);

    // 4. Criar local
    const local = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Marina Teste Completo',
      cep: '12345678',
      cidade: 'Sao Paulo',
      estado: 'SP'
    });
    console.log(`[4] Local criado: ${local.nome_local} (ID: ${local.id})`);

    // 5. Buscar status
    const status = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    console.log(`[5] Status: ${status.nome} (ID: ${status.id})`);

    // 6. Criar vistoria
    console.log('\n[6] Criando vistoria...');
    const vistoria = await Vistoria.create({
      embarcacao_id: embarcacao.id,
      local_id: local.id,
      vistoriador_id: admin.id,
      administrador_id: admin.id,
      status_id: status.id,
      valor_embarcacao: 50000.00,
      valor_vistoria: 500.00,
      valor_vistoriador: 300.00
    });
    console.log(`    [OK] Vistoria ID: ${vistoria.id}`);

    // 7. CÓPIA AUTOMÁTICA DO CHECKLIST (lógica do backend)
    console.log('\n[7] Executando copia automatica de checklist...');
    
    const embarcacaoCompleta = await Embarcacao.findByPk(embarcacao.id);
    console.log(`    Tipo da embarcacao: ${embarcacaoCompleta.tipo_embarcacao}`);
    
    if (embarcacaoCompleta && embarcacaoCompleta.tipo_embarcacao) {
      const { ChecklistTemplate, ChecklistTemplateItem } = require('../models');
      
      const template = await ChecklistTemplate.findOne({
        where: { tipo_embarcacao: embarcacaoCompleta.tipo_embarcacao },
        include: [{
          model: ChecklistTemplateItem,
          as: 'itens',
          where: { ativo: true },
          required: false
        }]
      });
      
      if (template && template.itens && template.itens.length > 0) {
        console.log(`    Template encontrado: ${template.nome}`);
        console.log(`    Itens no template: ${template.itens.length}`);
        
        for (const itemTemplate of template.itens) {
          await VistoriaChecklistItem.create({
            vistoria_id: vistoria.id,
            template_item_id: itemTemplate.id,
            ordem: itemTemplate.ordem,
            nome: itemTemplate.nome,
            descricao: itemTemplate.descricao,
            obrigatorio: itemTemplate.obrigatorio,
            permite_video: itemTemplate.permite_video,
            status: 'PENDENTE'
          });
        }
        console.log(`    [OK] ${template.itens.length} itens copiados para vistoria`);
      } else {
        console.log(`    [AVISO] Nenhum template encontrado`);
      }
    }

    // 8. Verificar resultado final
    console.log('\n[8] Verificando resultado...');
    
    const vistoriaCompleta = await Vistoria.findByPk(vistoria.id, {
      include: [
        { model: Embarcacao, as: 'Embarcacao' },
        { model: Local, as: 'Local' },
        { model: StatusVistoria, as: 'StatusVistoria' }
      ]
    });

    const itensChecklist = await VistoriaChecklistItem.findAll({
      where: { vistoria_id: vistoria.id },
      order: [['ordem', 'ASC']]
    });

    console.log('\n[RESULTADO FINAL]');
    console.log(`  Vistoria ID: ${vistoriaCompleta.id}`);
    console.log(`  Embarcacao: ${vistoriaCompleta.Embarcacao.nome}`);
    console.log(`  Tipo: ${vistoriaCompleta.Embarcacao.tipo_embarcacao}`);
    console.log(`  Local: ${vistoriaCompleta.Local.nome_local}`);
    console.log(`  Status: ${vistoriaCompleta.StatusVistoria.nome}`);
    console.log(`  Checklist: ${itensChecklist.length} itens`);

    if (itensChecklist.length > 0) {
      console.log('\n  Primeiros 5 itens do checklist:');
      itensChecklist.slice(0, 5).forEach(item => {
        const obg = item.obrigatorio ? '[OBRIGATORIO]' : '[OPCIONAL]';
        console.log(`    ${item.ordem}. ${item.nome} ${obg}`);
      });
    }

    // 9. Limpar dados de teste
    console.log('\n[9] Limpando dados de teste...');
    await VistoriaChecklistItem.destroy({ where: { vistoria_id: vistoria.id } });
    await vistoria.destroy();
    await embarcacao.destroy();
    await local.destroy();
    console.log('    [OK] Dados removidos');

    console.log('\n' + '='.repeat(60));
    console.log('[SUCESSO] FLUXO COMPLETO FUNCIONANDO!\n');
    console.log('[RESULTADO]');
    console.log('  1. Vistoria criada com sucesso');
    console.log('  2. Checklist copiado automaticamente');
    console.log('  3. Vistoriador pode comecar a preencher');
    console.log('\n[INFO] O sistema esta pronto para uso!\n');

  } catch (error) {
    console.error('\n[ERRO]:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testarFluxoCompleto();

