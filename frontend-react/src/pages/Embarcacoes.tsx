import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Ship, 
  User, 
  Mail, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Embarcacao } from '../types';
import { embarcacaoService } from '../services/api';
import { useAccessControl } from '../hooks/useAccessControl';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
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

const AdminBadge = styled.div`
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

const AdminInfo = styled.div`
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #3b82f6;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const InfoIcon = styled.div`
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

const InfoText = styled.div`
  color: #1e40af;
  font-weight: 500;
  line-height: 1.4;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const SearchInput = styled.input`
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

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.thead`
  background: #f8fafc;
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #f3f4f6;
  
  &:hover {
    background: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  color: #374151;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button<{ variant?: 'edit' | 'delete' }>`
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

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
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

const SuccessMessage = styled.div`
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

// Modal para criar/editar embarcação
const ModalOverlay = styled.div`
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

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  color: #1f2937;
  margin: 0;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #374151;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
`;

const Input = styled.input`
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


const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const Embarcacoes: React.FC = () => {
  const { isAdmin } = useAccessControl();
  const [embarcacoes, setEmbarcacoes] = useState<Embarcacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmbarcacao, setEditingEmbarcacao] = useState<Embarcacao | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    numero_casco: '',
    proprietario_nome: '',
    proprietario_email: ''
  });

  useEffect(() => {
    if (isAdmin) {
      loadEmbarcacoes();
    }
  }, [isAdmin]);

  const loadEmbarcacoes = async () => {
    try {
      setLoading(true);
      const data = await embarcacaoService.getAll();
      setEmbarcacoes(data);
    } catch (err: any) {
      setError('Erro ao carregar embarcações: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEmbarcacao(null);
    setFormData({
      nome: '',
      numero_casco: '',
      proprietario_nome: '',
      proprietario_email: ''
    });
    setShowModal(true);
  };

  const handleEdit = (embarcacao: Embarcacao) => {
    setEditingEmbarcacao(embarcacao);
    setFormData({
      nome: embarcacao.nome,
      numero_casco: embarcacao.numero_casco,
      proprietario_nome: embarcacao.proprietario_nome || '',
      proprietario_email: embarcacao.proprietario_email || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta embarcação?')) {
      return;
    }

    try {
      await embarcacaoService.delete(id);
      setSuccess('Embarcação excluída com sucesso!');
      loadEmbarcacoes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao excluir embarcação: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    console.log('=== FRONTEND DEBUG - HANDLE SUBMIT ===');
    console.log('editingEmbarcacao:', editingEmbarcacao);
    console.log('formData:', formData);

    try {
      if (editingEmbarcacao) {
        console.log('=== FRONTEND DEBUG - CHAMANDO UPDATE ===');
        console.log('ID da embarcação:', editingEmbarcacao.id);
        console.log('Dados para envio:', formData);
        
        const result = await embarcacaoService.update(editingEmbarcacao.id, formData);
        console.log('=== FRONTEND DEBUG - RESULTADO UPDATE ===');
        console.log('Resultado:', result);
        
        setSuccess('Embarcação atualizada com sucesso!');
      } else {
        console.log('=== FRONTEND DEBUG - CHAMANDO CREATE ===');
        const result = await embarcacaoService.create(formData);
        console.log('=== FRONTEND DEBUG - RESULTADO CREATE ===');
        console.log('Resultado:', result);
        
        setSuccess('Embarcação criada com sucesso!');
      }
      
      setShowModal(false);
      console.log('=== FRONTEND DEBUG - RECARREGANDO LISTA ===');
      await loadEmbarcacoes();
      console.log('=== FRONTEND DEBUG - LISTA RECARREGADA ===');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('=== FRONTEND DEBUG - ERRO ===');
      console.error('Erro completo:', err);
      console.error('Erro response:', err.response);
      console.error('Erro message:', err.message);
      setError('Erro ao salvar embarcação: ' + (err.response?.data?.error || err.message));
    }
  };

  const filteredEmbarcacoes = embarcacoes.filter(embarcacao =>
    embarcacao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    embarcacao.numero_casco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (embarcacao.proprietario_nome && embarcacao.proprietario_nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <Ship size={48} />
          <p>Carregando embarcações...</p>
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
          <Ship size={32} />
          Embarcações
          <AdminBadge>Admin</AdminBadge>
        </Title>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Buscar embarcações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="primary" onClick={handleCreate}>
            <Plus size={20} />
            Nova Embarcação
          </Button>
        </SearchContainer>
      </Header>

      <AdminInfo>
        <InfoIcon>
          <Ship size={16} />
        </InfoIcon>
        <InfoText>
          <strong>Modo Administrador:</strong> Você tem acesso completo às embarcações. 
          Pode criar, editar e excluir qualquer embarcação do sistema.
        </InfoText>
      </AdminInfo>

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

      {filteredEmbarcacoes.length === 0 ? (
        <EmptyState>
          <Ship size={64} />
          <h3>Nenhuma embarcação encontrada</h3>
          <p>
            {searchTerm 
              ? 'Tente ajustar os termos de busca' 
              : 'Comece criando sua primeira embarcação'
            }
          </p>
        </EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>Número do Casco</TableHeaderCell>
              <TableHeaderCell>Proprietário</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredEmbarcacoes.map((embarcacao) => (
              <TableRow key={embarcacao.id}>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Ship size={20} color="#3b82f6" />
                    <strong>{embarcacao.nome}</strong>
                  </div>
                </TableCell>
                <TableCell>{embarcacao.numero_casco}</TableCell>
                <TableCell>
                  {embarcacao.proprietario_nome ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={16} color="#6b7280" />
                      {embarcacao.proprietario_nome}
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>Não informado</span>
                  )}
                </TableCell>
                <TableCell>
                  {embarcacao.proprietario_email ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={16} color="#6b7280" />
                      {embarcacao.proprietario_email}
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>Não informado</span>
                  )}
                </TableCell>
                <TableCell>
                  <ActionButtons>
                    <IconButton variant="edit" onClick={() => handleEdit(embarcacao)}>
                      <Edit size={16} />
                    </IconButton>
                    <IconButton variant="delete" onClick={() => handleDelete(embarcacao.id)}>
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
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editingEmbarcacao ? 'Editar Embarcação' : 'Nova Embarcação'}
              </ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>&times;</CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="nome">Nome da Embarcação *</Label>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  placeholder="Ex: Veleiro Azul"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="numero_casco">Número do Casco *</Label>
                <Input
                  id="numero_casco"
                  type="text"
                  value={formData.numero_casco}
                  onChange={(e) => setFormData({ ...formData, numero_casco: e.target.value })}
                  required
                  placeholder="Ex: BR123456789"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="proprietario_nome">Nome do Proprietário</Label>
                <Input
                  id="proprietario_nome"
                  type="text"
                  value={formData.proprietario_nome}
                  onChange={(e) => setFormData({ ...formData, proprietario_nome: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="proprietario_email">Email do Proprietário</Label>
                <Input
                  id="proprietario_email"
                  type="email"
                  value={formData.proprietario_email}
                  onChange={(e) => setFormData({ ...formData, proprietario_email: e.target.value })}
                  placeholder="Ex: joao@email.com"
                />
              </FormGroup>

              <ModalButtons>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  {editingEmbarcacao ? 'Atualizar' : 'Criar'}
                </Button>
              </ModalButtons>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default Embarcacoes;
