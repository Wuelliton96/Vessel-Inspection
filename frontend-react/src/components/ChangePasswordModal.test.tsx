import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChangePasswordModal from './ChangePasswordModal';

const mockOnClose = jest.fn();
const mockOnSubmit = jest.fn();

const renderModal = (props = {}) => {
  return render(
    <ChangePasswordModal
      isOpen={true}
      onClose={mockOnClose}
      onSubmit={mockOnSubmit}
      loading={false}
      {...props}
    />
  );
};

describe('ChangePasswordModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar quando isOpen é true', () => {
    renderModal();
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('não deve renderizar quando isOpen é false', () => {
    renderModal({ isOpen: false });
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deve ter campo de senha atual', () => {
    renderModal();
    
    expect(screen.getByLabelText(/senha atual/i)).toBeInTheDocument();
  });

  it('deve ter campo de nova senha', () => {
    renderModal();
    
    expect(screen.getByLabelText(/nova senha/i)).toBeInTheDocument();
  });

  it('deve ter campo de confirmação de senha', () => {
    renderModal();
    
    expect(screen.getByLabelText(/confirmar/i)).toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no botão cancelar', () => {
    renderModal();
    
    const cancelButton = screen.getByText(/cancelar/i);
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('deve mostrar erro quando senhas não coincidem', async () => {
    renderModal();
    
    const senhaAtual = screen.getByLabelText(/senha atual/i);
    const novaSenha = screen.getByLabelText(/nova senha/i);
    const confirmarSenha = screen.getByLabelText(/confirmar/i);
    
    fireEvent.change(senhaAtual, { target: { value: 'senhaatual123' } });
    fireEvent.change(novaSenha, { target: { value: 'novasenha123' } });
    fireEvent.change(confirmarSenha, { target: { value: 'senhadiferente123' } });
    
    const submitButton = screen.getByRole('button', { name: /salvar|alterar/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/não coincidem/i)).toBeInTheDocument();
    });
  });

  it('deve desabilitar botão quando loading é true', () => {
    renderModal({ loading: true });
    
    const submitButton = screen.getByRole('button', { name: /salvar|alterar|carregando|alterando/i });
    expect(submitButton).toBeDisabled();
  });

  it('deve chamar onSubmit com senhas válidas', async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    renderModal();
    
    const senhaAtual = screen.getByLabelText(/senha atual/i);
    const novaSenha = screen.getByLabelText(/nova senha/i);
    const confirmarSenha = screen.getByLabelText(/confirmar/i);
    
    fireEvent.change(senhaAtual, { target: { value: 'senhaatual123' } });
    fireEvent.change(novaSenha, { target: { value: 'novasenha123' } });
    fireEvent.change(confirmarSenha, { target: { value: 'novasenha123' } });
    
    const submitButton = screen.getByRole('button', { name: /salvar|alterar/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith('senhaatual123', 'novasenha123');
    });
  });
});
