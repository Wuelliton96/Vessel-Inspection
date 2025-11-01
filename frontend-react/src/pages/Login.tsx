import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { Ship, Eye, EyeOff, LogIn, AlertCircle, CheckCircle, Info } from 'lucide-react';

const LoginContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
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

const LoginCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  padding: 4rem;
  width: 100%;
  max-width: 500px;
  position: relative;
  z-index: 2;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
  color: #1e40af;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #1f2937;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #6b7280;
  margin-bottom: 2.5rem;
  font-size: 1.1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
`;

const Input = styled.input`
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    background: white;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const PasswordInput = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PasswordField = styled.input`
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.9);
  padding-right: 3rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    background: white;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #374151;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  color: white;
  border: none;
  padding: 1.25rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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
  animation: fadeIn 0.3s ease-in;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
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
`;

const InfoMessage = styled.div`
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info' | null>(null);

  const { login, isAuthenticated } = useAuth();

  const clearErrorMessages = () => {
    setError('');
    setMessageType(null);
  };

  // Garantir que mensagens de erro não sejam limpas por mudanças de autenticação
  useEffect(() => {
    // Se o usuário não está autenticado e há uma mensagem de erro, mantê-la
    if (!isAuthenticated && error && messageType === 'error') {
      // Manter a mensagem de erro visível
      console.log('Mantendo mensagem de erro visível:', error);
    }
  }, [isAuthenticated, error, messageType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Iniciando processo de login...');
    console.log('Email:', email);
    console.log('Senha:', senha ? '***' : 'vazia');
    
    setLoading(true);
    clearErrorMessages();

    // Validações básicas no frontend
    if (!email.trim()) {
      setError('Por favor, digite seu email');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (!senha.trim()) {
      setError('Por favor, digite sua senha');
      setMessageType('error');
      setLoading(false);
      return;
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, digite um email válido');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      console.log('Chamando função login...');
      await login(email, senha);
      console.log('Login realizado com sucesso!');
      
      // Mostrar mensagem de sucesso brevemente antes do redirecionamento
      setError('Login realizado com sucesso! Redirecionando...');
      setMessageType('success');
      
      // Não fazer mais nada aqui - deixar o sistema redirecionar automaticamente
      
    } catch (err: any) {
      console.error('Erro no login:', err);
      console.error('Erro completo:', JSON.stringify(err, null, 2));
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      
      // Tratar mensagens de erro específicas
      let errorMessage = 'Erro ao fazer login';
      let messageType: 'error' | 'info' = 'error';
      
      // Verificar se é erro de resposta HTTP
      if (err.response?.data?.error) {
        const backendError = err.response.data.error;
        console.log('Erro do backend:', backendError);
        
        if (backendError === 'Email não cadastrado no sistema.') {
          errorMessage = 'Este email não está cadastrado no sistema. Verifique o email ou entre em contato com o administrador.';
          messageType = 'error';
        } else if (backendError === 'Senha incorreta.') {
          errorMessage = 'Senha incorreta. Verifique sua senha e tente novamente.';
          messageType = 'error';
        } else if (backendError === 'Email e senha são obrigatórios.') {
          errorMessage = 'Por favor, preencha todos os campos';
          messageType = 'error';
        } else {
          errorMessage = backendError;
        }
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        if (err.message.includes('Network Error') || err.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          messageType = 'info';
        } else {
          errorMessage = err.message;
        }
      }
      
      console.error('Mensagem de erro final:', errorMessage);
      setError(errorMessage);
      setMessageType(messageType);
      
      // Garantir que o loading seja false quando há erro
      setLoading(false);
      console.log('Processo de login finalizado com erro');
    }
  };

  return (
    <LoginContainer>
      <BackgroundImage />
      <Overlay />
      <LoginCard>
        <Logo>
          <Ship size={32} />
          <div>
            <Title>Sistema de Vistorias Náuticas</Title>
            <Subtitle>Faça login para continuar</Subtitle>
          </div>
        </Logo>

        <Form onSubmit={handleSubmit}>
          {error && messageType === 'error' && (
            <ErrorMessage>
              <AlertCircle size={16} />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {error.includes('email não está cadastrado') ? 'Email não encontrado' : 
                   error.includes('Senha incorreta') ? 'Senha incorreta' : 
                   'Erro no login'}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  {error}
                </div>
              </div>
            </ErrorMessage>
          )}
          
          {error && messageType === 'success' && (
            <SuccessMessage>
              <CheckCircle size={16} />
              {error}
            </SuccessMessage>
          )}
          
          {error && messageType === 'info' && (
            <InfoMessage>
              <Info size={16} />
              {error}
            </InfoMessage>
          )}
          
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearErrorMessages();
              }}
              required
              placeholder="seu@email.com"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="senha">Senha</Label>
            <PasswordInput>
              <PasswordField
                id="senha"
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  clearErrorMessages();
                }}
                required
                placeholder="Sua senha"
              />
              <PasswordToggle
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </PasswordToggle>
            </PasswordInput>
          </FormGroup>

          <Button type="submit" disabled={loading}>
            <LogIn size={20} />
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
          
          {/* Mensagem de ajuda */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '1rem', 
            fontSize: '0.8rem', 
            color: '#6b7280',
            lineHeight: '1.4'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Precisa de ajuda?</strong>
            </div>
            <div>
              • Verifique se o email está correto<br/>
              • Confirme se a senha está digitada corretamente<br/>
              • Entre em contato com o administrador se necessário
            </div>
          </div>
        </Form>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;