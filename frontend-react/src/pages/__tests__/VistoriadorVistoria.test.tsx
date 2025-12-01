import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VistoriadorVistoria from '../VistoriadorVistoria';
import { useAuth } from '../../contexts/AuthContext';
import { vistoriaService, checklistService } from '../../services/api';

// Mocks
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/api');

const mockUseAuth = useAuth as jest.Mock;
const mockVistoriaService = vistoriaService as jest.Mocked<typeof vistoriaService>;
const mockChecklistService = checklistService as jest.Mocked<typeof checklistService>;

const mockVistoria = {
  id: 1,
  data_vistoria: '2024-11-30',
  Embarcacao: { 
    id: 1,
    nome: 'Barco Teste', 
    tipo_embarcacao: 'LANCHA',
    Cliente: {
      id: 1,
      nome: 'Cliente Teste'
    }
  },
  Local: {
    nome: 'Local Teste',
    cidade: 'São Paulo',
    estado: 'SP'
  },
  vistoriador_id: 1,
  StatusVistoria: { nome: 'EM_ANDAMENTO' },
};

const mockChecklistItems = [
  {
    id: 1,
    nome: 'Foto da Proa',
    status: 'PENDENTE',
    foto_id: null,
    obrigatorio: true,
  },
];

const renderComponent = () => {
  return render(
    <MemoryRouter initialEntries={['/vistoriador/vistoria/1']}>
      <Routes>
        <Route path="/vistoriador/vistoria/:id" element={<VistoriadorVistoria />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('VistoriadorVistoria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      usuario: { id: 1, NivelAcesso: { id: 2 } },
    });
    mockVistoriaService.buscarPorId = jest.fn().mockResolvedValue(mockVistoria);
    mockChecklistService.getItemsByVistoria = jest.fn().mockResolvedValue(mockChecklistItems);
    mockChecklistService.getProgresso = jest.fn().mockResolvedValue({
      total: 1,
      concluidos: 0,
      percentual: 0,
    });
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

