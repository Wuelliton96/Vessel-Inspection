import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { Ship, Eye, EyeOff, LogIn, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { validarCPF, limparCPF, mascaraCPF } from '../utils/validators';

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
  border: 2px solid #fca5a5;
  color: #dc2626;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  animation: fadeIn 0.3s ease-in;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1);
  
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
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info' | null>(null);

  const { login, isAuthenticated, usuario } = useAuth();
  const navigate = useNavigate();

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

  // Verificar se o usuário precisa atualizar senha após login
  useEffect(() => {
    if (isAuthenticated && usuario && usuario.deveAtualizarSenha === true) {
      // Redirecionar para página de atualização de senha
      navigate('/password-update');
    }
  }, [isAuthenticated, usuario, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    clearErrorMessages();

    // Validações básicas no frontend
    if (!cpf.trim()) {
      setError('Por favor, digite seu CPF');
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

    // Validar CPF
    const cpfLimpo = limparCPF(cpf);
    if (!validarCPF(cpfLimpo)) {
      setError('Por favor, digite um CPF válido');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      await login(cpfLimpo, senha);
      
      // O useEffect vai verificar se precisa atualizar senha
      // Se não precisar, continuar normalmente
      const usuarioAtual = JSON.parse(localStorage.getItem('usuario') || '{}');
      if (!usuarioAtual.deveAtualizarSenha) {
      setError('Login realizado com sucesso! Redirecionando...');
      setMessageType('success');
      }
      // Se precisar atualizar, o modal será aberto pelo useEffect
      
    } catch (err: any) {
      console.error('Erro no login:', err);
      console.error('Erro completo:', JSON.stringify(err, null, 2));
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      
      // Tratar mensagens de erro específicas
      let errorMessage = 'Erro ao fazer login';
      let messageType: 'error' | 'info' = 'error';
      
      // Verificar se é erro de resposta HTTP
      if (err.response?.data) {
        const backendError = err.response.data;
        console.log('Erro do backend:', backendError);
        
        // Priorizar a mensagem detalhada do backend
        if (backendError.message) {
          errorMessage = backendError.message;
        } else if (backendError.error) {
          errorMessage = backendError.error;
        }

        // Tratar códigos específicos
        if (backendError.code === 'CPF_NAO_ENCONTRADO' || backendError.code === 'EMAIL_NAO_ENCONTRADO') {
          errorMessage = 'CPF não encontrado no sistema. Verifique se digitou corretamente ou entre em contato com o administrador.';
          messageType = 'error';
        } else if (backendError.code === 'SENHA_INCORRETA') {
          errorMessage = 'Senha incorreta. Por favor, verifique sua senha e tente novamente. Se esqueceu sua senha, entre em contato com o administrador.';
          messageType = 'error';
        } else if (backendError.code === 'CAMPOS_OBRIGATORIOS' || backendError.code === 'VALIDACAO_FALHOU') {
          // Pegar a mensagem específica dos detalhes
          if (backendError.details && backendError.details.length > 0) {
            errorMessage = backendError.details[0].msg || backendError.message || 'Por favor, verifique os dados informados.';
          } else {
            errorMessage = backendError.message || 'Por favor, preencha o CPF e a senha para continuar.';
          }
          messageType = 'error';
        } else if (backendError.code === 'CPF_INVALIDO' || backendError.code === 'EMAIL_INVALIDO') {
          errorMessage = 'Por favor, digite um CPF válido.';
          messageType = 'error';
        }
        
        // Verificar se é erro de validação (cpf deve ter 11 dígitos, etc)
        if (backendError.details && Array.isArray(backendError.details)) {
          const cpfError = backendError.details.find((d: any) => d.param === 'cpf');
          if (cpfError) {
            errorMessage = cpfError.msg || 'CPF inválido. Verifique se digitou corretamente.';
          }
        }
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
              <AlertCircle size={20} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  {error.includes('CPF não encontrado') || error.includes('Email não encontrado') ? 'CPF não encontrado' : 
                   error.includes('Senha incorreta') ? 'Senha incorreta' : 
                   error.includes('preencha') ? 'Campos obrigatórios' :
                   error.includes('CPF válido') || error.includes('email válido') ? 'CPF inválido' :
                   'Erro no login'}
                </div>
                <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
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
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              type="text"
              value={cpf}
              onChange={(e) => {
                const valor = mascaraCPF(e.target.value);
                setCpf(valor);
                clearErrorMessages();
              }}
              required
              placeholder="000.000.000-00"
              maxLength={14}
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
            fontSize: '0.85rem', 
            color: '#6b7280',
            lineHeight: '1.6',
            padding: '1rem',
            background: 'rgba(59, 130, 246, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(59, 130, 246, 0.1)'
          }}>
            <div style={{ marginBottom: '0.75rem', fontWeight: '600', color: '#374151' }}>
              Problemas para entrar??????
            </div>
            <div style={{ fontSize: '0.8rem' }}>
              <div style={{ marginBottom: '0.25rem' }}>• Verifique se o CPF está digitado corretamente</div>
              <div style={{ marginBottom: '0.25rem' }}>• Confirme se a senha está correta (diferencia maiúsculas/minúsculas)</div>
              <div style={{ marginBottom: '0.25rem' }}>• Se esqueceu sua senha, entre em contato com o administrador</div>
              <div>• Caso o problema persista, solicite suporte ao administrador do sistema</div>
            </div>
          </div>
        </Form>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;