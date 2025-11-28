import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Building, 
  Home, 
  AlertCircle,
  Search,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Local } from '../types';
import { localService } from '../services/api';
import { useAccessControl } from '../hooks/useAccessControl';
import { buscarCEP, formatarCEP, validarCEP } from '../utils/cepUtils';
import {
  Container,
  Header,
  Title,
  SearchContainer,
  SearchInput,
  Button,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  ActionButtons,
  IconButton,
  EmptyState,
  LoadingState,
  ErrorMessage,
  SuccessMessage,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  CloseButton,
  Form,
  FormGroup,
  Label,
  Input,
  Select,
  ModalButtons
} from '../components/shared/StyledComponents';

// Componente específico para badge de tipo de local
const TypeBadge = styled.span<{ type: 'MARINA' | 'RESIDENCIA' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;

  ${props => {
    if (props.type === 'MARINA') {
      return `
        background: #dbeafe;
        color: #1e40af;
      `;
    } else {
      return `
        background: #dcfce7;
        color: #166534;
      `;
    }
  }}
`;

// ModalContent com max-height para scroll
const ModalContentScrollable = styled(ModalContent)`
  max-height: 90vh;
  overflow-y: auto;
`;

// LoadingIcon para animação
const LoadingIcon = styled.span`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  animation: spin 1s linear infinite;
`;

const Locais: React.FC = () => {
  const { isAdmin } = useAccessControl();
  const [locais, setLocais] = useState<Local[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingLocal, setEditingLocal] = useState<Local | null>(null);
  const [deletingLocal, setDeletingLocal] = useState<Local | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [camposBloqueados, setCamposBloqueados] = useState({
    logradouro: false,
    bairro: false,
    cidade: false,
    estado: false
  });
  const [formData, setFormData] = useState({
    tipo: 'MARINA' as 'MARINA' | 'RESIDENCIA',
    nome_local: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });

  useEffect(() => {
    if (isAdmin) {
      loadLocais();
    }
  }, [isAdmin]);

  const loadLocais = async () => {
    try {
      setLoading(true);
      const data = await localService.getAll();
      setLocais(data);
    } catch (err: any) {
      setError('Erro ao carregar locais: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLocal(null);
    setFormData({
      tipo: 'MARINA',
      nome_local: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    });
    setShowModal(true);
  };

  const handleEdit = (local: Local) => {
    console.log('=== INICIANDO EDIÇÃO DE LOCAL ===');
    console.log('Local selecionado:', local);
    console.log('Estrutura do local:', JSON.stringify(local, null, 2));
    
    setEditingLocal(local);
    
    const formDataToSet = {
      tipo: local.tipo,
      nome_local: local.nome_local || '',
      cep: local.cep || '',
      logradouro: local.logradouro || '',
      numero: local.numero || '',
      complemento: local.complemento || '',
      bairro: local.bairro || '',
      cidade: local.cidade || '',
      estado: local.estado || ''
    };
    
    console.log('FormData configurado:', formDataToSet);
    setFormData(formDataToSet);
    setShowModal(true);
    
    console.log('=== EDIÇÃO INICIADA COM SUCESSO ===');
  };

  const handleDeleteClick = (local: Local) => {
    setDeletingLocal(local);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLocal) return;

    setDeleting(true);
    try {
      await localService.delete(deletingLocal.id);
      setSuccess('Local excluído com sucesso!');
      setShowDeleteModal(false);
      setDeletingLocal(null);
      loadLocais();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao excluir local: ' + (err.response?.data?.error || err.message));
      setShowDeleteModal(false);
      setDeletingLocal(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleCepChange = async (cep: string) => {
    // Formatar CEP enquanto digita
    const cepFormatado = formatarCEP(cep);
    setFormData({ ...formData, cep: cepFormatado });

    // Buscar CEP automaticamente quando tiver 8 dígitos
    if (validarCEP(cep)) {
      setCepLoading(true);
      try {
        const cepData = await buscarCEP(cep);
        if (cepData) {
          setFormData(prev => ({
            ...prev,
            cep: cepData.cep,
            logradouro: cepData.logradouro,
            bairro: cepData.bairro,
            cidade: cepData.localidade,
            estado: cepData.uf
          }));
          
          // Bloquear campos preenchidos automaticamente
          setCamposBloqueados({
            logradouro: true,
            bairro: true,
            cidade: true,
            estado: true
          });
          
          setSuccess('Endereço preenchido automaticamente! Campos bloqueados para edição.');
          setTimeout(() => setSuccess(''), 5000);
        }
      } catch (error: any) {
        setError('CEP não encontrado: ' + error.message);
        setTimeout(() => setError(''), 5000);
      } finally {
        setCepLoading(false);
      }
    }
  };

  const desbloquearCampos = () => {
    setCamposBloqueados({
      logradouro: false,
      bairro: false,
      cidade: false,
      estado: false
    });
    setSuccess('Campos desbloqueados! Você pode editá-los manualmente.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      console.log('=== INICIANDO ATUALIZAÇÃO DE LOCAL ===');
      console.log('editingLocal:', editingLocal);
      console.log('formData:', formData);
      
      if (editingLocal) {
        console.log('Atualizando local ID:', editingLocal.id);
        console.log('Dados para atualização:', formData);
        
        const response = await localService.update(editingLocal.id, formData);
        console.log('Resposta da atualização:', response);
        
        setSuccess('Local atualizado com sucesso!');
      } else {
        console.log('Criando novo local');
        console.log('Dados para criação:', formData);
        
        const response = await localService.create(formData);
        console.log('Resposta da criação:', response);
        
        setSuccess('Local criado com sucesso!');
      }
      
      setShowModal(false);
      loadLocais();
      setTimeout(() => setSuccess(''), 3000);
      
      console.log('=== ATUALIZAÇÃO CONCLUÍDA COM SUCESSO ===');
    } catch (err: any) {
      console.error('Erro ao salvar local:', err);
      console.error('Erro completo:', JSON.stringify(err, null, 2));
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      
      setError('Erro ao salvar local: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLocais = locais.filter(local =>
    (local.nome_local && local.nome_local.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (local.cidade && local.cidade.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (local.bairro && local.bairro.toLowerCase().includes(searchTerm.toLowerCase())) ||
    local.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatAddress = (local: Local) => {
    const parts = [];
    if (local.logradouro) parts.push(local.logradouro);
    if (local.numero) parts.push(local.numero);
    if (local.complemento) parts.push(local.complemento);
    if (local.bairro) parts.push(local.bairro);
    if (local.cidade) parts.push(local.cidade);
    if (local.estado) parts.push(local.estado);
    return parts.join(', ') || 'Endereço não informado';
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <MapPin size={48} />
          <p>Carregando locais...</p>
        </LoadingState>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <AlertCircle size={48} color="#ef4444" />
          <h2>Acesso Negado</h2>
          <p>Apenas administradores podem acessar esta página.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <MapPin size={32} />
          Locais
        </Title>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Buscar locais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={20} />
            Novo Local
          </Button>
        </SearchContainer>
      </Header>

      {error && (
        <ErrorMessage>
          <AlertCircle size={20} />
          {error}
        </ErrorMessage>
      )}

      {success && (
        <SuccessMessage>
          <CheckCircle size={20} />
          {success}
        </SuccessMessage>
      )}

      {filteredLocais.length === 0 ? (
        <EmptyState>
          <MapPin size={64} />
          <h3>Nenhum local encontrado</h3>
          <p>
            {searchTerm 
              ? 'Tente ajustar os termos de busca' 
              : 'Comece criando seu primeiro local'
            }
          </p>
        </EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Tipo</TableHeaderCell>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>Endereço</TableHeaderCell>
              <TableHeaderCell>CEP</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredLocais.map((local) => (
              <TableRow key={local.id}>
                <TableCell>
                  <TypeBadge type={local.tipo}>
                    {local.tipo === 'MARINA' ? <Building size={14} /> : <Home size={14} />}
                    {local.tipo}
                  </TypeBadge>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={20} color="#3b82f6" />
                    <strong>{local.nome_local || 'Sem nome'}</strong>
                  </div>
                </TableCell>
                <TableCell>
                  <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    {formatAddress(local)}
                  </div>
                </TableCell>
                <TableCell>
                  {local.cep ? (
                    <span style={{ fontFamily: 'monospace' }}>{local.cep}</span>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>Não informado</span>
                  )}
                </TableCell>
                <TableCell>
                  <ActionButtons>
                    <IconButton variant="edit" onClick={() => handleEdit(local)}>
                      <Edit size={16} />
                    </IconButton>
                    <IconButton variant="delete" onClick={() => handleDeleteClick(local)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showModal && (
        <ModalOverlay onClick={() => setShowModal(false)}>
          <ModalContentScrollable onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editingLocal ? 'Editar Local' : 'Novo Local'}
              </ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>&times;</CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="tipo">Tipo de Local *</Label>
                <Select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'MARINA' | 'RESIDENCIA' })}
                  required
                >
                  <option value="MARINA">Marina</option>
                  <option value="RESIDENCIA">Residência</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="nome_local">Nome do Local</Label>
                <Input
                  id="nome_local"
                  type="text"
                  value={formData.nome_local}
                  onChange={(e) => setFormData({ ...formData, nome_local: e.target.value })}
                  placeholder="Ex: Marina do Sol"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="cep">
                  CEP
                  {cepLoading && (
                    <LoadingIcon style={{ marginLeft: '0.5rem', color: '#3b82f6' }}>
                      <Search size={14} />
                    </LoadingIcon>
                  )}
                </Label>
                <Input
                  id="cep"
                  type="text"
                  value={formData.cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="Ex: 12345-678"
                  maxLength={9}
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Digite o CEP para preenchimento automático do endereço
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="logradouro">
                  Logradouro
                  {camposBloqueados.logradouro && (
                    <span style={{ marginLeft: '0.5rem', color: '#10b981' }}>
                      <CheckCircle size={14} />
                    </span>
                  )}
                </Label>
                <Input
                  id="logradouro"
                  type="text"
                  value={formData.logradouro}
                  onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                  placeholder="Ex: Rua das Flores"
                  disabled={camposBloqueados.logradouro}
                  style={{
                    backgroundColor: camposBloqueados.logradouro ? '#f3f4f6' : 'white',
                    color: camposBloqueados.logradouro ? '#6b7280' : '#111827'
                  }}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="Ex: 123"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  placeholder="Ex: Bloco A, Apt 101"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="bairro">
                  Bairro
                  {camposBloqueados.bairro && (
                    <span style={{ marginLeft: '0.5rem', color: '#10b981' }}>
                      <CheckCircle size={14} />
                    </span>
                  )}
                </Label>
                <Input
                  id="bairro"
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  placeholder="Ex: Centro"
                  disabled={camposBloqueados.bairro}
                  style={{
                    backgroundColor: camposBloqueados.bairro ? '#f3f4f6' : 'white',
                    color: camposBloqueados.bairro ? '#6b7280' : '#111827'
                  }}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="cidade">
                  Cidade
                  {camposBloqueados.cidade && (
                    <span style={{ marginLeft: '0.5rem', color: '#10b981' }}>
                      <CheckCircle size={14} />
                    </span>
                  )}
                </Label>
                <Input
                  id="cidade"
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Ex: Rio de Janeiro"
                  disabled={camposBloqueados.cidade}
                  style={{
                    backgroundColor: camposBloqueados.cidade ? '#f3f4f6' : 'white',
                    color: camposBloqueados.cidade ? '#6b7280' : '#111827'
                  }}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="estado">
                  Estado
                  {camposBloqueados.estado && (
                    <span style={{ marginLeft: '0.5rem', color: '#10b981' }}>
                      <CheckCircle size={14} />
                    </span>
                  )}
                </Label>
                <Input
                  id="estado"
                  type="text"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  placeholder="Ex: RJ"
                  maxLength={2}
                  disabled={camposBloqueados.estado}
                  style={{
                    backgroundColor: camposBloqueados.estado ? '#f3f4f6' : 'white',
                    color: camposBloqueados.estado ? '#6b7280' : '#111827'
                  }}
                />
              </FormGroup>

              {/* Botão para desbloquear campos */}
              {(camposBloqueados.logradouro || camposBloqueados.bairro || camposBloqueados.cidade || camposBloqueados.estado) && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  backgroundColor: '#f0f9ff', 
                  border: '1px solid #0ea5e9', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#0369a1' }}>
                    Campos preenchidos automaticamente pelo CEP
                  </p>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={desbloquearCampos}
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    Desbloquear Campos
                  </Button>
                </div>
              )}

              <ModalButtons>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      {editingLocal ? 'Atualizando...' : 'Criando...'}
                    </>
                  ) : (
                    editingLocal ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </ModalButtons>
            </Form>
          </ModalContentScrollable>
        </ModalOverlay>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <ModalOverlay onClick={() => setShowDeleteModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Excluir Local</h2>
              <button onClick={() => setShowDeleteModal(false)}>&times;</button>
            </ModalHeader>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>
                Tem certeza que deseja excluir o local <strong>{deletingLocal?.nome_local || 'este local'}</strong>?
              </p>
              <p style={{ color: '#dc2626', marginBottom: '1.5rem' }}>
                Esta ação não pode ser desfeita.
              </p>
              <ModalButtons>
                <Button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  style={{ background: '#6b7280' }}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Excluindo...
                    </>
                  ) : (
                    'Excluir'
                  )}
                </Button>
              </ModalButtons>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
};

export default Locais;
