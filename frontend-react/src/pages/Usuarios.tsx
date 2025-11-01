import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  UserCheck, 
  UserX, 
  Search,
  Users,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usuarioService } from '../services/api';
import { Usuario } from '../types';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    gap: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const ActionsBar = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  width: 250px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  @media (max-width: 768px) {
    width: 200px;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  border: none;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return 'background: #3b82f6; color: white;';
      case 'secondary':
        return 'background: #6b7280; color: white;';
      case 'danger':
        return 'background: #ef4444; color: white;';
      case 'success':
        return 'background: #10b981; color: white;';
      default:
        return 'background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;';
    }
  }}
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const UsersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const UserListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f9fafb;
  }
`;


const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const UserName = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  min-width: 150px;
`;

const UserEmail = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
  min-width: 200px;
`;

const UserRole = styled.div<{ role: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  min-width: 100px;
  
  ${props => {
    switch (props.role) {
      case 'ADMINISTRADOR':
        return 'background: #fef3c7; color: #92400e;';
      case 'VISTORIADOR':
        return 'background: #dbeafe; color: #1e40af;';
      default:
        return 'background: #f3f4f6; color: #374151;';
    }
  }}
`;

const UserActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.5rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return 'background: #dbeafe; color: #1e40af;';
      case 'secondary':
        return 'background: #f3f4f6; color: #6b7280;';
      case 'danger':
        return 'background: #fee2e2; color: #dc2626;';
      default:
        return 'background: #f3f4f6; color: #6b7280;';
    }
  }}
  
  &:hover {
    opacity: 0.8;
    transform: scale(1.05);
  }
`;

const UserStatus = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 500;
  min-width: 80px;
  
  ${props => props.active 
    ? 'color: #10b981;' 
    : 'color: #ef4444;'
  }
`;

const Modal = styled.div<{ show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
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
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
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
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const PasswordContainer = styled.div`
  position: relative;
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const InfoMessage = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  color: #0369a1;
  font-size: 0.875rem;
  line-height: 1.4;
`;

const InfoIcon = styled.span`
  font-size: 1rem;
  flex-shrink: 0;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #374151;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
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

const Usuarios: React.FC = () => {
  const { usuario: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'password' | 'delete'>('create');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    nivelAcessoId: 2,
    ativo: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Função para validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Função para lidar com mudança no campo email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    
    if (email && !validateEmail(email)) {
      setEmailError('Formato de email inválido');
    } else {
      setEmailError('');
    }
  };

  // Carregar usuários da API
  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        setLoading(true);
        const usuariosData = await usuarioService.getAll();
        setUsuarios(usuariosData);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        // Em caso de erro, manter lista vazia e mostrar mensagem de erro
        setUsuarios([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsuarios();
  }, []);

  const filteredUsuarios = usuarios.filter(user => {
    // Filtrar usuário logado
    if (currentUser && user.id === currentUser.id) {
      return false;
    }
    
    // Filtrar por termo de busca
    return user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleCreateUser = () => {
    setModalType('create');
    setSelectedUser(null);
    setFormData({
      nome: '',
      email: '',
      senha: '',
      nivelAcessoId: 2,
      ativo: true
    });
    setEmailError('');
    setShowModal(true);
  };

  const handleEditUser = (user: Usuario) => {
    setModalType('edit');
    setSelectedUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: '',
      nivelAcessoId: user.nivelAcessoId,
      ativo: user.ativo
    });
    setEmailError('');
    setShowModal(true);
  };

  const handleResetPassword = (user: Usuario) => {
    setModalType('password');
    setSelectedUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: '',
      nivelAcessoId: user.nivelAcessoId,
      ativo: user.ativo
    });
    setShowModal(true);
  };

  const handleDeleteUser = (user: Usuario) => {
    setModalType('delete');
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleToggleStatus = async (user: Usuario) => {
    try {
      await usuarioService.toggleStatus(user.id);
      console.log('Status do usuário alterado com sucesso');
      
      // Recarregar lista de usuários
      const usuariosData = await usuarioService.getAll();
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar email antes de enviar
    if (formData.email && !validateEmail(formData.email)) {
      setEmailError('Formato de email inválido');
      return;
    }
    
    try {
      if (modalType === 'create') {
        // Remover senha dos dados para criação (senha padrão será usada)
        const { senha, ...userData } = formData;
        await usuarioService.create(userData);
        console.log('Usuário criado com sucesso');
      } else if (modalType === 'edit' && selectedUser) {
        await usuarioService.update(selectedUser.id, formData);
        console.log('Usuário atualizado com sucesso');
      } else if (modalType === 'password' && selectedUser) {
        await usuarioService.resetPassword(selectedUser.id, { novaSenha: formData.senha });
        console.log('Senha redefinida com sucesso');
      }
      
      // Recarregar lista de usuários
      const usuariosData = await usuarioService.getAll();
      setUsuarios(usuariosData);
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao processar usuário:', error);
    }
  };

  const handleDelete = async () => {
    if (selectedUser) {
      try {
        await usuarioService.delete(selectedUser.id);
        console.log('Usuário excluído com sucesso');
        
        // Recarregar lista de usuários
        const usuariosData = await usuarioService.getAll();
        setUsuarios(usuariosData);
        setShowModal(false);
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
      }
    }
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'create':
        return 'Criar Usuário';
      case 'edit':
        return 'Editar Usuário';
      case 'password':
        return 'Redefinir Senha';
      case 'delete':
        return 'Excluir Usuário';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <Users size={48} />
          <p>Carregando usuários...</p>
        </LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Users size={24} />
          Gerenciamento de Usuários
        </Title>
        
        <ActionsBar>
          <SearchContainer>
            <SearchIcon>
              <Search size={16} />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <Button variant="primary" onClick={handleCreateUser}>
            <Plus size={16} />
            Novo Usuário
          </Button>
        </ActionsBar>
      </Header>

      {filteredUsuarios.length === 0 ? (
        <EmptyState>
          <Users size={48} />
          <p>Nenhum usuário encontrado</p>
        </EmptyState>
      ) : (
        <UsersList>
          {filteredUsuarios.map((user) => (
            <UserListItem key={user.id}>
              <UserInfo>
                  <UserName>{user.nome}</UserName>
                  <UserEmail>{user.email}</UserEmail>
                  <UserRole role={user.nivelAcesso?.nome || 'DESCONHECIDO'}>
                    <Shield size={12} />
                    {user.nivelAcesso?.nome || 'DESCONHECIDO'}
                  </UserRole>
                  <UserStatus active={user.ativo}>
                    {user.ativo ? (
                      <>
                        <UserCheck size={12} />
                        Ativo
                      </>
                    ) : (
                      <>
                        <UserX size={12} />
                        Inativo
                      </>
                    )}
                  </UserStatus>
                </UserInfo>
                
                <UserActions>
                  <ActionButton
                    variant="primary"
                    onClick={() => handleEditUser(user)}
                    title="Editar usuário"
                  >
                    <Edit size={16} />
                  </ActionButton>
                  
                  <ActionButton
                    variant="secondary"
                    onClick={() => handleResetPassword(user)}
                    title="Redefinir senha"
                  >
                    <Key size={16} />
                  </ActionButton>
                  
                  <ActionButton
                    variant="secondary"
                    onClick={() => handleToggleStatus(user)}
                    title={user.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                  >
                    {user.ativo ? <UserX size={16} /> : <UserCheck size={16} />}
                  </ActionButton>
                  
                  <ActionButton
                    variant="danger"
                    onClick={() => handleDeleteUser(user)}
                    title="Excluir usuário"
                  >
                    <Trash2 size={16} />
                  </ActionButton>
                </UserActions>
            </UserListItem>
          ))}
        </UsersList>
      )}

      {/* Modal */}
      <Modal show={showModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{getModalTitle()}</ModalTitle>
            <CloseButton onClick={() => setShowModal(false)}>
              ×
            </CloseButton>
          </ModalHeader>

          {modalType === 'delete' ? (
            <div>
              <p>Tem certeza que deseja excluir o usuário <strong>{selectedUser?.nome}</strong>?</p>
              <p>Esta ação não pode ser desfeita.</p>
              <ButtonGroup>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Excluir
                </Button>
              </ButtonGroup>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  required
                  style={{ borderColor: emailError ? '#ef4444' : undefined }}
                />
                {emailError && (
                  <ErrorMessage style={{ marginTop: '0.5rem' }}>
                    {emailError}
                  </ErrorMessage>
                )}
              </FormGroup>

              {modalType === 'password' && (
                <FormGroup>
                  <Label htmlFor="senha">Nova Senha</Label>
                  <PasswordContainer>
                    <Input
                      id="senha"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      required
                    />
                    <PasswordToggle
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </PasswordToggle>
                  </PasswordContainer>
                </FormGroup>
              )}

              {modalType === 'create' && (
                <FormGroup>
                  <InfoMessage>
                    <InfoIcon>ℹ️</InfoIcon>
                    <div>
                      <strong>Senha padrão:</strong> mudar123
                      <br />
                      O usuário será obrigado a alterar a senha no primeiro login.
                    </div>
                  </InfoMessage>
                </FormGroup>
              )}

              <FormGroup>
                <Label htmlFor="nivelAcesso">Nível de Acesso</Label>
                <Select
                  id="nivelAcesso"
                  value={formData.nivelAcessoId}
                  onChange={(e) => setFormData({ ...formData, nivelAcessoId: parseInt(e.target.value) })}
                >
                  <option value={1}>Administrador</option>
                  <option value={2}>Vistoriador</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  />
                  {' '}Usuário Ativo
                </Label>
              </FormGroup>

              <ButtonGroup>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit">
                  {modalType === 'create' ? 'Criar' : modalType === 'edit' ? 'Salvar' : 'Redefinir'}
                </Button>
              </ButtonGroup>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Usuarios;
