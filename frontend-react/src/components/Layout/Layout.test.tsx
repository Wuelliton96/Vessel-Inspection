import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import { useAuth } from '../../contexts/AuthContext';

// Mocks
jest.mock('../../contexts/AuthContext');

const mockUseAuth = useAuth as jest.Mock;

const renderLayout = () => {
  return render(
    <BrowserRouter>
      <Layout>
        <div data-testid="child-content">Conteúdo filho</div>
      </Layout>
    </BrowserRouter>
  );
};

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      usuario: {
        id: 1,
        nome: 'Admin',
        email: 'admin@teste.com',
        NivelAcesso: { id: 1, nome: 'ADMIN' },
      },
      logout: jest.fn(),
    });
  });

  it('deve renderizar o componente Layout', () => {
    renderLayout();
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('deve renderizar o conteúdo filho', () => {
    renderLayout();
    
    expect(screen.getByText('Conteúdo filho')).toBeInTheDocument();
  });
});

