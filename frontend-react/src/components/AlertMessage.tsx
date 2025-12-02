/**
 * Componente de mensagem de alerta padronizado
 * Para exibir erros, sucesso, avisos e informacoes em formularios
 */

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X, RefreshCw } from 'lucide-react';

type AlertType = 'error' | 'success' | 'warning' | 'info';

interface AlertMessageProps {
  message: string;
  type: AlertType;
  onClose?: () => void;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const AlertContainer = styled.div<{ type: AlertType }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  animation: ${fadeIn} 0.3s ease-out;
  margin-bottom: 1rem;
  
  ${props => {
    switch (props.type) {
      case 'error':
        return `
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #991b1b;
        `;
      case 'success':
        return `
          background: #f0fdf4;
          border: 1px solid #86efac;
          color: #166534;
        `;
      case 'warning':
        return `
          background: #fffbeb;
          border: 1px solid #fcd34d;
          color: #92400e;
        `;
      case 'info':
        return `
          background: #eff6ff;
          border: 1px solid #93c5fd;
          color: #1e40af;
        `;
      default:
        return `
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #374151;
        `;
    }
  }}
`;

const IconWrapper = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Message = styled.p`
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

const ActionButton = styled.button<{ type: AlertType }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => {
    switch (props.type) {
      case 'error':
        return `
          background: #dc2626;
          color: white;
          &:hover { background: #b91c1c; }
        `;
      case 'success':
        return `
          background: #16a34a;
          color: white;
          &:hover { background: #15803d; }
        `;
      case 'warning':
        return `
          background: #d97706;
          color: white;
          &:hover { background: #b45309; }
        `;
      case 'info':
        return `
          background: #2563eb;
          color: white;
          &:hover { background: #1d4ed8; }
        `;
      default:
        return `
          background: #4b5563;
          color: white;
          &:hover { background: #374151; }
        `;
    }
  }}
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  background: transparent;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  color: inherit;
  
  &:hover {
    opacity: 1;
  }
`;

const getIcon = (type: AlertType) => {
  const size = 20;
  switch (type) {
    case 'error':
      return <AlertCircle size={size} />;
    case 'success':
      return <CheckCircle size={size} />;
    case 'warning':
      return <AlertTriangle size={size} />;
    case 'info':
      return <Info size={size} />;
    default:
      return <Info size={size} />;
  }
};

const AlertMessage: React.FC<AlertMessageProps> = ({
  message,
  type,
  onClose,
  onRetry,
  showRetry = false,
  className
}) => {
  if (!message) return null;

  return (
    <AlertContainer type={type} className={className}>
      <IconWrapper>
        {getIcon(type)}
      </IconWrapper>
      <Content>
        <Message>{message}</Message>
        {(showRetry && onRetry) && (
          <Actions>
            <ActionButton type={type} onClick={onRetry}>
              <RefreshCw size={14} />
              Tentar Novamente
            </ActionButton>
          </Actions>
        )}
      </Content>
      {onClose && (
        <CloseButton onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </CloseButton>
      )}
    </AlertContainer>
  );
};

// Componente para exibir erros de formulario
interface FormErrorProps {
  error: string | null;
  onClose?: () => void;
  onRetry?: () => void;
}

export const FormError: React.FC<FormErrorProps> = ({ error, onClose, onRetry }) => {
  if (!error) return null;
  return (
    <AlertMessage
      message={error}
      type="error"
      onClose={onClose}
      onRetry={onRetry}
      showRetry={!!onRetry}
    />
  );
};

// Componente para exibir sucesso de operacao
interface FormSuccessProps {
  message: string | null;
  onClose?: () => void;
}

export const FormSuccess: React.FC<FormSuccessProps> = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <AlertMessage
      message={message}
      type="success"
      onClose={onClose}
    />
  );
};

// Componente para exibir aviso
interface FormWarningProps {
  message: string | null;
  onClose?: () => void;
  onRetry?: () => void;
}

export const FormWarning: React.FC<FormWarningProps> = ({ message, onClose, onRetry }) => {
  if (!message) return null;
  return (
    <AlertMessage
      message={message}
      type="warning"
      onClose={onClose}
      onRetry={onRetry}
      showRetry={!!onRetry}
    />
  );
};

export default AlertMessage;

