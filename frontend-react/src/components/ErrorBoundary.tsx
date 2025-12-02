import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  padding: 2rem;
`;

const ErrorCard = styled.div`
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  padding: 3rem;
  max-width: 600px;
  width: 100%;
  text-align: center;
`;

const IconContainer = styled.div`
  width: 80px;
  height: 80px;
  background: #fef2f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  color: #991b1b;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  ${props => props.variant === 'primary' ? `
    background: #dc2626;
    color: white;
    
    &:hover {
      background: #b91c1c;
    }
  ` : `
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  `}
`;

const ErrorDetails = styled.details`
  margin-top: 2rem;
  text-align: left;
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
`;

const ErrorSummary = styled.summary`
  cursor: pointer;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 600;
  
  &:hover {
    color: #374151;
  }
`;

const ErrorStack = styled.pre`
  margin-top: 1rem;
  padding: 1rem;
  background: #1f2937;
  color: #f3f4f6;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log do erro para debug (em producao, enviar para servico de monitoramento)
    console.error('[ErrorBoundary] Erro capturado:', error);
    console.error('[ErrorBoundary] Info do componente:', errorInfo);
  }

  handleReload = (): void => {
    globalThis.location.reload();
  };

  handleGoHome = (): void => {
    globalThis.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Se um fallback customizado foi fornecido, usar ele
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrao
      return (
        <ErrorContainer>
          <ErrorCard>
            <IconContainer>
              <AlertTriangle size={40} color="#dc2626" />
            </IconContainer>
            
            <Title>Ops! Algo deu errado</Title>
            
            <Message>
              Ocorreu um erro inesperado na aplicacao. 
              Isso pode ter sido causado por um problema de conexao, 
              dados invalidos ou um erro temporario do sistema.
            </Message>
            
            <ButtonGroup>
              <Button variant="primary" onClick={this.handleReload}>
                <RefreshCw size={18} />
                Recarregar Pagina
              </Button>
              <Button variant="secondary" onClick={this.handleGoHome}>
                <Home size={18} />
                Ir para Inicio
              </Button>
            </ButtonGroup>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <ErrorDetails>
                <ErrorSummary>Detalhes do erro (desenvolvimento)</ErrorSummary>
                <ErrorStack>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </ErrorStack>
              </ErrorDetails>
            )}
          </ErrorCard>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

