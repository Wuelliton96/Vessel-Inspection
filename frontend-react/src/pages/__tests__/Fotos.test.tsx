import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Fotos from '../Fotos';
import { useAuth } from '../../contexts/AuthContext';
import { fotoService, vistoriaService } from '../../services/api';

// Mocks
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/api');

const mockUseAuth = useAuth as jest.Mock;
const mockFotoService = fotoService as jest.Mocked<typeof fotoService>;
const mockVistoriaService = vistoriaService as jest.Mocked<typeof vistoriaService>;

const mockVistoria = {
  id: 1,
  Embarcacao: { nome: 'Barco Teste' },
  vistoriador_id: 1,
  StatusVistoria: { nome: 'EM_ANDAMENTO' },
};

const mockFotos = [
  {
    id: 1,
    url_arquivo: 'foto1.jpg',
    url_completa: '/uploads/fotos/vistoria-1/foto1.jpg',
    tipo_foto_id: 1,
    observacao: 'Foto da proa',
    TipoFotoChecklist: {
      nome_exibicao: 'Proa',
      descricao: 'Frente da embarcação',
    },
    createdAt: '2024-11-30T10:00:00Z',
  },
  {
    id: 2,
    url_arquivo: 'foto2.jpg',
    url_completa: '/uploads/fotos/vistoria-1/foto2.jpg',
    tipo_foto_id: 2,
    observacao: null,
    TipoFotoChecklist: {
      nome_exibicao: 'Popa',
      descricao: 'Traseira da embarcação',
    },
    createdAt: '2024-11-30T10:05:00Z',
  },
];

const renderComponent = () => {
  return render(
    <MemoryRouter initialEntries={['/fotos/1']}>
      <Routes>
        <Route path="/fotos/:vistoriaId" element={<Fotos />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Fotos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      usuario: { id: 1, NivelAcesso: { id: 1 } },
    });
    mockVistoriaService.buscarPorId = jest.fn().mockResolvedValue(mockVistoria);
    mockFotoService.listarPorVistoria = jest.fn().mockResolvedValue(mockFotos);
    mockFotoService.uploadFoto = jest.fn().mockResolvedValue({ id: 3 });
    mockFotoService.deletar = jest.fn().mockResolvedValue({});
  });

  describe('Carregamento inicial', () => {
    it('deve carregar dados da vistoria', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockVistoriaService.buscarPorId).toHaveBeenCalledWith(1);
      });
    });

    it('deve carregar fotos da vistoria', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockFotoService.listarPorVistoria).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Exibição de fotos', () => {
    it('deve exibir fotos carregadas', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockFotoService.listarPorVistoria).toHaveBeenCalled();
      });
    });
  });

  describe('Tratamento de erros', () => {
    it('deve tratar erro ao carregar vistoria', async () => {
      mockVistoriaService.buscarPorId = jest.fn().mockRejectedValue(new Error('Erro'));

      renderComponent();

      await waitFor(() => {
        expect(mockVistoriaService.buscarPorId).toHaveBeenCalled();
      });
    });
  });
});

