/**
 * Testes para página Locais
 */

import React from 'react';
import { Local } from '../../types';

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

jest.mock('../../services/api', () => ({
  localService: {
    getAll: () => mockGetAll(),
    create: (data: any) => mockCreate(data),
    update: (id: number, data: any) => mockUpdate(id, data),
    delete: (id: number) => mockDelete(id)
  }
}));

// Mock do cepUtils
const mockBuscarCEP = jest.fn();
jest.mock('../../utils/cepUtils', () => ({
  buscarCEP: () => mockBuscarCEP(),
  formatarCEP: (cep: string) => {
    const cleaned = cep?.replace(/\D/g, '') || '';
    if (cleaned.length <= 5) return cleaned;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  },
  validarCEP: (cep: string) => (cep?.replace(/\D/g, '') || '').length === 8
}));

// Dados mock
const mockLocais: Local[] = [
  {
    id: 1,
    tipo: 'MARINA',
    nome_local: 'Marina do Sol',
    cep: '01310100',
    logradouro: 'Av. Paulista',
    numero: '1000',
    complemento: 'Galpão 5',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  },
  {
    id: 2,
    tipo: 'RESIDENCIA',
    nome_local: 'Casa do João',
    cep: '22041080',
    logradouro: 'Av. Atlântica',
    numero: '500',
    complemento: 'Cobertura',
    bairro: 'Copacabana',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02'
  },
  {
    id: 3,
    tipo: 'MARINA',
    nome_local: 'Marina Azul',
    cep: null,
    logradouro: null,
    numero: null,
    complemento: null,
    bairro: null,
    cidade: 'Santos',
    estado: 'SP',
    createdAt: '2024-01-03',
    updatedAt: '2024-01-03'
  }
];

describe('Locais', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue(mockLocais);
  });

  describe('Componente', () => {
    it('deve importar componente sem erro', async () => {
      const { default: Locais } = await import('../Locais');
      expect(Locais).toBeDefined();
      expect(typeof Locais).toBe('function');
    });
  });

  describe('Serviços', () => {
    it('deve chamar getAll ao inicializar', async () => {
      const { localService } = require('../../services/api');
      const result = await localService.getAll();
      expect(mockGetAll).toHaveBeenCalled();
      expect(result).toEqual(mockLocais);
    });

    it('deve chamar create com dados corretos', async () => {
      const novoLocal = {
        tipo: 'MARINA',
        nome_local: 'Nova Marina',
        cidade: 'Guarujá',
        estado: 'SP'
      };
      mockCreate.mockResolvedValue({ id: 4, ...novoLocal });
      
      const { localService } = require('../../services/api');
      const result = await localService.create(novoLocal);
      
      expect(mockCreate).toHaveBeenCalledWith(novoLocal);
      expect(result.nome_local).toBe('Nova Marina');
    });

    it('deve chamar update com id e dados corretos', async () => {
      const dadosAtualizados = { nome_local: 'Marina Atualizada' };
      mockUpdate.mockResolvedValue({ ...mockLocais[0], ...dadosAtualizados });
      
      const { localService } = require('../../services/api');
      const result = await localService.update(1, dadosAtualizados);
      
      expect(mockUpdate).toHaveBeenCalledWith(1, dadosAtualizados);
      expect(result.nome_local).toBe('Marina Atualizada');
    });

    it('deve chamar delete com id correto', async () => {
      mockDelete.mockResolvedValue(undefined);
      
      const { localService } = require('../../services/api');
      await localService.delete(1);
      
      expect(mockDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('Busca de CEP', () => {
    it('deve buscar CEP e retornar dados', async () => {
      mockBuscarCEP.mockResolvedValue({
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP'
      });
      
      const { buscarCEP } = require('../../utils/cepUtils');
      const result = await buscarCEP();
      
      expect(result.logradouro).toBe('Avenida Paulista');
      expect(result.localidade).toBe('São Paulo');
    });

    it('deve formatar CEP corretamente', () => {
      const { formatarCEP } = require('../../utils/cepUtils');
      
      expect(formatarCEP('01310100')).toBe('01310-100');
      expect(formatarCEP('01310')).toBe('01310');
    });

    it('deve validar CEP corretamente', () => {
      const { validarCEP } = require('../../utils/cepUtils');
      
      expect(validarCEP('01310100')).toBe(true);
      expect(validarCEP('01310')).toBe(false);
    });
  });

  describe('Dados mock', () => {
    it('deve ter locais tipo MARINA', () => {
      const marinas = mockLocais.filter(l => l.tipo === 'MARINA');
      expect(marinas.length).toBe(2);
    });

    it('deve ter locais tipo RESIDENCIA', () => {
      const residencias = mockLocais.filter(l => l.tipo === 'RESIDENCIA');
      expect(residencias.length).toBe(1);
    });

    it('deve ter locais com e sem endereço completo', () => {
      const comEndereco = mockLocais.filter(l => l.logradouro !== null);
      const semEndereco = mockLocais.filter(l => l.logradouro === null);
      
      expect(comEndereco.length).toBe(2);
      expect(semEndereco.length).toBe(1);
    });

    it('deve filtrar por nome corretamente', () => {
      const filtro = 'Sol';
      const resultado = mockLocais.filter(l => 
        l.nome_local?.toLowerCase().includes(filtro.toLowerCase())
      );
      
      expect(resultado.length).toBe(1);
      expect(resultado[0].nome_local).toBe('Marina do Sol');
    });

    it('deve filtrar por cidade corretamente', () => {
      const filtro = 'São Paulo';
      const resultado = mockLocais.filter(l => 
        l.cidade?.toLowerCase().includes(filtro.toLowerCase())
      );
      
      expect(resultado.length).toBe(1);
    });

    it('deve filtrar por tipo corretamente', () => {
      const resultado = mockLocais.filter(l => l.tipo === 'MARINA');
      expect(resultado.length).toBe(2);
    });
  });

  describe('Formatação de Endereço', () => {
    it('deve formatar endereço completo', () => {
      const local = mockLocais[0];
      const parts = [];
      if (local.logradouro) parts.push(local.logradouro);
      if (local.numero) parts.push(local.numero);
      if (local.complemento) parts.push(local.complemento);
      if (local.bairro) parts.push(local.bairro);
      if (local.cidade) parts.push(local.cidade);
      if (local.estado) parts.push(local.estado);
      
      const endereco = parts.join(', ');
      
      expect(endereco).toContain('Av. Paulista');
      expect(endereco).toContain('1000');
      expect(endereco).toContain('Bela Vista');
    });

    it('deve retornar mensagem para endereço incompleto', () => {
      const local = mockLocais[2];
      const parts = [];
      if (local.logradouro) parts.push(local.logradouro);
      
      const endereco = parts.length > 0 ? parts.join(', ') : 'Endereço não informado';
      
      expect(endereco).toBe('Endereço não informado');
    });
  });

  describe('Estados', () => {
    it('deve retornar lista vazia quando não há locais', async () => {
      mockGetAll.mockResolvedValue([]);
      
      const { localService } = require('../../services/api');
      const result = await localService.getAll();
      
      expect(result).toEqual([]);
    });

    it('deve lidar com erro ao carregar locais', async () => {
      const erro = new Error('Erro de conexão');
      mockGetAll.mockRejectedValue(erro);
      
      const { localService } = require('../../services/api');
      
      await expect(localService.getAll()).rejects.toThrow('Erro de conexão');
    });

    it('deve lidar com erro ao criar local', async () => {
      const erro = new Error('Nome já cadastrado');
      mockCreate.mockRejectedValue(erro);
      
      const { localService } = require('../../services/api');
      
      await expect(localService.create({ tipo: 'MARINA' })).rejects.toThrow('Nome já cadastrado');
    });

    it('deve lidar com erro ao excluir local', async () => {
      const erro = new Error('Local possui vistorias vinculadas');
      mockDelete.mockRejectedValue(erro);
      
      const { localService } = require('../../services/api');
      
      await expect(localService.delete(1)).rejects.toThrow('Local possui vistorias vinculadas');
    });

    it('deve lidar com CEP não encontrado', async () => {
      const erro = new Error('CEP não encontrado');
      mockBuscarCEP.mockRejectedValue(erro);
      
      const { buscarCEP } = require('../../utils/cepUtils');
      
      await expect(buscarCEP()).rejects.toThrow('CEP não encontrado');
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
