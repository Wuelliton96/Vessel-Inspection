/**
 * Testes para ProtectedRoute.tsx
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

// Mock do useAuth
const mockUseAuth = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve mostrar loading quando está carregando', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('deve redirecionar para login quando não autenticado', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route 
            path="/protected" 
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('deve renderizar children quando autenticado', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
  });

  it('deve renderizar múltiplos children corretamente', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>First Child</div>
          <div>Second Child</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
  });

  it('loading deve ter estilos corretos', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    const loadingElement = screen.getByText('Carregando...');
    expect(loadingElement).toHaveStyle({
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    });
  });
});
