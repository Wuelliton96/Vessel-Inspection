import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Shield, Plus, Edit, Trash2, Power, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Seguradora, TipoEmbarcacaoSeguradora } from '../types';
import { seguradoraService } from '../services/api';
import { TIPOS_EMBARCACAO_SEGURADORA, getLabelTipoEmbarcacaoSeguradora } from '../utils/validators';
import { useAccessControl } from '../hooks/useAccessControl';

const Container = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'success' | 'secondary' }>`
  background: ${props => {
    switch(props.variant) {
      case 'danger': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'success': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      case 'secondary': return '#6b7280';
      default: return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    }
  }};
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Table = styled.table`
  width: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const Thead = styled.thead`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
`;

const Th = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const Tr = styled.tr`
  &:hover {
    background: #f9fafb;
  }
`;

const StatusBadge = styled.span<{ ativo: boolean }>`
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => props.ativo ? '#d1fae5' : '#fee2e2'};
  color: ${props => props.ativo ? '#065f46' : '#991b1b'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button<{ variant?: 'primary' | 'danger' | 'warning' }>`
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: ${props => {
    switch(props.variant) {
      case 'danger': return '#fee2e2';
      case 'warning': return '#fef3c7';
      default: return '#dbeafe';
    }
  }};
  color: ${props => {
    switch(props.variant) {
      case 'danger': return '#dc2626';
      case 'warning': return '#d97706';
      default: return '#2563eb';
    }
  }};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
`;

const Modal = styled.div<{ show: boolean }>`
  display: ${props => props.show ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
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

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;

  input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
`;

const AlertMessage = styled.div<{ variant: 'error' | 'success' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: ${props => props.variant === 'error' ? '#fee2e2' : '#d1fae5'};
  color: ${props => props.variant === 'error' ? '#991b1b' : '#065f46'};
  border: 1px solid ${props => props.variant === 'error' ? '#fecaca' : '#a7f3d0'};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
`;

const TiposList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TipoTag = styled.span`
  padding: 0.3rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  background: #dbeafe;
  color: #1e40af;
  font-weight: 500;
`;

const Seguradoras: React.FC = () => {
  const { isAdmin } = useAccessControl();
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal de criação/edição
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Seguradora | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    ativo: true,
    tipos_permitidos: [] as TipoEmbarcacaoSeguradora[]
  });
  
  // Modal de confirmação de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [seguradoraParaExcluir, setSeguradoraParaExcluir] = useState<Seguradora | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const loadSeguradoras = async () => {
    try {
      setLoading(true);
      const data = await seguradoraService.getAll();
      setSeguradoras(data);
    } catch (err: any) {
      setError('Erro ao carregar seguradoras: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadSeguradoras();
    }
  }, [isAdmin]);

  const handleAbrirModal = (seguradora?: Seguradora) => {
    if (seguradora) {
      setEditando(seguradora);
      setFormData({
        nome: seguradora.nome,
        ativo: seguradora.ativo,
        tipos_permitidos: seguradora.tiposPermitidos?.map(t => t.tipo_embarcacao) || []
      });
    } else {
      setEditando(null);
      setFormData({
        nome: '',
        ativo: true,
        tipos_permitidos: []
      });
    }
    setShowModal(true);
    setError('');
  };

  const handleFecharModal = () => {
    setShowModal(false);
    setEditando(null);
    setFormData({ nome: '', ativo: true, tipos_permitidos: [] });
  };

  const handleTipoChange = (tipo: TipoEmbarcacaoSeguradora) => {
    if (formData.tipos_permitidos.includes(tipo)) {
      setFormData({
        ...formData,
        tipos_permitidos: formData.tipos_permitidos.filter(t => t !== tipo)
      });
    } else {
      setFormData({
        ...formData,
        tipos_permitidos: [...formData.tipos_permitidos, tipo]
      });
    }
  };

  const handleSalvar = async () => {
    if (!formData.nome.trim()) {
      setError('Nome da seguradora é obrigatório');
      return;
    }

    if (formData.tipos_permitidos.length === 0) {
      setError('Selecione pelo menos um tipo de embarcação');
      return;
    }

    setSubmitting(true);
    try {
      if (editando) {
        await seguradoraService.update(editando.id, formData);
        setSuccess('Seguradora atualizada com sucesso!');
      } else {
        await seguradoraService.create(formData);
        setSuccess('Seguradora criada com sucesso!');
      }

      handleFecharModal();
      loadSeguradoras();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao salvar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (seguradora: Seguradora) => {
    setTogglingId(seguradora.id);
    try {
      await seguradoraService.toggleStatus(seguradora.id);
      setSuccess(`Seguradora ${seguradora.ativo ? 'desativada' : 'ativada'} com sucesso!`);
      loadSeguradoras();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao alterar status: ' + (err.response?.data?.error || err.message));
    } finally {
      setTogglingId(null);
    }
  };

  const handleAbrirExclusao = (seguradora: Seguradora) => {
    setSeguradoraParaExcluir(seguradora);
    setShowDeleteModal(true);
  };

  const handleConfirmarExclusao = async () => {
    if (!seguradoraParaExcluir) return;

    setDeleting(true);
    try {
      await seguradoraService.delete(seguradoraParaExcluir.id);
      setSuccess('Seguradora excluída com sucesso!');
      setShowDeleteModal(false);
      setSeguradoraParaExcluir(null);
      loadSeguradoras();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao excluir: ' + (err.response?.data?.error || err.message));
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <Container>
        <AlertMessage variant="error">
          <AlertCircle size={20} />
          Você não tem permissão para acessar esta página.
        </AlertMessage>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <Title><Shield size={32} /> Carregando...</Title>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Shield size={32} />
          Gestão de Seguradoras
        </Title>
        <Button onClick={() => handleAbrirModal()}>
          <Plus size={20} />
          Nova Seguradora
        </Button>
      </Header>

      {error && (
        <AlertMessage variant="error">
          <AlertCircle size={20} />
          {error}
        </AlertMessage>
      )}

      {success && (
        <AlertMessage variant="success">
          <Check size={20} />
          {success}
        </AlertMessage>
      )}

      {seguradoras.length === 0 ? (
        <EmptyState>
          <Shield size={64} color="#d1d5db" />
          <h3>Nenhuma seguradora cadastrada</h3>
          <p>Clique em "Nova Seguradora" para começar</p>
        </EmptyState>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Nome</Th>
              <Th>Tipos Permitidos</Th>
              <Th>Status</Th>
              <Th style={{ textAlign: 'center' }}>Ações</Th>
            </tr>
          </Thead>
          <tbody>
            {seguradoras.map(seguradora => (
              <Tr key={seguradora.id}>
                <Td><strong>{seguradora.nome}</strong></Td>
                <Td>
                  <TiposList>
                    {seguradora.tiposPermitidos?.map(tp => (
                      <TipoTag key={tp.id}>
                        {getLabelTipoEmbarcacaoSeguradora(tp.tipo_embarcacao)}
                      </TipoTag>
                    )) || '-'}
                  </TiposList>
                </Td>
                <Td>
                  <StatusBadge ativo={seguradora.ativo}>
                    {seguradora.ativo ? 'Ativa' : 'Inativa'}
                  </StatusBadge>
                </Td>
                <Td>
                  <ActionButtons>
                    <IconButton onClick={() => handleAbrirModal(seguradora)}>
                      <Edit size={18} />
                    </IconButton>
                    <IconButton 
                      variant="warning" 
                      onClick={() => handleToggleStatus(seguradora)}
                      title={togglingId === seguradora.id ? 'Alterando...' : seguradora.ativo ? 'Desativar' : 'Ativar'}
                      disabled={togglingId === seguradora.id}
                    >
                      {togglingId === seguradora.id ? (
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Power size={18} />
                      )}
                    </IconButton>
                    <IconButton 
                      variant="danger" 
                      onClick={() => handleAbrirExclusao(seguradora)}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </ActionButtons>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Modal de Criação/Edição */}
      <Modal show={showModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              {editando ? 'Editar Seguradora' : 'Nova Seguradora'}
            </ModalTitle>
            <IconButton onClick={handleFecharModal}>
              <X size={20} />
            </IconButton>
          </ModalHeader>

          {error && (
            <AlertMessage variant="error">
              <AlertCircle size={20} />
              {error}
            </AlertMessage>
          )}

          <FormGroup>
            <Label>Nome da Seguradora *</Label>
            <Input
              type="text"
              value={formData.nome}
              onChange={e => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Essor, Mapfre, Swiss RE..."
            />
          </FormGroup>

          <FormGroup>
            <Label>Tipos de Embarcação Permitidos *</Label>
            <CheckboxGroup>
              {TIPOS_EMBARCACAO_SEGURADORA.map(tipo => (
                <CheckboxLabel key={tipo.value}>
                  <input
                    type="checkbox"
                    checked={formData.tipos_permitidos.includes(tipo.value as TipoEmbarcacaoSeguradora)}
                    onChange={() => handleTipoChange(tipo.value as TipoEmbarcacaoSeguradora)}
                  />
                  {tipo.label}
                </CheckboxLabel>
              ))}
            </CheckboxGroup>
          </FormGroup>

          <FormGroup>
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={formData.ativo}
                onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
              />
              Seguradora ativa
            </CheckboxLabel>
          </FormGroup>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={handleFecharModal} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="success" onClick={handleSalvar} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  {editando ? 'Salvando...' : 'Criando...'}
                </>
              ) : (
                <>
                  <Check size={18} />
                  {editando ? 'Salvar Alterações' : 'Criar Seguradora'}
                </>
              )}
            </Button>
          </div>
        </ModalContent>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal show={showDeleteModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Confirmar Exclusão</ModalTitle>
            <IconButton onClick={() => setShowDeleteModal(false)}>
              <X size={20} />
            </IconButton>
          </ModalHeader>

          <p style={{ marginBottom: '1.5rem' }}>
            Tem certeza que deseja excluir a seguradora{' '}
            <strong>{seguradoraParaExcluir?.nome}</strong>?
          </p>
          <p style={{ color: '#dc2626', marginBottom: '1.5rem' }}>
            Esta ação não pode ser desfeita.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmarExclusao} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          </div>
        </ModalContent>
      </Modal>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
};

export default Seguradoras;


