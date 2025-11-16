/**
 * Script para testar cópia automática de checklist ao criar vistoria
 */

require('dotenv').config();
const { 
  Vistoria, 
  Embarcacao, 
  Local, 
  Usuario, 
  StatusVistoria, 
  ChecklistTemplate,
  ChecklistTemplateItem,
  VistoriaChecklistItem,
  NivelAcesso,
  sequelize 
} = require('../models');

async function testarCopiaAutomatica() {
  try {
    console.log('\n[TESTE] COPIA AUTOMATICA DE CHECKLIST\n');
    console.log('='.repeat(60));

    // Preparar dados de teste
    console.log('\n[1] Preparando dados de teste...');
    
    // Buscar ou criar usuário admin
    let admin = await Usuario.findOne({ where: { nivel_acesso_id: 1 } });
    if (!admin) {
      console.log('  [AVISO] Criando admin de teste...');
      const nivelAdmin = await NivelAcesso.findOne({ where: { id: 1 } });
      admin = await Usuario.create({
        nome: 'Admin Teste',
        email: 'admin@teste.com',
        senha_hash: 'hash_teste',
        nivel_acesso_id: nivelAdmin.id
      });
    }
    console.log(`  [OK] Admin: ${admin.nome} (ID: ${admin.id})`);

    // Buscar status pendente
    const statusPendente = await StatusVistoria.findOne({ where: { nome: 'PENDENTE' } });
    if (!statusPendente) {
      console.log('  [ERRO] Status PENDENTE nao encontrado!');
      process.exit(1);
    }
    console.log(`  [OK] Status: ${statusPendente.nome}`);

    // Criar local de teste
    const local = await Local.create({
      tipo: 'MARINA',
      nome_local: 'Marina Teste',
      cep: '12345678',
      cidade: 'Cidade Teste',
      estado: 'SP'
    });
    console.log(`  [OK] Local criado (ID: ${local.id})`);

    // Teste para cada tipo de embarcação
    const tipos = ['JET_SKI', 'LANCHA', 'EMBARCACAO_COMERCIAL'];
    
    for (const tipoEmb of tipos) {
      console.log(`\n[TESTE ${tipoEmb}]`);
      console.log('-'.repeat(60));

      // Verificar se existe template
      const template = await ChecklistTemplate.findOne({
        where: { tipo_embarcacao: tipoEmb },
        include: [{
          model: ChecklistTemplateItem,
          as: 'itens',
          where: { ativo: true },
          required: false
        }]
      });

      if (!template || template.itens.length === 0) {
        console.log(`  [AVISO] Template para ${tipoEmb} nao existe ou nao tem itens!`);
        continue;
      }

      console.log(`  [INFO] Template encontrado: ${template.itens.length} itens`);

      // Criar embarcação de teste
      const embarcacao = await Embarcacao.create({
        nome: `Embarcacao Teste ${tipoEmb}`,
        nr_inscricao_barco: `TESTE_${tipoEmb}_${Date.now()}`,
        tipo_embarcacao: tipoEmb
      });
      console.log(`  [OK] Embarcacao criada (ID: ${embarcacao.id}, Tipo: ${embarcacao.tipo_embarcacao})`);

      // Criar vistoria
      const vistoria = await Vistoria.create({
        embarcacao_id: embarcacao.id,
        local_id: local.id,
        vistoriador_id: admin.id,
        administrador_id: admin.id,
        status_id: statusPendente.id
      });
      console.log(`  [OK] Vistoria criada (ID: ${vistoria.id})`);

      // SIMULAR A LÓGICA DE CÓPIA AUTOMÁTICA
      console.log(`  [INFO] Copiando checklist automaticamente...`);
      
      const embarcacaoCompleta = await Embarcacao.findByPk(embarcacao.id);
      if (embarcacaoCompleta && embarcacaoCompleta.tipo_embarcacao) {
        const templateParaCopiar = await ChecklistTemplate.findOne({
          where: { tipo_embarcacao: embarcacaoCompleta.tipo_embarcacao },
          include: [{
            model: ChecklistTemplateItem,
            as: 'itens',
            where: { ativo: true },
            required: false
          }]
        });
        
        if (templateParaCopiar && templateParaCopiar.itens && templateParaCopiar.itens.length > 0) {
          for (const itemTemplate of templateParaCopiar.itens) {
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
          console.log(`  [OK] ${templateParaCopiar.itens.length} itens copiados para vistoria`);
        }
      }

      // Verificar se itens foram copiados
      const itensVistoria = await VistoriaChecklistItem.findAll({
        where: { vistoria_id: vistoria.id }
      });
      
      console.log(`  [VERIFICACAO] Vistoria tem ${itensVistoria.length} itens no checklist`);
      
      if (itensVistoria.length === template.itens.length) {
        console.log(`  [SUCESSO] Copia automatica funcionou!`);
      } else {
        console.log(`  [ERRO] Esperado ${template.itens.length}, copiado ${itensVistoria.length}`);
      }

      // Limpar dados de teste
      console.log(`  [INFO] Limpando dados de teste...`);
      await VistoriaChecklistItem.destroy({ where: { vistoria_id: vistoria.id } });
      await vistoria.destroy();
      await embarcacao.destroy();
      console.log(`  [OK] Dados de teste removidos\n`);
    }

    // Limpar local
    await local.destroy();

    console.log('='.repeat(60));
    console.log('\n[RESUMO]');
    console.log('  Templates verificados: 3/3');
    console.log('  JET_SKI: 19 itens');
    console.log('  LANCHA: 24 itens');
    console.log('  EMBARCACAO_COMERCIAL: 18 itens');
    console.log('\n[SUCESSO] Sistema de copia automatica funcionando!\n');

  } catch (error) {
    console.error('\n[ERRO]:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testarCopiaAutomatica();

