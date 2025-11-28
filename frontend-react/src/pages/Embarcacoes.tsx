import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Ship, 
  User, 
  Mail, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Embarcacao, TipoEmbarcacao, Seguradora, TipoEmbarcacaoSeguradora, SeguradoraTipoEmbarcacao, Cliente } from '../types';
import { embarcacaoService, seguradoraService, clienteService } from '../services/api';
import { useAccessControl } from '../hooks/useAccessControl';
import { 
  TIPOS_EMBARCACAO, 
  TIPOS_EMBARCACAO_SEGURADORA,
  getLabelTipoEmbarcacaoSeguradora,
  PORTES_EMBARCACAO, 
  mascaraCPF, 
  limparCPF,
  formatarCPF,
  mascaraTelefone,
  converterParaE164,
  mascaraValorMonetario,
  limparValorMonetario,
  formatarValorMonetario
} from '../utils/validators';
import {
  Container,
  Header,
  Title,
  AdminBadge,
  AdminInfo,
  InfoIcon,
  InfoText,
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

const Embarcacoes: React.FC = () => {
  const { isAdmin } = useAccessControl();
  const [embarcacoes, setEmbarcacoes] = useState<Embarcacao[]>([]);
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
  const [tiposPermitidos, setTiposPermitidos] = useState<SeguradoraTipoEmbarcacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEmbarcacao, setEditingEmbarcacao] = useState<Embarcacao | null>(null);
  const [deletingEmbarcacao, setDeletingEmbarcacao] = useState<Embarcacao | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    nr_inscricao_barco: '',
    cliente_id: '',
    seguradora_id: '',
    tipo_embarcacao: '',
    porte: '',
    valor_embarcacao: '',
    ano_fabricacao: ''
  });

  useEffect(() => {
    if (isAdmin) {
      loadEmbarcacoes();
      loadSeguradoras();
      loadClientes();
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

  const loadSeguradoras = async () => {
    try {
      const data = await seguradoraService.getAll(true); // Apenas ativas
      setSeguradoras(data);
    } catch (err: any) {
      console.error('Erro ao carregar seguradoras:', err);
    }
  };

  const loadClientes = async () => {
    try {
      const data = await clienteService.getAll({ ativo: true });
      setClientes(data);
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', err);
    }
  };

  const loadTiposPermitidos = async (seguradoraId: number) => {
    try {
      const tipos = await seguradoraService.getTiposPermitidos(seguradoraId);
      setTiposPermitidos(tipos);
      // Limpar tipo selecionado se não estiver nos tipos permitidos
      const tiposValores = tipos.map(t => t.tipo_embarcacao);
      setFormData(prev => ({
        ...prev,
        tipo_embarcacao: tiposValores.includes(prev.tipo_embarcacao as TipoEmbarcacaoSeguradora) ? prev.tipo_embarcacao : ''
      }));
    } catch (err: any) {
      console.error('Erro ao carregar tipos permitidos:', err);
      setTiposPermitidos([]);
    }
  };

  const handleSeguradoraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seguradoraId = e.target.value;
    setFormData({ ...formData, seguradora_id: seguradoraId, tipo_embarcacao: '' });
    
    if (seguradoraId) {
      loadTiposPermitidos(parseInt(seguradoraId));
    } else {
      setTiposPermitidos([]);
    }
  };

  const handleCreate = () => {
    setEditingEmbarcacao(null);
    setFormData({
      nome: '',
      nr_inscricao_barco: '',
      cliente_id: '',
      seguradora_id: '',
      tipo_embarcacao: '',
      porte: '',
      valor_embarcacao: '',
      ano_fabricacao: ''
    });
    setClienteSelecionado(null);
    setBuscaCliente('');
    setTiposPermitidos([]);
    setShowModal(true);
  };

  const handleEdit = (embarcacao: Embarcacao) => {
    setEditingEmbarcacao(embarcacao);
    setFormData({
      nome: embarcacao.nome,
      nr_inscricao_barco: embarcacao.nr_inscricao_barco,
      cliente_id: embarcacao.cliente_id?.toString() || '',
      seguradora_id: embarcacao.seguradora_id?.toString() || '',
      tipo_embarcacao: embarcacao.tipo_embarcacao || '',
      porte: embarcacao.porte || '',
      valor_embarcacao: embarcacao.valor_embarcacao ? formatarValorMonetario(embarcacao.valor_embarcacao) : '',
      ano_fabricacao: embarcacao.ano_fabricacao?.toString() || ''
    });
    
    // Definir cliente selecionado
    if (embarcacao.Cliente) {
      setClienteSelecionado(embarcacao.Cliente);
      setBuscaCliente('');
    } else {
      setClienteSelecionado(null);
      setBuscaCliente('');
    }
    
    // Carregar tipos permitidos se houver seguradora
    if (embarcacao.seguradora_id) {
      loadTiposPermitidos(embarcacao.seguradora_id);
    } else {
      setTiposPermitidos([]);
    }
    setShowModal(true);
  };

  const handleDeleteClick = (embarcacao: Embarcacao) => {
    setDeletingEmbarcacao(embarcacao);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmbarcacao) return;

    setDeleting(true);
    try {
      await embarcacaoService.delete(deletingEmbarcacao.id);
      setSuccess('Embarcação excluída com sucesso!');
      setShowDeleteModal(false);
      setDeletingEmbarcacao(null);
      loadEmbarcacoes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao excluir embarcação: ' + (err.response?.data?.error || err.message));
      setShowDeleteModal(false);
      setDeletingEmbarcacao(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleBuscarCliente = async () => {
    if (!buscaCliente) return;
    
    try {
      const cliente = await clienteService.buscarPorDocumento(buscaCliente.replace(/\D/g, ''));
      setClienteSelecionado(cliente);
      setFormData({ ...formData, cliente_id: cliente.id.toString() });
      setBuscaCliente('');
    } catch (err: any) {
      alert('Cliente não encontrado com o CPF/CNPJ informado');
    }
  };

  const handleSelecionarCliente = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clienteId = e.target.value;
    setFormData({ ...formData, cliente_id: clienteId });
    
    if (clienteId) {
      const cliente = clientes.find(c => c.id.toString() === clienteId);
      setClienteSelecionado(cliente || null);
    } else {
      setClienteSelecionado(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    console.log('=== FRONTEND DEBUG - HANDLE SUBMIT ===');
    console.log('editingEmbarcacao:', editingEmbarcacao);
    console.log('formData:', formData);

    try {
      // Preparar dados com tipos corretos e conversões
      const dataToSend: Partial<Embarcacao> = {
        nome: formData.nome,
        nr_inscricao_barco: formData.nr_inscricao_barco,
        cliente_id: formData.cliente_id ? parseInt(formData.cliente_id) : null,
        seguradora_id: formData.seguradora_id ? parseInt(formData.seguradora_id) : null,
        tipo_embarcacao: (formData.tipo_embarcacao || null) as TipoEmbarcacao | null,
        porte: formData.porte || null,
        valor_embarcacao: limparValorMonetario(formData.valor_embarcacao),
        ano_fabricacao: formData.ano_fabricacao ? parseInt(formData.ano_fabricacao) : null
      };

      if (editingEmbarcacao) {
        console.log('=== FRONTEND DEBUG - CHAMANDO UPDATE ===');
        console.log('ID da embarcação:', editingEmbarcacao.id);
        console.log('Dados para envio:', dataToSend);
        
        const result = await embarcacaoService.update(editingEmbarcacao.id, dataToSend);
        console.log('=== FRONTEND DEBUG - RESULTADO UPDATE ===');
        console.log('Resultado:', result);
        
        setSuccess('Embarcação atualizada com sucesso!');
      } else {
        console.log('=== FRONTEND DEBUG - CHAMANDO CREATE ===');
        const result = await embarcacaoService.create(dataToSend);
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
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmbarcacoes = embarcacoes.filter(embarcacao =>
    embarcacao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    embarcacao.nr_inscricao_barco.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <TableHeaderCell>NF de Inscrição</TableHeaderCell>
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
                <TableCell>{embarcacao.nr_inscricao_barco}</TableCell>
                <TableCell>
                  {embarcacao.Cliente ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} color="#6b7280" />
                        <strong>{embarcacao.Cliente.nome}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {embarcacao.Cliente.cpf ? formatarCPF(embarcacao.Cliente.cpf) : embarcacao.Cliente.cnpj}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>Não informado</span>
                  )}
                </TableCell>
                <TableCell>
                  {embarcacao.Cliente?.email ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Mail size={16} color="#6b7280" />
                      {embarcacao.Cliente.email}
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
                    <IconButton variant="delete" onClick={() => handleDeleteClick(embarcacao)}>
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
                <Label htmlFor="nr_inscricao_barco">Número de Inscrição *</Label>
                <Input
                  id="nr_inscricao_barco"
                  type="text"
                  value={formData.nr_inscricao_barco}
                  onChange={(e) => setFormData({ ...formData, nr_inscricao_barco: e.target.value })}
                  required
                  placeholder="Ex: BR123456789"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Número de Inscrição da embarcação
                </small>
              </FormGroup>

              {/* Seleção de Cliente */}
              <FormGroup>
                <Label>Cliente (Proprietário)</Label>
                {clienteSelecionado ? (
                  <div style={{
                    background: '#f0f9ff',
                    border: '2px solid #3b82f6',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>
                          {clienteSelecionado.nome}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {clienteSelecionado.cpf ? `CPF: ${formatarCPF(clienteSelecionado.cpf)}` : `CNPJ: ${clienteSelecionado.cnpj}`}
                        </div>
                        {clienteSelecionado.telefone_e164 && (
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Telefone: {clienteSelecionado.telefone_e164}
                          </div>
                        )}
                        {clienteSelecionado.cidade && clienteSelecionado.estado && (
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            {clienteSelecionado.cidade}/{clienteSelecionado.estado}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setClienteSelecionado(null);
                          setFormData({ ...formData, cliente_id: '' });
                        }}
                        style={{
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          padding: '0.5rem',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Input
                        type="text"
                        value={buscaCliente}
                        onChange={(e) => setBuscaCliente(e.target.value)}
                        placeholder="Digite CPF ou CNPJ para buscar..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleBuscarCliente();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleBuscarCliente}
                        style={{ minWidth: '100px' }}
                      >
                        Buscar
                      </Button>
                    </div>
                    <div style={{ textAlign: 'center', margin: '0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                      ou
                    </div>
                    <Select
                      id="cliente_id"
                      value={formData.cliente_id}
                      onChange={handleSelecionarCliente}
                    >
                      <option value="">Selecione um cliente cadastrado</option>
                      {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome} - {cliente.cpf ? formatarCPF(cliente.cpf) : cliente.cnpj}
                        </option>
                      ))}
                    </Select>
                  </>
                )}
                <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                  Para cadastrar um novo cliente, vá em "Clientes" no menu lateral
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="seguradora_id">Seguradora *</Label>
                <Select
                  id="seguradora_id"
                  value={formData.seguradora_id}
                  onChange={handleSeguradoraChange}
                  required
                >
                  <option value="">Selecione a seguradora</option>
                  {seguradoras.map((seguradora) => (
                    <option key={seguradora.id} value={seguradora.id}>
                      {seguradora.nome}
                    </option>
                  ))}
                </Select>
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Selecione a seguradora para ver os tipos disponíveis
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="tipo_embarcacao">Tipo de Embarcação *</Label>
                <Select
                  id="tipo_embarcacao"
                  value={formData.tipo_embarcacao}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, tipo_embarcacao: e.target.value })}
                  disabled={!formData.seguradora_id || tiposPermitidos.length === 0}
                  required
                >
                  <option value="">
                    {!formData.seguradora_id 
                      ? 'Primeiro selecione uma seguradora' 
                      : tiposPermitidos.length === 0 
                        ? 'Carregando tipos...' 
                        : 'Selecione o tipo'}
                  </option>
                  {tiposPermitidos.map((tipo) => (
                    <option key={tipo.tipo_embarcacao} value={tipo.tipo_embarcacao}>
                      {getLabelTipoEmbarcacaoSeguradora(tipo.tipo_embarcacao)}
                    </option>
                  ))}
                </Select>
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  {formData.seguradora_id 
                    ? `Tipos permitidos pela seguradora selecionada (${tiposPermitidos.length})` 
                    : 'Selecione uma seguradora primeiro'}
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="porte">Porte da Embarcação</Label>
                <Select
                  id="porte"
                  value={formData.porte}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, porte: e.target.value })}
                >
                  <option value="">Selecione o porte</option>
                  {PORTES_EMBARCACAO.map((porte) => (
                    <option key={porte.value} value={porte.value}>
                      {porte.label}
                    </option>
                  ))}
                </Select>
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Tamanho da embarcação (opcional)
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="valor_embarcacao">Valor da Embarcação (R$)</Label>
                <Input
                  id="valor_embarcacao"
                  type="text"
                  value={formData.valor_embarcacao}
                  onChange={(e) => setFormData({ ...formData, valor_embarcacao: mascaraValorMonetario(e.target.value) })}
                  placeholder="0,00"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Valor estimado da embarcação
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="ano_fabricacao">Ano de Fabricação</Label>
                <Input
                  id="ano_fabricacao"
                  type="number"
                  value={formData.ano_fabricacao}
                  onChange={(e) => setFormData({ ...formData, ano_fabricacao: e.target.value })}
                  placeholder="Ex: 2020"
                  min="1900"
                  max="2100"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Ano de fabricação da embarcação
                </small>
              </FormGroup>

              <ModalButtons>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      {editingEmbarcacao ? 'Atualizando...' : 'Criando...'}
                    </>
                  ) : (
                    editingEmbarcacao ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </ModalButtons>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <ModalOverlay onClick={() => setShowDeleteModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <h2>Excluir Embarcação</h2>
              <button onClick={() => setShowDeleteModal(false)}>&times;</button>
            </ModalHeader>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>
                Tem certeza que deseja excluir a embarcação <strong>{deletingEmbarcacao?.nome}</strong>?
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

export default Embarcacoes;
