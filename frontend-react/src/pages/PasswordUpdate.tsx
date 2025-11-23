import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 9999;
`;

const BackgroundImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 120%;
  height: 100%;
  background-image: url('https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.4;
  animation: slideBackground 30s linear infinite;
  
  @keyframes slideBackground {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-20%);
    }
  }
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(30, 58, 138, 0.8) 0%, rgba(59, 130, 246, 0.8) 100%);
  z-index: 1;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  padding: 3.5rem;
  width: 100%;
  max-width: 550px;
  position: relative;
  z-index: 2;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: slideIn 0.3s ease-out;
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  text-align: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #1e40af;
  margin-bottom: 0.5rem;
`;

const Title = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  text-align: center;
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #6b7280;
  margin: 0 0 2.5rem 0;
  font-size: 1rem;
  line-height: 1.6;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  font-weight: 600;
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
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 0.75rem;
  border-radius: 6px;
`;

const SuccessMessage = styled.div`
  color: #059669;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.75rem;
  border-radius: 6px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.875rem 2.25rem;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  
  ${props => {
    if (props.variant === 'primary') {
      return `
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        
        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.5);
          transform: translateY(-2px);
        }
        
        &:active:not(:disabled) {
          transform: translateY(0);
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
        background: white;
        color: #374151;
        border: 2px solid #e5e7eb;
        
        &:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        
        &:active {
          background: #f3f4f6;
        }
      `;
    }
  }}
`;

const PasswordUpdate: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { usuario, token, updatePassword, logout } = useAuth();
  const navigate = useNavigate();

  // Verificar se o usuário está autenticado e precisa atualizar senha
  useEffect(() => {
    if (!token || !usuario) {
      navigate('/login');
      return;
    }
    
    if (!usuario.deveAtualizarSenha) {
      // Se não precisa atualizar senha, redirecionar para dashboard
      navigate('/');
    }
  }, [token, usuario, navigate]);

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
    setSuccess('');

    if (!passwordValidation.isValid) {
      setError('Senha não atende aos critérios obrigatórios');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (!token) {
      setError('Token não encontrado. Por favor, faça login novamente.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(token, password);
      setSuccess('Senha atualizada com sucesso! Redirecionando...');
      
      // O updatePassword no contexto já atualiza o token e usuário automaticamente
      // Redirecionar para o dashboard após atualização
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao atualizar senha:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Erro ao atualizar senha. Tente novamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    logout();
    navigate('/login');
  };

  // Não renderizar se não estiver autenticado ou não precisar atualizar senha
  if (!token || !usuario || !usuario.deveAtualizarSenha) {
    return null;
  }

  return (
    <Container>
      <BackgroundImage />
      <Overlay />
      <Card>
        <Header>
          <Logo>
            <Lock size={48} color="#3b82f6" style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }} />
          </Logo>
          <div>
            <Title>Atualização de Senha</Title>
            <Subtitle>
              Por motivos de segurança, você deve atualizar sua senha antes de continuar acessando o sistema.
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                hasError={!!error && password.length > 0}
                required
                placeholder="Digite sua nova senha"
                disabled={loading}
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
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
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                hasError={!!error && confirmPassword.length > 0}
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
            <CriteriaTitle>Critérios obrigatórios:</CriteriaTitle>
            <CriteriaItem isValid={passwordValidation.criteria.length}>
              {passwordValidation.criteria.length ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              Pelo menos 8 caracteres
            </CriteriaItem>
            <CriteriaItem isValid={passwordValidation.criteria.uppercase}>
              {passwordValidation.criteria.uppercase ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              Uma letra maiúscula
            </CriteriaItem>
            <CriteriaItem isValid={passwordValidation.criteria.lowercase}>
              {passwordValidation.criteria.lowercase ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              Uma letra minúscula
            </CriteriaItem>
            <CriteriaItem isValid={passwordValidation.criteria.number}>
              {passwordValidation.criteria.number ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              Um número
            </CriteriaItem>
            <CriteriaItem isValid={passwordValidation.criteria.special}>
              {passwordValidation.criteria.special ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              Um caractere especial
            </CriteriaItem>
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
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !passwordValidation.isValid || password !== confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Atualizando...
                </>
              ) : (
                'Atualizar Senha'
              )}
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </ButtonGroup>
        </Form>
      </Card>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
};

export default PasswordUpdate;

