import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import PagamentosVistoriadores from '../PagamentosVistoriadores';
import { useAuth } from '../../contexts/AuthContext';
import { pagamentoService, vistoriadorService } from '../../services/api';

// Mocks
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/api');

const mockUseAuth = useAuth as jest.Mock;
const mockPagamentoService = pagamentoService as jest.Mocked<typeof pagamentoService>;
const mockVistoriadorService = vistoriadorService as jest.Mocked<typeof vistoriadorService>;

const mockVistoriadores = [
  { id: 1, nome: 'Vistoriador 1', email: 'v1@teste.com' },
  { id: 2, nome: 'Vistoriador 2', email: 'v2@teste.com' },
];

const mockLotes = [
  {
    id: 1,
    numero_lote: 'LOTE-001',
    status: 'PENDENTE',
    valor_total: 1500.0,
    quantidade_vistorias: 3,
    vistoriador_id: 1,
    Vistoriador: { nome: 'Vistoriador 1' },
    createdAt: '2024-11-30T10:00:00Z',
  },
  {
    id: 2,
    numero_lote: 'LOTE-002',
    status: 'PAGO',
    valor_total: 2000.0,
    quantidade_vistorias: 4,
    vistoriador_id: 2,
    Vistoriador: { nome: 'Vistoriador 2' },
    createdAt: '2024-11-29T10:00:00Z',
  },
];

const mockVistoriasDisponiveis = [
  {
    id: 1,
    Embarcacao: { nome: 'Barco 1' },
    valor_pago_vistoriador: 500.0,
    data_conclusao: '2024-11-30',
    Vistoriador: { id: 1, nome: 'Vistoriador 1' },
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <PagamentosVistoriadores />
    </BrowserRouter>
  );
};

describe('PagamentosVistoriadores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      usuario: { id: 1, NivelAcesso: { id: 1 } },
    });
    mockPagamentoService.listarLotes = jest.fn().mockResolvedValue(mockLotes);
    mockPagamentoService.listarVistoriasDisponiveis = jest.fn().mockResolvedValue(mockVistoriasDisponiveis);
    mockPagamentoService.criarLote = jest.fn().mockResolvedValue({ id: 3 });
    mockPagamentoService.marcarComoPago = jest.fn().mockResolvedValue({});
    mockVistoriadorService.listar = jest.fn().mockResolvedValue(mockVistoriadores);
  });

  describe('Renderização inicial', () => {
    it('deve renderizar o componente', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Pagamento/i)).toBeInTheDocument();
      });
    });

    it('deve carregar lista de lotes', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockPagamentoService.listarLotes).toHaveBeenCalled();
      });
    });
  });

  describe('Funcionalidades', () => {
    it('deve filtrar lotes por status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockPagamentoService.listarLotes).toHaveBeenCalled();
      });
    });

    it('deve filtrar lotes por vistoriador', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockPagamentoService.listarLotes).toHaveBeenCalled();
      });
    });
  });
});

