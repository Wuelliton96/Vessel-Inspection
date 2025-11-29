import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { useAuth } from '../contexts/AuthContext';
import { validarCPF, limparCPF, mascaraCPF } from '../utils/validators';

// Mock dos módulos
jest.mock('../contexts/AuthContext');
jest.mock('../utils/validators');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock dos ícones do lucide-react
jest.mock('lucide-react', () => ({
  Ship: () => <div data-testid="ship-icon">Ship</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  EyeOff: () => <div data-testid="eye-off-icon">EyeOff</div>,
  LogIn: () => <div data-testid="login-icon">LogIn</div>,
  AlertCircle: () => <div data-testid="alert-icon">AlertCircle</div>,
  CheckCircle: () => <div data-testid="check-icon">CheckCircle</div>,
  Info: () => <div data-testid="info-icon">Info</div>,
  Loader2: () => <div data-testid="loader-icon">Loader2</div>,
}));

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      usuario: null,
    });

    (validarCPF as jest.Mock).mockImplementation((cpf: string) => {
      return cpf.length === 11 && /^\d+$/.test(cpf);
    });

    (limparCPF as jest.Mock).mockImplementation((cpf: string) => {
      return cpf.replaceAll(/\D/g, '');
    });

    (mascaraCPF as jest.Mock).mockImplementation((cpf: string) => {
      const cleaned = cpf.replaceAll(/\D/g, '');
      if (cleaned.length <= 11) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      }
      return cpf;
    });
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  describe('Renderização inicial', () => {
    test('deve renderizar o formulário de login', () => {
      renderLogin();
      
      expect(screen.getByText('Sistema de Vistorias Náuticas')).toBeInTheDocument();
      expect(screen.getByText('Faça login para continuar')).toBeInTheDocument();
      expect(screen.getByLabelText('CPF')).toBeInTheDocument();
      expect(screen.getByLabelText('Senha')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    test('deve renderizar campos vazios inicialmente', () => {
      renderLogin();
      
      const cpfInput = screen.getByLabelText('CPF');
      const senhaInput = screen.getByLabelText('Senha');
      
      expect(cpfInput).toHaveValue('');
      expect(senhaInput).toHaveValue('');
    });

    test('deve renderizar o ícone do navio', () => {
      renderLogin();
      expect(screen.getByTestId('ship-icon')).toBeInTheDocument();
    });
  });

  describe('Interação com campos', () => {
    test('deve atualizar o campo CPF quando digitado', () => {
      renderLogin();
      
      const cpfInput = screen.getByLabelText('CPF');
      fireEvent.change(cpfInput, { target: { value: '12345678901' } });
      
      expect(mascaraCPF).toHaveBeenCalled();
      expect(cpfInput).toHaveValue('12345678901');
    });

    test('deve atualizar o campo senha quando digitado', () => {
      renderLogin();
      
      const senhaInput = screen.getByLabelText('Senha');
      fireEvent.change(senhaInput, { target: { value: 'senha123' } });
      
      expect(senhaInput).toHaveValue('senha123');
    });

    test('deve alternar visibilidade da senha ao clicar no botão', () => {
      renderLogin();
      
      const senhaInput = screen.getByLabelText('Senha');
      const toggleButton = screen.getByRole('button', { name: '' });
      
      // Inicialmente deve ser password
      expect(senhaInput).toHaveAttribute('type', 'password');
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
      
      // Clicar no toggle
      fireEvent.click(toggleButton);
      
      // Deve mudar para text
      expect(senhaInput).toHaveAttribute('type', 'text');
      expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
    });
  });

  describe('Validação de formulário', () => {
    test('deve mostrar erro quando CPF está vazio', async () => {
      renderLogin();
      
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/por favor, digite seu cpf/i)).toBeInTheDocument();
      });
      
      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('deve mostrar erro quando senha está vazia', async () => {
      renderLogin();
      
      const cpfInput = screen.getByLabelText('CPF');
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      
      fireEvent.change(cpfInput, { target: { value: '12345678901' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/por favor, digite sua senha/i)).toBeInTheDocument();
      });
      
      expect(mockLogin).not.toHaveBeenCalled();
    });

    test('deve mostrar erro quando CPF é inválido', async () => {
      (validarCPF as jest.Mock).mockReturnValue(false);
      
      renderLogin();
      
      const cpfInput = screen.getByLabelText('CPF');
      const senhaInput = screen.getByLabelText('Senha');
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      
      fireEvent.change(cpfInput, { target: { value: '123' } });
      fireEvent.change(senhaInput, { target: { value: 'senha123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/por favor, digite um cpf válido/i)).toBeInTheDocument();
      });
      
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Submissão do formulário', () => {
    test('deve chamar login quando formulário é válido', async () => {
      mockLogin.mockResolvedValue({});
      
      renderLogin();
      
      const cpfInput = screen.getByLabelText('CPF');
      const senhaInput = screen.getByLabelText('Senha');
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      
      fireEvent.change(cpfInput, { target: { value: '12345678901' } });
      fireEvent.change(senhaInput, { target: { value: 'senha123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('12345678901', 'senha123');
      });
    });

    test('deve mostrar loading durante o login', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderLogin();
      
      const cpfInput = screen.getByLabelText('CPF');
      const senhaInput = screen.getByLabelText('Senha');
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      
      fireEvent.change(cpfInput, { target: { value: '12345678901' } });
      fireEvent.change(senhaInput, { target: { value: 'senha123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/entrando/i)).toBeInTheDocument();
      });
      
      expect(submitButton).toBeDisabled();
    });

    test('deve mostrar mensagem de sucesso após login bem-sucedido', async () => {
      const mockUsuario = { id: 1, nome: 'Teste', deveAtualizarSenha: false };
      mockLogin.mockResolvedValue({});
      
      localStorage.setItem('usuario', JSON.stringify(mockUsuario));
      
      renderLogin();
      
      const cpfInput = screen.getByLabelText('CPF');
      const senhaInput = screen.getByLabelText('Senha');
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      
      fireEvent.change(cpfInput, { target: { value: '12345678901' } });
      fireEvent.change(senhaInput, { target: { value: 'senha123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/login realizado com sucesso/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tratamento de erros', () => {
    test('deve mostrar erro quando login falha', async () => {
      const error = {
        response: {
          data: {
            error: 'CPF ou senha incorretos',
            code: 'SENHA_INCORRETA'
          }
        }
      };
      
      mockLogin.mockRejectedValue(error);
      
      renderLogin();
      
      const cpfInput = screen.getByLabelText('CPF');
      const senhaInput = screen.getByLabelText('Senha');
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      
      fireEvent.change(cpfInput, { target: { value: '12345678901' } });
      fireEvent.change(senhaInput, { target: { value: 'senha123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/senha incorreta/i)).toBeInTheDocument();
      });
    });

    test('deve mostrar erro quando CPF não é encontrado', async () => {
      const error = {
        response: {
          data: {
            error: 'CPF não encontrado',
            code: 'CPF_NAO_ENCONTRADO'
          }
        }
      };
      
      mockLogin.mockRejectedValue(error);
      
      renderLogin();
      
      const cpfInput = screen.getByLabelText('CPF');
      const senhaInput = screen.getByLabelText('Senha');
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      
      fireEvent.change(cpfInput, { target: { value: '12345678901' } });
      fireEvent.change(senhaInput, { target: { value: 'senha123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/cpf não encontrado no sistema/i)).toBeInTheDocument();
      });
    });

    test('deve mostrar erro de conexão quando há problema de rede', async () => {
      const error = {
        message: 'Network Error'
      };
      
      mockLogin.mockRejectedValue(error);
      
      renderLogin();
      
      const cpfInput = screen.getByLabelText('CPF');
      const senhaInput = screen.getByLabelText('Senha');
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      
      fireEvent.change(cpfInput, { target: { value: '12345678901' } });
      fireEvent.change(senhaInput, { target: { value: 'senha123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/erro de conexão/i)).toBeInTheDocument();
      });
    });
  });

  describe('Limpeza de mensagens de erro', () => {
    test('deve limpar erro ao digitar no campo CPF', async () => {
      renderLogin();
      
      const cpfInput = screen.getByLabelText('CPF');
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      
      // Tentar submeter sem CPF
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/por favor, digite seu cpf/i)).toBeInTheDocument();
      });
      
      // Digitar no campo CPF
      fireEvent.change(cpfInput, { target: { value: '12345678901' } });
      
      // Erro deve ser limpo (não deve aparecer mais)
      await waitFor(() => {
        expect(screen.queryByText(/por favor, digite seu cpf/i)).not.toBeInTheDocument();
      });
    });

    test('deve limpar erro ao digitar no campo senha', async () => {
      renderLogin();
      
      const cpfInput = screen.getByLabelText('CPF');
      const senhaInput = screen.getByLabelText('Senha');
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      
      fireEvent.change(cpfInput, { target: { value: '12345678901' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/por favor, digite sua senha/i)).toBeInTheDocument();
      });
      
      // Digitar no campo senha
      fireEvent.change(senhaInput, { target: { value: 'senha123' } });
      
      // Erro deve ser limpo
      await waitFor(() => {
        expect(screen.queryByText(/por favor, digite sua senha/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Mensagens de ajuda', () => {
    test('deve exibir mensagens de ajuda', () => {
      renderLogin();
      
      expect(screen.getByText(/problemas para entrar/i)).toBeInTheDocument();
      expect(screen.getByText(/verifique se o cpf está digitado corretamente/i)).toBeInTheDocument();
      expect(screen.getByText(/confirme se a senha está correta/i)).toBeInTheDocument();
    });
  });
});

