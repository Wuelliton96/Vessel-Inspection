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

// ---------------- Sincronização ----------------
// Controle por variável de ambiente DB_SYNC:
//   "off"  -> não sincroniza
//   "alter" (padrão) -> altera tabelas sem perder dados
//   "force" -> recria tabelas (cuidado! apaga dados)
const shouldSync = process.env.NODE_ENV !== 'test' && (process.env.DB_SYNC || 'alter') !== 'off';
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
};
