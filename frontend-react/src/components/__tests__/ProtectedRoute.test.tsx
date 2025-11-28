import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthContext } from '../../contexts/AuthContext';
import { AuthContextType } from '../../types';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: ({ to }: { to: string }) => {
    mockNavigate(to);
    return <div data-testid="navigate">Redirecting to {to}</div>;
  },
}));

describe('ProtectedRoute', () => {
  const mockAuthContextValue: AuthContextType = {
    isAuthenticated: false,
    loading: false,
    usuario: null,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    updatePassword: jest.fn(),
  };

  const renderWithAuth = (authValue: Partial<AuthContextType> = {}) => {
    const contextValue = { ...mockAuthContextValue, ...authValue };
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={contextValue as AuthContextType}>
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  it('deve renderizar conteúdo quando usuário está autenticado', () => {
    renderWithAuth({ isAuthenticated: true });

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('deve mostrar loading quando está carregando', () => {
    renderWithAuth({ loading: true });

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('deve redirecionar para login quando usuário não está autenticado', () => {
    renderWithAuth({ isAuthenticated: false, loading: false });

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText('Redirecting to /login')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('não deve renderizar conteúdo quando não está autenticado', () => {
    renderWithAuth({ isAuthenticated: false, loading: false });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('deve renderizar conteúdo após loading quando autenticado', () => {
    const { rerender } = renderWithAuth({ loading: true });

    expect(screen.getByText('Carregando...')).toBeInTheDocument();

    // Simular fim do loading e autenticação
    rerender(
      <BrowserRouter>
        <AuthContext.Provider
          value={{ ...mockAuthContextValue, isAuthenticated: true, loading: false } as AuthContextType}
        >
          <ProtectedRoute>
            <div data-testid="protected-content">Protected Content</div>
          </ProtectedRoute>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});

