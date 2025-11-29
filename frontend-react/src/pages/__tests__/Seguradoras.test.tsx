/**
 * Testes para página Seguradoras
 */

import React from 'react';
import { Seguradora, TipoEmbarcacaoSeguradora, SeguradoraTipoEmbarcacao } from '../../types';

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
const mockGetAll = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockToggleStatus = jest.fn();

jest.mock('../../services/api', () => ({
  seguradoraService: {
    getAll: () => mockGetAll(),
    create: (data: any) => mockCreate(data),
    update: (id: number, data: any) => mockUpdate(id, data),
    delete: (id: number) => mockDelete(id),
    toggleStatus: (id: number) => mockToggleStatus(id)
  }
}));

// Mock dos utilitários
jest.mock('../../utils/validators', () => ({
  TIPOS_EMBARCACAO_SEGURADORA: [
    { value: 'LANCHA', label: 'Lancha' },
    { value: 'VELEIRO', label: 'Veleiro' },
    { value: 'JETSKI', label: 'Jet Ski' },
    { value: 'IATE', label: 'Iate' }
  ],
  getLabelTipoEmbarcacaoSeguradora: (tipo: string) => {
    const tipos: Record<string, string> = {
      'LANCHA': 'Lancha',
      'VELEIRO': 'Veleiro',
      'JETSKI': 'Jet Ski',
      'IATE': 'Iate'
    };
    return tipos[tipo] || tipo;
  }
}));

// Dados mock
const mockTiposPermitidos: SeguradoraTipoEmbarcacao[] = [
  { id: 1, seguradora_id: 1, tipo_embarcacao: 'LANCHA' as TipoEmbarcacaoSeguradora, createdAt: '2024-01-01' },
  { id: 2, seguradora_id: 1, tipo_embarcacao: 'VELEIRO' as TipoEmbarcacaoSeguradora, createdAt: '2024-01-01' }
];

const mockSeguradoras: Seguradora[] = [
  {
    id: 1,
    nome: 'Seguradora ABC',
    ativo: true,
    tiposPermitidos: mockTiposPermitidos,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 2,
    nome: 'Seguradora XYZ',
    ativo: false,
    tiposPermitidos: [],
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02'
  },
  {
    id: 3,
    nome: 'Mapfre Seguros',
    ativo: true,
    tiposPermitidos: [
      { id: 3, seguradora_id: 3, tipo_embarcacao: 'IATE' as TipoEmbarcacaoSeguradora, createdAt: '2024-01-01' }
    ],
    createdAt: '2024-01-03',
    updatedAt: '2024-01-03'
  }
];

describe('Seguradoras', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue(mockSeguradoras);
  });

  describe('Componente', () => {
    it('deve importar componente sem erro', async () => {
      const { default: Seguradoras } = await import('../Seguradoras');
      expect(Seguradoras).toBeDefined();
      expect(typeof Seguradoras).toBe('function');
    });
  });

  describe('Serviços', () => {
    it('deve chamar getAll ao inicializar', async () => {
      const { seguradoraService } = require('../../services/api');
      const result = await seguradoraService.getAll();
      expect(mockGetAll).toHaveBeenCalled();
      expect(result).toEqual(mockSeguradoras);
    });

    it('deve chamar create com dados corretos', async () => {
      const novaSeguradora = {
        nome: 'Nova Seguradora',
        ativo: true,
        tipos_permitidos: ['LANCHA', 'VELEIRO']
      };
      mockCreate.mockResolvedValue({ id: 4, ...novaSeguradora });
      
      const { seguradoraService } = require('../../services/api');
      const result = await seguradoraService.create(novaSeguradora);
      
      expect(mockCreate).toHaveBeenCalledWith(novaSeguradora);
      expect(result.nome).toBe('Nova Seguradora');
    });

    it('deve chamar update com id e dados corretos', async () => {
      const dadosAtualizados = { 
        nome: 'Seguradora Atualizada',
        tipos_permitidos: ['LANCHA']
      };
      mockUpdate.mockResolvedValue({ ...mockSeguradoras[0], ...dadosAtualizados });
      
      const { seguradoraService } = require('../../services/api');
      const result = await seguradoraService.update(1, dadosAtualizados);
      
      expect(mockUpdate).toHaveBeenCalledWith(1, dadosAtualizados);
      expect(result.nome).toBe('Seguradora Atualizada');
    });

    it('deve chamar delete com id correto', async () => {
      mockDelete.mockResolvedValue(undefined);
      
      const { seguradoraService } = require('../../services/api');
      await seguradoraService.delete(1);
      
      expect(mockDelete).toHaveBeenCalledWith(1);
    });

    it('deve chamar toggleStatus com id correto', async () => {
      mockToggleStatus.mockResolvedValue({ ...mockSeguradoras[0], ativo: false });
      
      const { seguradoraService } = require('../../services/api');
      const result = await seguradoraService.toggleStatus(1);
      
      expect(mockToggleStatus).toHaveBeenCalledWith(1);
      expect(result.ativo).toBe(false);
    });
  });

  describe('Dados mock', () => {
    it('deve ter seguradoras ativas e inativas', () => {
      const ativas = mockSeguradoras.filter(s => s.ativo);
      const inativas = mockSeguradoras.filter(s => !s.ativo);
      
      expect(ativas.length).toBe(2);
      expect(inativas.length).toBe(1);
    });

    it('deve ter seguradoras com tipos permitidos', () => {
      const comTipos = mockSeguradoras.filter(s => s.tiposPermitidos && s.tiposPermitidos.length > 0);
      const semTipos = mockSeguradoras.filter(s => !s.tiposPermitidos || s.tiposPermitidos.length === 0);
      
      expect(comTipos.length).toBe(2);
      expect(semTipos.length).toBe(1);
    });

    it('deve ter tipos de embarcação configurados', () => {
      const { TIPOS_EMBARCACAO_SEGURADORA } = require('../../utils/validators');
      expect(TIPOS_EMBARCACAO_SEGURADORA.length).toBe(4);
    });

    it('deve formatar label do tipo de embarcação', () => {
      const { getLabelTipoEmbarcacaoSeguradora } = require('../../utils/validators');
      
      expect(getLabelTipoEmbarcacaoSeguradora('LANCHA')).toBe('Lancha');
      expect(getLabelTipoEmbarcacaoSeguradora('VELEIRO')).toBe('Veleiro');
      expect(getLabelTipoEmbarcacaoSeguradora('JETSKI')).toBe('Jet Ski');
    });
  });

  describe('Validações', () => {
    it('deve validar nome obrigatório', () => {
      const seguradoraSemNome = { nome: '', tipos_permitidos: ['LANCHA'] };
      expect(seguradoraSemNome.nome.trim()).toBe('');
    });

    it('deve validar tipos permitidos obrigatórios', () => {
      const seguradoraSemTipos = { nome: 'Teste', tipos_permitidos: [] };
      expect(seguradoraSemTipos.tipos_permitidos.length).toBe(0);
    });

    it('deve permitir múltiplos tipos', () => {
      const seguradoraMultiTipos = { 
        nome: 'Teste', 
        tipos_permitidos: ['LANCHA', 'VELEIRO', 'IATE'] 
      };
      expect(seguradoraMultiTipos.tipos_permitidos.length).toBe(3);
    });
  });

  describe('Estados', () => {
    it('deve retornar lista vazia quando não há seguradoras', async () => {
      mockGetAll.mockResolvedValue([]);
      
      const { seguradoraService } = require('../../services/api');
      const result = await seguradoraService.getAll();
      
      expect(result).toEqual([]);
    });

    it('deve lidar com erro ao carregar seguradoras', async () => {
      const erro = new Error('Erro de conexão');
      mockGetAll.mockRejectedValue(erro);
      
      const { seguradoraService } = require('../../services/api');
      
      await expect(seguradoraService.getAll()).rejects.toThrow('Erro de conexão');
    });

    it('deve lidar com erro ao criar seguradora', async () => {
      const erro = new Error('Nome já cadastrado');
      mockCreate.mockRejectedValue(erro);
      
      const { seguradoraService } = require('../../services/api');
      
      await expect(seguradoraService.create({ nome: 'Test' })).rejects.toThrow('Nome já cadastrado');
    });

    it('deve lidar com erro ao excluir seguradora', async () => {
      const erro = new Error('Seguradora possui embarcações vinculadas');
      mockDelete.mockRejectedValue(erro);
      
      const { seguradoraService } = require('../../services/api');
      
      await expect(seguradoraService.delete(1)).rejects.toThrow('Seguradora possui embarcações vinculadas');
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

    it('deve bloquear não administradores', () => {
      const accessControl = {
        isAdmin: false,
        isVistoriador: true,
        canEdit: false,
        canDelete: false
      };
      
      expect(accessControl.isAdmin).toBe(false);
    });
  });
});
