/**
 * Testes abrangentes para AuthContext
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { authService } from '../../services/api';

// Mock do authService
jest.mock('../../services/api', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    updatePassword: jest.fn()
  }
}));

// Mock do useInactivityTimeout
jest.mock('../../hooks/useInactivityTimeout', () => ({
  useInactivityTimeout: jest.fn()
}));

// Componente de teste para acessar o contexto
const TestComponent = () => {
  const { usuario, token, login, logout, loading, isAuthenticated, register, updatePassword } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="usuario">{usuario?.nome || 'null'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <button onClick={() => login('12345678901', 'senha123')}>Login</button>
      <button onClick={() => register('Nome', 'email@test.com', 'senha123')}>Register</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => updatePassword('token', 'novaSenha')}>Update Password</button>
    </div>
  );
};

describe('AuthContext', () => {
  const mockUser = {
    id: 1,
    nome: 'Test User',
    email: 'test@example.com',
    cpf: '12345678901',
    nivelAcessoId: 1,
    nivelAcesso: { id: 1, nome: 'ADMIN', descricao: '' },
    ativo: true,
    deveAtualizarSenha: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Estado inicial', () => {
    it('deve começar com loading true e depois false', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('deve começar não autenticado', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
    });

    it('deve restaurar sessão do localStorage', async () => {
      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('usuario', JSON.stringify(mockUser));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('usuario').textContent).toBe('Test User');
      });
    });
  });

  describe('Login', () => {
    it('deve fazer login com sucesso', async () => {
      (authService.login as jest.Mock).mockResolvedValue({
        token: 'new-token',
        usuario: mockUser
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        userEvent.click(screen.getByText('Login'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('usuario').textContent).toBe('Test User');
      });

      expect(localStorage.getItem('token')).toBe('new-token');
      expect(sessionStorage.getItem('justLoggedIn')).toBe('true');
    });

    it('deve lançar erro se login falhar', async () => {
      const error = new Error('Invalid credentials');
      (authService.login as jest.Mock).mockRejectedValue(error);

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        try {
          userEvent.click(screen.getByText('Login'));
        } catch (e) {
          // Erro esperado
        }
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('Register', () => {
    it('deve fazer registro com sucesso', async () => {
      (authService.register as jest.Mock).mockResolvedValue({
        token: 'new-token',
        usuario: mockUser
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        userEvent.click(screen.getByText('Register'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });
    });

    it('deve lançar erro se registro falhar', async () => {
      const error = new Error('Registration failed');
      (authService.register as jest.Mock).mockRejectedValue(error);

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        try {
          userEvent.click(screen.getByText('Register'));
        } catch (e) {
          // Erro esperado
        }
      });

      expect(consoleError).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });

  describe('Logout', () => {
    it('deve fazer logout e limpar dados', async () => {
      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('usuario', JSON.stringify(mockUser));
      sessionStorage.setItem('justLoggedIn', 'true');
      sessionStorage.setItem('newVistoriaAlertDismissed', 'true');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      await act(async () => {
        userEvent.click(screen.getByText('Logout'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('usuario').textContent).toBe('null');
      });

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('usuario')).toBeNull();
      expect(sessionStorage.getItem('justLoggedIn')).toBeNull();
      expect(sessionStorage.getItem('newVistoriaAlertDismissed')).toBeNull();
    });
  });

  describe('useAuth hook', () => {
    it('deve lançar erro quando usado fora do provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleError.mockRestore();
    });
  });

  describe('isAuthenticated', () => {
    it('deve ser true quando token e usuario existem', async () => {
      localStorage.setItem('token', 'token');
      localStorage.setItem('usuario', JSON.stringify(mockUser));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });
    });

    it('deve ser false quando token não existe', async () => {
      localStorage.setItem('usuario', JSON.stringify(mockUser));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
    });

    it('deve ser false quando usuario não existe', async () => {
      localStorage.setItem('token', 'token');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
    });
  });
});

