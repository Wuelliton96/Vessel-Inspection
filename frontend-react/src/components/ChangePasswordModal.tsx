import React, { useState } from 'react';
import styled from 'styled-components';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2.5rem;
  width: 90%;
  max-width: 520px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #374151;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  color: #1f2937;
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin: 0 0 2rem 0;
  font-size: 0.95rem;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
`;

const PasswordContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid ${props => props.hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  padding-right: 3rem;
  background: #ffffff;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
  }
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:disabled {
    background: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(:disabled) {
    color: #374151;
    background: rgba(0, 0, 0, 0.05);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const CriteriaList = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.25rem;
  margin-top: 0.5rem;
`;

const CriteriaTitle = styled.h4`
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  color: #374151;
  font-weight: 600;
`;

const CriteriaItem = styled.div<{ isValid: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: ${props => props.isValid ? '#059669' : '#6b7280'};
  font-weight: ${props => props.isValid ? '500' : '400'};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 1rem 2rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  min-width: 120px;
  
  ${props => {
    if (props.variant === 'primary') {
      return `
        background: #3b82f6;
        color: white;
        
        &:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        &:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      `;
    } else {
      return `
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #d1d5db;
        
        &:hover:not(:disabled) {
          background: #e5e7eb;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
      `;
    }
  }}
`;

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
  loading?: boolean;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validatePassword = (pwd: string) => {
    const criteria = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
    
    return {
      isValid: Object.values(criteria).every(Boolean),
      criteria
    };
  };

  const passwordValidation = validatePassword(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError('Senha atual é obrigatória');
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Nova senha não atende aos critérios obrigatórios');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (currentPassword === newPassword) {
      setError('A nova senha deve ser diferente da senha atual');
      return;
    }

    try {
      await onSubmit(currentPassword, newPassword);
      setSuccess('Senha alterada com sucesso!');
      setTimeout(() => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err: any) {
      // Não fechar o modal em caso de erro - manter aberto para o usuário tentar novamente
      const errorResponse = err.response?.data;
      const errorMessage = errorResponse?.message || errorResponse?.error || 'Erro ao alterar senha';
      
      // Mensagens mais específicas baseadas no erro
      if (errorMessage.toLowerCase().includes('atual') || errorMessage.toLowerCase().includes('incorreta')) {
        setError('Senha atual incorreta. Verifique e tente novamente.');
      } else if (errorResponse?.details && Array.isArray(errorResponse.details)) {
        // Se houver detalhes de validação, mostrar os critérios não atendidos
        setError(`Senha não atende aos critérios: ${errorResponse.details.join(', ')}`);
      } else {
        setError(errorMessage);
      }
      
      // Limpar apenas a senha atual em caso de erro, mantendo os outros campos
      setCurrentPassword('');
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <CloseButton onClick={handleClose}>&times;</CloseButton>
        
        <Header>
          <Lock size={24} color="#3b82f6" />
          <div>
            <Title>Alterar Senha</Title>
            <Subtitle>
              Digite sua senha atual e defina uma nova senha segura.
            </Subtitle>
          </div>
        </Header>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <PasswordContainer>
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                hasError={error.includes('atual') && currentPassword.length > 0}
                required
                placeholder="Digite sua senha atual"
                disabled={loading}
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={loading}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </PasswordToggle>
            </PasswordContainer>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="newPassword">Nova Senha</Label>
            <PasswordContainer>
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                hasError={!!error && newPassword.length > 0 && !error.includes('atual')}
                required
                placeholder="Digite sua nova senha"
                disabled={loading}
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={loading}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </PasswordToggle>
            </PasswordContainer>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <PasswordContainer>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                hasError={!!error && confirmPassword.length > 0 && !error.includes('atual')}
                required
                placeholder="Confirme sua nova senha"
                disabled={loading}
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </PasswordToggle>
            </PasswordContainer>
          </FormGroup>

          <CriteriaList>
            <CriteriaTitle>Critérios obrigatórios para nova senha:</CriteriaTitle>
            <CriteriaItem isValid={passwordValidation.criteria.length}>
              {passwordValidation.criteria.length ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              Pelo menos 8 caracteres
            </CriteriaItem>
            <CriteriaItem isValid={passwordValidation.criteria.uppercase}>
              {passwordValidation.criteria.uppercase ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              Uma letra maiúscula
            </CriteriaItem>
            <CriteriaItem isValid={passwordValidation.criteria.lowercase}>
              {passwordValidation.criteria.lowercase ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              Uma letra minúscula
            </CriteriaItem>
            <CriteriaItem isValid={passwordValidation.criteria.number}>
              {passwordValidation.criteria.number ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              Um número
            </CriteriaItem>
            <CriteriaItem isValid={passwordValidation.criteria.special}>
              {passwordValidation.criteria.special ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              Um caractere especial
            </CriteriaItem>
            {newPassword !== '' && (
              <CriteriaItem isValid={newPassword !== currentPassword}>
                {newPassword !== currentPassword ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                Diferente da senha atual
              </CriteriaItem>
            )}
            {confirmPassword !== '' && (
              <CriteriaItem isValid={newPassword === confirmPassword}>
                {newPassword === confirmPassword ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                Senhas coincidem
              </CriteriaItem>
            )}
          </CriteriaList>

          {error && (
            <ErrorMessage>
              <AlertCircle size={16} />
              {error}
            </ErrorMessage>
          )}

          {success && (
            <SuccessMessage>
              <CheckCircle size={16} />
              {success}
            </SuccessMessage>
          )}

          <ButtonGroup>
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !passwordValidation.isValid || newPassword !== confirmPassword || !currentPassword}
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ChangePasswordModal;
