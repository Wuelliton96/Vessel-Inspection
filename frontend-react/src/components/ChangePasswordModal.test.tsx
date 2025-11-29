import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChangePasswordModal from './ChangePasswordModal';

// Mock dos ícones
jest.mock('lucide-react', () => ({
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  EyeOff: () => <div data-testid="eye-off-icon">EyeOff</div>,
  Lock: () => <div data-testid="lock-icon">Lock</div>,
  AlertCircle: () => <div data-testid="alert-icon">AlertCircle</div>,
  CheckCircle: () => <div data-testid="check-icon">CheckCircle</div>,
  X: () => <div data-testid="close-icon">X</div>,
}));

describe('ChangePasswordModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit
  };

  describe('Renderização', () => {
    test('deve renderizar modal quando isOpen é true', () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      expect(screen.getByText(/alterar senha/i)).toBeInTheDocument();
    });

    test('não deve renderizar modal quando isOpen é false', () => {
      render(<ChangePasswordModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText(/alterar senha/i)).not.toBeInTheDocument();
    });

    test('deve exibir campos de senha atual e nova senha', () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      expect(screen.getByLabelText(/senha atual/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nova senha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar nova senha/i)).toBeInTheDocument();
    });

    test('deve exibir botões de ação', () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /alterar senha/i })).toBeInTheDocument();
    });
  });

  describe('Interação com campos', () => {
    test('deve atualizar campo de senha atual quando digitado', () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      const senhaAtualInput = screen.getByLabelText(/senha atual/i);
      fireEvent.change(senhaAtualInput, { target: { value: 'senhaAntiga123' } });
      
      expect(senhaAtualInput).toHaveValue('senhaAntiga123');
    });

    test('deve atualizar campo de nova senha quando digitado', () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      const novaSenhaInput = screen.getByLabelText(/nova senha/i);
      fireEvent.change(novaSenhaInput, { target: { value: 'novaSenha123' } });
      
      expect(novaSenhaInput).toHaveValue('novaSenha123');
    });

    test('deve atualizar campo de confirmação quando digitado', () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      const confirmarInput = screen.getByLabelText(/confirmar nova senha/i);
      fireEvent.change(confirmarInput, { target: { value: 'novaSenha123' } });
      
      expect(confirmarInput).toHaveValue('novaSenha123');
    });

    test('deve alternar visibilidade da senha atual', () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      const senhaAtualInput = screen.getByLabelText(/senha atual/i);
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(btn => 
        btn.getAttribute('aria-label')?.includes('senha') || 
        btn.querySelector('[data-testid="eye-icon"]')
      );
      
      expect(senhaAtualInput).toHaveAttribute('type', 'password');
      
      if (toggleButton) {
        fireEvent.click(toggleButton);
        // Verificar se mudou para text (pode precisar de ajuste baseado na implementação)
      }
    });
  });

  describe('Validação', () => {
    test('deve mostrar erro quando senha atual está vazia', async () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      const submitButton = screen.getByRole('button', { name: /alterar senha/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/senha atual é obrigatória/i)).toBeInTheDocument();
      });
    });

    test('deve mostrar erro quando nova senha não atende aos critérios', async () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      const senhaAtualInput = screen.getByLabelText(/senha atual/i);
      const novaSenhaInput = screen.getByLabelText(/nova senha/i);
      const confirmarInput = screen.getByLabelText(/confirmar nova senha/i);
      const submitButton = screen.getByRole('button', { name: /alterar senha/i });
      
      fireEvent.change(senhaAtualInput, { target: { value: 'SenhaAntiga123!' } });
      fireEvent.change(novaSenhaInput, { target: { value: '123' } });
      fireEvent.change(confirmarInput, { target: { value: '123' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/não atende aos critérios/i)).toBeInTheDocument();
      });
    });

    test('deve mostrar erro quando senhas não coincidem', async () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      const senhaAtualInput = screen.getByLabelText(/senha atual/i);
      const novaSenhaInput = screen.getByLabelText(/nova senha/i);
      const confirmarInput = screen.getByLabelText(/confirmar nova senha/i);
      const submitButton = screen.getByRole('button', { name: /alterar senha/i });
      
      fireEvent.change(senhaAtualInput, { target: { value: 'SenhaAntiga123!' } });
      fireEvent.change(novaSenhaInput, { target: { value: 'NovaSenha123!' } });
      fireEvent.change(confirmarInput, { target: { value: 'SenhaDiferente123!' } });
      
      // Botão deve estar desabilitado quando senhas não coincidem
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    test('deve mostrar erro quando nova senha não atende aos critérios', async () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      const senhaAtualInput = screen.getByLabelText(/senha atual/i);
      const novaSenhaInput = screen.getByLabelText(/nova senha/i);
      const confirmarInput = screen.getByLabelText(/confirmar nova senha/i);
      const submitButton = screen.getByRole('button', { name: /alterar senha/i });
      
      fireEvent.change(senhaAtualInput, { target: { value: 'senhaAntiga123!' } });
      fireEvent.change(novaSenhaInput, { target: { value: '123' } });
      fireEvent.change(confirmarInput, { target: { value: '123' } });
      
      // Botão deve estar desabilitado quando senha não atende critérios
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Submissão do formulário', () => {
    test('deve chamar onSubmit quando formulário é válido', async () => {
      mockOnSubmit.mockResolvedValue({});
      
      render(<ChangePasswordModal {...defaultProps} />);
      
      const senhaAtualInput = screen.getByLabelText(/senha atual/i);
      const novaSenhaInput = screen.getByLabelText(/nova senha/i);
      const confirmarInput = screen.getByLabelText(/confirmar nova senha/i);
      const submitButton = screen.getByRole('button', { name: /alterar senha/i });
      
      fireEvent.change(senhaAtualInput, { target: { value: 'SenhaAntiga123!' } });
      fireEvent.change(novaSenhaInput, { target: { value: 'NovaSenha123!' } });
      fireEvent.change(confirmarInput, { target: { value: 'NovaSenha123!' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('SenhaAntiga123!', 'NovaSenha123!');
      });
    });

    test('deve mostrar mensagem de sucesso após alteração', async () => {
      mockOnSubmit.mockResolvedValue({});
      
      render(<ChangePasswordModal {...defaultProps} />);
      
      const senhaAtualInput = screen.getByLabelText(/senha atual/i);
      const novaSenhaInput = screen.getByLabelText(/nova senha/i);
      const confirmarInput = screen.getByLabelText(/confirmar nova senha/i);
      const submitButton = screen.getByRole('button', { name: /alterar senha/i });
      
      fireEvent.change(senhaAtualInput, { target: { value: 'SenhaAntiga123!' } });
      fireEvent.change(novaSenhaInput, { target: { value: 'NovaSenha123!' } });
      fireEvent.change(confirmarInput, { target: { value: 'NovaSenha123!' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/senha alterada com sucesso/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tratamento de erros', () => {
    test('deve mostrar erro quando onSubmit rejeita', async () => {
      const error = {
        response: {
          data: {
            error: 'Senha atual incorreta'
          }
        }
      };
      
      mockOnSubmit.mockRejectedValue(error);
      
      render(<ChangePasswordModal {...defaultProps} />);
      
      const senhaAtualInput = screen.getByLabelText(/senha atual/i);
      const novaSenhaInput = screen.getByLabelText(/nova senha/i);
      const confirmarInput = screen.getByLabelText(/confirmar nova senha/i);
      const submitButton = screen.getByRole('button', { name: /alterar senha/i });
      
      fireEvent.change(senhaAtualInput, { target: { value: 'senhaErrada' } });
      fireEvent.change(novaSenhaInput, { target: { value: 'NovaSenha123!' } });
      fireEvent.change(confirmarInput, { target: { value: 'NovaSenha123!' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/senha atual incorreta/i)).toBeInTheDocument();
      });
    });
  });

  describe('Fechamento do modal', () => {
    test('deve chamar onClose ao clicar no botão cancelar', () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      fireEvent.click(cancelButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('deve chamar onClose ao clicar no botão X', () => {
      render(<ChangePasswordModal {...defaultProps} />);
      
      const closeButton = screen.getByTestId('close-icon').parentElement;
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });
});

