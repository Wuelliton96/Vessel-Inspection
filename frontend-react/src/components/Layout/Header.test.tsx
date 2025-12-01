import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';

// Mocks
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/api');

const mockUseAuth = useAuth as jest.Mock;
const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockLogout = jest.fn();

const renderHeader = () => {
  return render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      usuario: {
        id: 1,
        nome: 'Admin',
        email: 'admin@teste.com',
        nivelAcessoId: 1,
        nivelAcesso: { id: 1, nome: 'ADMIN' },
      },
      logout: mockLogout,
    });
    mockAuthService.changePassword = jest.fn().mockResolvedValue({});
  });

  it('deve renderizar o componente Header', () => {
    renderHeader();
    
    expect(document.querySelector('header')).toBeInTheDocument();
  });

  it('deve mostrar nome do usuário', () => {
    renderHeader();
    
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });

  it('deve mostrar título do sistema', () => {
    renderHeader();
    
    expect(screen.getByText(/Sistema de Vistorias Náuticas/i)).toBeInTheDocument();
  });

  it('deve mostrar botão de sair', () => {
    renderHeader();
    
    expect(screen.getByText('Sair')).toBeInTheDocument();
  });

  it('deve chamar logout ao clicar em Sair', () => {
    renderHeader();
    
    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
  });

  it('deve mostrar botão de alterar senha', () => {
    renderHeader();
    
    expect(screen.getByText('Alterar Senha')).toBeInTheDocument();
  });

  it('deve abrir modal de alterar senha ao clicar no botão', () => {
    renderHeader();
    
    const alterarSenhaButton = screen.getByText('Alterar Senha');
    fireEvent.click(alterarSenhaButton);
    
    // O modal deve aparecer
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('deve exibir Administrador para usuário admin', () => {
    renderHeader();
    
    expect(screen.getByText('Administrador')).toBeInTheDocument();
  });

  describe('Vistoriador', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        usuario: {
          id: 2,
          nome: 'Vistoriador',
          email: 'vistoriador@teste.com',
          nivelAcessoId: 2,
          nivelAcesso: { id: 2, nome: 'VISTORIADOR' },
        },
        logout: mockLogout,
      });
    });

    it('deve exibir Vistoriador para usuário vistoriador', () => {
      renderHeader();
      
      expect(screen.getByText('Vistoriador')).toBeInTheDocument();
    });
  });
});

