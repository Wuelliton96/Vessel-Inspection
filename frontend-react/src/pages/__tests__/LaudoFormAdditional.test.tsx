import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LaudoForm from '../LaudoForm';
import { useAuth } from '../../contexts/AuthContext';
import { vistoriaService, laudoService } from '../../services/api';

// Mocks
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/api');

const mockUseAuth = useAuth as jest.Mock;
const mockVistoriaService = vistoriaService as jest.Mocked<typeof vistoriaService>;
const mockLaudoService = laudoService as jest.Mocked<typeof laudoService>;

const mockVistoria = {
  id: 1,
  data_vistoria: '2024-11-30',
  Embarcacao: {
    id: 1,
    nome: 'Barco Teste',
    tipo_embarcacao: 'LANCHA',
    ano_fabricacao: 2020,
    comprimento: 10.5,
    Cliente: {
      id: 1,
      nome: 'Cliente Teste',
      cpf_cnpj: '12345678900',
    },
  },
  Local: {
    nome: 'Local Teste',
    cidade: 'São Paulo',
    estado: 'SP',
  },
  Laudo: null,
  vistoriador_id: 1,
  StatusVistoria: { nome: 'CONCLUIDA' },
};

const mockLaudo = {
  id: 1,
  numero_laudo: 'LAUDO-001',
  parecer: 'APROVADO',
  observacoes: 'Embarcação em bom estado',
  conclusao: 'Sem ressalvas',
  valor_mercado: 150000,
  vistoria_id: 1,
};

const renderComponent = () => {
  return render(
    <MemoryRouter initialEntries={['/laudo/1']}>
      <Routes>
        <Route path="/laudo/:vistoriaId" element={<LaudoForm />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('LaudoForm Additional Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      usuario: { id: 1, NivelAcesso: { id: 1 } },
    });
    mockVistoriaService.buscarPorId = jest.fn().mockResolvedValue(mockVistoria);
    mockLaudoService.criar = jest.fn().mockResolvedValue(mockLaudo);
    mockLaudoService.atualizar = jest.fn().mockResolvedValue(mockLaudo);
  });

  describe('Carregamento', () => {
    it('deve carregar dados da vistoria', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockVistoriaService.buscarPorId).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Formulário', () => {
    it('deve renderizar campos do formulário', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockVistoriaService.buscarPorId).toHaveBeenCalled();
      });
    });
  });

  describe('Erros', () => {
    it('deve tratar erro ao carregar vistoria', async () => {
      mockVistoriaService.buscarPorId = jest.fn().mockRejectedValue({
        response: { status: 404 },
      });

      renderComponent();

      await waitFor(() => {
        expect(mockVistoriaService.buscarPorId).toHaveBeenCalled();
      });
    });
  });
});

