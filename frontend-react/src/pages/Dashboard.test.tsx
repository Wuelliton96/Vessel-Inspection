import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './Dashboard';
import { dashboardService } from '../services/api';
import { useAccessControl } from '../hooks/useAccessControl';

// Mocks
jest.mock('../services/api');
jest.mock('../hooks/useAccessControl');
jest.mock('./VistoriadorDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="vistoriador-dashboard">Vistoriador Dashboard</div>
}));

// Mock dos ícones
jest.mock('lucide-react', () => ({
  Ship: () => <div data-testid="ship-icon">Ship</div>,
  MapPin: () => <div data-testid="map-icon">MapPin</div>,
  ClipboardCheck: () => <div data-testid="clipboard-icon">ClipboardCheck</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
  TrendingUp: () => <div data-testid="trend-up-icon">TrendingUp</div>,
  TrendingDown: () => <div data-testid="trend-down-icon">TrendingDown</div>,
  DollarSign: () => <div data-testid="dollar-icon">DollarSign</div>,
  ArrowUp: () => <div data-testid="arrow-up-icon">ArrowUp</div>,
  ArrowDown: () => <div data-testid="arrow-down-icon">ArrowDown</div>,
  Minus: () => <div data-testid="minus-icon">Minus</div>,
  AlertCircle: () => <div data-testid="alert-icon">AlertCircle</div>,
}));

const mockDashboardData = {
  totalVistorias: 100,
  vistoriasPendentes: 20,
  vistoriasEmAndamento: 30,
  vistoriasConcluidas: 50,
  totalEmbarcacoes: 75,
  totalLocais: 25,
  totalUsuarios: 15,
  vistoriasAprovadas: 45,
  vistoriasReprovadas: 5,
  valorTotalVistorias: 50000,
  valorTotalVistoriadores: 30000,
  comparacaoPeriodo: {
    vistorias: { atual: 100, anterior: 80, variacao: 25 },
    embarcacoes: { atual: 75, anterior: 70, variacao: 7.14 },
    locais: { atual: 25, anterior: 23, variacao: 8.7 }
  },
  rankingVistoriadores: [
    { id: 1, nome: 'Vistoriador 1', totalVistorias: 30, valorTotal: 15000 },
    { id: 2, nome: 'Vistoriador 2', totalVistorias: 25, valorTotal: 12500 },
    { id: 3, nome: 'Vistoriador 3', totalVistorias: 20, valorTotal: 10000 }
  ],
  statusVistorias: {
    PENDENTE: 20,
    EM_ANDAMENTO: 30,
    CONCLUIDA: 50,
    APROVADA: 45,
    REPROVADA: 5
  }
};

describe('Dashboard Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    jest.clearAllMocks();

    (useAccessControl as jest.Mock).mockReturnValue({
      isAdmin: true,
      isVistoriador: false
    });

    (dashboardService.getEstatisticas as jest.Mock).mockResolvedValue(mockDashboardData);
  });

  const renderDashboard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );
  };

  describe('Renderização para Administrador', () => {
    test('deve renderizar dashboard de administrador quando isAdmin é true', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });

    test('deve exibir métricas principais', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/100/)).toBeInTheDocument(); // Total de vistorias
        expect(screen.getByText(/75/)).toBeInTheDocument(); // Total de embarcações
        expect(screen.getByText(/25/)).toBeInTheDocument(); // Total de locais
      });
    });

    test('deve exibir cards de métricas', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/vistorias/i)).toBeInTheDocument();
        expect(screen.getByText(/embarcações/i)).toBeInTheDocument();
        expect(screen.getByText(/locais/i)).toBeInTheDocument();
      });
    });
  });

  describe('Renderização para Vistoriador', () => {
    beforeEach(() => {
      (useAccessControl as jest.Mock).mockReturnValue({
        isAdmin: false,
        isVistoriador: true
      });
    });

    test('deve renderizar dashboard de vistoriador quando isVistoriador é true', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('vistoriador-dashboard')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    test('deve exibir estado de carregamento enquanto busca dados', () => {
      (dashboardService.getEstatisticas as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderDashboard();

      // Verificar se está carregando (pode não ter texto específico, mas não deve ter dados)
      expect(screen.queryByText(/100/)).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    test('deve exibir mensagem de erro quando falha ao carregar dados', async () => {
      const error = new Error('Erro ao carregar dados');
      (dashboardService.getEstatisticas as jest.Mock).mockRejectedValue(error);

      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/erro/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dados do Dashboard', () => {
    test('deve chamar dashboardService.getDashboardData ao montar', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(dashboardService.getEstatisticas).toHaveBeenCalled();
      });
    });

    test('deve exibir ranking de vistoriadores quando disponível', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Vistoriador 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Vistoriador 2/i)).toBeInTheDocument();
        expect(screen.getByText(/Vistoriador 3/i)).toBeInTheDocument();
      });
    });

    test('deve exibir comparação de períodos', async () => {
      renderDashboard();

      await waitFor(() => {
        // Verificar se há indicadores de variação
        expect(screen.getByTestId('trend-up-icon')).toBeInTheDocument();
      });
    });
  });
});

