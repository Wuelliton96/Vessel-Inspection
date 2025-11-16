const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Laudo = sequelize.define('Laudo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  vistoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  numero_laudo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  versao: {
    type: DataTypes.STRING(20),
    defaultValue: 'BS 2021-01'
  },
  
  nome_moto_aquatica: DataTypes.STRING(255),
  local_guarda: DataTypes.TEXT,
  proprietario: DataTypes.STRING(255),
  cpf_cnpj: DataTypes.STRING(18),
  endereco_proprietario: DataTypes.TEXT,
  responsavel: DataTypes.STRING(255),
  data_inspecao: DataTypes.DATEONLY,
  local_vistoria: DataTypes.TEXT,
  empresa_prestadora: DataTypes.STRING(255),
  responsavel_inspecao: DataTypes.STRING(255),
  participantes_inspecao: DataTypes.TEXT,
  
  inscricao_capitania: DataTypes.STRING(100),
  estaleiro_construtor: DataTypes.STRING(255),
  tipo_embarcacao: DataTypes.STRING(100),
  modelo_embarcacao: DataTypes.STRING(255),
  ano_fabricacao: DataTypes.INTEGER,
  capacidade: DataTypes.STRING(100),
  classificacao_embarcacao: DataTypes.STRING(100),
  area_navegacao: DataTypes.STRING(100),
  situacao_capitania: DataTypes.TEXT,
  valor_risco: DataTypes.DECIMAL(12, 2),
  
  material_casco: DataTypes.STRING(100),
  observacoes_casco: DataTypes.TEXT,
  
  quantidade_motores: DataTypes.INTEGER,
  tipo_motor: DataTypes.STRING(100),
  fabricante_motor: DataTypes.STRING(255),
  modelo_motor: DataTypes.STRING(255),
  numero_serie_motor: DataTypes.STRING(255),
  potencia_motor: DataTypes.STRING(100),
  combustivel_utilizado: DataTypes.STRING(50),
  capacidade_tanque: DataTypes.STRING(50),
  ano_fabricacao_motor: DataTypes.INTEGER,
  numero_helices: DataTypes.STRING(100),
  rabeta_reversora: DataTypes.STRING(100),
  blower: DataTypes.STRING(100),
  
  quantidade_baterias: DataTypes.INTEGER,
  marca_baterias: DataTypes.STRING(100),
  capacidade_baterias: DataTypes.STRING(50),
  carregador_bateria: DataTypes.STRING(100),
  transformador: DataTypes.STRING(100),
  quantidade_geradores: DataTypes.INTEGER,
  fabricante_geradores: DataTypes.STRING(255),
  tipo_modelo_geradores: DataTypes.STRING(255),
  capacidade_geracao: DataTypes.STRING(100),
  quantidade_bombas_porao: DataTypes.INTEGER,
  fabricante_bombas_porao: DataTypes.STRING(255),
  modelo_bombas_porao: DataTypes.STRING(255),
  quantidade_bombas_agua_doce: DataTypes.INTEGER,
  fabricante_bombas_agua_doce: DataTypes.STRING(255),
  modelo_bombas_agua_doce: DataTypes.STRING(255),
  observacoes_eletricos: DataTypes.TEXT,
  
  guincho_eletrico: DataTypes.STRING(100),
  ancora: DataTypes.STRING(100),
  cabos: DataTypes.STRING(255),
  
  agulha_giroscopica: DataTypes.STRING(100),
  agulha_magnetica: DataTypes.STRING(100),
  antena: DataTypes.STRING(100),
  bidata: DataTypes.STRING(100),
  barometro: DataTypes.STRING(100),
  buzina: DataTypes.STRING(100),
  conta_giros: DataTypes.STRING(100),
  farol_milha: DataTypes.STRING(100),
  gps: DataTypes.STRING(100),
  higrometro: DataTypes.STRING(100),
  horimetro: DataTypes.STRING(100),
  limpador_parabrisa: DataTypes.STRING(100),
  manometros: DataTypes.STRING(100),
  odometro_fundo: DataTypes.STRING(100),
  passarela_embarque: DataTypes.STRING(100),
  piloto_automatico: DataTypes.STRING(100),
  psi: DataTypes.STRING(100),
  radar: DataTypes.STRING(100),
  radio_ssb: DataTypes.STRING(100),
  radio_vhf: DataTypes.STRING(100),
  radiogoniometro: DataTypes.STRING(100),
  sonda: DataTypes.STRING(100),
  speed_log: DataTypes.STRING(100),
  strobow: DataTypes.STRING(100),
  termometro: DataTypes.STRING(100),
  voltimetro: DataTypes.STRING(100),
  outros_equipamentos: DataTypes.TEXT,
  
  extintores_automaticos: DataTypes.STRING(100),
  extintores_portateis: DataTypes.STRING(100),
  outros_incendio: DataTypes.TEXT,
  atendimento_normas: DataTypes.STRING(100),
  
  acumulo_agua: DataTypes.STRING(100),
  avarias_casco: DataTypes.STRING(100),
  estado_geral_limpeza: DataTypes.TEXT,
  teste_funcionamento_motor: DataTypes.TEXT,
  funcionamento_bombas_porao: DataTypes.TEXT,
  manutencao: DataTypes.STRING(100),
  observacoes_vistoria: DataTypes.TEXT,
  
  checklist_eletrica: DataTypes.JSONB,
  checklist_hidraulica: DataTypes.JSONB,
  checklist_geral: DataTypes.JSONB,
  
  logo_empresa_url: DataTypes.STRING(512),
  nome_empresa: DataTypes.STRING(255),
  nota_rodape: DataTypes.TEXT,
  
  url_pdf: DataTypes.STRING(512),
  data_geracao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'laudos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeUpdate: (laudo) => {
      if (laudo.changed('data_geracao')) {
        laudo.set('data_geracao', laudo.previous('data_geracao'));
      }
    }
  }
});

module.exports = Laudo;