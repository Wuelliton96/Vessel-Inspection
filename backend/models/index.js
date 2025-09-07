// backend/models/index.js
const sequelize = require('../config/database');

// Importando todos os models
const NivelAcesso = require('./NivelAcesso');
const Usuario = require('./Usuario');
const Embarcacao = require('./Embarcacao');
// ... crie os outros arquivos de model da mesma forma ...
const StatusVistoria = require('./StatusVistoria'); // Crie este arquivo
const Local = require('./Local'); // Crie este arquivo
const TipoFotoChecklist = require('./TipoFotoChecklist'); // Crie este arquivo
const Vistoria = require('./Vistoria');
const Foto = require('./Foto'); // Crie este arquivo
const Laudo = require('./Laudo'); // Crie este arquivo

// --- Definindo as Associações ---

// Um Usuário pertence a um Nível de Acesso
Usuario.belongsTo(NivelAcesso, { foreignKey: 'nivel_acesso_id' });
NivelAcesso.hasMany(Usuario, { foreignKey: 'nivel_acesso_id' });

// Uma Vistoria tem vários responsáveis (usuários)
Vistoria.belongsTo(Usuario, { as: 'vistoriador', foreignKey: 'vistoriador_id' });
Vistoria.belongsTo(Usuario, { as: 'administrador', foreignKey: 'administrador_id' });
Vistoria.belongsTo(Usuario, { as: 'aprovador', foreignKey: 'aprovado_por_id' });

// Uma Vistoria pertence a uma Embarcação, um Local e um Status
Vistoria.belongsTo(Embarcacao, { foreignKey: 'embarcacao_id' });
Vistoria.belongsTo(Local, { foreignKey: 'local_id' });
Vistoria.belongsTo(StatusVistoria, { foreignKey: 'status_id' });

// Relacionamentos de Vistoria com Foto e Laudo
Vistoria.hasMany(Foto, { foreignKey: 'vistoria_id' });
Foto.belongsTo(Vistoria, { foreignKey: 'vistoria_id' });
Foto.belongsTo(TipoFotoChecklist, { foreignKey: 'tipo_foto_id' });

Vistoria.hasOne(Laudo, { as: 'Laudo', foreignKey: 'vistoria_id' });
Laudo.belongsTo(Vistoria, { as: 'Vistoria', foreignKey: 'vistoria_id' });


// Sincronizando o banco de dados (evita em ambiente de teste)
if (process.env.NODE_ENV !== 'test') {
  sequelize.sync({ alter: true })
    .then(() => console.log('Banco de dados sincronizado com sucesso.'))
    .catch(err => console.error('Erro ao sincronizar o banco de dados:', err));
}

// Exportando todos os models e a instância do sequelize
module.exports = {
  sequelize,
  NivelAcesso,
  Usuario,
  Embarcacao,
  StatusVistoria,
  Local,
  TipoFotoChecklist,
  Vistoria,
  Foto,
  Laudo
};