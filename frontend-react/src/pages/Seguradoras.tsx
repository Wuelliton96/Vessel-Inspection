import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Shield, Plus, Edit, Trash2, Power, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Seguradora, TipoEmbarcacaoSeguradora } from '../types';
import { seguradoraService } from '../services/api';
import { TIPOS_EMBARCACAO_SEGURADORA, getLabelTipoEmbarcacaoSeguradora } from '../utils/validators';
import { useAccessControl } from '../hooks/useAccessControl';
import {
  Container,
  Header,
  Title,
  Button,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  ActionButtons,
  StatusBadge,
  EmptyState,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  FormGroup,
  Label,
  Input
} from '../components/shared/StyledComponents';

// TableHeader com gradiente específico
const TheadGradient = styled(TableHeader)`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
`;

const ThWhite = styled(TableHeaderCell)`
  color: white;
`;

// IconButton com variante warning
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

// Modal com show prop
const Modal = styled(ModalOverlay)<{ show: boolean }>`
  display: ${props => props.show ? 'flex' : 'none'};
`;

const ModalContentScrollable = styled(ModalContent)`
  max-height: 90vh;
  overflow-y: auto;
`;

// Componentes específicos
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

// Componentes específicos para tipos
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
    <Container maxWidth="1400px">
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
          <TheadGradient>
            <tr>
              <ThWhite>Nome</ThWhite>
              <ThWhite>Tipos Permitidos</ThWhite>
              <ThWhite>Status</ThWhite>
              <ThWhite style={{ textAlign: 'center' }}>Ações</ThWhite>
            </tr>
          </TheadGradient>
          <TableBody>
            {seguradoras.map(seguradora => (
              <TableRow key={seguradora.id}>
                <TableCell><strong>{seguradora.nome}</strong></TableCell>
                <TableCell>
                  <TiposList>
                    {seguradora.tiposPermitidos?.map(tp => (
                      <TipoTag key={tp.id}>
                        {getLabelTipoEmbarcacaoSeguradora(tp.tipo_embarcacao)}
                      </TipoTag>
                    )) || '-'}
                  </TiposList>
                </TableCell>
                <TableCell>
                  <StatusBadge ativo={seguradora.ativo}>
                    {seguradora.ativo ? 'Ativa' : 'Inativa'}
                  </StatusBadge>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Modal de Criação/Edição */}
      <Modal show={showModal}>
        <ModalContentScrollable>
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
        </ModalContentScrollable>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal show={showDeleteModal}>
        <ModalContentScrollable>
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
        </ModalContentScrollable>
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


