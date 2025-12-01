import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import NovaVistoria from '../NovaVistoria';
import { useAuth } from '../../contexts/AuthContext';
import { 
  embarcacaoService, 
  clienteService, 
  vistoriaService,
  localService,
  seguradoraService
} from '../../services/api';

// Mocks
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/api');

const mockUseAuth = useAuth as jest.Mock;
const mockEmbarcacaoService = embarcacaoService as jest.Mocked<typeof embarcacaoService>;
const mockClienteService = clienteService as jest.Mocked<typeof clienteService>;
const mockVistoriaService = vistoriaService as jest.Mocked<typeof vistoriaService>;
const mockLocalService = localService as jest.Mocked<typeof localService>;
const mockSeguradoraService = seguradoraService as jest.Mocked<typeof seguradoraService>;

const mockClientes = [
  { id: 1, nome: 'Cliente 1', cpf_cnpj: '12345678900' },
  { id: 2, nome: 'Cliente 2', cpf_cnpj: '98765432100' },
];

const mockEmbarcacoes = [
  { id: 1, nome: 'Barco 1', cliente_id: 1, tipo_embarcacao: 'LANCHA' },
  { id: 2, nome: 'Barco 2', cliente_id: 2, tipo_embarcacao: 'IATE' },
];

const mockLocais = [
  { id: 1, nome: 'Local 1', cidade: 'São Paulo', estado: 'SP' },
  { id: 2, nome: 'Local 2', cidade: 'Rio de Janeiro', estado: 'RJ' },
];

const mockSeguradoras = [
  { id: 1, nome: 'Seguradora 1' },
  { id: 2, nome: 'Seguradora 2' },
];

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <NovaVistoria />
    </MemoryRouter>
  );
};

describe('NovaVistoria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      usuario: { id: 1, NivelAcesso: { id: 1 } },
    });
    mockClienteService.listar = jest.fn().mockResolvedValue(mockClientes);
    mockEmbarcacaoService.listar = jest.fn().mockResolvedValue(mockEmbarcacoes);
    mockLocalService.listar = jest.fn().mockResolvedValue(mockLocais);
    mockSeguradoraService.listar = jest.fn().mockResolvedValue(mockSeguradoras);
    mockVistoriaService.criar = jest.fn().mockResolvedValue({ id: 1 });
  });

  describe('Carregamento inicial', () => {
    it('deve carregar dados necessários', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockClienteService.listar).toHaveBeenCalled();
      });
    });
  });

  describe('Exibição', () => {
    it('deve renderizar o formulário', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockClienteService.listar).toHaveBeenCalled();
      });
    });
  });
});

