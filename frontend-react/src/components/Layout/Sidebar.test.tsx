import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessControl } from '../../hooks/useAccessControl';

// Mocks
jest.mock('../../contexts/AuthContext');
jest.mock('../../hooks/useAccessControl');

const mockUseAuth = useAuth as jest.Mock;
const mockUseAccessControl = useAccessControl as jest.Mock;

const mockAdminMenuItems = [
  { path: '/', label: 'Dashboard', icon: 'Home' },
  { path: '/vistorias', label: 'Vistorias', icon: 'ClipboardCheck' },
  { path: '/embarcacoes', label: 'Embarcações', icon: 'Ship' },
  { path: '/clientes', label: 'Clientes', icon: 'Users' },
  { path: '/usuarios', label: 'Usuários', icon: 'UserCheck' },
];

const mockVistoriadorMenuItems = [
  { path: '/', label: 'Dashboard', icon: 'Home' },
  { path: '/minhas-vistorias', label: 'Minhas Vistorias', icon: 'ClipboardCheck' },
];

const renderSidebar = () => {
  return render(
    <BrowserRouter>
      <Sidebar />
    </BrowserRouter>
  );
};

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      usuario: {
        id: 1,
        nome: 'Admin',
        email: 'admin@teste.com',
        NivelAcesso: { id: 1, nome: 'ADMIN' },
      },
    });
    mockUseAccessControl.mockReturnValue({
      getVisibleMenuItems: jest.fn().mockReturnValue(mockAdminMenuItems),
    });
  });

  it('deve renderizar o componente Sidebar', () => {
    renderSidebar();
    
    expect(document.querySelector('nav, aside')).toBeInTheDocument();
  });

  it('deve mostrar links de navegação para admin', () => {
    renderSidebar();
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Vistorias')).toBeInTheDocument();
    expect(screen.getByText('Embarcações')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Usuários')).toBeInTheDocument();
  });

  it('deve ter botão de menu mobile', () => {
    renderSidebar();
    
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('deve abrir menu mobile ao clicar no botão', () => {
    renderSidebar();
    
    const menuButton = screen.getByText('Menu');
    fireEvent.click(menuButton);
    
    // Verificar se a classe 'open' foi adicionada
    const sidebar = document.querySelector('aside');
    expect(sidebar).toHaveClass('open');
  });

  it('deve fechar menu mobile ao clicar em um link', () => {
    renderSidebar();
    
    // Abrir menu
    const menuButton = screen.getByText('Menu');
    fireEvent.click(menuButton);
    
    // Clicar em um link
    const dashboardLink = screen.getByText('Dashboard');
    fireEvent.click(dashboardLink);
    
    // Menu deve fechar
    const sidebar = document.querySelector('aside');
    expect(sidebar).not.toHaveClass('open');
  });

  describe('Para Vistoriador', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        usuario: {
          id: 2,
          nome: 'Vistoriador',
          email: 'vistoriador@teste.com',
          NivelAcesso: { id: 2, nome: 'VISTORIADOR' },
        },
      });
      mockUseAccessControl.mockReturnValue({
        getVisibleMenuItems: jest.fn().mockReturnValue(mockVistoriadorMenuItems),
      });
    });

    it('deve renderizar sidebar para vistoriador', () => {
      renderSidebar();
      
      expect(document.querySelector('nav, aside')).toBeInTheDocument();
    });

    it('deve mostrar apenas links permitidos para vistoriador', () => {
      renderSidebar();
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Minhas Vistorias')).toBeInTheDocument();
      expect(screen.queryByText('Usuários')).not.toBeInTheDocument();
    });
  });
});

