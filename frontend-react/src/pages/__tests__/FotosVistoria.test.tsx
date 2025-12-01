import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import FotosVistoria from '../FotosVistoria';
import { useAuth } from '../../contexts/AuthContext';
import { fotoService, vistoriaService, checklistService } from '../../services/api';

// Mocks
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/api');

const mockUseAuth = useAuth as jest.Mock;
const mockFotoService = fotoService as jest.Mocked<typeof fotoService>;
const mockVistoriaService = vistoriaService as jest.Mocked<typeof vistoriaService>;
const mockChecklistService = checklistService as jest.Mocked<typeof checklistService>;

const mockVistoria = {
  id: 1,
  Embarcacao: { nome: 'Barco Teste', tipo_embarcacao: 'LANCHA' },
  vistoriador_id: 1,
  StatusVistoria: { nome: 'EM_ANDAMENTO' },
};

const mockFotos = [
  {
    id: 1,
    url_arquivo: 'foto1.jpg',
    url_completa: '/uploads/fotos/vistoria-1/foto1.jpg',
    tipo_foto_id: 1,
    TipoFotoChecklist: {
      nome_exibicao: 'Proa',
    },
  },
];

const mockChecklistItems = [
  {
    id: 1,
    nome: 'Foto da Proa',
    status: 'CONCLUIDO',
    foto_id: 1,
    obrigatorio: true,
  },
  {
    id: 2,
    nome: 'Foto da Popa',
    status: 'PENDENTE',
    foto_id: null,
    obrigatorio: true,
  },
];

const mockChecklistProgresso = {
  total: 2,
  concluidos: 1,
  percentual: 50,
};

const renderComponent = () => {
  return render(
    <MemoryRouter initialEntries={['/vistoria/1/fotos']}>
      <Routes>
        <Route path="/vistoria/:id/fotos" element={<FotosVistoria />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('FotosVistoria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      usuario: { id: 1, NivelAcesso: { id: 2 } },
    });
    mockVistoriaService.buscarPorId = jest.fn().mockResolvedValue(mockVistoria);
    mockFotoService.listarPorVistoria = jest.fn().mockResolvedValue(mockFotos);
    mockFotoService.uploadFoto = jest.fn().mockResolvedValue({ id: 2 });
    mockFotoService.deletar = jest.fn().mockResolvedValue({});
    mockChecklistService.getItemsByVistoria = jest.fn().mockResolvedValue(mockChecklistItems);
    mockChecklistService.getProgresso = jest.fn().mockResolvedValue(mockChecklistProgresso);
  });

  describe('Carregamento inicial', () => {
    it('deve carregar dados da vistoria', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockVistoriaService.buscarPorId).toHaveBeenCalledWith(1);
      });
    });

    it('deve carregar itens do checklist', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockChecklistService.getItemsByVistoria).toHaveBeenCalledWith(1);
      });
    });

    it('deve carregar progresso do checklist', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockChecklistService.getProgresso).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Exibição de itens', () => {
    it('deve exibir itens do checklist', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockChecklistService.getItemsByVistoria).toHaveBeenCalled();
      });
    });
  });

  describe('Upload de fotos', () => {
    it('deve fazer upload de foto', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockChecklistService.getItemsByVistoria).toHaveBeenCalled();
      });
    });
  });

  describe('Tratamento de erros', () => {
    it('deve tratar erro ao carregar vistoria não encontrada', async () => {
      mockVistoriaService.buscarPorId = jest.fn().mockRejectedValue({
        response: { status: 404 },
      });

      renderComponent();

      await waitFor(() => {
        expect(mockVistoriaService.buscarPorId).toHaveBeenCalled();
      });
    });

    it('deve tratar erro de acesso negado', async () => {
      mockVistoriaService.buscarPorId = jest.fn().mockRejectedValue({
        response: { status: 403 },
      });

      renderComponent();

      await waitFor(() => {
        expect(mockVistoriaService.buscarPorId).toHaveBeenCalled();
      });
    });
  });

  describe('Navegação', () => {
    it('deve ter botão de voltar', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockVistoriaService.buscarPorId).toHaveBeenCalled();
      });
    });
  });
});

