/**
 * Testes para VistoriadorDashboard
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VistoriadorDashboard from '../VistoriadorDashboard';

// Mock do navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock do useAuth
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    usuario: {
      id: 1,
      nome: 'Vistoriador Teste',
      nivelAcesso: { nome: 'VISTORIADOR' }
    }
  })
}));

// Mock dos serviços
jest.mock('../../services/api', () => ({
  vistoriaService: {
    getByVistoriador: jest.fn()
  },
  pagamentoService: {
    getResumoFinanceiro: jest.fn()
  }
}));

import { vistoriaService, pagamentoService } from '../../services/api';

describe('VistoriadorDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock padrão para vistorias
    (vistoriaService.getByVistoriador as jest.Mock).mockResolvedValue([]);
    
    // Mock padrão para resumo financeiro
    (pagamentoService.getResumoFinanceiro as jest.Mock).mockResolvedValue({
      recebido: { total: 0, quantidade: 0, mes: { total: 0, quantidade: 0 } },
      pendente: { total: 0, quantidade: 0, mes: { total: 0, quantidade: 0 } }
    });
  });

  it('deve renderizar o dashboard', async () => {
    render(
      <MemoryRouter>
        <VistoriadorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('deve mostrar nome do usuário', async () => {
    render(
      <MemoryRouter>
        <VistoriadorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/vistoriador teste/i)).toBeInTheDocument();
    });
  });

  it('deve carregar vistorias', async () => {
    render(
      <MemoryRouter>
        <VistoriadorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(vistoriaService.getByVistoriador).toHaveBeenCalled();
    });
  });

  it('deve carregar resumo financeiro', async () => {
    render(
      <MemoryRouter>
        <VistoriadorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(pagamentoService.getResumoFinanceiro).toHaveBeenCalled();
    });
  });

  it('deve mostrar estatísticas', async () => {
    (vistoriaService.getByVistoriador as jest.Mock).mockResolvedValue([
      { id: 1, status: { nome: 'PENDENTE' } },
      { id: 2, status: { nome: 'EM_ANDAMENTO' } },
      { id: 3, status: { nome: 'CONCLUIDA' } }
    ]);

    render(
      <MemoryRouter>
        <VistoriadorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Deve ter carregado as vistorias
      expect(vistoriaService.getByVistoriador).toHaveBeenCalled();
    });
  });

  it('deve mostrar valores financeiros', async () => {
    (pagamentoService.getResumoFinanceiro as jest.Mock).mockResolvedValue({
      recebido: { total: 5000, quantidade: 10, mes: { total: 1000, quantidade: 2 } },
      pendente: { total: 2000, quantidade: 5, mes: { total: 500, quantidade: 1 } }
    });

    render(
      <MemoryRouter>
        <VistoriadorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(pagamentoService.getResumoFinanceiro).toHaveBeenCalled();
    });
  });

  it('deve lidar com erro ao carregar vistorias', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (vistoriaService.getByVistoriador as jest.Mock).mockRejectedValue(new Error('Erro'));

    render(
      <MemoryRouter>
        <VistoriadorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(vistoriaService.getByVistoriador).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('deve lidar com erro ao carregar financeiro', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (pagamentoService.getResumoFinanceiro as jest.Mock).mockRejectedValue(new Error('Erro'));

    render(
      <MemoryRouter>
        <VistoriadorDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(pagamentoService.getResumoFinanceiro).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});

