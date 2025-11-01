import React, { useState } from 'react';
import styled from 'styled-components';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9); /* Fundo mais opaco para não mostrar nada atrás */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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
  font-size: 1.5rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin: 0.5rem 0 1.5rem 0;
  font-size: 0.9rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
`;

const PasswordContainer = styled.div`
  position: relative;
`;

const Input = styled.input<{ hasError?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid ${props => props.hasError ? '#ef4444' : '#e5e7eb'};
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.hasError ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 0 0 3px ${props => props.hasError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
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
  
  &:hover {
    color: #374151;
  }
`;

const CriteriaList = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.5rem;
`;

const CriteriaTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #374151;
`;

const CriteriaItem = styled.div<{ isValid: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
  color: ${props => props.isValid ? '#10b981' : '#6b7280'};
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => {
    if (props.variant === 'primary') {
      return `
        background: #3b82f6;
        color: white;
        
        &:hover:not(:disabled) {
          background: #2563eb;
        }
        
        &:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `;
    } else {
      return `
        background: #f3f4f6;
        color: #374151;
        
        &:hover {
          background: #e5e7eb;
        }
      `;
    }
  }}
`;

interface PasswordUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void>;
  loading?: boolean;
}

const PasswordUpdateModal: React.FC<PasswordUpdateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

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

  const passwordValidation = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordValidation.isValid) {
      setError('Senha não atende aos critérios obrigatórios');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    try {
      await onSubmit(password);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar senha');
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <Header>
          <Lock size={24} color="#3b82f6" />
          <div>
            <Title>Atualização Obrigatória de Senha</Title>
            <Subtitle>
              Por motivos de segurança, você deve atualizar sua senha antes de continuar.
            </Subtitle>
          </div>
        </Header>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="password">Nova Senha</Label>
            <PasswordContainer>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hasError={!!error && password.length > 0}
                required
                placeholder="Digite sua nova senha"
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </PasswordToggle>
            </PasswordContainer>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <PasswordContainer>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                hasError={!!error && confirmPassword.length > 0}
                required
                placeholder="Confirme sua nova senha"
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </PasswordToggle>
            </PasswordContainer>
          </FormGroup>

          <CriteriaList>
            <CriteriaTitle>Critérios obrigatórios:</CriteriaTitle>
            <CriteriaItem isValid={passwordValidation.criteria.length}>
              {passwordValidation.criteria.length ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
              Pelo menos 8 caracteres
            </CriteriaItem>
            <CriteriaItem isValid={passwordValidation.criteria.uppercase}>
              {passwordValidation.criteria.uppercase ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
              Uma letra maiúscula
            </CriteriaItem>
            <CriteriaItem isValid={passwordValidation.criteria.lowercase}>
              {passwordValidation.criteria.lowercase ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
              Uma letra minúscula
            </CriteriaItem>
            <CriteriaItem isValid={passwordValidation.criteria.number}>
              {passwordValidation.criteria.number ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
              Um número
            </CriteriaItem>
            <CriteriaItem isValid={passwordValidation.criteria.special}>
              {passwordValidation.criteria.special ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
              Um caractere especial
            </CriteriaItem>
          </CriteriaList>

          {error && (
            <ErrorMessage>
              <AlertCircle size={16} />
              {error}
            </ErrorMessage>
          )}

          <ButtonGroup>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Sair
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !passwordValidation.isValid || password !== confirmPassword}
            >
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PasswordUpdateModal;
