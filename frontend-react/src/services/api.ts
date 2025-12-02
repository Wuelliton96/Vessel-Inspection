import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest, Usuario, Embarcacao, Local, Vistoria, ChecklistStatus, LotePagamento, VistoriaLotePagamento, Seguradora, TipoEmbarcacaoSeguradora, SeguradoraTipoEmbarcacao, Cliente, ChecklistTemplate, VistoriaChecklistItem, ChecklistProgresso, StatusChecklistItem } from '../types';

import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Timeout global de 30 segundos
});

// Interceptor de requisicao
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API] Erro na requisicao:', error);
    return Promise.reject(error);
  }
);

// Interceptor de resposta com tratamento de erros robusto
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log do erro para debug
    console.error('[API] Erro na resposta:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });

    // Erro de timeout
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const timeoutError = new Error('Tempo limite excedido. O servidor pode estar lento.');
      (timeoutError as any).response = error.response;
      (timeoutError as any).isTimeout = true;
      return Promise.reject(timeoutError);
    }

    // Erro de rede (sem conexao)
    if (!error.response && error.message === 'Network Error') {
      const networkError = new Error('Erro de conexao. Verifique sua internet.');
      (networkError as any).isNetworkError = true;
      return Promise.reject(networkError);
    }

    // Nao fazer logout em erros 401 especificos que sao erros de validacao (como senha incorreta)
    const isChangePasswordError = error.config?.url?.includes('/change-password');
    const isLoginError = error.config?.url?.includes('/login');
    
    if (error.response?.status === 401 && 
        !globalThis.location.pathname.includes('/login') && 
        !isChangePasswordError && 
        !isLoginError) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      globalThis.location.href = '/login';
    }
    
    // Em producao, nao expor detalhes sensiveis do erro
    if (process.env.NODE_ENV === 'production') {
      const genericError = new Error('Erro ao processar requisicao');
      (genericError as any).response = error.response;
      (genericError as any).config = error.config;
      return Promise.reject(genericError);
    }
    
    return Promise.reject(error);
  }
);

// Servico para verificar conexao com o backend
export const healthService = {
  checkConnection: async (): Promise<{ connected: boolean; status?: string; error?: string }> => {
    try {
      const response = await api.get('/health', { timeout: 5000 });
      return {
        connected: response.data.status === 'healthy',
        status: response.data.status
      };
    } catch (error: any) {
      return {
        connected: false,
        error: error.message || 'Servidor indisponivel'
      };
    }
  }
};

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      
      const data = response.data;
      
      if (!data.token) {
        throw new Error('Token não encontrado na resposta');
      }
      
      if (!data.user) {
        throw new Error('Dados do usuário não encontrados na resposta');
      }
      
      const formattedResponse = {
        token: data.token,
        usuario: {
          id: data.user.id,
          nome: data.user.nome,
          email: data.user.email || null,
          cpf: data.user.cpf,
          nivelAcessoId: data.user.nivelAcessoId,
          nivelAcesso: {
            id: data.user.nivelAcessoId,
            nome: data.user.nivelAcesso,
            descricao: data.user.nivelAcessoDescricao || ''
          },
          ativo: true,
          deveAtualizarSenha: data.user.deveAtualizarSenha || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
      return formattedResponse;
    } catch (error: any) {
      // Erro silencioso em produção
      throw error;
    }
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/register', userData);
    const data = response.data;
    
    return {
      token: data.token,
      usuario: {
        id: data.user.id,
        nome: data.user.nome,
        email: data.user.email || null,
        cpf: data.user.cpf || '',
        nivelAcessoId: data.user.nivelAcessoId,
        nivelAcesso: {
          id: data.user.nivelAcessoId,
          nome: data.user.nivelAcesso,
          descricao: data.user.nivelAcessoDescricao || ''
        },
        ativo: true,
        deveAtualizarSenha: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  },

  getMe: async (): Promise<Usuario> => {
    const response = await api.get('/api/auth/me');
    const data = response.data;
    
    return {
      id: data.user.id,
      nome: data.user.nome,
      email: data.user.email || null,
      cpf: data.user.cpf || '',
      nivelAcessoId: data.user.nivelAcessoId,
      nivelAcesso: {
        id: data.user.nivelAcessoId,
        nome: data.user.nivelAcesso,
        descricao: data.user.nivelAcessoDescricao || ''
      },
      ativo: true, // Default para usuários ativos
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  },

  updatePassword: async (token: string, novaSenha: string): Promise<AuthResponse> => {
    const response = await api.put('/api/auth/force-password-update', {
      token,
      novaSenha
    });
    const data = response.data;
    
    // Converter a resposta do backend para o formato esperado pelo AuthContext
    return {
      token: data.token,
      usuario: {
        id: data.user.id,
        nome: data.user.nome,
        email: data.user.email || null,
        cpf: data.user.cpf || '',
        nivelAcessoId: data.user.nivelAcessoId,
        nivelAcesso: {
          id: data.user.nivelAcessoId,
          nome: data.user.nivelAcesso,
          descricao: ''
        },
        ativo: true,
        deveAtualizarSenha: data.user.deveAtualizarSenha || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await api.put('/api/auth/change-password', {
      senhaAtual: currentPassword,
      novaSenha: newPassword
    });
    return response.data;
  },
};



// Serviços de usuários
export const usuarioService = {
  getAll: async (): Promise<Usuario[]> => {
    const response = await api.get('/api/usuarios');
    return response.data;
  },

  getById: async (id: number): Promise<Usuario> => {
    const response = await api.get(`/api/usuarios/${id}`);
    return response.data;
  },

  create: async (data: Partial<Usuario>): Promise<Usuario> => {
    const response = await api.post('/api/usuarios', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Usuario>): Promise<Usuario> => {
    const response = await api.put(`/api/usuarios/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/usuarios/${id}`);
  },

  resetPassword: async (id: number, data: { novaSenha: string }): Promise<void> => {
    await api.post(`/api/usuarios/${id}/reset-password`, data);
  },

  toggleStatus: async (id: number): Promise<Usuario> => {
    const response = await api.patch(`/api/usuarios/${id}/toggle-status`);
    return response.data;
  },
};

// Serviços para embarcações
export const embarcacaoService = {
  getAll: async (proprietario_cpf?: string): Promise<Embarcacao[]> => {
    const params = proprietario_cpf ? { proprietario_cpf } : {};
    const response = await api.get('/api/embarcacoes', { params });
    return response.data;
  },

  getByCPF: async (cpf: string): Promise<Embarcacao[]> => {
    const response = await api.get('/api/embarcacoes', { 
      params: { proprietario_cpf: cpf } 
    });
    return response.data;
  },

  getById: async (id: number): Promise<Embarcacao> => {
    const response = await api.get(`/api/embarcacoes/${id}`);
    return response.data;
  },

  create: async (data: Partial<Embarcacao>): Promise<Embarcacao> => {
    const response = await api.post('/api/embarcacoes', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Embarcacao>): Promise<Embarcacao> => {
    const response = await api.put(`/api/embarcacoes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/embarcacoes/${id}`);
  }
};

// Serviços para locais
export const localService = {
  getAll: async (): Promise<Local[]> => {
    const response = await api.get('/api/locais');
    return response.data;
  },

  getById: async (id: number): Promise<Local> => {
    const response = await api.get(`/api/locais/${id}`);
    return response.data;
  },

  create: async (data: Partial<Local>): Promise<Local> => {
    const response = await api.post('/api/locais', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Local>): Promise<Local> => {
    try {
      const response = await api.put(`/api/locais/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/locais/${id}`);
  }
};

// Serviços para vistorias
export const vistoriaService = {
  getById: async (id: number): Promise<Vistoria> => {
    const response = await api.get(`/api/vistorias/${id}`);
    return response.data;
  },

  getAll: async (): Promise<Vistoria[]> => {
    const response = await api.get('/api/vistorias');
    return response.data;
  },

  getByVistoriador: async (): Promise<Vistoria[]> => {
    const response = await api.get('/api/vistoriador/vistorias');
    return response.data;
  },

  create: async (data: Partial<Vistoria>): Promise<Vistoria> => {
    const response = await api.post('/api/vistorias', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Vistoria>): Promise<Vistoria> => {
    try {
      const response = await api.put(`/api/vistorias/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/vistorias/${id}`);
  }
};

// Serviços específicos para vistoriador
export const vistoriadorService = {
  getVistorias: async (): Promise<Vistoria[]> => {
    const response = await api.get('/api/vistoriador/vistorias');
    return response.data;
  },

  getVistoriaById: async (id: number): Promise<Vistoria> => {
    const response = await api.get(`/api/vistoriador/vistorias/${id}`);
    return response.data;
  },

  iniciarVistoria: async (id: number): Promise<{ message: string; vistoria: Vistoria; data_inicio: string }> => {
    try {
      const response = await api.put(`/api/vistoriador/vistorias/${id}/iniciar`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  updateStatus: async (id: number, statusId: number, dadosRascunho?: any): Promise<Vistoria> => {
    try {
      const response = await api.put(`/api/vistoriador/vistorias/${id}/status`, {
        status_id: statusId,
        dados_rascunho: dadosRascunho
      });
      
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getChecklistStatus: async (id: number): Promise<ChecklistStatus> => {
    const response = await api.get(`/api/vistoriador/vistorias/${id}/checklist-status`);
    return response.data;
  },

  getTiposFotoChecklist: async (): Promise<any[]> => {
    const response = await api.get('/api/vistoriador/tipos-foto-checklist');
    return response.data;
  }
};

// Serviços para pagamentos de vistoriadores
// Serviços para dashboard
export const dashboardService = {
  getEstatisticas: async (): Promise<any> => {
    const response = await api.get('/api/dashboard/estatisticas');
    return response.data;
  }
};

export const pagamentoService = {
  getAll: async (params?: {
    periodo_tipo?: string;
    status?: string;
    vistoriador_id?: number;
    data_inicio?: string;
    data_fim?: string;
  }): Promise<LotePagamento[]> => {
    const response = await api.get('/api/pagamentos', { params });
    return response.data;
  },

  getById: async (id: number): Promise<LotePagamento & { vistorias: VistoriaLotePagamento[] }> => {
    const response = await api.get(`/api/pagamentos/${id}`);
    return response.data;
  },

  gerarLote: async (data: {
    vistoriador_id: number;
    periodo_tipo: string;
    data_inicio: string;
    data_fim: string;
  }): Promise<LotePagamento> => {
    const response = await api.post('/api/pagamentos/gerar', data);
    return response.data;
  },

  marcarPago: async (id: number, data: {
    forma_pagamento?: string;
    comprovante_url?: string;
    observacoes?: string;
  }): Promise<LotePagamento> => {
    const response = await api.put(`/api/pagamentos/${id}/pagar`, data);
    return response.data;
  },

  cancelar: async (id: number): Promise<LotePagamento> => {
    const response = await api.put(`/api/pagamentos/${id}/cancelar`);
    return response.data;
  },

  excluir: async (id: number): Promise<void> => {
    await api.delete(`/api/pagamentos/${id}`);
  },

  getVistoriasDisponiveis: async (vistoriadorId: number, params?: {
    data_inicio?: string;
    data_fim?: string;
  }): Promise<{ vistorias: Vistoria[]; quantidade: number; valor_total: number }> => {
    const response = await api.get(`/api/pagamentos/vistoriador/${vistoriadorId}/disponiveis`, { params });
    return response.data;
  },

  getResumoGeral: async (params?: {
    periodo_inicio?: string;
    periodo_fim?: string;
  }): Promise<{
    pendente: { quantidade: number; valor_total: number };
    pago: { quantidade: number; valor_total: number };
  }> => {
    const response = await api.get('/api/pagamentos/resumo/geral', { params });
    return response.data;
  },

  getResumoFinanceiro: async (): Promise<{
    recebido: {
      total: number;
      quantidade: number;
      mes: {
        total: number;
        quantidade: number;
      };
    };
    pendente: {
      total: number;
      quantidade: number;
      mes: {
        total: number;
        quantidade: number;
      };
    };
  }> => {
    const response = await api.get('/api/vistoriador/financeiro');
    return response.data;
  }
};

// Serviços para seguradoras
export const seguradoraService = {
  getAll: async (ativo?: boolean): Promise<Seguradora[]> => {
    const params = ativo !== undefined ? { ativo } : {};
    const response = await api.get('/api/seguradoras', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Seguradora> => {
    const response = await api.get(`/api/seguradoras/${id}`);
    return response.data;
  },

  getTiposPermitidos: async (id: number): Promise<SeguradoraTipoEmbarcacao[]> => {
    const response = await api.get(`/api/seguradoras/${id}/tipos-permitidos`);
    const data = response.data;
    
    // O backend retorna um array de strings, precisamos converter para objetos
    if (Array.isArray(data) && data.length > 0) {
      // Se for array de strings
      if (typeof data[0] === 'string') {
        return data.map((tipo: string) => ({
          id: 0, // Não temos o ID do relacionamento
          seguradora_id: id,
          tipo_embarcacao: tipo as TipoEmbarcacaoSeguradora,
          createdAt: new Date().toISOString()
        }));
      }
      // Se já for array de objetos, retornar como está
      return data;
    }
    
    return [];
  },

  create: async (data: { 
    nome: string; 
    ativo?: boolean;
    tipos_permitidos?: TipoEmbarcacaoSeguradora[];
  }): Promise<Seguradora> => {
    const response = await api.post('/api/seguradoras', data);
    return response.data;
  },

  update: async (id: number, data: { 
    nome?: string; 
    ativo?: boolean;
    tipos_permitidos?: TipoEmbarcacaoSeguradora[];
  }): Promise<Seguradora> => {
    const response = await api.put(`/api/seguradoras/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/seguradoras/${id}`);
  },

  toggleStatus: async (id: number): Promise<Seguradora> => {
    const response = await api.patch(`/api/seguradoras/${id}/toggle-status`);
    return response.data;
  }
};

// Serviços para clientes
export const clienteService = {
  getAll: async (params?: {
    ativo?: boolean;
    tipo_pessoa?: string;
  }): Promise<Cliente[]> => {
    const response = await api.get('/api/clientes', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get(`/api/clientes/${id}`);
    return response.data;
  },

  buscarPorDocumento: async (documento: string): Promise<Cliente> => {
    const response = await api.get(`/api/clientes/buscar/${documento}`);
    return response.data;
  },

  create: async (data: Partial<Cliente>): Promise<Cliente> => {
    const response = await api.post('/api/clientes', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Cliente>): Promise<Cliente> => {
    const response = await api.put(`/api/clientes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/clientes/${id}`);
  },

  toggleStatus: async (id: number): Promise<Cliente> => {
    const response = await api.patch(`/api/clientes/${id}/toggle-status`);
    return response.data;
  }
};

// Serviços para checklists
export const checklistService = {
  // Templates
  getTemplates: async (): Promise<ChecklistTemplate[]> => {
    const response = await api.get('/api/checklists/templates');
    return response.data;
  },

  getTemplateByTipo: async (tipoEmbarcacao: string): Promise<ChecklistTemplate> => {
    const response = await api.get(`/api/checklists/templates/${tipoEmbarcacao}`);
    return response.data;
  },

  createTemplate: async (data: Partial<ChecklistTemplate>): Promise<ChecklistTemplate> => {
    const response = await api.post('/api/checklists/templates', data);
    return response.data;
  },

  updateTemplate: async (id: number, data: Partial<ChecklistTemplate>): Promise<ChecklistTemplate> => {
    const response = await api.put(`/api/checklists/templates/${id}`, data);
    return response.data;
  },

  // Itens de template
  addItemToTemplate: async (templateId: number, item: any): Promise<any> => {
    const response = await api.post(`/api/checklists/templates/${templateId}/itens`, item);
    return response.data;
  },

  updateItem: async (itemId: number, data: any): Promise<any> => {
    const response = await api.put(`/api/checklists/itens/${itemId}`, data);
    return response.data;
  },

  deleteItem: async (itemId: number): Promise<void> => {
    await api.delete(`/api/checklists/itens/${itemId}`);
  },

  // Checklist de vistoria
  copiarTemplateParaVistoria: async (vistoriaId: number): Promise<any> => {
    const response = await api.post(`/api/checklists/vistoria/${vistoriaId}/copiar-template`);
    return response.data;
  },

  getChecklistVistoria: async (vistoriaId: number): Promise<VistoriaChecklistItem[]> => {
    const response = await api.get(`/api/checklists/vistoria/${vistoriaId}`);
    return response.data;
  },

  atualizarStatusItem: async (itemId: number, data: {
    status?: StatusChecklistItem;
    foto_id?: number | null;
    observacao?: string;
  }): Promise<VistoriaChecklistItem> => {
    const response = await api.patch(`/api/checklists/vistoria/item/${itemId}/status`, data);
    return response.data;
  },

  addItemCustomizado: async (vistoriaId: number, item: any): Promise<VistoriaChecklistItem> => {
    const response = await api.post(`/api/checklists/vistoria/${vistoriaId}/itens`, item);
    return response.data;
  },

  getProgresso: async (vistoriaId: number): Promise<ChecklistProgresso> => {
    const response = await api.get(`/api/checklists/vistoria/${vistoriaId}/progresso`);
    return response.data;
  }
};

export const laudoService = {
  listar: async () => {
    const response = await api.get('/api/laudos');
    return response.data;
  },

  buscarPorId: async (id: number) => {
    const response = await api.get(`/api/laudos/${id}`);
    return response.data;
  },

  buscarPorVistoria: async (vistoriaId: number) => {
    const response = await api.get(`/api/laudos/vistoria/${vistoriaId}`);
    return response.data;
  },

  criar: async (vistoriaId: number, dados: any) => {
    const response = await api.post(`/api/laudos/vistoria/${vistoriaId}`, dados);
    return response.data;
  },

  atualizar: async (id: number, dados: any) => {
    const response = await api.put(`/api/laudos/${id}`, dados);
    return response.data;
  },

  preview: async (id: number) => {
    const response = await api.get(`/api/laudos/${id}/preview`);
    return response.data;
  },

  gerarPDF: async (id: number) => {
    const response = await api.post(`/api/laudos/${id}/gerar-pdf`);
    return response.data;
  },

  download: async (id: number) => {
    const response = await api.get(`/api/laudos/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  excluir: async (id: number) => {
    const response = await api.delete(`/api/laudos/${id}`);
    return response.data;
  }
};

export const configuracaoLaudoService = {
  get: async () => {
    const response = await api.get('/api/configuracoes-laudo');
    return response.data;
  },

  update: async (data: {
    nome_empresa?: string;
    logo_empresa_url?: string;
    nota_rodape?: string;
    empresa_prestadora?: string;
  }) => {
    const response = await api.put('/api/configuracoes-laudo', data);
    return response.data;
  }
};

export const auditoriaService = {
  listar: async (params?: {
    page?: number;
    limit?: number;
    acao?: string;
    entidade?: string;
    usuarioId?: number;
    nivelCritico?: string;
    dataInicio?: string;
    dataFim?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const response = await api.get(`/api/auditoria?${queryParams.toString()}`);
    return response.data;
  },

  estatisticas: async (params?: {
    dataInicio?: string;
    dataFim?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const response = await api.get(`/api/auditoria/estatisticas?${queryParams.toString()}`);
    return response.data;
  },

  porUsuario: async (usuarioId: number, params?: {
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const response = await api.get(`/api/auditoria/usuario/${usuarioId}?${queryParams.toString()}`);
    return response.data;
  },

  criticos: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
    }
    const response = await api.get(`/api/auditoria/criticos?${queryParams.toString()}`);
    return response.data;
  }
};

export default api;
