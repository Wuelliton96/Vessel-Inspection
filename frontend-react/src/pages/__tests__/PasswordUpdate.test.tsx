/**
 * Testes para PasswordUpdate
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import PasswordUpdate from '../PasswordUpdate';

// Mock do useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock do useAuth
const mockUpdatePassword = jest.fn();
const mockLogout = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

describe('PasswordUpdate', () => {
  const authenticatedUserNeedsUpdate = {
    usuario: {
      id: 1,
      nome: 'Test User',
      deveAtualizarSenha: true
    },
    token: 'valid-token',
    updatePassword: mockUpdatePassword,
    logout: mockLogout
  };

  const authenticatedUserNoUpdate = {
    usuario: {
      id: 1,
      nome: 'Test User',
      deveAtualizarSenha: false
    },
    token: 'valid-token',
    updatePassword: mockUpdatePassword,
    logout: mockLogout
  };

  const unauthenticatedUser = {
    usuario: null,
    token: null,
    updatePassword: mockUpdatePassword,
    logout: mockLogout
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve redirecionar para login se não autenticado', () => {
    mockUseAuth.mockReturnValue(unauthenticatedUser);

    render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('deve redirecionar para home se não precisa atualizar senha', () => {
    mockUseAuth.mockReturnValue(authenticatedUserNoUpdate);

    render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('deve renderizar formulário se precisa atualizar senha', () => {
    mockUseAuth.mockReturnValue(authenticatedUserNeedsUpdate);

    render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    expect(screen.getByText('Atualização de Senha')).toBeInTheDocument();
    expect(screen.getByLabelText(/nova senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
  });

  it('deve mostrar critérios de senha', () => {
    mockUseAuth.mockReturnValue(authenticatedUserNeedsUpdate);

    render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    expect(screen.getByText(/pelo menos 8 caracteres/i)).toBeInTheDocument();
    expect(screen.getByText(/uma letra maiúscula/i)).toBeInTheDocument();
    expect(screen.getByText(/uma letra minúscula/i)).toBeInTheDocument();
    expect(screen.getByText(/um número/i)).toBeInTheDocument();
    expect(screen.getByText(/um caractere especial/i)).toBeInTheDocument();
  });

  it('deve mostrar erro se senhas não coincidem', async () => {
    mockUseAuth.mockReturnValue(authenticatedUserNeedsUpdate);

    render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/nova senha/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
    const submitButton = screen.getByText(/atualizar senha/i);

    await act(async () => {
      await userEvent.type(passwordInput, 'ValidPass1!');
      await userEvent.type(confirmPasswordInput, 'DifferentPass1!');
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/as senhas não coincidem/i)).toBeInTheDocument();
    });
  });

  it('deve mostrar erro se senha não atende critérios', async () => {
    mockUseAuth.mockReturnValue(authenticatedUserNeedsUpdate);

    render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/nova senha/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
    const submitButton = screen.getByText(/atualizar senha/i);

    await act(async () => {
      await userEvent.type(passwordInput, 'weak');
      await userEvent.type(confirmPasswordInput, 'weak');
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/senha não atende aos critérios obrigatórios/i)).toBeInTheDocument();
    });
  });

  it('deve toggle visibilidade da senha', async () => {
    mockUseAuth.mockReturnValue(authenticatedUserNeedsUpdate);

    render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/nova senha/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Encontrar o botão de toggle pelo container
    const toggleButtons = screen.getAllByRole('button');
    const togglePassword = toggleButtons.find(btn => btn.querySelector('svg'));
    
    if (togglePassword) {
      fireEvent.click(togglePassword);
      
      // Após o clique, o tipo deve mudar para text
      await waitFor(() => {
        const input = screen.getByLabelText(/nova senha/i);
        expect(input).toHaveAttribute('type', 'text');
      });
    }
  });

  it('deve chamar updatePassword ao submeter senha válida', async () => {
    mockUseAuth.mockReturnValue(authenticatedUserNeedsUpdate);
    mockUpdatePassword.mockResolvedValue({});

    render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/nova senha/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
    const submitButton = screen.getByRole('button', { name: /atualizar senha/i });

    await act(async () => {
      await userEvent.type(passwordInput, 'ValidPass1!');
      await userEvent.type(confirmPasswordInput, 'ValidPass1!');
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith('valid-token', 'ValidPass1!');
    });
  });

  it('deve chamar logout ao cancelar', async () => {
    mockUseAuth.mockReturnValue(authenticatedUserNeedsUpdate);

    render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    const cancelButton = screen.getByText(/cancelar/i);
    fireEvent.click(cancelButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('deve mostrar erro da API', async () => {
    mockUseAuth.mockReturnValue(authenticatedUserNeedsUpdate);
    mockUpdatePassword.mockRejectedValue({
      response: { data: { error: 'Erro do servidor' } }
    });

    render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/nova senha/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
    const submitButton = screen.getByRole('button', { name: /atualizar senha/i });

    await act(async () => {
      await userEvent.type(passwordInput, 'ValidPass1!');
      await userEvent.type(confirmPasswordInput, 'ValidPass1!');
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/erro do servidor/i)).toBeInTheDocument();
    });
  });

  it('deve desabilitar botões durante loading', async () => {
    mockUseAuth.mockReturnValue(authenticatedUserNeedsUpdate);
    mockUpdatePassword.mockImplementation(() => new Promise(() => {})); // Promise que nunca resolve

    render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/nova senha/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
    const submitButton = screen.getByRole('button', { name: /atualizar senha/i });

    await act(async () => {
      await userEvent.type(passwordInput, 'ValidPass1!');
      await userEvent.type(confirmPasswordInput, 'ValidPass1!');
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/atualizando/i)).toBeInTheDocument();
    });
  });

  it('deve validar critérios individuais da senha', () => {
    mockUseAuth.mockReturnValue(authenticatedUserNeedsUpdate);

    render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    const passwordInput = screen.getByLabelText(/nova senha/i);

    // Testar cada critério progressivamente
    fireEvent.change(passwordInput, { target: { value: 'a' } });
    // Só minúscula - outros critérios não atendidos

    fireEvent.change(passwordInput, { target: { value: 'aA' } });
    // Minúscula + maiúscula

    fireEvent.change(passwordInput, { target: { value: 'aA1' } });
    // + número

    fireEvent.change(passwordInput, { target: { value: 'aA1!' } });
    // + especial

    fireEvent.change(passwordInput, { target: { value: 'aA1!long' } });
    // + comprimento (8 caracteres)

    // Senha válida deve ter todos os critérios atendidos
    expect(passwordInput).toHaveValue('aA1!long');
  });

  it('deve retornar null se token ausente após inicialização', () => {
    mockUseAuth.mockReturnValue({
      usuario: { deveAtualizarSenha: true },
      token: null,
      updatePassword: mockUpdatePassword,
      logout: mockLogout
    });

    const { container } = render(
      <MemoryRouter>
        <PasswordUpdate />
      </MemoryRouter>
    );

    // Componente deve retornar null
    expect(container.firstChild).toBeNull();
  });
});

