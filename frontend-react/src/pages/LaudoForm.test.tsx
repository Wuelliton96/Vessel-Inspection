import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import LaudoForm from './LaudoForm';
import { laudoService } from '../services/api';

jest.mock('../services/api', () => ({
  laudoService: {
    buscarPorId: jest.fn(),
    buscarPorVistoria: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
    gerarPDF: jest.fn(),
    download: jest.fn()
  }
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ vistoriaId: '1' })
}));

describe('Página LaudoForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (laudoService.buscarPorVistoria as jest.Mock).mockRejectedValue(new Error('Não encontrado'));
  });

  it('deve renderizar título correto para novo laudo', async () => {
    render(
      <BrowserRouter>
        <LaudoForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Novo Laudo')).toBeInTheDocument();
    });
  });

  it('deve renderizar todas as abas', async () => {
    render(
      <BrowserRouter>
        <LaudoForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dados Gerais')).toBeInTheDocument();
      expect(screen.getByText('1. Dados da Embarcação')).toBeInTheDocument();
      expect(screen.getByText('2. Casco')).toBeInTheDocument();
      expect(screen.getByText('3. Propulsão')).toBeInTheDocument();
      expect(screen.getByText('9-11. Checklists')).toBeInTheDocument();
      expect(screen.getByText('Configurações')).toBeInTheDocument();
    });
  });

  it('deve alternar entre abas ao clicar', async () => {
    render(
      <BrowserRouter>
        <LaudoForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dados Gerais')).toBeInTheDocument();
    });

    const abaEmbarcacao = screen.getByText('1. Dados da Embarcação');
    fireEvent.click(abaEmbarcacao);

    await waitFor(() => {
      expect(screen.getByText('1.1. Inscrição na Capitania dos Portos')).toBeInTheDocument();
    });
  });

  it('deve exibir botão Salvar Rascunho', async () => {
    render(
      <BrowserRouter>
        <LaudoForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const botoes = screen.getAllByText('Salvar Rascunho');
      expect(botoes.length).toBeGreaterThan(0);
    });
  });

  it('deve exibir botão Voltar', async () => {
    render(
      <BrowserRouter>
        <LaudoForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const botoes = screen.getAllByText('Voltar');
      expect(botoes.length).toBeGreaterThan(0);
    });
  });

  it('deve inicializar com versão padrão', async () => {
    render(
      <BrowserRouter>
        <LaudoForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const inputVersao = screen.getByPlaceholderText('Ex: BS 2021-01') as HTMLInputElement;
      expect(inputVersao.value).toBe('BS 2021-01');
    });
  });

  it('deve permitir digitar no campo Nome da Moto Aquática', async () => {
    render(
      <BrowserRouter>
        <LaudoForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      const input = screen.getByPlaceholderText('Ex: Sea Doo RXT X 325') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Yamaha VX' } });
      expect(input.value).toBe('Yamaha VX');
    });
  });

  it('deve carregar laudo existente ao editar', async () => {
    const mockLaudo = {
      id: 1,
      numero_laudo: '251111A',
      versao: 'BS 2021-01',
      nome_moto_aquatica: 'Sea Doo Teste',
      proprietario: 'João Silva'
    };

    (laudoService.buscarPorId as jest.Mock).mockResolvedValue(mockLaudo);

    const { useParams } = require('react-router-dom');
    useParams.mockReturnValue({ id: '1' });

    render(
      <BrowserRouter>
        <LaudoForm />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(laudoService.buscarPorId).toHaveBeenCalledWith(1);
    });
  });
});

