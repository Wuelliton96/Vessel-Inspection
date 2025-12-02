/**
 * Wrapper de pagina com tratamento de erros
 * Adiciona ErrorBoundary e estados de loading/error a qualquer pagina
 */

import React, { useState, useCallback, ReactNode } from 'react';
import styled from 'styled-components';
import { RefreshCw, Home, AlertTriangle, Loader2 } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

interface PageWrapperProps {
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingMessage?: string;
}

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
  color: #6b7280;
`;

const LoadingSpinner = styled.div`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
`;

const ErrorCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
`;

const ErrorIcon = styled.div`
  width: 64px;
  height: 64px;
  background: #fef2f2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: #dc2626;
`;

const ErrorTitle = styled.h3`
  color: #991b1b;
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
`;

const ErrorMessage = styled.p`
  color: #6b7280;
  margin: 0 0 1.5rem;
  line-height: 1.5;
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

// Componente de Loading
const LoadingState: React.FC<{ message?: string }> = ({ message = 'Carregando...' }) => (
  <LoadingContainer>
    <LoadingSpinner>
      <Loader2 size={40} />
    </LoadingSpinner>
    <p>{message}</p>
  </LoadingContainer>
);

// Componente de Erro
interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <ErrorContainer>
    <ErrorCard>
      <ErrorIcon>
        <AlertTriangle size={32} />
      </ErrorIcon>
      <ErrorTitle>Ops! Algo deu errado</ErrorTitle>
      <ErrorMessage>{error}</ErrorMessage>
      <ButtonGroup>
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            <RefreshCw size={18} />
            Tentar Novamente
          </Button>
        )}
        <Button variant="secondary" onClick={() => globalThis.location.href = '/'}>
          <Home size={18} />
          Ir para Inicio
        </Button>
      </ButtonGroup>
    </ErrorCard>
  </ErrorContainer>
);

// Componente principal
const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  loading = false,
  error = null,
  onRetry,
  loadingMessage = 'Carregando...'
}) => {
  if (loading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
};

/**
 * Hook para gerenciar estado de pagina
 */
export function usePageState() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startLoading = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
  }, []);

  const setPageError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeAsync = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    options?: {
      loadingMessage?: string;
      errorMessage?: string;
    }
  ): Promise<T | null> => {
    startLoading();
    try {
      const result = await asyncFn();
      stopLoading();
      return result;
    } catch (err: any) {
      const message = options?.errorMessage || 
                      err.response?.data?.message || 
                      err.response?.data?.error || 
                      err.message || 
                      'Erro inesperado. Tente novamente.';
      setPageError(message);
      return null;
    }
  }, [startLoading, stopLoading, setPageError]);

  return {
    loading,
    error,
    startLoading,
    stopLoading,
    setPageError,
    clearError,
    executeAsync,
    pageWrapperProps: {
      loading,
      error,
      onRetry: clearError
    }
  };
}

export default PageWrapper;

