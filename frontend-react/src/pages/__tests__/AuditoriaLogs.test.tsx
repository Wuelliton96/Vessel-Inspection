import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import AuditoriaLogs from '../AuditoriaLogs';
import { useAuth } from '../../contexts/AuthContext';
import { auditoriaService } from '../../services/api';

// Mocks
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/api');

const mockUseAuth = useAuth as jest.Mock;
const mockAuditoriaService = auditoriaService as jest.Mocked<typeof auditoriaService>;

const mockLogs = [
  {
    id: 1,
    usuario_id: 1,
    usuario_email: 'admin@teste.com',
    usuario_nome: 'Admin',
    acao: 'CREATE',
    entidade: 'Usuario',
    entidade_id: 2,
    dados_anteriores: null,
    dados_novos: '{"nome":"Novo Usuario"}',
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    nivel_critico: false,
    detalhes: 'Criou um novo usuário',
    createdAt: '2024-11-30T10:00:00Z',
  },
  {
    id: 2,
    usuario_id: 1,
    usuario_email: 'admin@teste.com',
    usuario_nome: 'Admin',
    acao: 'LOGIN_FAILED',
    entidade: 'Usuario',
    entidade_id: null,
    dados_anteriores: null,
    dados_novos: null,
    ip_address: '192.168.1.1',
    user_agent: 'Mozilla/5.0',
    nivel_critico: true,
    detalhes: 'Tentativa de login falhou',
    createdAt: '2024-11-30T09:00:00Z',
  },
];

const mockEstatisticas = {
  acoesPorTipo: [
    { acao: 'CREATE', total: '10' },
    { acao: 'UPDATE', total: '5' },
  ],
  acoesCriticas: 3,
  loginsFalhados: 2,
  operacoesBloqueadas: 1,
  totalAcoes: 20,
  usuariosMaisAtivos: [
    { usuario_nome: 'Admin', usuario_email: 'admin@teste.com', total: '15' },
  ],
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AuditoriaLogs />
    </BrowserRouter>
  );
};

describe('AuditoriaLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuditoriaService.listar = jest.fn().mockResolvedValue({
      logs: mockLogs,
      pagination: { totalPages: 2, total: 25 },
    });
    mockAuditoriaService.estatisticas = jest.fn().mockResolvedValue(mockEstatisticas);
  });

  describe('Acesso Restrito', () => {
    it('deve mostrar mensagem de acesso negado para usuário não admin', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 2, nome: 'Vistoriador' },
      });

      renderComponent();

      expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
      expect(screen.getByText(/Apenas o Administrador Principal/)).toBeInTheDocument();
    });

    it('deve mostrar botão de voltar ao início para não admin', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 2, nome: 'Vistoriador' },
      });

      renderComponent();

      const voltarButton = screen.getByText('Voltar ao Início');
      expect(voltarButton).toBeInTheDocument();
    });
  });

  describe('Admin Principal (ID=1)', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nome: 'Admin Principal' },
      });
    });

    it('deve renderizar o título corretamente', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Auditoria do Sistema')).toBeInTheDocument();
      });
    });

    it('deve mostrar badge de Administrador Principal', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Administrador Principal')).toBeInTheDocument();
      });
    });

    it('deve carregar e exibir estatísticas', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total de Ações')).toBeInTheDocument();
        expect(screen.getByText('20')).toBeInTheDocument();
        expect(screen.getByText('Ações Críticas')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('deve carregar e exibir logs', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Criou um novo usuário/)).toBeInTheDocument();
      });
    });

    it('deve exibir logs críticos com destaque', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Tentativa de login falhou/)).toBeInTheDocument();
      });
    });
  });

  describe('Filtros', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nome: 'Admin Principal' },
      });
    });

    it('deve renderizar filtros', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Ação')).toBeInTheDocument();
        expect(screen.getByText('Entidade')).toBeInTheDocument();
        expect(screen.getByText('Criticidade')).toBeInTheDocument();
      });
    });

    it('deve aplicar filtros ao clicar no botão', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Aplicar Filtros')).toBeInTheDocument();
      });

      const aplicarButton = screen.getByText('Aplicar Filtros');
      fireEvent.click(aplicarButton);

      await waitFor(() => {
        expect(mockAuditoriaService.listar).toHaveBeenCalled();
      });
    });

    it('deve limpar filtros ao clicar no botão', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Limpar Filtros')).toBeInTheDocument();
      });

      const limparButton = screen.getByText('Limpar Filtros');
      fireEvent.click(limparButton);

      await waitFor(() => {
        expect(mockAuditoriaService.listar).toHaveBeenCalled();
      });
    });

    it('deve atualizar ao clicar no botão Atualizar', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Atualizar')).toBeInTheDocument();
      });

      const atualizarButton = screen.getByText('Atualizar');
      fireEvent.click(atualizarButton);

      await waitFor(() => {
        expect(mockAuditoriaService.listar).toHaveBeenCalled();
      });
    });

    it('deve alterar filtro de ação', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByRole('combobox')[0]).toBeInTheDocument();
      });

      const acaoSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(acaoSelect, { target: { value: 'CREATE' } });

      expect(acaoSelect).toHaveValue('CREATE');
    });
  });

  describe('Paginação', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nome: 'Admin Principal' },
      });
    });

    it('deve mostrar paginação quando há mais de uma página', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Próxima')).toBeInTheDocument();
        expect(screen.getByText('Anterior')).toBeInTheDocument();
      });
    });

    it('deve navegar para próxima página', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Próxima')).toBeInTheDocument();
      });

      const proximaButton = screen.getByText('Próxima');
      fireEvent.click(proximaButton);

      await waitFor(() => {
        expect(mockAuditoriaService.listar).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Estado de Erro', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nome: 'Admin Principal' },
      });
    });

    it('deve exibir mensagem de erro quando API falha', async () => {
      mockAuditoriaService.listar = jest.fn().mockRejectedValue({
        response: { data: { error: 'Erro ao carregar dados' } },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar dados')).toBeInTheDocument();
      });
    });
  });

  describe('Estado Vazio', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nome: 'Admin Principal' },
      });
      mockAuditoriaService.listar = jest.fn().mockResolvedValue({
        logs: [],
        pagination: { totalPages: 1, total: 0 },
      });
    });

    it('deve exibir mensagem quando não há logs', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhum log encontrado')).toBeInTheDocument();
      });
    });
  });
});

describe('Funções auxiliares', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      usuario: { id: 1, nome: 'Admin Principal' },
    });
    mockAuditoriaService.listar = jest.fn().mockResolvedValue({
      logs: [
        { ...mockLogs[0], acao: 'UPDATE' },
        { ...mockLogs[0], id: 3, acao: 'DELETE' },
        { ...mockLogs[0], id: 4, acao: 'DELETE_BLOCKED' },
        { ...mockLogs[0], id: 5, acao: 'LOGIN_SUCCESS' },
        { ...mockLogs[0], id: 6, acao: 'RESET_PASSWORD' },
        { ...mockLogs[0], id: 7, acao: 'TOGGLE_STATUS' },
        { ...mockLogs[0], id: 8, acao: 'UNKNOWN_ACTION' },
      ],
      pagination: { totalPages: 1, total: 7 },
    });
    mockAuditoriaService.estatisticas = jest.fn().mockResolvedValue(mockEstatisticas);
  });

  it('deve exibir diferentes tipos de ações', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Atualização/)).toBeInTheDocument();
    });
  });
});

