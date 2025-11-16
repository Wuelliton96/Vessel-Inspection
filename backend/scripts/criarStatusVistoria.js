/**
 * Script para criar status de vistoria padrão
 */

require('dotenv').config();
const { StatusVistoria, sequelize } = require('../models');

const STATUS_PADRAO = [
  { nome: 'PENDENTE', descricao: 'Vistoria criada, aguardando inicio' },
  { nome: 'EM_ANDAMENTO', descricao: 'Vistoria em andamento pelo vistoriador' },
  { nome: 'CONCLUIDA', descricao: 'Vistoria concluida pelo vistoriador' },
  { nome: 'APROVADA', descricao: 'Vistoria aprovada pelo administrador' },
  { nome: 'REPROVADA', descricao: 'Vistoria reprovada, precisa refazer' },
  { nome: 'CANCELADA', descricao: 'Vistoria cancelada' }
];

async function criarStatus() {
  try {
    console.log('\n[SCRIPT] Criando Status de Vistoria\n');
    console.log('='.repeat(60));

    for (const statusData of STATUS_PADRAO) {
      const [status, criado] = await StatusVistoria.findOrCreate({
        where: { nome: statusData.nome },
        defaults: statusData
      });

      if (criado) {
        console.log(`[OK] ${statusData.nome} - criado (ID: ${status.id})`);
      } else {
        console.log(`[INFO] ${statusData.nome} - ja existe (ID: ${status.id})`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('[SUCESSO] Status criados!\n');

    const total = await StatusVistoria.count();
    console.log(`[INFO] Total de status: ${total}\n`);

  } catch (error) {
    console.error('\n[ERRO]:', error.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

criarStatus();

