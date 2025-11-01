// Tipos para o sistema de vistorias náuticas
export interface Usuario {
  id: number;
  nome: string;
  email: string;
  nivelAcessoId: number;
  nivelAcesso?: NivelAcesso;
  ativo: boolean;
  deveAtualizarSenha?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NivelAcesso {
  id: number;
  nome: string;
  descricao: string;
}

export interface Embarcacao {
  id: number;
  nome: string;
  numero_casco: string;
  proprietario_nome?: string;
  proprietario_email?: string;
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
  embarcacao?: Embarcacao;
  local?: Local;
  vistoriador?: Usuario;
  administrador?: Usuario;
  statusVistoria?: StatusVistoria;
  fotos?: Foto[];
  laudos?: Laudo[];
  createdAt: string;
  updatedAt: string;
  // Relacionamentos com nomes corretos do backend
  Embarcacao?: Embarcacao;
  Local?: Local;
  StatusVistoria?: StatusVistoria;
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


