// backend/models/index.js
const path = require('path');

// garante que o .env de backend seja lido, mesmo se o CWD mudar
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SequelizeLib = require('sequelize');
const sequelize = require('../config/database');

// ------------ Import dos Models (já inicializados) -------------
// Cada arquivo de model deve exportar um Model já definido, por ex.:
//   const { DataTypes } = require('sequelize');
//   const sequelize = require('../config/database');
//   const Usuario = sequelize.define('usuarios', { ... });
//   module.exports = Usuario;

const NivelAcesso = require('./NivelAcesso');
const Usuario = require('./Usuario');
const Embarcacao = require('./Embarcacao');
const StatusVistoria = require('./StatusVistoria');
const Local = require('./Local');
const TipoFotoChecklist = require('./TipoFotoChecklist');
const Vistoria = require('./Vistoria');
const Foto = require('./Foto');
const Laudo = require('./Laudo');
const LotePagamento = require('./LotePagamento');
const VistoriaLotePagamento = require('./VistoriaLotePagamento');
const Seguradora = require('./Seguradora');
const SeguradoraTipoEmbarcacao = require('./SeguradoraTipoEmbarcacao');
const Cliente = require('./Cliente');
const ChecklistTemplate = require('./ChecklistTemplate');
const ChecklistTemplateItem = require('./ChecklistTemplateItem');
const VistoriaChecklistItem = require('./VistoriaChecklistItem');

// ---------------- Associações ----------------

// Usuário <-> Nível de Acesso
Usuario.belongsTo(NivelAcesso, { foreignKey: 'nivel_acesso_id' });
NivelAcesso.hasMany(Usuario, { foreignKey: 'nivel_acesso_id' });

// Vistoria <-> Responsáveis (Usuário)
Vistoria.belongsTo(Usuario, { as: 'vistoriador', foreignKey: 'vistoriador_id' });
Vistoria.belongsTo(Usuario, { as: 'administrador', foreignKey: 'administrador_id' });
Vistoria.belongsTo(Usuario, { as: 'aprovador', foreignKey: 'aprovado_por_id' });

// Vistoria <-> Embarcação / Local / Status
Vistoria.belongsTo(Embarcacao, { as: 'Embarcacao', foreignKey: 'embarcacao_id' });
Vistoria.belongsTo(Local, { as: 'Local', foreignKey: 'local_id' });
Vistoria.belongsTo(StatusVistoria, { as: 'StatusVistoria', foreignKey: 'status_id' });

// Vistoria <-> Foto / Laudo
Vistoria.hasMany(Foto, { as: 'Fotos', foreignKey: 'vistoria_id' });
Foto.belongsTo(Vistoria, { as: 'Vistoria', foreignKey: 'vistoria_id' });
Foto.belongsTo(TipoFotoChecklist, { as: 'TipoFotoChecklist', foreignKey: 'tipo_foto_id' });
TipoFotoChecklist.hasMany(Foto, { as: 'Fotos', foreignKey: 'tipo_foto_id' });

Vistoria.hasOne(Laudo, { as: 'Laudo', foreignKey: 'vistoria_id' });
Laudo.belongsTo(Vistoria, { as: 'Vistoria', foreignKey: 'vistoria_id' });

// LotePagamento <-> Usuario (vistoriador e quem pagou)
LotePagamento.belongsTo(Usuario, { as: 'vistoriador', foreignKey: 'vistoriador_id' });
LotePagamento.belongsTo(Usuario, { as: 'pagoPor', foreignKey: 'pago_por_id' });
Usuario.hasMany(LotePagamento, { as: 'lotesPagamento', foreignKey: 'vistoriador_id' });

// VistoriaLotePagamento <-> LotePagamento
VistoriaLotePagamento.belongsTo(LotePagamento, { as: 'lotePagamento', foreignKey: 'lote_pagamento_id' });
LotePagamento.hasMany(VistoriaLotePagamento, { as: 'vistoriasLote', foreignKey: 'lote_pagamento_id' });

// VistoriaLotePagamento <-> Vistoria
VistoriaLotePagamento.belongsTo(Vistoria, { as: 'vistoria', foreignKey: 'vistoria_id' });
Vistoria.hasMany(VistoriaLotePagamento, { as: 'lotesPagamento', foreignKey: 'vistoria_id' });

// Seguradora <-> SeguradoraTipoEmbarcacao
Seguradora.hasMany(SeguradoraTipoEmbarcacao, { as: 'tiposPermitidos', foreignKey: 'seguradora_id' });
SeguradoraTipoEmbarcacao.belongsTo(Seguradora, { as: 'seguradora', foreignKey: 'seguradora_id' });

// Embarcacao <-> Seguradora
Embarcacao.belongsTo(Seguradora, { as: 'Seguradora', foreignKey: 'seguradora_id' });
Seguradora.hasMany(Embarcacao, { as: 'embarcacoes', foreignKey: 'seguradora_id' });

// Cliente <-> Embarcacao
Cliente.hasMany(Embarcacao, { as: 'embarcacoes', foreignKey: 'cliente_id' });
Embarcacao.belongsTo(Cliente, { as: 'Cliente', foreignKey: 'cliente_id' });

// ChecklistTemplate <-> ChecklistTemplateItem
ChecklistTemplate.hasMany(ChecklistTemplateItem, { as: 'itens', foreignKey: 'checklist_template_id' });
ChecklistTemplateItem.belongsTo(ChecklistTemplate, { as: 'template', foreignKey: 'checklist_template_id' });

// Vistoria <-> VistoriaChecklistItem
Vistoria.hasMany(VistoriaChecklistItem, { as: 'checklistItens', foreignKey: 'vistoria_id' });
VistoriaChecklistItem.belongsTo(Vistoria, { as: 'vistoria', foreignKey: 'vistoria_id' });

// VistoriaChecklistItem <-> Foto
VistoriaChecklistItem.belongsTo(Foto, { as: 'foto', foreignKey: 'foto_id' });

// VistoriaChecklistItem <-> ChecklistTemplateItem
VistoriaChecklistItem.belongsTo(ChecklistTemplateItem, { as: 'templateItem', foreignKey: 'template_item_id' });

// ---------------- Sincronização ----------------
// Controle por variável de ambiente DB_SYNC:
//   "off" (padrão)  -> não sincroniza (use migrations SQL)
//   "alter" -> altera tabelas sem perder dados
//   "force" -> recria tabelas (cuidado! apaga dados)
const shouldSync = process.env.NODE_ENV !== 'test' && (process.env.DB_SYNC || 'off') !== 'off';
if (shouldSync) {
  const mode = process.env.DB_SYNC || 'alter';
  const syncOptions = {
    alter: mode === 'alter',
    force: mode === 'force'
  };

  sequelize.sync(syncOptions)
    .then(() => console.log(`Banco de dados sincronizado (${mode}).`))
    .catch(err => console.error('Erro ao sincronizar o banco de dados:', err));
}

// ---------------- Exports ----------------
module.exports = {
  // instância e lib (útil em alguns lugares)
  sequelize,
  Sequelize: SequelizeLib,

  // models
  NivelAcesso,
  Usuario,
  Embarcacao,
  StatusVistoria,
  Local,
  TipoFotoChecklist,
  Vistoria,
  Foto,
  Laudo,
  LotePagamento,
  VistoriaLotePagamento,
  Seguradora,
  SeguradoraTipoEmbarcacao,
  Cliente,
  ChecklistTemplate,
  ChecklistTemplateItem,
  VistoriaChecklistItem,
};
