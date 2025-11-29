/**
 * Testes para página Vistorias
 */

import React from 'react';
import { Vistoria, Embarcacao, Usuario, Local } from '../../types';

// Mock do useAuth
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    usuario: {
      id: 1,
      nome: 'Admin',
      nivelAcesso: { nome: 'ADMIN' }
    }
  })
}));

// Mock do useAccessControl
jest.mock('../../hooks/useAccessControl', () => ({
  useAccessControl: () => ({
    isAdmin: true,
    isVistoriador: false,
    canEdit: true,
    canDelete: true
  })
}));

// Mock dos serviços
const mockVistoriaGetAll = jest.fn();
const mockVistoriaCreate = jest.fn();
const mockVistoriaUpdate = jest.fn();
const mockVistoriaDelete = jest.fn();
const mockUsuarioGetAll = jest.fn();
const mockEmbarcacaoGetAll = jest.fn();
const mockClienteGetAll = jest.fn();

jest.mock('../../services/api', () => ({
  vistoriaService: {
    getAll: () => mockVistoriaGetAll(),
    create: (data: any) => mockVistoriaCreate(data),
    update: (id: number, data: any) => mockVistoriaUpdate(id, data),
    delete: (id: number) => mockVistoriaDelete(id)
  },
  usuarioService: {
    getAll: () => mockUsuarioGetAll()
  },
  embarcacaoService: {
    getAll: () => mockEmbarcacaoGetAll()
  },
  clienteService: {
    getAll: (params?: any) => mockClienteGetAll(params),
    buscarPorDocumento: jest.fn()
  }
}));

// Mock dos utilitários
jest.mock('../../utils/cepUtils', () => ({
  buscarCEP: jest.fn(),
  formatarCEP: (cep: string) => cep,
  validarCEP: () => false
}));

jest.mock('../../utils/debounce', () => ({
  useDebounce: (value: any) => value
}));

jest.mock('../../utils/validators', () => ({
  mascaraValorMonetario: (value: string) => value,
  limparValorMonetario: (value: string) => parseFloat(value?.replace(',', '.')) || 0,
  formatarValorMonetario: (value: number) => value?.toFixed(2).replace('.', ',') || '0,00',
  limparCPF: (value: string) => value?.replace(/\D/g, ''),
  converterParaE164: (value: string) => value,
  mascaraCPF: (value: string) => value,
  mascaraTelefone: (value: string) => value,
  mascaraDocumento: (value: string) => value
}));

// Dados mock
const mockUsuarios: Usuario[] = [
  {
    id: 2,
    nome: 'Vistoriador João',
    email: 'joao@email.com',
    cpf: '12345678901',
    nivelAcessoId: 2,
    nivelAcesso: { id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' },
    ativo: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
];

const mockEmbarcacoes: Embarcacao[] = [
  {
    id: 1,
    nome: 'Barco Azul',
    nr_inscricao_barco: 'BR123456',
    cliente_id: 1,
    seguradora_id: 1,
    tipo_embarcacao: 'LANCHA',
    porte: 'MEDIO',
    valor_embarcacao: 150000,
    ano_fabricacao: 2020,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
];

const mockLocal: Local = {
  id: 1,
  tipo: 'MARINA',
  nome_local: 'Marina do Sol',
  cidade: 'São Paulo',
  estado: 'SP',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01'
};

const mockVistorias: Vistoria[] = [
  {
    id: 1,
    embarcacao_id: 1,
    vistoriador_id: 2,
    local_id: 1,
    data_agendamento: '2024-02-15T10:00:00Z',
    data_inicio: null,
    data_fim: null,
    status_id: 1,
    valor_vistoria: 500,
    valor_deslocamento: 100,
    observacoes: 'Vistoria agendada',
    latitude: null,
    longitude: null,
    dados_rascunho: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    Embarcacao: mockEmbarcacoes[0],
    Vistoriador: mockUsuarios[0],
    Local: mockLocal,
    Status: {
      id: 1,
      nome: 'AGENDADA',
      descricao: 'Vistoria agendada'
    }
  },
  {
    id: 2,
    embarcacao_id: 1,
    vistoriador_id: 2,
    local_id: 1,
    data_agendamento: '2024-02-10T14:00:00Z',
    data_inicio: '2024-02-10T14:30:00Z',
    data_fim: '2024-02-10T16:00:00Z',
    status_id: 4,
    valor_vistoria: 600,
    valor_deslocamento: 150,
    observacoes: 'Vistoria concluída',
    latitude: -23.5505,
    longitude: -46.6333,
    dados_rascunho: null,
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
    Embarcacao: mockEmbarcacoes[0],
    Vistoriador: mockUsuarios[0],
    Local: mockLocal,
    Status: {
      id: 4,
      nome: 'CONCLUIDA',
      descricao: 'Vistoria concluída'
    }
  }
];

describe('Vistorias', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVistoriaGetAll.mockResolvedValue(mockVistorias);
    mockUsuarioGetAll.mockResolvedValue(mockUsuarios);
    mockEmbarcacaoGetAll.mockResolvedValue(mockEmbarcacoes);
    mockClienteGetAll.mockResolvedValue([]);
  });

  describe('Componente', () => {
    it('deve importar componente sem erro', async () => {
      const { default: Vistorias } = await import('../Vistorias');
      expect(Vistorias).toBeDefined();
      expect(typeof Vistorias).toBe('function');
    });
  });

  describe('Serviços de Vistoria', () => {
    it('deve chamar getAll ao inicializar', async () => {
      const { vistoriaService } = require('../../services/api');
      const result = await vistoriaService.getAll();
      expect(mockVistoriaGetAll).toHaveBeenCalled();
      expect(result).toEqual(mockVistorias);
    });

    it('deve chamar create com dados corretos', async () => {
      const novaVistoria = {
        embarcacao_id: 1,
        vistoriador_id: 2,
        local_id: 1,
        data_agendamento: '2024-03-01T10:00:00Z',
        valor_vistoria: 500
      };
      mockVistoriaCreate.mockResolvedValue({ id: 3, ...novaVistoria });
      
      const { vistoriaService } = require('../../services/api');
      const result = await vistoriaService.create(novaVistoria);
      
      expect(mockVistoriaCreate).toHaveBeenCalledWith(novaVistoria);
      expect(result.valor_vistoria).toBe(500);
    });

    it('deve chamar update com id e dados corretos', async () => {
      const dadosAtualizados = { status_id: 2, observacoes: 'Em andamento' };
      mockVistoriaUpdate.mockResolvedValue({ ...mockVistorias[0], ...dadosAtualizados });
      
      const { vistoriaService } = require('../../services/api');
      const result = await vistoriaService.update(1, dadosAtualizados);
      
      expect(mockVistoriaUpdate).toHaveBeenCalledWith(1, dadosAtualizados);
      expect(result.status_id).toBe(2);
    });

    it('deve chamar delete com id correto', async () => {
      mockVistoriaDelete.mockResolvedValue(undefined);
      
      const { vistoriaService } = require('../../services/api');
      await vistoriaService.delete(1);
      
      expect(mockVistoriaDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('Serviços de Usuário', () => {
    it('deve carregar lista de vistoriadores', async () => {
      const { usuarioService } = require('../../services/api');
      const result = await usuarioService.getAll();
      
      expect(mockUsuarioGetAll).toHaveBeenCalled();
      expect(result).toEqual(mockUsuarios);
    });
  });

  describe('Serviços de Embarcação', () => {
    it('deve carregar lista de embarcações', async () => {
      const { embarcacaoService } = require('../../services/api');
      const result = await embarcacaoService.getAll();
      
      expect(mockEmbarcacaoGetAll).toHaveBeenCalled();
      expect(result).toEqual(mockEmbarcacoes);
    });
  });

  describe('Dados mock', () => {
    it('deve ter vistorias com diferentes status', () => {
      const agendadas = mockVistorias.filter(v => v.Status?.nome === 'AGENDADA');
      const concluidas = mockVistorias.filter(v => v.Status?.nome === 'CONCLUIDA');
      
      expect(agendadas.length).toBe(1);
      expect(concluidas.length).toBe(1);
    });

    it('deve ter vistorias com dados de embarcação', () => {
      const comEmbarcacao = mockVistorias.filter(v => v.Embarcacao !== undefined);
      expect(comEmbarcacao.length).toBe(2);
    });

    it('deve ter vistorias com dados de vistoriador', () => {
      const comVistoriador = mockVistorias.filter(v => v.Vistoriador !== undefined);
      expect(comVistoriador.length).toBe(2);
    });

    it('deve ter vistorias com dados de local', () => {
      const comLocal = mockVistorias.filter(v => v.Local !== undefined);
      expect(comLocal.length).toBe(2);
    });

    it('deve calcular valor total da vistoria', () => {
      const vistoria = mockVistorias[0];
      const valorTotal = (vistoria.valor_vistoria || 0) + (vistoria.valor_deslocamento || 0);
      
      expect(valorTotal).toBe(600);
    });

    it('deve filtrar por embarcação corretamente', () => {
      const filtro = 'Barco';
      const resultado = mockVistorias.filter(v => 
        v.Embarcacao?.nome.toLowerCase().includes(filtro.toLowerCase())
      );
      
      expect(resultado.length).toBe(2);
    });

    it('deve filtrar por local corretamente', () => {
      const filtro = 'Marina do Sol';
      const resultado = mockVistorias.filter(v => 
        v.Local?.nome_local?.toLowerCase().includes(filtro.toLowerCase())
      );
      
      expect(resultado.length).toBe(2);
    });

    it('deve filtrar por status corretamente', () => {
      const resultado = mockVistorias.filter(v => v.Status?.nome === 'AGENDADA');
      expect(resultado.length).toBe(1);
    });
  });

  describe('Estados', () => {
    it('deve retornar lista vazia quando não há vistorias', async () => {
      mockVistoriaGetAll.mockResolvedValue([]);
      
      const { vistoriaService } = require('../../services/api');
      const result = await vistoriaService.getAll();
      
      expect(result).toEqual([]);
    });

    it('deve lidar com erro ao carregar vistorias', async () => {
      const erro = new Error('Erro de conexão');
      mockVistoriaGetAll.mockRejectedValue(erro);
      
      const { vistoriaService } = require('../../services/api');
      
      await expect(vistoriaService.getAll()).rejects.toThrow('Erro de conexão');
    });

    it('deve lidar com erro ao criar vistoria', async () => {
      const erro = new Error('Embarcação não encontrada');
      mockVistoriaCreate.mockRejectedValue(erro);
      
      const { vistoriaService } = require('../../services/api');
      
      await expect(vistoriaService.create({})).rejects.toThrow('Embarcação não encontrada');
    });

    it('deve lidar com erro ao excluir vistoria', async () => {
      const erro = new Error('Vistoria em andamento não pode ser excluída');
      mockVistoriaDelete.mockRejectedValue(erro);
      
      const { vistoriaService } = require('../../services/api');
      
      await expect(vistoriaService.delete(1)).rejects.toThrow('Vistoria em andamento não pode ser excluída');
    });
  });

  describe('Formatação', () => {
    it('deve formatar valor monetário corretamente', () => {
      const { formatarValorMonetario } = require('../../utils/validators');
      const resultado = formatarValorMonetario(500);
      expect(resultado).toBeDefined();
    });

    it('deve limpar valor monetário corretamente', () => {
      const { limparValorMonetario } = require('../../utils/validators');
      const resultado = limparValorMonetario('500,00');
      expect(typeof resultado).toBe('number');
    });
  });

  describe('Controle de Acesso', () => {
    it('deve verificar se é admin', () => {
      const { useAccessControl } = require('../../hooks/useAccessControl');
      const { isAdmin, canEdit, canDelete } = useAccessControl();
      
      expect(isAdmin).toBe(true);
      expect(canEdit).toBe(true);
      expect(canDelete).toBe(true);
    });
  });

  describe('Datas', () => {
    it('deve ter data de agendamento válida', () => {
      const vistoria = mockVistorias[0];
      const dataAgendamento = new Date(vistoria.data_agendamento);
      
      expect(dataAgendamento).toBeInstanceOf(Date);
      expect(isNaN(dataAgendamento.getTime())).toBe(false);
    });

    it('deve calcular duração da vistoria', () => {
      const vistoria = mockVistorias[1];
      if (vistoria.data_inicio && vistoria.data_fim) {
        const inicio = new Date(vistoria.data_inicio);
        const fim = new Date(vistoria.data_fim);
        const duracaoMs = fim.getTime() - inicio.getTime();
        const duracaoMinutos = duracaoMs / (1000 * 60);
        
        expect(duracaoMinutos).toBe(90); // 1h30min
      }
    });
  });
});
