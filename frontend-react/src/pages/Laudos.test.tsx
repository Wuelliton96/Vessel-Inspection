import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Laudos from './Laudos';
import { laudoService, vistoriaService } from '../services/api';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

jest.mock('../services/api', () => ({
  laudoService: {
    listar: jest.fn(),
    download: jest.fn(),
    excluir: jest.fn()
  },
  vistoriaService: {
    getAll: jest.fn()
  }
}));

const mockLaudos = [
  {
    id: 1,
    numero_laudo: '251111A',
    vistoria_id: 1,
    data_geracao: '2025-11-11T10:00:00.000Z',
    url_pdf: '/uploads/laudos/2025/11/laudo-1.pdf',
    Vistoria: {
      id: 1,
      Embarcacao: {
        id: 1,
        nome: 'Sea Doo RXT X 325'
      }
    }
  },
  {
    id: 2,
    numero_laudo: '251111B',
    vistoria_id: 2,
    data_geracao: '2025-11-11T11:00:00.000Z',
    url_pdf: null,
    Vistoria: {
      id: 2,
      Embarcacao: {
        id: 2,
        nome: 'Yamaha VX Cruiser'
      }
    }
  }
];

describe('Página Laudos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (vistoriaService.getAll as jest.Mock).mockResolvedValue([]);
  });

  it('deve renderizar título da página', async () => {
    (laudoService.listar as jest.Mock).mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <Laudos />
      </BrowserRouter>
    );

    expect(screen.getByText('Laudos de Vistoria')).toBeInTheDocument();
  });

  it('deve exibir loading inicial', () => {
    (laudoService.listar as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(
      <BrowserRouter>
        <Laudos />
      </BrowserRouter>
    );

    expect(screen.getByText('Carregando laudos...')).toBeInTheDocument();
  });

  it('deve carregar e exibir lista de laudos', async () => {
    (laudoService.listar as jest.Mock).mockResolvedValue(mockLaudos);
    
    render(
      <BrowserRouter>
        <Laudos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('251111A')).toBeInTheDocument();
      expect(screen.getByText('251111B')).toBeInTheDocument();
      expect(screen.getByText('Sea Doo RXT X 325')).toBeInTheDocument();
      expect(screen.getByText('Yamaha VX Cruiser')).toBeInTheDocument();
    });
  });

  it('deve exibir mensagem quando não há laudos', async () => {
    (laudoService.listar as jest.Mock).mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <Laudos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nenhum laudo encontrado')).toBeInTheDocument();
    });
  });

  it('deve exibir status correto para laudo com PDF', async () => {
    (laudoService.listar as jest.Mock).mockResolvedValue([mockLaudos[0]]);
    
    render(
      <BrowserRouter>
        <Laudos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('PDF Gerado')).toBeInTheDocument();
    });
  });

  it('deve exibir status rascunho para laudo sem PDF', async () => {
    (laudoService.listar as jest.Mock).mockResolvedValue([mockLaudos[1]]);
    
    render(
      <BrowserRouter>
        <Laudos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Rascunho')).toBeInTheDocument();
    });
  });

  it('deve exibir erro ao falhar carregar laudos', async () => {
    const errorMessage = 'Erro ao carregar laudos';
    (laudoService.listar as jest.Mock).mockRejectedValue({
      response: { data: { error: errorMessage } }
    });
    
    render(
      <BrowserRouter>
        <Laudos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('deve chamar laudoService.listar ao montar', async () => {
    (laudoService.listar as jest.Mock).mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <Laudos />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(laudoService.listar).toHaveBeenCalledTimes(1);
    });
  });
});

