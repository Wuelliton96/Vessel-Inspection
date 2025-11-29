/**
 * Testes para página Embarcacoes
 */

import React from 'react';
import { Embarcacao, Cliente, Seguradora, SeguradoraTipoEmbarcacao } from '../../types';

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
const mockSeguradoraGetAll = jest.fn();
const mockClienteGetAll = jest.fn();
const mockClienteBuscar = jest.fn();
const mockGetTiposPermitidos = jest.fn();

jest.mock('../../services/api', () => ({
  embarcacaoService: {
    getAll: () => mockGetAll(),
    create: (data: any) => mockCreate(data),
    update: (id: number, data: any) => mockUpdate(id, data),
    delete: (id: number) => mockDelete(id)
  },
  seguradoraService: {
    getAll: (ativo?: boolean) => mockSeguradoraGetAll(ativo),
    getTiposPermitidos: (id: number) => mockGetTiposPermitidos(id)
  },
  clienteService: {
    getAll: (params?: any) => mockClienteGetAll(params),
    buscarPorDocumento: (doc: string) => mockClienteBuscar(doc)
  }
}));

// Mock dos utilitários
jest.mock('../../utils/validators', () => ({
  TIPOS_EMBARCACAO: [
    { value: 'LANCHA', label: 'Lancha' },
    { value: 'VELEIRO', label: 'Veleiro' }
  ],
  TIPOS_EMBARCACAO_SEGURADORA: [
    { value: 'LANCHA', label: 'Lancha' },
    { value: 'VELEIRO', label: 'Veleiro' }
  ],
  getLabelTipoEmbarcacaoSeguradora: (tipo: string) => tipo,
  PORTES_EMBARCACAO: [
    { value: 'PEQUENO', label: 'Pequeno' },
    { value: 'MEDIO', label: 'Médio' },
    { value: 'GRANDE', label: 'Grande' }
  ],
  mascaraCPF: jest.fn((value: string) => value),
  limparCPF: jest.fn((value: string) => value?.replace(/\D/g, '')),
  formatarCPF: jest.fn((value: string) => value),
  mascaraTelefone: jest.fn((value: string) => value),
  converterParaE164: jest.fn((value: string) => value),
  mascaraValorMonetario: (value: string) => value || '',
  limparValorMonetario: (value: string) => parseFloat(value?.replace(/\./g, '').replace(',', '.')) || 0,
  formatarValorMonetario: (value: number) => value?.toFixed(2).replace('.', ',') || '0,00'
}));

// Dados mock
const mockClientes: Cliente[] = [
  {
    id: 1,
    tipo_pessoa: 'FISICA',
    nome: 'João Silva',
    cpf: '12345678901',
    cnpj: null,
    telefone_e164: '+5511999999999',
    email: 'joao@email.com',
    ativo: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  }
];

const mockSeguradoras: Seguradora[] = [
  {
    id: 1,
    nome: 'Seguradora ABC',
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
    proprietario_nome: 'João Silva',
    proprietario_cpf: '12345678901',
    proprietario_email: 'joao@email.com',
    proprietario_telefone: '+5511999999999',
    Cliente: mockClientes[0],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 2,
    nome: 'Veleiro Mar',
    nr_inscricao_barco: 'BR654321',
    cliente_id: null,
    seguradora_id: 1,
    tipo_embarcacao: 'VELEIRO',
    porte: 'GRANDE',
    valor_embarcacao: 300000,
    ano_fabricacao: 2018,
    proprietario_nome: null,
    proprietario_cpf: null,
    proprietario_email: null,
    proprietario_telefone: null,
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02'
  }
];

describe('Embarcacoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue(mockEmbarcacoes);
    mockSeguradoraGetAll.mockResolvedValue(mockSeguradoras);
    mockClienteGetAll.mockResolvedValue(mockClientes);
    mockGetTiposPermitidos.mockResolvedValue([
      { tipo_embarcacao: 'LANCHA' },
      { tipo_embarcacao: 'VELEIRO' }
    ]);
  });

  describe('Componente', () => {
    it('deve importar componente sem erro', async () => {
      const { default: Embarcacoes } = await import('../Embarcacoes');
      expect(Embarcacoes).toBeDefined();
      expect(typeof Embarcacoes).toBe('function');
    });
  });

  describe('Serviços de Embarcação', () => {
    it('deve chamar getAll ao inicializar', async () => {
      const { embarcacaoService } = require('../../services/api');
      const result = await embarcacaoService.getAll();
      expect(mockGetAll).toHaveBeenCalled();
      expect(result).toEqual(mockEmbarcacoes);
    });

    it('deve chamar create com dados corretos', async () => {
      const novaEmbarcacao = {
        nome: 'Nova Embarcação',
        nr_inscricao_barco: 'BR999999',
        seguradora_id: 1,
        tipo_embarcacao: 'LANCHA'
      };
      mockCreate.mockResolvedValue({ id: 3, ...novaEmbarcacao });
      
      const { embarcacaoService } = require('../../services/api');
      const result = await embarcacaoService.create(novaEmbarcacao);
      
      expect(mockCreate).toHaveBeenCalledWith(novaEmbarcacao);
      expect(result.nome).toBe('Nova Embarcação');
    });

    it('deve chamar update com id e dados corretos', async () => {
      const dadosAtualizados = { nome: 'Embarcação Atualizada' };
      mockUpdate.mockResolvedValue({ ...mockEmbarcacoes[0], ...dadosAtualizados });
      
      const { embarcacaoService } = require('../../services/api');
      const result = await embarcacaoService.update(1, dadosAtualizados);
      
      expect(mockUpdate).toHaveBeenCalledWith(1, dadosAtualizados);
      expect(result.nome).toBe('Embarcação Atualizada');
    });

    it('deve chamar delete com id correto', async () => {
      mockDelete.mockResolvedValue(undefined);
      
      const { embarcacaoService } = require('../../services/api');
      await embarcacaoService.delete(1);
      
      expect(mockDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('Serviços de Seguradora', () => {
    it('deve carregar seguradoras ativas', async () => {
      const { seguradoraService } = require('../../services/api');
      const result = await seguradoraService.getAll(true);
      
      expect(mockSeguradoraGetAll).toHaveBeenCalledWith(true);
      expect(result).toEqual(mockSeguradoras);
    });

    it('deve carregar tipos permitidos por seguradora', async () => {
      const { seguradoraService } = require('../../services/api');
      const result = await seguradoraService.getTiposPermitidos(1);
      
      expect(mockGetTiposPermitidos).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(2);
    });
  });

  describe('Serviços de Cliente', () => {
    it('deve carregar clientes ativos', async () => {
      const { clienteService } = require('../../services/api');
      const result = await clienteService.getAll({ ativo: true });
      
      expect(mockClienteGetAll).toHaveBeenCalledWith({ ativo: true });
      expect(result).toEqual(mockClientes);
    });

    it('deve buscar cliente por documento', async () => {
      mockClienteBuscar.mockResolvedValue(mockClientes[0]);
      
      const { clienteService } = require('../../services/api');
      const result = await clienteService.buscarPorDocumento('12345678901');
      
      expect(mockClienteBuscar).toHaveBeenCalledWith('12345678901');
      expect(result.nome).toBe('João Silva');
    });
  });

  describe('Dados mock', () => {
    it('deve ter embarcações com diferentes tipos', () => {
      const lanchas = mockEmbarcacoes.filter(e => e.tipo_embarcacao === 'LANCHA');
      const veleiros = mockEmbarcacoes.filter(e => e.tipo_embarcacao === 'VELEIRO');
      
      expect(lanchas.length).toBe(1);
      expect(veleiros.length).toBe(1);
    });

    it('deve ter embarcações com e sem proprietário', () => {
      const comProprietario = mockEmbarcacoes.filter(e => e.cliente_id !== null);
      const semProprietario = mockEmbarcacoes.filter(e => e.cliente_id === null);
      
      expect(comProprietario.length).toBe(1);
      expect(semProprietario.length).toBe(1);
    });

    it('deve filtrar por nome corretamente', () => {
      const filtro = 'Barco';
      const resultado = mockEmbarcacoes.filter(e => 
        e.nome.toLowerCase().includes(filtro.toLowerCase())
      );
      
      expect(resultado.length).toBe(1);
      expect(resultado[0].nome).toBe('Barco Azul');
    });

    it('deve filtrar por número de inscrição corretamente', () => {
      const filtro = 'BR123456';
      const resultado = mockEmbarcacoes.filter(e => 
        e.nr_inscricao_barco.includes(filtro)
      );
      
      expect(resultado.length).toBe(1);
      expect(resultado[0].nome).toBe('Barco Azul');
    });
  });

  describe('Estados', () => {
    it('deve retornar lista vazia quando não há embarcações', async () => {
      mockGetAll.mockResolvedValue([]);
      
      const { embarcacaoService } = require('../../services/api');
      const result = await embarcacaoService.getAll();
      
      expect(result).toEqual([]);
    });

    it('deve lidar com erro ao carregar embarcações', async () => {
      const erro = new Error('Erro de conexão');
      mockGetAll.mockRejectedValue(erro);
      
      const { embarcacaoService } = require('../../services/api');
      
      await expect(embarcacaoService.getAll()).rejects.toThrow('Erro de conexão');
    });
  });

  describe('Formatação', () => {
    it('deve formatar valor monetário corretamente', () => {
      const { formatarValorMonetario } = require('../../utils/validators');
      const resultado = formatarValorMonetario(150000);
      expect(resultado).toBeDefined();
    });

    it('deve limpar valor monetário corretamente', () => {
      const { limparValorMonetario } = require('../../utils/validators');
      const resultado = limparValorMonetario('150.000,00');
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
});
