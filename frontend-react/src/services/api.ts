import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest, Usuario, Embarcacao, Local, Vistoria, ChecklistStatus, LotePagamento, VistoriaLotePagamento, Seguradora, TipoEmbarcacaoSeguradora, Cliente, ChecklistTemplate, VistoriaChecklistItem, ChecklistProgresso, StatusChecklistItem } from '../types';

import { API_CONFIG } from '../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  console.log('Interceptor Request:', config.method?.toUpperCase(), config.url);
  console.log('Headers:', config.headers);
  console.log('Data:', config.data);
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Token adicionado ao header');
  } else {
    console.log('Nenhum token encontrado no localStorage');
  }
  return config;
});

// Interceptor para lidar com respostas de erro
api.interceptors.response.use(
  (response) => {
    console.log('Interceptor Response Success:', response.status, response.config.url);
    console.log('Response Data:', response.data);
    return response;
  },
  (error) => {
    console.error('Interceptor Response Error:', error);
    console.error('Error Status:', error.response?.status);
    console.error('Error Data:', error.response?.data);
    console.error('Error Config:', error.config);
    
    // Só redirecionar para login se não estivermos já na página de login
    // Isso evita interferir com o tratamento de erros de login
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      console.log('Status 401 - Removendo tokens e redirecionando...');
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      console.log('API Service: Iniciando chamada de login...');
      console.log('Credentials:', { email: credentials.email, senha: '***' });
      console.log('URL:', `${API_BASE_URL}/api/auth/login`);
      
      console.log('Enviando requisição...');
      const response = await api.post('/api/auth/login', credentials);
      console.log('Response recebida:', response);
      console.log('Status:', response.status);
      console.log('Data:', response.data);
      
      const data = response.data;
      console.log('Analisando dados da resposta...');
      console.log('Token presente:', !!data.token);
      console.log('User presente:', !!data.user);
      
      if (!data.token) {
        throw new Error('Token não encontrado na resposta');
      }
      
      if (!data.user) {
        throw new Error('Dados do usuário não encontrados na resposta');
      }
      
      console.log('Formatando dados para o frontend...');
      const formattedResponse = {
        token: data.token,
        usuario: {
          id: data.user.id,
          nome: data.user.nome,
          email: data.user.email,
          nivelAcessoId: data.user.nivelAcessoId,
          nivelAcesso: {
            id: data.user.nivelAcessoId,
            nome: data.user.nivelAcesso,
            descricao: data.user.nivelAcessoDescricao || ''
          },
          ativo: true, // Default para usuários ativos
          deveAtualizarSenha: data.user.deveAtualizarSenha || false, // Campo do backend
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
      console.log('=== DEBUG AUTH SERVICE ===');
      console.log('data.user.deveAtualizarSenha:', data.user.deveAtualizarSenha);
      console.log('Tipo:', typeof data.user.deveAtualizarSenha);
      console.log('Valor final:', formattedResponse.usuario.deveAtualizarSenha);
      console.log('=== FIM DEBUG AUTH SERVICE ===');
      
      console.log('Dados formatados:', formattedResponse);
      return formattedResponse;
    } catch (error: any) {
      console.error('API Service: Erro no login:', error);
      console.error('API Service: Erro completo:', JSON.stringify(error, null, 2));
      console.error('API Service: Error response:', error.response);
      console.error('API Service: Error message:', error.message);
      
      // Re-throw o erro para que seja tratado pelo componente Login
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
        email: data.user.email,
        nivelAcessoId: data.user.nivelAcessoId,
        nivelAcesso: {
          id: data.user.nivelAcessoId,
          nome: data.user.nivelAcesso,
          descricao: data.user.nivelAcessoDescricao || ''
        },
        ativo: true, // Default para usuários ativos
        deveAtualizarSenha: false, // Default para usuários já autenticados
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
      email: data.user.email,
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
    return response.data;
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
      console.log('=== API SERVICE UPDATE LOCAL ===');
      console.log('ID:', id);
      console.log('Data:', data);
      console.log('URL:', `${API_BASE_URL}/api/locais/${id}`);
      
      const response = await api.put(`/api/locais/${id}`, data);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('=== FIM API SERVICE UPDATE ===');
      
      return response.data;
    } catch (error: any) {
      console.error('API Service: Erro na atualização:', error);
      console.error('API Service: Error response:', error.response);
      console.error('API Service: Error message:', error.message);
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
    const response = await api.get('/api/vistorias/vistoriador');
    return response.data;
  },

  create: async (data: Partial<Vistoria>): Promise<Vistoria> => {
    const response = await api.post('/api/vistorias', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Vistoria>): Promise<Vistoria> => {
    try {
      console.log('=== API SERVICE UPDATE VISTORIA ===');
      console.log('ID:', id);
      console.log('Data:', data);
      console.log('URL:', `${API_BASE_URL}/api/vistorias/${id}`);
      
      const response = await api.put(`/api/vistorias/${id}`, data);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('=== FIM API SERVICE UPDATE ===');
      
      return response.data;
    } catch (error: any) {
      console.error('API Service: Erro na atualização:', error);
      console.error('API Service: Error response:', error.response);
      console.error('API Service: Error message:', error.message);
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
      console.log('=== API SERVICE INICIAR VISTORIA ===');
      console.log('ID:', id);
      console.log('URL:', `${API_BASE_URL}/api/vistoriador/vistorias/${id}/iniciar`);
      
      const response = await api.put(`/api/vistoriador/vistorias/${id}/iniciar`);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('=== FIM API SERVICE INICIAR VISTORIA ===');
      
      return response.data;
    } catch (error: any) {
      console.error('API Service: Erro ao iniciar vistoria:', error);
      console.error('API Service: Error response:', error.response);
      console.error('API Service: Error message:', error.message);
      throw error;
    }
  },

  updateStatus: async (id: number, statusId: number, dadosRascunho?: any): Promise<Vistoria> => {
    try {
      console.log('=== API SERVICE UPDATE STATUS VISTORIA ===');
      console.log('ID:', id);
      console.log('Status ID:', statusId);
      console.log('Dados Rascunho:', dadosRascunho);
      
      const response = await api.put(`/api/vistoriador/vistorias/${id}/status`, {
        status_id: statusId,
        dados_rascunho: dadosRascunho
      });
      
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('=== FIM API SERVICE UPDATE STATUS ===');
      
      return response.data;
    } catch (error: any) {
      console.error('API Service: Erro ao atualizar status:', error);
      console.error('API Service: Error response:', error.response);
      console.error('API Service: Error message:', error.message);
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

  getTiposPermitidos: async (id: number): Promise<TipoEmbarcacaoSeguradora[]> => {
    const response = await api.get(`/api/seguradoras/${id}/tipos-permitidos`);
    return response.data;
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

export default api;
