import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Users, Plus, Edit2, Trash2, Search, X, Building2, User, MapPin, Phone, Mail, FileText, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { clienteService } from '../services/api';
import { Cliente, TipoPessoa } from '../types';
import { validarCPF, formatarCPF, mascaraCPF, validarCNPJ, formatarCNPJ, mascaraCNPJ, mascaraTelefone } from '../utils/validators';

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
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
`;

const ButtonPrimary = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(102, 126, 234, 0.35);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const FiltersContainer = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Table = styled.table`
  width: 100%;
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const TableHead = styled.thead`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const TableRow = styled.tr`
  &:not(:last-child) {
    border-bottom: 1px solid #e2e8f0;
  }

  &:hover {
    background: #f8fafc;
  }
`;

const TableHeader = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TableCell = styled.td`
  padding: 1rem;
  color: #475569;
`;

const Badge = styled.span<{ variant?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
    switch (props.variant) {
      case 'success': return '#dcfce7';
      case 'danger': return '#fee2e2';
      case 'info': return '#dbeafe';
      case 'warning': return '#fef3c7';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'success': return '#166534';
      case 'danger': return '#991b1b';
      case 'info': return '#1e40af';
      case 'warning': return '#92400e';
      default: return '#475569';
    }
  }};
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button<{ variant?: string }>`
  padding: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: ${props => {
    switch (props.variant) {
      case 'danger': return '#fee2e2';
      case 'success': return '#dcfce7';
      case 'warning': return '#fef3c7';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'danger': return '#991b1b';
      case 'success': return '#166534';
      case 'warning': return '#92400e';
      default: return '#475569';
    }
  }};

  &:hover {
    transform: scale(1.1);
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0 0.5rem 0;
  padding-top: 1rem;
  border-top: 2px solid #e2e8f0;
`;

const ErrorMessage = styled.div`
  background: #fee2e2;
  color: #991b1b;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #94a3b8;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1.5rem;
  padding: 0.5rem 0;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #475569;

  input {
    cursor: pointer;
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
`;

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [error, setError] = useState('');
  
  // Filtros
  const [filtroTipoPessoa, setFiltroTipoPessoa] = useState<string>('');
  const [filtroDocumento, setFiltroDocumento] = useState('');
  const [filtroNome, setFiltroNome] = useState('');
  
  // Formulário
  const [formData, setFormData] = useState({
    tipo_pessoa: 'FISICA' as TipoPessoa,
    nome: '',
    cpf: '',
    cnpj: '',
    telefone_e164: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    observacoes: ''
  });

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clienteService.getAll();
      setClientes(data);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        tipo_pessoa: cliente.tipo_pessoa,
        nome: cliente.nome,
        cpf: cliente.cpf ? formatarCPF(cliente.cpf) : '',
        cnpj: cliente.cnpj ? formatarCNPJ(cliente.cnpj) : '',
        telefone_e164: cliente.telefone_e164 || '',
        email: cliente.email || '',
        cep: cliente.cep || '',
        logradouro: cliente.logradouro || '',
        numero: cliente.numero || '',
        complemento: cliente.complemento || '',
        bairro: cliente.bairro || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        observacoes: cliente.observacoes || ''
      });
    } else {
      setEditingCliente(null);
      setFormData({
        tipo_pessoa: 'FISICA',
        nome: '',
        cpf: '',
        cnpj: '',
        telefone_e164: '',
        email: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        observacoes: ''
      });
    }
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCliente(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (formData.tipo_pessoa === 'FISICA') {
      if (!formData.cpf || !validarCPF(formData.cpf)) {
        setError('CPF inválido');
        return;
      }
    } else {
      if (!formData.cnpj || !validarCNPJ(formData.cnpj)) {
        setError('CNPJ inválido');
        return;
      }
    }

    try {
      const payload = {
        tipo_pessoa: formData.tipo_pessoa,
        nome: formData.nome.trim(),
        cpf: formData.tipo_pessoa === 'FISICA' ? formData.cpf.replace(/\D/g, '') : null,
        cnpj: formData.tipo_pessoa === 'JURIDICA' ? formData.cnpj.replace(/\D/g, '') : null,
        telefone_e164: formData.telefone_e164 ? formData.telefone_e164.replace(/\D/g, '').replace(/^(\d{2})(\d+)/, '+55$1$2') : null,
        email: formData.email.trim() || null,
        cep: formData.cep.replace(/\D/g, '') || null,
        logradouro: formData.logradouro.trim() || null,
        numero: formData.numero.trim() || null,
        complemento: formData.complemento.trim() || null,
        bairro: formData.bairro.trim() || null,
        cidade: formData.cidade.trim() || null,
        estado: formData.estado.trim() || null,
        observacoes: formData.observacoes.trim() || null
      };

      if (editingCliente) {
        await clienteService.update(editingCliente.id, payload);
      } else {
        await clienteService.create(payload);
      }

      await loadClientes();
      handleCloseModal();
    } catch (err: any) {
      console.error('Erro ao salvar cliente:', err);
      setError(err.response?.data?.error || 'Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      await clienteService.delete(id);
      await loadClientes();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao excluir cliente');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await clienteService.toggleStatus(id);
      await loadClientes();
    } catch (err) {
      alert('Erro ao alterar status do cliente');
    }
  };

  const clientesFiltrados = clientes.filter(cliente => {
    if (filtroTipoPessoa && cliente.tipo_pessoa !== filtroTipoPessoa) return false;
    
    if (filtroDocumento) {
      const doc = filtroDocumento.replace(/\D/g, '');
      if (cliente.cpf && !cliente.cpf.includes(doc)) return false;
      if (cliente.cnpj && !cliente.cnpj.includes(doc)) return false;
      if (!cliente.cpf && !cliente.cnpj) return false;
    }
    
    if (filtroNome && !cliente.nome.toLowerCase().includes(filtroNome.toLowerCase())) return false;
    
    return true;
  });

  return (
    <Container>
      <Header>
        <Title>
          <Users size={32} />
          Gestão de Clientes
        </Title>
        <ButtonPrimary onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Novo Cliente
        </ButtonPrimary>
      </Header>

      <FiltersContainer>
        <FilterGroup>
          <Label htmlFor="filtro-tipo">Tipo de Pessoa</Label>
          <Select
            id="filtro-tipo"
            value={filtroTipoPessoa}
            onChange={(e) => setFiltroTipoPessoa(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="FISICA">Pessoa Física</option>
            <option value="JURIDICA">Pessoa Jurídica</option>
          </Select>
        </FilterGroup>
        
        <FilterGroup>
          <Label htmlFor="filtro-doc">CPF/CNPJ</Label>
          <Input
            id="filtro-doc"
            type="text"
            placeholder="Digite o CPF ou CNPJ..."
            value={filtroDocumento}
            onChange={(e) => setFiltroDocumento(e.target.value)}
          />
        </FilterGroup>
        
        <FilterGroup>
          <Label htmlFor="filtro-nome">Nome</Label>
          <Input
            id="filtro-nome"
            type="text"
            placeholder="Buscar por nome..."
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
          />
        </FilterGroup>
      </FiltersContainer>

      {loading ? (
        <EmptyState>
          <LoadingSpinner />
          <p>Carregando clientes...</p>
        </EmptyState>
      ) : clientesFiltrados.length === 0 ? (
        <EmptyState>
          <Users size={64} />
          <h3>Nenhum cliente encontrado</h3>
          <p>Adicione um novo cliente ou ajuste os filtros</p>
        </EmptyState>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeader>Tipo</TableHeader>
              <TableHeader>Nome</TableHeader>
              <TableHeader>CPF/CNPJ</TableHeader>
              <TableHeader>Contato</TableHeader>
              <TableHeader>Cidade/UF</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Ações</TableHeader>
            </tr>
          </TableHead>
          <tbody>
            {clientesFiltrados.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell>
                  <Badge variant={cliente.tipo_pessoa === 'FISICA' ? 'info' : 'warning'}>
                    {cliente.tipo_pessoa === 'FISICA' ? (
                      <><User size={14} /> PF</>
                    ) : (
                      <><Building2 size={14} /> PJ</>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <strong>{cliente.nome}</strong>
                </TableCell>
                <TableCell>
                  {cliente.cpf ? formatarCPF(cliente.cpf) : formatarCNPJ(cliente.cnpj || '')}
                </TableCell>
                <TableCell>
                  {cliente.telefone_e164 && (
                    <div style={{ fontSize: '0.875rem' }}>
                      <Phone size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {cliente.telefone_e164}
                    </div>
                  )}
                  {cliente.email && (
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {cliente.email}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {cliente.cidade && cliente.estado ? `${cliente.cidade}/${cliente.estado}` : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={cliente.ativo ? 'success' : 'danger'}>
                    {cliente.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ActionsContainer>
                    <IconButton onClick={() => handleToggleStatus(cliente.id)}>
                      {cliente.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </IconButton>
                    <IconButton onClick={() => handleOpenModal(cliente)}>
                      <Edit2 size={18} />
                    </IconButton>
                    <IconButton variant="danger" onClick={() => handleDelete(cliente.id)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </ActionsContainer>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}

      {showModal && (
        <Modal onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                {editingCliente ? <><Edit2 size={24} /> Editar Cliente</> : <><Plus size={24} /> Novo Cliente</>}
              </ModalTitle>
              <IconButton onClick={handleCloseModal}>
                <X size={20} />
              </IconButton>
            </ModalHeader>

            {error && (
              <ErrorMessage>
                <AlertCircle size={20} />
                {error}
              </ErrorMessage>
            )}

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Tipo de Pessoa *</Label>
                <RadioGroup>
                  <RadioLabel>
                    <input
                      type="radio"
                      name="tipo_pessoa"
                      value="FISICA"
                      checked={formData.tipo_pessoa === 'FISICA'}
                      onChange={(e) => setFormData({ ...formData, tipo_pessoa: e.target.value as TipoPessoa, cpf: '', cnpj: '' })}
                      disabled={!!editingCliente}
                    />
                    <User size={16} />
                    Pessoa Física
                  </RadioLabel>
                  <RadioLabel>
                    <input
                      type="radio"
                      name="tipo_pessoa"
                      value="JURIDICA"
                      checked={formData.tipo_pessoa === 'JURIDICA'}
                      onChange={(e) => setFormData({ ...formData, tipo_pessoa: e.target.value as TipoPessoa, cpf: '', cnpj: '' })}
                      disabled={!!editingCliente}
                    />
                    <Building2 size={16} />
                    Pessoa Jurídica
                  </RadioLabel>
                </RadioGroup>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="nome">{formData.tipo_pessoa === 'FISICA' ? 'Nome Completo' : 'Razão Social'} *</Label>
                <Input
                  id="nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder={formData.tipo_pessoa === 'FISICA' ? 'Ex: João da Silva' : 'Ex: Empresa XYZ Ltda'}
                  required
                />
              </FormGroup>

              <FormRow>
                {formData.tipo_pessoa === 'FISICA' ? (
                  <FormGroup>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: mascaraCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                      disabled={!!editingCliente}
                    />
                  </FormGroup>
                ) : (
                  <FormGroup>
                    <Label htmlFor="cnpj">CNPJ *</Label>
                    <Input
                      id="cnpj"
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: mascaraCNPJ(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      required
                      disabled={!!editingCliente}
                    />
                  </FormGroup>
                )}
                
                <FormGroup>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    type="text"
                    value={formData.telefone_e164}
                    onChange={(e) => setFormData({ ...formData, telefone_e164: mascaraTelefone(e.target.value) })}
                    placeholder="(11) 99999-8888"
                    maxLength={15}
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemplo@email.com"
                />
              </FormGroup>

              <SectionTitle>
                <MapPin size={20} />
                Endereço
              </SectionTitle>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    type="text"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                    placeholder="00000000"
                    maxLength={8}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Ex: 1000"
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label htmlFor="logradouro">Rua/Avenida</Label>
                <Input
                  id="logradouro"
                  type="text"
                  value={formData.logradouro}
                  onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                  placeholder="Ex: Av. Paulista"
                />
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    type="text"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    placeholder="Ex: Apto 501"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    type="text"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Ex: Centro"
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    type="text"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Ex: São Paulo"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="estado">Estado (UF)</Label>
                  <Input
                    id="estado"
                    type="text"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase().slice(0, 2) })}
                    placeholder="Ex: SP"
                    maxLength={2}
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre o cliente..."
                />
              </FormGroup>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <IconButton type="button" onClick={handleCloseModal} style={{ padding: '0.75rem 1.5rem' }}>
                  Cancelar
                </IconButton>
                <ButtonPrimary type="submit">
                  {editingCliente ? 'Atualizar' : 'Cadastrar'}
                </ButtonPrimary>
              </div>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default Clientes;


