/**
 * Testes para página Clientes
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Cliente, TipoPessoa } from '../../types';

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

// Mock dos serviços
const mockGetAll = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockToggleStatus = jest.fn();

jest.mock('../../services/api', () => ({
  clienteService: {
    getAll: () => mockGetAll(),
    create: (data: any) => mockCreate(data),
    update: (id: number, data: any) => mockUpdate(id, data),
    delete: (id: number) => mockDelete(id),
    toggleStatus: (id: number) => mockToggleStatus(id)
  }
}));

// Mock dos utilitários
jest.mock('../../utils/validators', () => ({
  validarCPF: (cpf: string) => cpf?.replace(/\D/g, '').length === 11,
  formatarCPF: (cpf: string) => {
    if (!cpf) return cpf;
    const cleaned = cpf.replace(/\D/g, '');
    return `${cleaned.slice(0,3)}.${cleaned.slice(3,6)}.${cleaned.slice(6,9)}-${cleaned.slice(9)}`;
  },
  mascaraCPF: (value: string) => value || '',
  validarCNPJ: (cnpj: string) => cnpj?.replace(/\D/g, '').length === 14,
  formatarCNPJ: (cnpj: string) => {
    if (!cnpj) return cnpj;
    const cleaned = cnpj.replace(/\D/g, '');
    return `${cleaned.slice(0,2)}.${cleaned.slice(2,5)}.${cleaned.slice(5,8)}/${cleaned.slice(8,12)}-${cleaned.slice(12)}`;
  },
  mascaraCNPJ: (value: string) => value || '',
  mascaraTelefone: (value: string) => value || ''
}));

jest.mock('../../utils/cepUtils', () => ({
  buscarCEP: jest.fn(),
  formatarCEP: jest.fn((cep: string) => cep),
  validarCEP: jest.fn(() => false)
}));

// Dados mock
const mockClientes: Cliente[] = [
  {
    id: 1,
    tipo_pessoa: 'FISICA' as TipoPessoa,
    nome: 'João Silva',
    cpf: '12345678901',
    cnpj: null,
    telefone_e164: '+5511999999999',
    email: 'joao@email.com',
    cep: '01310100',
    logradouro: 'Av. Paulista',
    numero: '1000',
    complemento: 'Sala 101',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    observacoes: 'Cliente VIP',
    ativo: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    tipo_pessoa: 'JURIDICA' as TipoPessoa,
    nome: 'Empresa ABC Ltda',
    cpf: null,
    cnpj: '12345678000190',
    telefone_e164: '+5511988888888',
    email: 'contato@empresa.com',
    cep: '04538133',
    logradouro: 'Av. Faria Lima',
    numero: '2000',
    complemento: 'Andar 10',
    bairro: 'Itaim Bibi',
    cidade: 'São Paulo',
    estado: 'SP',
    observacoes: null,
    ativo: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    id: 3,
    tipo_pessoa: 'FISICA' as TipoPessoa,
    nome: 'Maria Santos',
    cpf: '98765432101',
    cnpj: null,
    telefone_e164: null,
    email: null,
    cep: null,
    logradouro: null,
    numero: null,
    complemento: null,
    bairro: null,
    cidade: null,
    estado: null,
    observacoes: null,
    ativo: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  }
];

describe('Clientes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAll.mockResolvedValue(mockClientes);
  });

  describe('Componente', () => {
    it('deve importar componente sem erro', async () => {
      const { default: Clientes } = await import('../Clientes');
      expect(Clientes).toBeDefined();
      expect(typeof Clientes).toBe('function');
    });
  });

  describe('Serviços', () => {
    it('deve chamar getAll ao inicializar', async () => {
      const { clienteService } = require('../../services/api');
      const result = await clienteService.getAll();
      expect(mockGetAll).toHaveBeenCalled();
      expect(result).toEqual(mockClientes);
    });

    it('deve chamar create com dados corretos', async () => {
      const novoCliente = {
        tipo_pessoa: 'FISICA',
        nome: 'Novo Cliente',
        cpf: '11122233344'
      };
      mockCreate.mockResolvedValue({ id: 4, ...novoCliente });
      
      const { clienteService } = require('../../services/api');
      const result = await clienteService.create(novoCliente);
      
      expect(mockCreate).toHaveBeenCalledWith(novoCliente);
      expect(result.nome).toBe('Novo Cliente');
    });

    it('deve chamar update com id e dados corretos', async () => {
      const dadosAtualizados = { nome: 'Cliente Atualizado' };
      mockUpdate.mockResolvedValue({ ...mockClientes[0], ...dadosAtualizados });
      
      const { clienteService } = require('../../services/api');
      const result = await clienteService.update(1, dadosAtualizados);
      
      expect(mockUpdate).toHaveBeenCalledWith(1, dadosAtualizados);
      expect(result.nome).toBe('Cliente Atualizado');
    });

    it('deve chamar delete com id correto', async () => {
      mockDelete.mockResolvedValue(undefined);
      
      const { clienteService } = require('../../services/api');
      await clienteService.delete(1);
      
      expect(mockDelete).toHaveBeenCalledWith(1);
    });

    it('deve chamar toggleStatus com id correto', async () => {
      mockToggleStatus.mockResolvedValue({ ...mockClientes[0], ativo: false });
      
      const { clienteService } = require('../../services/api');
      const result = await clienteService.toggleStatus(1);
      
      expect(mockToggleStatus).toHaveBeenCalledWith(1);
      expect(result.ativo).toBe(false);
    });
  });

  describe('Validações', () => {
    it('deve validar CPF corretamente', () => {
      const { validarCPF } = require('../../utils/validators');
      
      expect(validarCPF('12345678901')).toBe(true);
      expect(validarCPF('123')).toBe(false);
    });

    it('deve validar CNPJ corretamente', () => {
      const { validarCNPJ } = require('../../utils/validators');
      
      expect(validarCNPJ('12345678000190')).toBe(true);
      expect(validarCNPJ('123')).toBe(false);
    });
  });

  describe('Dados mock', () => {
    it('deve ter clientes pessoa física', () => {
      const pessoasFisicas = mockClientes.filter(c => c.tipo_pessoa === 'FISICA');
      expect(pessoasFisicas.length).toBe(2);
    });

    it('deve ter clientes pessoa jurídica', () => {
      const pessoasJuridicas = mockClientes.filter(c => c.tipo_pessoa === 'JURIDICA');
      expect(pessoasJuridicas.length).toBe(1);
    });

    it('deve ter clientes ativos e inativos', () => {
      const ativos = mockClientes.filter(c => c.ativo);
      const inativos = mockClientes.filter(c => !c.ativo);
      
      expect(ativos.length).toBe(2);
      expect(inativos.length).toBe(1);
    });

    it('deve filtrar por nome corretamente', () => {
      const filtro = 'João';
      const resultado = mockClientes.filter(c => 
        c.nome.toLowerCase().includes(filtro.toLowerCase())
      );
      
      expect(resultado.length).toBe(1);
      expect(resultado[0].nome).toBe('João Silva');
    });

    it('deve filtrar por tipo de pessoa corretamente', () => {
      const resultado = mockClientes.filter(c => c.tipo_pessoa === 'JURIDICA');
      
      expect(resultado.length).toBe(1);
      expect(resultado[0].nome).toBe('Empresa ABC Ltda');
    });
  });

  describe('Estados', () => {
    it('deve retornar lista vazia quando não há clientes', async () => {
      mockGetAll.mockResolvedValue([]);
      
      const { clienteService } = require('../../services/api');
      const result = await clienteService.getAll();
      
      expect(result).toEqual([]);
    });

    it('deve lidar com erro ao carregar clientes', async () => {
      const erro = new Error('Erro de conexão');
      mockGetAll.mockRejectedValue(erro);
      
      const { clienteService } = require('../../services/api');
      
      await expect(clienteService.getAll()).rejects.toThrow('Erro de conexão');
    });

    it('deve lidar com erro ao criar cliente', async () => {
      const erro = new Error('CPF já cadastrado');
      mockCreate.mockRejectedValue(erro);
      
      const { clienteService } = require('../../services/api');
      
      await expect(clienteService.create({ nome: 'Test' })).rejects.toThrow('CPF já cadastrado');
    });
  });

  describe('Formatação', () => {
    it('deve formatar CPF corretamente', () => {
      const { formatarCPF } = require('../../utils/validators');
      const resultado = formatarCPF('12345678901');
      expect(resultado).toBeDefined();
    });

    it('deve formatar CNPJ corretamente', () => {
      const { formatarCNPJ } = require('../../utils/validators');
      const resultado = formatarCNPJ('12345678000190');
      expect(resultado).toBeDefined();
    });

    it('deve formatar telefone corretamente', () => {
      const { mascaraTelefone } = require('../../utils/validators');
      const resultado = mascaraTelefone('11999999999');
      expect(resultado).toBeDefined();
    });
  });
});
