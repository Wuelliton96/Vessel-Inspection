// Tipos para o sistema de vistorias náuticas
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  nivelAcessoId: number;
  nivelAcesso?: NivelAcesso;
  ativo: boolean;
  deveAtualizarSenha?: boolean;
  cpf?: string | null;
  telefone_e164?: string | null;
  estado?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NivelAcesso {
  id: number;
  nome: string;
  descricao: string;
}

export type TipoEmbarcacao = 'JET_SKI' | 'BALSA' | 'IATE' | 'VELEIRO' | 'REBOCADOR' | 'EMPURRADOR' | 'LANCHA' | 'BARCO' | 'OUTRO';

export type TipoContatoAcompanhante = 'PROPRIETARIO' | 'MARINA' | 'TERCEIRO';

export type PeriodoTipoPagamento = 'DIARIO' | 'SEMANAL' | 'MENSAL';

export type StatusPagamento = 'PENDENTE' | 'PAGO' | 'CANCELADO';

export type TipoEmbarcacaoSeguradora = 'LANCHA' | 'JET_SKI' | 'EMBARCACAO_COMERCIAL';

export type TipoPessoa = 'FISICA' | 'JURIDICA';

export type StatusChecklistItem = 'PENDENTE' | 'CONCLUIDO' | 'NAO_APLICAVEL';

export interface ChecklistTemplate {
  id: number;
  tipo_embarcacao: string;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  itens?: ChecklistTemplateItem[];
}

export interface ChecklistTemplateItem {
  id: number;
  checklist_template_id: number;
  ordem: number;
  nome: string;
  descricao?: string | null;
  obrigatorio: boolean;
  permite_video: boolean;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VistoriaChecklistItem {
  id: number;
  vistoria_id: number;
  template_item_id?: number | null;
  ordem: number;
  nome: string;
  descricao?: string | null;
  obrigatorio: boolean;
  permite_video: boolean;
  status: StatusChecklistItem;
  foto_id?: number | null;
  observacao?: string | null;
  concluido_em?: string | null;
  createdAt: string;
  updatedAt: string;
  foto?: any;
}

export interface ChecklistProgresso {
  total: number;
  concluidos: number;
  pendentes: number;
  naoAplicaveis: number;
  obrigatoriosPendentes: number;
  percentual: number;
  podeAprovar: boolean;
}

export interface Cliente {
  id: number;
  tipo_pessoa: TipoPessoa;
  nome: string;
  cpf?: string | null;
  cnpj?: string | null;
  telefone_e164?: string | null;
  email?: string | null;
  // Endereço
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  // Relacionamentos
  embarcacoes?: Embarcacao[];
}

export interface Embarcacao {
  id: number;
  nome: string;
  nr_inscricao_barco: string;
  proprietario_nome?: string;
  proprietario_cpf?: string | null;
  proprietario_telefone_e164?: string | null;
  proprietario_email?: string;
  tipo_embarcacao?: TipoEmbarcacao | null;
  porte?: string | null;
  seguradora_id?: number | null;
  valor_embarcacao?: number | string | null;
  ano_fabricacao?: number | null;
  cliente_id?: number | null;
  Seguradora?: Seguradora;
  Cliente?: Cliente;
  createdAt: string;
  updatedAt: string;
}

export interface Local {
  id: number;
  tipo: 'MARINA' | 'RESIDENCIA';
  nome_local?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vistoria {
  id: number;
  dados_rascunho?: any;
  data_inicio?: string;
  data_conclusao?: string;
  data_aprovacao?: string;
  embarcacao_id: number;
  local_id: number;
  vistoriador_id: number;
  administrador_id: number;
  status_id: number;
  valor_embarcacao?: number | string | null;
  valor_vistoria?: number | string | null;
  valor_vistoriador?: number | string | null;
  contato_acompanhante_tipo?: TipoContatoAcompanhante | null;
  contato_acompanhante_nome?: string | null;
  contato_acompanhante_telefone_e164?: string | null;
  contato_acompanhante_email?: string | null;
  corretora_nome?: string | null;
  corretora_telefone_e164?: string | null;
  corretora_email_laudo?: string | null;
  embarcacao?: Embarcacao;
  local?: Local;
  vistoriador?: Usuario;
  administrador?: Usuario;
  statusVistoria?: StatusVistoria;
  fotos?: Foto[];
  laudos?: Laudo[];
  createdAt: string;
  updatedAt: string;
  // Relacionamentos com nomes corretos do backend (maiúsculas)
  Embarcacao?: Embarcacao;
  Local?: Local;
  StatusVistoria?: StatusVistoria;
  Fotos?: Foto[];
}

export interface StatusVistoria {
  id: number;
  nome: string;
  descricao: string;
}

export interface Foto {
  id: number;
  url_arquivo: string;
  observacao?: string;
  vistoria_id: number;
  tipo_foto_id: number;
  tipoFotoChecklist?: TipoFotoChecklist;
  TipoFotoChecklist?: TipoFotoChecklist;
  createdAt: string;
  updatedAt: string;
}

export interface TipoFotoChecklist {
  id: number;
  codigo: string;
  nome_exibicao: string;
  descricao?: string;
  obrigatorio: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Laudo {
  id: number;
  conteudo: string;
  vistoriaId: number;
  createdAt: string;
  updatedAt: string;
}

export interface LotePagamento {
  id: number;
  vistoriador_id: number;
  periodo_tipo: PeriodoTipoPagamento;
  data_inicio: string;
  data_fim: string;
  quantidade_vistorias: number;
  valor_total: number | string;
  status: StatusPagamento;
  data_pagamento?: string | null;
  forma_pagamento?: string | null;
  comprovante_url?: string | null;
  observacoes?: string | null;
  pago_por_id?: number | null;
  createdAt: string;
  updatedAt: string;
  // Relacionamentos
  vistoriador?: Usuario;
  pagoPor?: Usuario;
  vistorias?: VistoriaLotePagamento[];
}

export interface VistoriaLotePagamento {
  id: number;
  lote_pagamento_id: number;
  vistoria_id: number;
  valor_vistoriador: number | string;
  createdAt: string;
  updatedAt: string;
  // Relacionamentos
  vistoria?: Vistoria;
  lotePagamento?: LotePagamento;
}

export interface Seguradora {
  id: number;
  nome: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  // Relacionamentos
  tiposPermitidos?: SeguradoraTipoEmbarcacao[];
}

export interface SeguradoraTipoEmbarcacao {
  id: number;
  seguradora_id: number;
  tipo_embarcacao: TipoEmbarcacaoSeguradora;
  createdAt: string;
  // Relacionamentos
  seguradora?: Seguradora;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface ChecklistItem {
  tipo_id: number;
  codigo: string;
  nome_exibicao: string;
  descricao?: string;
  obrigatorio: boolean;
  foto_tirada: boolean;
  foto_url?: string;
  foto_observacao?: string;
}

export interface ChecklistStatus {
  checklistStatus: ChecklistItem[];
  resumo: {
    totalObrigatorios: number;
    fotosObrigatoriasTiradas: number;
    checklistCompleto: boolean;
    progresso: number;
  };
}

