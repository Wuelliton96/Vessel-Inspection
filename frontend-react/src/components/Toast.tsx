/**
 * Componente Toast para notificacoes
 * Exibe mensagens de sucesso, erro e aviso de forma padronizada
 */

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
  show: boolean;
}

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div<{ type: ToastType; isClosing: boolean }>`
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  padding: 1rem 1.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  animation: ${props => props.isClosing ? slideOut : slideIn} 0.3s ease-in-out forwards;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        `;
      case 'error':
        return `
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        `;
      case 'warning':
        return `
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        `;
      case 'info':
        return `
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        `;
      default:
        return `
          background: #374151;
          color: white;
        `;
    }
  }}
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Message = styled.span`
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.25rem;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const ProgressBar = styled.div<{ duration: number; type: ToastType }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 0 0 0.75rem 0.75rem;
  animation: progress ${props => props.duration}ms linear forwards;
  
  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={22} />;
    case 'error':
      return <XCircle size={22} />;
    case 'warning':
      return <AlertCircle size={22} />;
    case 'info':
      return <Info size={22} />;
    default:
      return <Info size={22} />;
  }
};

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 4000,
  onClose,
  show
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [show, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  if (!show) return null;

  return (
    <ToastContainer type={type} isClosing={isClosing}>
      <IconWrapper>
        {getIcon(type)}
      </IconWrapper>
      <Message>{message}</Message>
      <CloseButton onClick={handleClose}>
        <X size={16} />
      </CloseButton>
      <ProgressBar duration={duration} type={type} />
    </ToastContainer>
  );
};

// Hook para gerenciar toasts
interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const showSuccess = (message: string) => showToast(message, 'success');
  const showError = (message: string) => showToast(message, 'error');
  const showWarning = (message: string) => showToast(message, 'warning');
  const showInfo = (message: string) => showToast(message, 'info');

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastComponent: (
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={hideToast}
      />
    )
  };
}

export default Toast;

