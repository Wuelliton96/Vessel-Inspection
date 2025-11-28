/**
 * Componentes styled compartilhados
 * Reduz duplicação de código entre páginas
 */
import styled from 'styled-components';

// Container padrão para páginas com props opcionais
export const Container = styled.div<{ 
  maxWidth?: string;
  padding?: string;
  responsive?: boolean;
}>`
  padding: ${props => props.padding || '2rem'};
  max-width: ${props => props.maxWidth || '1200px'};
  margin: 0 auto;
  
  ${props => props.responsive && `
    @media (max-width: 768px) {
      padding: 1rem;
    }
  `}
`;

// Header padrão para páginas
export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

// Título padrão
export const Title = styled.h1`
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

// Badge de admin
export const AdminBadge = styled.div`
  background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
`;

// Info box de admin
export const AdminInfo = styled.div`
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #3b82f6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const InfoIcon = styled.div`
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const InfoText = styled.div`
  color: #1e40af;
  font-weight: 500;
  line-height: 1.4;
`;

// Container de busca
export const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

// Input de busca
export const SearchInput = styled.input`
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  width: 300px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

// Botão padrão com variantes
export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  
  ${props => {
    if (props.variant === 'primary') {
      return `
        background: #3b82f6;
        color: white;
        
        &:hover:not(:disabled) {
          background: #2563eb;
          transform: translateY(-1px);
        }
      `;
    } else if (props.variant === 'danger') {
      return `
        background: #ef4444;
        color: white;
        
        &:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-1px);
        }
      `;
    } else if (props.variant === 'success') {
      return `
        background: #10b981;
        color: white;
        
        &:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
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
        }
      `;
    }
  }}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

// Tabela padrão
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

export const TableHeader = styled.thead`
  background: #f8fafc;
`;

export const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

export const TableBody = styled.tbody``;

export const TableRow = styled.tr<{ isAdmin?: boolean }>`
  border-bottom: 1px solid #f3f4f6;
  
  &:hover {
    background: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  ${props => props.isAdmin && `
    border-left: 3px solid #dc2626;
    background: linear-gradient(90deg, rgba(220, 38, 38, 0.05) 0%, transparent 100%);
  `}
`;

export const TableCell = styled.td`
  padding: 1rem;
  color: #374151;
`;

// Botões de ação
export const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const IconButton = styled.button<{ variant?: 'edit' | 'delete' }>`
  padding: 0.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  ${props => {
    if (props.variant === 'edit') {
      return `
        background: #dbeafe;
        color: #2563eb;
        
        &:hover {
          background: #bfdbfe;
        }
      `;
    } else {
      return `
        background: #fee2e2;
        color: #dc2626;
        
        &:hover {
          background: #fecaca;
        }
      `;
    }
  }}
`;

// Estados vazios
export const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

export const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

// Mensagens
export const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const SuccessMessage = styled.div`
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// Modal
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

export const ModalTitle = styled.h2`
  color: #1f2937;
  margin: 0;
  font-size: 1.5rem;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #374151;
  }
`;

// Formulário
export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
`;

export const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

export const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

export const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

// ModalBody para modais mais complexos
export const ModalBody = styled.div`
  padding: 1.5rem 0;
`;

// Textarea
export const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

// StatusBadge genérico (suporta status string ou ativo boolean)
export const StatusBadge = styled.span<{ 
  status?: 'active' | 'inactive' | 'pending' | 'completed' | 'error' | 'success' | 'pendente' | 'em_andamento' | 'concluida' | 'reprovada' | string;
  ativo?: boolean;
}>`
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  
  ${props => {
    // Se usar ativo (boolean)
    if (props.ativo !== undefined) {
      return props.ativo 
        ? 'background: #d1fae5; color: #065f46;'
        : 'background: #fee2e2; color: #991b1b;';
    }
    
    // Se usar status (string)
    const status = props.status?.toLowerCase();
    switch(status) {
      case 'active':
      case 'ativo':
      case 'success':
      case 'completed':
      case 'concluida':
        return 'background: #d1fae5; color: #065f46;';
      case 'inactive':
      case 'inativo':
      case 'error':
      case 'reprovada':
        return 'background: #fee2e2; color: #991b1b;';
      case 'pending':
      case 'pendente':
      case 'em_andamento':
        return 'background: #fef3c7; color: #92400e;';
      default:
        return 'background: #e5e7eb; color: #374151;';
    }
  }}
`;

// Card genérico
export const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

// Grid genérico
export const Grid = styled.div<{ cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.cols || 3}, 1fr);
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// InfoBox/Alert genérico
export const InfoBox = styled.div<{ type?: 'success' | 'warning' | 'error' | 'info' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  ${props => {
    switch(props.type) {
      case 'success':
        return 'background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534;';
      case 'warning':
        return 'background: #fffbeb; border: 1px solid #fde68a; color: #92400e;';
      case 'error':
        return 'background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;';
      default:
        return 'background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af;';
    }
  }}
`;

// ButtonGroup
export const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    
    button {
      width: 100%;
    }
  }
`;

// SectionTitle
export const SectionTitle = styled.h2`
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
`;

// ActionsBar (para headers com múltiplas ações)
export const ActionsBar = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

