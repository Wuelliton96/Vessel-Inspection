import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ClipboardList, 
  Ship, 
  MapPin, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  ClipboardCheck,
  Loader2,
  DollarSign,
  Mail,
  X,
  Camera,
  Building2,
  Phone,
  FileText
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Vistoria, Usuario, Embarcacao, Cliente, TipoPessoa } from '../types';
import { vistoriaService, usuarioService, embarcacaoService, clienteService } from '../services/api';
import { useAccessControl } from '../hooks/useAccessControl';
import { buscarCEP, formatarCEP, validarCEP } from '../utils/cepUtils';
import { useDebounce } from '../utils/debounce';
import { 
  mascaraValorMonetario, 
  limparValorMonetario, 
  formatarValorMonetario, 
  limparCPF,
  converterParaE164,
  mascaraCPF,
  mascaraTelefone,
  mascaraDocumento
} from '../utils/validators';

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

const TableRow = styled.tr<{ isAdmin?: boolean }>`
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

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;

  ${props => {
    switch (props.status) {
      case 'PENDENTE':
        return `
          background: #fef3c7;
          color: #92400e;
        `;
      case 'APROVADA':
        return `
          background: #d1fae5;
          color: #065f46;
        `;
      case 'REPROVADA':
        return `
          background: #fee2e2;
          color: #991b1b;
        `;
      default:
        return `
          background: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'PENDENTE':
      return <Clock size={14} />;
    case 'APROVADA':
      return <CheckCircle size={14} />;
    case 'REPROVADA':
      return <XCircle size={14} />;
    default:
      return <AlertCircle size={14} />;
  }
};

// Modal para criar/editar vistoria
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
  max-width: 700px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin: 2rem 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  
  &:first-child {
    margin-top: 0;
  }
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

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  resize: vertical;
  font-family: inherit;
  min-height: 80px;

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

const LoadingIcon = styled.span`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  animation: spin 1s linear infinite;
`;

const Vistorias: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAccessControl();
  const queryClient = useQueryClient();
  
  // Estados locais
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCPF, setFiltroCPF] = useState('');
  const [filtroVistoriador, setFiltroVistoriador] = useState('');
  const [tiposPermitidos, setTiposPermitidos] = useState<string[]>([]);
  
  // Debounce na busca para evitar requisições excessivas
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Usar React Query para cache de dados
  const { data: vistorias = [], isLoading: loadingVistorias } = useQuery({
    queryKey: ['vistorias', isAdmin],
    queryFn: () => isAdmin ? vistoriaService.getAll() : vistoriaService.getByVistoriador(),
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
    gcTime: 5 * 60 * 1000,
  });
  
  const { data: vistoriadores = [] } = useQuery({
    queryKey: ['vistoriadores'],
    queryFn: () => usuarioService.getAll(),
    enabled: isAdmin, // Só carrega se for admin
    staleTime: 10 * 60 * 1000, // Cache por 10 minutos (muda pouco)
    select: (data) => data.filter(u => u.nivelAcessoId === 2), // Filtrar apenas vistoriadores
  });
  
  const { data: seguradoras = [] } = useQuery({
    queryKey: ['seguradoras'],
    queryFn: async () => {
      const { seguradoraService } = await import('../services/api');
      return seguradoraService.getAll();
    },
    staleTime: 10 * 60 * 1000, // Cache por 10 minutos
  });
  
  const loading = loadingVistorias;
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingVistoria, setEditingVistoria] = useState<Vistoria | null>(null);
  const [deletingVistoria, setDeletingVistoria] = useState<Vistoria | null>(null);
  
  // Estados para busca inteligente de embarcação por CPF
  const [cpfBusca, setCpfBusca] = useState('');
  const [embarcacoesEncontradas, setEmbarcacoesEncontradas] = useState<Embarcacao[]>([]);
  const [buscandoEmbarcacao, setBuscandoEmbarcacao] = useState(false);
  const [modoEmbarcacao, setModoEmbarcacao] = useState<'buscar' | 'selecionar' | 'criar' | 'cadastrar_cliente'>('buscar');
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  
  // Estados para o formulário de cadastro de cliente
  const [clienteFormData, setClienteFormData] = useState({
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
    observacoes: '',
    ativo: true
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [clienteCepLoading, setClienteCepLoading] = useState(false);
  const [camposBloqueados, setCamposBloqueados] = useState({
    local_logradouro: false,
    local_bairro: false,
    local_cidade: false,
    local_estado: false
  });
  const [formData, setFormData] = useState({
    // Campos da Embarcação
    embarcacao_nome: '',
    embarcacao_nr_inscricao_barco: '',
    embarcacao_proprietario_nome: '',
    embarcacao_proprietario_cpf: '',
    embarcacao_proprietario_telefone_e164: '',
    embarcacao_proprietario_email: '',
    embarcacao_tipo: '', // JET_SKI, LANCHA, EMBARCACAO_COMERCIAL
    seguradora_id: 0,
    embarcacao_valor: '',
    embarcacao_ano_fabricacao: '',
    
    // Dados do Cliente (carregados automaticamente)
    cliente_nome: '',
    cliente_documento: '',
    cliente_telefone: '',
    cliente_email: '',
    cliente_endereco_completo: '',
    
    // Campos do Local
    local_tipo: 'MARINA' as 'MARINA' | 'RESIDENCIA',
    local_nome_local: '',
    local_cep: '',
    local_logradouro: '',
    local_numero: '',
    local_complemento: '',
    local_bairro: '',
    local_cidade: '',
    local_estado: '',
    
    // Campos da Vistoria
    vistoriador_id: 0,
    dados_rascunho: null as any,
    
    // Campos Financeiros
    valor_vistoria: '',
    valor_vistoriador: '',
    
    // Campos de Contato/Acompanhante
    contato_acompanhante_tipo: '',
    contato_acompanhante_nome: '',
    contato_acompanhante_telefone_e164: '',
    contato_acompanhante_email: '',
    
    // Campos da Corretora
    corretora_nome: '',
    corretora_telefone_e164: '',
    corretora_email_laudo: ''
  });

  // Verificar se há parâmetro de vistoria criada
  useEffect(() => {
    const createdId = searchParams.get('created');
    if (createdId) {
      const vistoriaId = parseInt(createdId, 10);
      if (!isNaN(vistoriaId)) {
        setSuccess(`Vistoria criada com sucesso! ID: #${vistoriaId}`);
        // Remover o parâmetro da URL após mostrar a mensagem
        setTimeout(() => {
          setSearchParams({});
          setSuccess('');
        }, 8000);
      }
    }
  }, [searchParams, setSearchParams]);

  // Função para invalidar cache quando necessário (após criar/editar/deletar)
  const invalidateVistorias = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['vistorias'] });
  }, [queryClient]);

  // Buscar CLIENTE por CPF/CNPJ
  const buscarPorCPF = async () => {
    if (!cpfBusca) {
      setError('Digite um CPF/CNPJ para buscar');
      return;
    }

    try {
      setBuscandoEmbarcacao(true);
      setError('');
      const documentoLimpo = cpfBusca.replace(/\D/g, '');
      
      // Buscar cliente por documento
      const cliente = await clienteService.buscarPorDocumento(documentoLimpo);
      setClienteEncontrado(cliente);
      
      // Buscar embarcações do cliente
      const todasEmbarcacoes = await embarcacaoService.getAll();
      const embarcacoesCliente = todasEmbarcacoes.filter(e => e.cliente_id === cliente.id);
      
      setEmbarcacoesEncontradas(embarcacoesCliente);
      
      if (embarcacoesCliente.length > 0) {
        setModoEmbarcacao('selecionar');
        setSuccess(`Cliente: ${cliente.nome} | ${embarcacoesCliente.length} embarcação(ões) encontrada(s)`);
      } else {
        setModoEmbarcacao('criar');
        setSuccess(`Cliente encontrado: ${cliente.nome}. Cadastre uma embarcação para ele.`);
      }
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Erro ao buscar cliente:', err);
      // Cliente não encontrado - mostrar opção de cadastro
      setClienteEncontrado(null);
      setEmbarcacoesEncontradas([]);
      setModoEmbarcacao('cadastrar_cliente');
    } finally {
      setBuscandoEmbarcacao(false);
    }
  };

  // Abrir modal de cadastro de cliente
  const handleOpenClienteModal = () => {
    // Pré-preencher com o CPF/CNPJ digitado
    const documentoLimpo = cpfBusca.replace(/\D/g, '');
    const isCPF = documentoLimpo.length === 11;
    
    setClienteFormData({
      tipo_pessoa: isCPF ? 'FISICA' : 'JURIDICA',
      nome: '',
      cpf: isCPF ? cpfBusca : '',
      cnpj: !isCPF ? cpfBusca : '',
      telefone_e164: '',
      email: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      observacoes: '',
      ativo: true
    });
    setShowClienteModal(true);
  };

  // Fechar modal de cliente
  const handleCloseClienteModal = () => {
    setShowClienteModal(false);
    setClienteFormData({
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
      observacoes: '',
      ativo: true
    });
  };

  // Buscar CEP para o modal de cliente
  const handleClienteCepChange = async (cep: string) => {
    // Apenas números
    const cepNumeros = cep.replace(/\D/g, '');
    setClienteFormData({ ...clienteFormData, cep: cepNumeros });

    // Buscar CEP automaticamente quando tiver 8 dígitos
    if (cepNumeros.length === 8) {
      setClienteCepLoading(true);
      try {
        const cepData = await buscarCEP(cepNumeros);
        if (cepData) {
          setClienteFormData(prev => ({
            ...prev,
            cep: cepData.cep,
            logradouro: cepData.logradouro,
            bairro: cepData.bairro,
            cidade: cepData.localidade,
            estado: cepData.uf
          }));
          
          setSuccess('Endereço preenchido automaticamente pelo CEP!');
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (error: any) {
        setError('CEP não encontrado');
        setTimeout(() => setError(''), 3000);
      } finally {
        setClienteCepLoading(false);
      }
    }
  };

  // Submeter cadastro de cliente
  const handleClienteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validar CPF/CNPJ
      const documento = clienteFormData.tipo_pessoa === 'FISICA' ? clienteFormData.cpf : clienteFormData.cnpj;
      if (!documento) {
        setError('Documento (CPF/CNPJ) é obrigatório');
        return;
      }

      setError('');
      const novoCliente = await clienteService.create(clienteFormData);
      setSuccess(`Cliente ${novoCliente.nome} cadastrado com sucesso!`);
      setTimeout(() => setSuccess(''), 5000);
      
      // Fechar modal
      handleCloseClienteModal();
      
      // Buscar automaticamente o cliente recém-cadastrado
      await buscarPorCPF();
      
    } catch (err: any) {
      console.error('Erro ao cadastrar cliente:', err);
      setError(err.response?.data?.message || 'Erro ao cadastrar cliente');
    }
  };

  // Selecionar embarcação existente
  const selecionarEmbarcacao = (embarcacao: Embarcacao) => {
    // Preencher dados da embarcação e do cliente
    const cliente = embarcacao.Cliente || clienteEncontrado;
    
    setFormData({
      ...formData,
      embarcacao_nome: embarcacao.nome,
      embarcacao_nr_inscricao_barco: embarcacao.nr_inscricao_barco,
      embarcacao_proprietario_nome: embarcacao.proprietario_nome || cliente?.nome || '',
      embarcacao_proprietario_cpf: embarcacao.proprietario_cpf || cliente?.cpf || '',
      embarcacao_proprietario_telefone_e164: embarcacao.proprietario_telefone_e164 || cliente?.telefone_e164 || '',
      embarcacao_proprietario_email: embarcacao.proprietario_email || cliente?.email || '',
      embarcacao_valor: embarcacao.valor_embarcacao ? formatarValorMonetario(embarcacao.valor_embarcacao) : '',
      embarcacao_ano_fabricacao: embarcacao.ano_fabricacao?.toString() || '',
      embarcacao_tipo: embarcacao.tipo_embarcacao || '',
      seguradora_id: embarcacao.seguradora_id || 0,
      
      // Dados do cliente para exibição
      cliente_nome: cliente?.nome || '',
      cliente_documento: cliente?.cpf || cliente?.cnpj || '',
      cliente_telefone: cliente?.telefone_e164 || '',
      cliente_email: cliente?.email || '',
      cliente_endereco_completo: cliente ? 
        `${cliente.logradouro || ''} ${cliente.numero || ''}, ${cliente.bairro || ''} - ${cliente.cidade || ''}/${cliente.estado || ''}`.trim() : ''
    });
    setSuccess(`Embarcação "${embarcacao.nome}" selecionada!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCreate = () => {
    setEditingVistoria(null);
    // Resetar estados de busca
    setCpfBusca('');
    setClienteEncontrado(null);
    setEmbarcacoesEncontradas([]);
    setModoEmbarcacao('buscar');
    setFormData({
      // Campos da Embarcação
      embarcacao_nome: '',
      embarcacao_nr_inscricao_barco: '',
      embarcacao_proprietario_nome: '',
      embarcacao_proprietario_cpf: '',
      embarcacao_proprietario_telefone_e164: '',
      embarcacao_proprietario_email: '',
      embarcacao_tipo: '',
      seguradora_id: 0,
      embarcacao_valor: '',
      embarcacao_ano_fabricacao: '',
      
      // Dados do Cliente
      cliente_nome: '',
      cliente_documento: '',
      cliente_telefone: '',
      cliente_email: '',
      cliente_endereco_completo: '',
      
      // Campos do Local
      local_tipo: 'MARINA',
      local_nome_local: '',
      local_cep: '',
      local_logradouro: '',
      local_numero: '',
      local_complemento: '',
      local_bairro: '',
      local_cidade: '',
      local_estado: '',
      
      // Campos da Vistoria
      vistoriador_id: vistoriadores.length > 0 ? vistoriadores[0].id : 0,
      dados_rascunho: null,
      
      // Campos Financeiros
      valor_vistoria: '',
      valor_vistoriador: '',
      
      // Campos de Contato/Acompanhante
      contato_acompanhante_tipo: '',
      contato_acompanhante_nome: '',
      contato_acompanhante_telefone_e164: '',
      contato_acompanhante_email: '',
      
      // Campos da Corretora
      corretora_nome: '',
      corretora_telefone_e164: '',
      corretora_email_laudo: ''
    });
    setShowModal(true);
  };

  const handleEdit = (vistoria: Vistoria) => {
    console.log('=== INICIANDO EDIÇÃO DE VISTORIA ===');
    console.log('Vistoria selecionada:', vistoria);
    console.log('Estrutura da vistoria:', JSON.stringify(vistoria, null, 2));
    
    setEditingVistoria(vistoria);
    
    const formDataToSet = {
      // Campos da Embarcação
      embarcacao_nome: vistoria.Embarcacao?.nome || vistoria.embarcacao?.nome || '',
      embarcacao_nr_inscricao_barco: vistoria.Embarcacao?.nr_inscricao_barco || vistoria.embarcacao?.nr_inscricao_barco || '',
      embarcacao_proprietario_nome: vistoria.Embarcacao?.proprietario_nome || vistoria.embarcacao?.proprietario_nome || '',
      embarcacao_proprietario_cpf: vistoria.Embarcacao?.proprietario_cpf || vistoria.embarcacao?.proprietario_cpf || '',
      embarcacao_proprietario_telefone_e164: vistoria.Embarcacao?.proprietario_telefone_e164 || vistoria.embarcacao?.proprietario_telefone_e164 || '',
      embarcacao_proprietario_email: vistoria.Embarcacao?.proprietario_email || vistoria.embarcacao?.proprietario_email || '',
      embarcacao_tipo: vistoria.Embarcacao?.tipo_embarcacao || vistoria.embarcacao?.tipo_embarcacao || '',
      seguradora_id: vistoria.Embarcacao?.seguradora_id || vistoria.embarcacao?.seguradora_id || 0,
      embarcacao_valor: vistoria.Embarcacao?.valor_embarcacao ? formatarValorMonetario(vistoria.Embarcacao.valor_embarcacao) : '',
      embarcacao_ano_fabricacao: vistoria.Embarcacao?.ano_fabricacao?.toString() || '',
      
      // Dados do Cliente
      cliente_nome: '',
      cliente_documento: '',
      cliente_telefone: '',
      cliente_email: '',
      cliente_endereco_completo: '',
      
      // Campos do Local
      local_tipo: vistoria.Local?.tipo || vistoria.local?.tipo || 'MARINA',
      local_nome_local: vistoria.Local?.nome_local || vistoria.local?.nome_local || '',
      local_cep: vistoria.Local?.cep || vistoria.local?.cep || '',
      local_logradouro: vistoria.Local?.logradouro || vistoria.local?.logradouro || '',
      local_numero: vistoria.Local?.numero || vistoria.local?.numero || '',
      local_complemento: vistoria.Local?.complemento || vistoria.local?.complemento || '',
      local_bairro: vistoria.Local?.bairro || vistoria.local?.bairro || '',
      local_cidade: vistoria.Local?.cidade || vistoria.local?.cidade || '',
      local_estado: vistoria.Local?.estado || vistoria.local?.estado || '',
      
      // Campos da Vistoria
      vistoriador_id: vistoria.vistoriador_id,
      dados_rascunho: vistoria.dados_rascunho,
      
      // Campos Financeiros
      valor_vistoria: vistoria.valor_vistoria ? formatarValorMonetario(vistoria.valor_vistoria) : '',
      valor_vistoriador: vistoria.valor_vistoriador ? formatarValorMonetario(vistoria.valor_vistoriador) : '',
      
      // Campos de Contato/Acompanhante
      contato_acompanhante_tipo: vistoria.contato_acompanhante_tipo || '',
      contato_acompanhante_nome: vistoria.contato_acompanhante_nome || '',
      contato_acompanhante_telefone_e164: vistoria.contato_acompanhante_telefone_e164 || '',
      contato_acompanhante_email: vistoria.contato_acompanhante_email || '',
      
      // Campos da Corretora
      corretora_nome: vistoria.corretora_nome || '',
      corretora_telefone_e164: vistoria.corretora_telefone_e164 || '',
      corretora_email_laudo: vistoria.corretora_email_laudo || ''
    };
    
    console.log('FormData configurado:', formDataToSet);
    setFormData(formDataToSet);
    setShowModal(true);
    
    console.log('=== EDIÇÃO INICIADA COM SUCESSO ===');
  };

  const handleDeleteClick = (vistoria: Vistoria) => {
    // Verificar se vistoria está PENDENTE
    if (vistoria.StatusVistoria?.nome !== 'PENDENTE') {
      setError(`Apenas vistorias com status PENDENTE podem ser excluídas. Status atual: ${vistoria.StatusVistoria?.nome}`);
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    setDeletingVistoria(vistoria);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingVistoria) return;

    try {
      await vistoriaService.delete(deletingVistoria.id);
      setSuccess('Vistoria excluída com sucesso!');
      setShowDeleteModal(false);
      setDeletingVistoria(null);
      invalidateVistorias(); // Atualiza cache
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao excluir vistoria: ' + (err.response?.data?.error || err.message));
      setShowDeleteModal(false);
      setDeletingVistoria(null);
    }
  };

  const handleCepChange = async (cep: string) => {
    // Formatar CEP enquanto digita
    const cepFormatado = formatarCEP(cep);
    setFormData({ ...formData, local_cep: cepFormatado });

    // Buscar CEP automaticamente quando tiver 8 dígitos
    if (validarCEP(cep)) {
      setCepLoading(true);
      try {
        const cepData = await buscarCEP(cep);
        if (cepData) {
          setFormData(prev => ({
            ...prev,
            local_cep: cepData.cep,
            local_logradouro: cepData.logradouro,
            local_bairro: cepData.bairro,
            local_cidade: cepData.localidade,
            local_estado: cepData.uf
          }));
          
          // Bloquear campos preenchidos automaticamente
          setCamposBloqueados({
            local_logradouro: true,
            local_bairro: true,
            local_cidade: true,
            local_estado: true
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
      local_logradouro: false,
      local_bairro: false,
      local_cidade: false,
      local_estado: false
    });
    setSuccess('Campos desbloqueados! Você pode editá-los manualmente.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      console.log('=== INICIANDO ATUALIZAÇÃO DE VISTORIA ===');
      console.log('editingVistoria:', editingVistoria);
      console.log('formData:', formData);
      
      // Preparar dados com valores monetários convertidos e tipos corretos
      const dataToSend: any = {
        ...formData,
        seguradora_id: formData.seguradora_id || null,
        tipo_embarcacao: formData.embarcacao_tipo || null,
        valor_vistoria: limparValorMonetario(formData.valor_vistoria),
        valor_vistoriador: limparValorMonetario(formData.valor_vistoriador),
        contato_acompanhante_tipo: formData.contato_acompanhante_tipo || null,
        contato_acompanhante_telefone_e164: formData.contato_acompanhante_telefone_e164 ? converterParaE164(formData.contato_acompanhante_telefone_e164) : null,
        embarcacao_proprietario_cpf: formData.embarcacao_proprietario_cpf ? limparCPF(formData.embarcacao_proprietario_cpf) : null,
        embarcacao_proprietario_telefone_e164: formData.embarcacao_proprietario_telefone_e164 ? converterParaE164(formData.embarcacao_proprietario_telefone_e164) : null,
        embarcacao_valor: limparValorMonetario(formData.embarcacao_valor),
        embarcacao_ano_fabricacao: formData.embarcacao_ano_fabricacao ? parseInt(formData.embarcacao_ano_fabricacao) : null,
        corretora_telefone_e164: formData.corretora_telefone_e164 ? converterParaE164(formData.corretora_telefone_e164) : null
      };
      
      console.log('Dados preparados para envio:', dataToSend);
      
      if (editingVistoria) {
        console.log('Atualizando vistoria ID:', editingVistoria.id);
        console.log('Dados para atualização:', dataToSend);
        
        const response = await vistoriaService.update(editingVistoria.id, dataToSend);
        console.log('Resposta da atualização:', response);
        
        setSuccess('Vistoria atualizada com sucesso!');
      } else {
        console.log('Criando nova vistoria');
        console.log('Dados para criação:', dataToSend);
        
        const response = await vistoriaService.create(dataToSend);
        console.log('Resposta da criação:', response);
        
        setSuccess('Vistoria criada com sucesso!');
      }
      
      setShowModal(false);
      invalidateVistorias(); // Atualiza cache
      setTimeout(() => setSuccess(''), 3000);
      
      console.log('=== ATUALIZAÇÃO CONCLUÍDA COM SUCESSO ===');
    } catch (err: any) {
      console.error('Erro ao salvar vistoria:', err);
      console.error('Erro completo:', JSON.stringify(err, null, 2));
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      
      setError('Erro ao salvar vistoria: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Função para formatar data
  const formatarData = (data: string | null | undefined): string => {
    if (!data) return 'N/A';
    try {
      const dataObj = new Date(data);
      if (isNaN(dataObj.getTime())) return 'N/A';
      return dataObj.toLocaleDateString('pt-BR');
    } catch {
      return 'N/A';
    }
  };

  // Memoizar filtro de vistorias para melhor performance
  const filteredVistorias = useMemo(() => {
    return vistorias.filter(vistoria => {
      const searchLower = debouncedSearchTerm.toLowerCase();
      const embarcacaoNome = (vistoria.Embarcacao?.nome || vistoria.embarcacao?.nome || '').toLowerCase();
      const embarcacaoNumero = (vistoria.Embarcacao?.nr_inscricao_barco || vistoria.embarcacao?.nr_inscricao_barco || '').toLowerCase();
      const proprietarioCPF = (vistoria.Embarcacao?.proprietario_cpf || vistoria.embarcacao?.proprietario_cpf || '');
      const localNome = (vistoria.Local?.nome_local || vistoria.local?.nome_local || '').toLowerCase();
      const vistoriadorNome = vistoria.vistoriador?.nome?.toLowerCase() || '';
      const vistoriadorId = vistoria.vistoriador_id?.toString() || '';
      const statusNome = (vistoria.StatusVistoria?.nome || vistoria.statusVistoria?.nome || '').toLowerCase();
      
      // Filtro de texto geral (usa debouncedSearchTerm)
      const matchSearch = !debouncedSearchTerm || (
        embarcacaoNome.includes(searchLower) ||
        embarcacaoNumero.includes(searchLower) ||
        localNome.includes(searchLower) ||
        vistoriadorNome.includes(searchLower) ||
        statusNome.includes(searchLower)
      );
      
      // Filtro de CPF do proprietário
      const matchCPF = !filtroCPF || proprietarioCPF.includes(filtroCPF.replace(/\D/g, ''));
      
      // Filtro de vistoriador
      const matchVistoriador = !filtroVistoriador || vistoriadorId === filtroVistoriador;
      
      return matchSearch && matchCPF && matchVistoriador;
    });
  }, [vistorias, debouncedSearchTerm, filtroCPF, filtroVistoriador]);

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <ClipboardList size={48} />
          <p>Carregando vistorias...</p>
        </LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <ClipboardList size={32} />
          Vistorias
        </Title>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Buscar vistorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isAdmin && (
            <Button variant="primary" onClick={() => navigate('/vistorias/nova')} title="Criar nova vistoria (Admin)">
              <Plus size={20} />
              Nova Vistoria
            </Button>
          )}
          {!isAdmin && (
            <Button variant="secondary" onClick={() => navigate('/vistorias')} title="Minhas vistorias">
              <ClipboardCheck size={20} />
              Minhas Vistorias
            </Button>
          )}
        </SearchContainer>
      </Header>

      {/* Filtros Avançados */}
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: '12px', 
        marginBottom: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          marginBottom: '1rem',
          color: '#3b82f6',
          fontWeight: 600
        }}>
          <Search size={20} />
          Filtros Avançados
          {(filtroCPF || filtroVistoriador) && (
            <span style={{ 
              background: '#dbeafe', 
              padding: '0.25rem 0.6rem', 
              borderRadius: '12px',
              fontSize: '0.8rem'
            }}>
              {filteredVistorias.length} resultado(s)
            </span>
          )}
        </div>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
        <div>
          <label style={{ 
            display: 'block', 
            fontWeight: 600, 
            color: '#374151', 
            marginBottom: '0.5rem',
            fontSize: '0.9rem'
          }}>
            CPF do Proprietário
          </label>
          <SearchInput
            type="text"
            placeholder="000.000.000-00"
            value={filtroCPF}
            onChange={(e) => setFiltroCPF(mascaraCPF(e.target.value))}
            maxLength={14}
            style={{ width: '100%' }}
          />
        </div>
        
        {isAdmin && (
          <div>
            <label style={{ 
              display: 'block', 
              fontWeight: 600, 
              color: '#374151', 
              marginBottom: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Vistoriador
            </label>
            <select
              value={filtroVistoriador}
              onChange={(e) => setFiltroVistoriador(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'white'
              }}
            >
              <option value="">Todos os vistoriadores</option>
              {vistoriadores.map(v => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </select>
          </div>
        )}
        
        {(filtroCPF || filtroVistoriador) && (
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button 
              variant="secondary" 
              onClick={() => {
                setFiltroCPF('');
                setFiltroVistoriador('');
              }}
              style={{ width: '100%' }}
            >
              <X size={18} />
              Limpar Filtros
            </Button>
          </div>
        )}
        </div>
      </div>


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

      {filteredVistorias.length === 0 ? (
        <EmptyState>
          <ClipboardList size={64} />
          <h3>Nenhuma vistoria encontrada</h3>
          <p>
            {searchTerm 
              ? 'Tente ajustar os termos de busca' 
              : isAdmin 
                ? 'Comece criando sua primeira vistoria'
                : 'Você ainda não possui vistorias atribuídas'
            }
          </p>
        </EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell style={{ width: '80px' }}>ID</TableHeaderCell>
              <TableHeaderCell>Embarcação</TableHeaderCell>
              <TableHeaderCell>Local</TableHeaderCell>
              <TableHeaderCell>Vistoriador</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Data Criação</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredVistorias.map((vistoria) => (
              <TableRow key={vistoria.id} isAdmin={isAdmin}>
                <TableCell>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '6px',
                    minWidth: '60px',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                  }}>
                    #{vistoria.id}
                  </div>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Ship size={20} color="#3b82f6" />
                    <div>
                      <div style={{ fontWeight: '600' }}>{vistoria.Embarcacao?.nome || vistoria.embarcacao?.nome || 'N/A'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {vistoria.Embarcacao?.nr_inscricao_barco || vistoria.embarcacao?.nr_inscricao_barco || 'N/A'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={20} color="#3b82f6" />
                    <div>
                      <div style={{ fontWeight: '600' }}>{vistoria.Local?.nome_local || vistoria.local?.nome_local || 'N/A'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {vistoria.Local?.cidade || vistoria.local?.cidade || 'N/A'}, {vistoria.Local?.estado || vistoria.local?.estado || 'N/A'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={20} color="#6b7280" />
                    <div>
                      <div style={{ fontWeight: '600' }}>{vistoria.vistoriador?.nome || 'N/A'}</div>
                      {vistoria.vistoriador?.estado && (
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          UF: {vistoria.vistoriador.estado}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div style={{ 
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    background: '#f3f4f6',
                    color: '#374151',
                    fontWeight: '600',
                    textAlign: 'center',
                    fontSize: '0.9rem'
                  }}>
                    {vistoria.Local?.estado || vistoria.local?.estado || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={vistoria.StatusVistoria?.nome || vistoria.statusVistoria?.nome || 'DESCONHECIDO'}>
                    {getStatusIcon(vistoria.StatusVistoria?.nome || vistoria.statusVistoria?.nome || '')}
                    {vistoria.StatusVistoria?.nome || vistoria.statusVistoria?.nome || 'DESCONHECIDO'}
                  </StatusBadge>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="#6b7280" />
                    <div style={{ fontWeight: '600' }}>{formatarData((vistoria as any).created_at || vistoria.createdAt)}</div>
                  </div>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <ActionButtons>
                      <IconButton 
                        variant="edit" 
                        onClick={() => navigate(`/vistoria/${vistoria.id}/fotos`)}
                        title="Ver fotos da vistoria"
                        style={{ background: '#dbeafe', color: '#1e40af' }}
                      >
                        <Camera size={16} />
                      </IconButton>
                      {vistoria.StatusVistoria?.nome === 'CONCLUIDA' && (
                        <IconButton 
                          variant="edit"
                          onClick={() => navigate(`/vistorias/${vistoria.id}/laudo/novo`)}
                          title="Criar/Editar Laudo"
                          style={{ background: '#dcfce7', color: '#166534' }}
                        >
                          <FileText size={16} />
                        </IconButton>
                      )}
                      <IconButton 
                        variant="edit" 
                        onClick={() => handleEdit(vistoria)}
                        title="Editar vistoria (Admin)"
                      >
                        <Edit size={16} />
                      </IconButton>
                      {vistoria.StatusVistoria?.nome === 'PENDENTE' && (
                        <IconButton 
                          variant="delete" 
                          onClick={() => handleDeleteClick(vistoria)}
                          title="Excluir vistoria (apenas se PENDENTE)"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      )}
                    </ActionButtons>
                  </TableCell>
                )}
                {!isAdmin && (
                  <TableCell>
                    <ActionButtons>
                      <IconButton 
                        variant="edit" 
                        onClick={() => navigate(`/vistoria/${vistoria.id}`)}
                        title="Realizar vistoria"
                      >
                        <ClipboardCheck size={16} />
                      </IconButton>
                    </ActionButtons>
                  </TableCell>
                )}
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
                {editingVistoria ? 'Editar Vistoria' : 'Nova Vistoria'}
              </ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>&times;</CloseButton>
            </ModalHeader>

            <Form onSubmit={handleSubmit}>
              {/* Seção da Embarcação */}
              <SectionTitle>
                <Ship size={20} />
                Dados da Embarcação
              </SectionTitle>

              {/* Busca Inteligente por CPF */}
              {!editingVistoria && (
                <div style={{ 
                  background: '#f0f9ff', 
                  border: '2px dashed #3b82f6', 
                  borderRadius: '8px', 
                  padding: '1.5rem', 
                  marginBottom: '1.5rem' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Ship size={18} color="#3b82f6" />
                    <strong style={{ color: '#1e40af' }}>Buscar Cliente por CPF/CNPJ</strong>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <FormGroup style={{ flex: 1, marginBottom: 0 }}>
                      <Label htmlFor="cpf_busca">CPF/CNPJ do Cliente</Label>
                      <Input
                        id="cpf_busca"
                        type="text"
                        value={cpfBusca}
                        onChange={(e) => setCpfBusca(mascaraDocumento(e.target.value))}
                        placeholder="CPF: 000.000.000-00 ou CNPJ: 00.000.000/0000-00"
                        maxLength={18}
                        disabled={modoEmbarcacao !== 'buscar'}
                      />
                    </FormGroup>
                    
                    <Button
                      type="button"
                      onClick={buscarPorCPF}
                      disabled={buscandoEmbarcacao || !cpfBusca}
                      style={{ 
                        minWidth: '120px',
                        background: modoEmbarcacao !== 'buscar' ? '#6b7280' : undefined
                      }}
                    >
                      {buscandoEmbarcacao ? 'Buscando...' : 'Buscar'}
                    </Button>
                    
                    {modoEmbarcacao !== 'buscar' && (
                      <Button
                        type="button"
                        onClick={() => {
                          setCpfBusca('');
                          setClienteEncontrado(null);
                          setEmbarcacoesEncontradas([]);
                          setModoEmbarcacao('buscar');
                          setFormData({
                            ...formData,
                            embarcacao_nome: '',
                            embarcacao_nr_inscricao_barco: '',
                            embarcacao_proprietario_nome: '',
                            embarcacao_proprietario_cpf: '',
                            embarcacao_proprietario_telefone_e164: '',
                            embarcacao_valor: '',
                            embarcacao_ano_fabricacao: '',
                            embarcacao_proprietario_email: '',
                            embarcacao_tipo: '',
                            seguradora_id: 0
                          });
                        }}
                        style={{ background: '#dc2626', minWidth: '100px' }}
                      >
                        Nova Busca
                      </Button>
                    )}
                  </div>

                  {/* Cliente Encontrado - Mostrar Dados */}
                  {clienteEncontrado && (modoEmbarcacao === 'selecionar' || modoEmbarcacao === 'criar') && (
                    <div style={{
                      marginTop: '1rem',
                      background: '#dcfce7',
                      border: '2px solid #10b981',
                      borderRadius: '8px',
                      padding: '1rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <CheckCircle size={20} color="#166534" />
                        <strong style={{ color: '#166534' }}>Cliente Encontrado</strong>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#166534', display: 'grid', gap: '0.25rem' }}>
                        <div><strong>Nome:</strong> {clienteEncontrado.nome}</div>
                        <div><strong>Documento:</strong> {clienteEncontrado.cpf ? `CPF: ${clienteEncontrado.cpf}` : `CNPJ: ${clienteEncontrado.cnpj}`}</div>
                        {clienteEncontrado.telefone_e164 && <div><strong>Telefone:</strong> {clienteEncontrado.telefone_e164}</div>}
                        {clienteEncontrado.email && <div><strong>Email:</strong> {clienteEncontrado.email}</div>}
                        {clienteEncontrado.cidade && clienteEncontrado.estado && (
                          <div><strong>Endereço:</strong> {clienteEncontrado.logradouro || ''} {clienteEncontrado.numero || ''}, {clienteEncontrado.cidade}/{clienteEncontrado.estado}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cliente não encontrado - Botão para cadastrar */}
                  {modoEmbarcacao === 'cadastrar_cliente' && (
                    <div style={{
                      marginTop: '1rem',
                      background: '#fef3c7',
                      border: '2px solid #f59e0b',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      textAlign: 'center'
                    }}>
                      <AlertCircle size={32} color="#f59e0b" style={{ marginBottom: '0.75rem' }} />
                      <h3 style={{ color: '#92400e', marginBottom: '0.5rem', fontSize: '1.125rem' }}>
                        Cliente Não Encontrado
                      </h3>
                      <p style={{ color: '#92400e', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                        Nenhum cliente foi encontrado com o CPF/CNPJ informado.
                      </p>
                      <p style={{ color: '#92400e', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '600' }}>
                        Para criar uma vistoria, é necessário cadastrar o cliente primeiro.
                      </p>
                      
                      <div style={{
                        background: '#fff9e6',
                        border: '1px solid #f59e0b',
                        borderRadius: '6px',
                        padding: '1rem',
                        marginBottom: '1.25rem',
                        textAlign: 'left'
                      }}>
                        <p style={{ color: '#92400e', fontSize: '0.85rem', margin: '0 0 0.5rem 0', fontWeight: '600' }}>
                          Como proceder:
                        </p>
                        <ol style={{ color: '#92400e', fontSize: '0.85rem', margin: '0', paddingLeft: '1.5rem' }}>
                          <li>Clique em "Cadastrar Novo Cliente" (abrirá um formulário)</li>
                          <li>Preencha os dados do cliente (nome, endereço, etc.)</li>
                          <li>Clique em "Cadastrar Cliente"</li>
                          <li>O cliente será automaticamente selecionado</li>
                        </ol>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                          type="button"
                          onClick={handleOpenClienteModal}
                          style={{ 
                            background: '#10b981',
                            fontSize: '0.9rem',
                            padding: '0.75rem 1.25rem'
                          }}
                        >
                          <Plus size={18} style={{ marginRight: '0.5rem' }} />
                          Cadastrar Novo Cliente
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            // Buscar novamente após cadastrar cliente
                            if (cpfBusca) {
                              buscarPorCPF();
                            }
                          }}
                          style={{ 
                            background: '#3b82f6',
                            fontSize: '0.9rem',
                            padding: '0.75rem 1.25rem'
                          }}
                        >
                          <Search size={18} style={{ marginRight: '0.5rem' }} />
                          Buscar Novamente
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            setCpfBusca('');
                            setModoEmbarcacao('buscar');
                          }}
                          style={{ 
                            background: '#6b7280',
                            fontSize: '0.9rem',
                            padding: '0.75rem 1.25rem'
                          }}
                        >
                          ← Voltar
                        </Button>
                      </div>
                    </div>
                  )}

                  {modoEmbarcacao === 'selecionar' && embarcacoesEncontradas.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <Label style={{ marginBottom: 0 }}>Selecione uma embarcação:</Label>
                        <Button
                          type="button"
                          onClick={() => {
                            setModoEmbarcacao('criar');
                            setFormData({
                              ...formData,
                              embarcacao_nome: '',
                              embarcacao_nr_inscricao_barco: '',
                              embarcacao_proprietario_nome: clienteEncontrado?.nome || '',
                              embarcacao_proprietario_cpf: clienteEncontrado?.cpf || '',
                              embarcacao_proprietario_telefone_e164: clienteEncontrado?.telefone_e164 || '',
                              embarcacao_valor: '',
                              embarcacao_ano_fabricacao: '',
                              embarcacao_proprietario_email: clienteEncontrado?.email || '',
                              embarcacao_tipo: '',
                              seguradora_id: 0
                            });
                            setSuccess(`Cadastre uma nova embarcação para: ${clienteEncontrado?.nome}`);
                            setTimeout(() => setSuccess(''), 3000);
                          }}
                          style={{ 
                            background: '#10b981', 
                            fontSize: '0.875rem',
                            padding: '0.5rem 1rem'
                          }}
                        >
                          + Cadastrar Nova Embarcação
                        </Button>
                      </div>
                      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.5rem' }}>
                        {embarcacoesEncontradas.map((emb) => (
                          <div
                            key={emb.id}
                            onClick={() => selecionarEmbarcacao(emb)}
                            style={{
                              padding: '1rem',
                              border: formData.embarcacao_nr_inscricao_barco === emb.nr_inscricao_barco 
                                ? '2px solid #3b82f6' 
                                : '1px solid #e5e7eb',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: formData.embarcacao_nr_inscricao_barco === emb.nr_inscricao_barco 
                                ? '#eff6ff' 
                                : 'white',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ fontWeight: 600, color: '#1f2937' }}>{emb.nome}</div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                              NF Insc: {emb.nr_inscricao_barco}
                            </div>
                            {emb.tipo_embarcacao && (
                              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                Tipo: {emb.tipo_embarcacao}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {modoEmbarcacao === 'criar' && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ 
                        padding: '0.75rem', 
                        background: '#fef3c7', 
                        border: '1px solid #fbbf24', 
                        borderRadius: '6px',
                        marginBottom: embarcacoesEncontradas.length > 0 ? '0.75rem' : 0
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ color: '#92400e' }}>Nova Embarcação para: {clienteEncontrado?.nome || 'Cliente'}</strong>
                            <p style={{ fontSize: '0.875rem', color: '#92400e', marginTop: '0.25rem', marginBottom: 0 }}>
                              Preencha os dados abaixo para cadastrar uma nova embarcação.
                            </p>
                          </div>
                          {embarcacoesEncontradas.length > 0 && (
                            <Button
                              type="button"
                              onClick={() => {
                                setModoEmbarcacao('selecionar');
                                setFormData({
                                  ...formData,
                                  embarcacao_nome: '',
                                  embarcacao_nr_inscricao_barco: '',
                                  embarcacao_proprietario_nome: clienteEncontrado?.nome || '',
                                  embarcacao_proprietario_cpf: clienteEncontrado?.cpf || '',
                                  embarcacao_proprietario_telefone_e164: clienteEncontrado?.telefone_e164 || '',
                                  embarcacao_valor: '',
                                  embarcacao_ano_fabricacao: '',
                                  embarcacao_proprietario_email: clienteEncontrado?.email || '',
                                  embarcacao_tipo: '',
                                  seguradora_id: 0
                                });
                              }}
                              style={{ 
                                background: '#3b82f6', 
                                fontSize: '0.875rem',
                                padding: '0.5rem 1rem',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              ← Voltar para Lista
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <FormGroup>
                <Label htmlFor="embarcacao_nome">Nome da Embarcação *</Label>
                <Input
                  id="embarcacao_nome"
                  type="text"
                  value={formData.embarcacao_nome}
                  onChange={(e) => setFormData({ ...formData, embarcacao_nome: e.target.value })}
                  required
                  placeholder="Ex: Veleiro Azul"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="embarcacao_nr_inscricao_barco">Número de Inscrição *</Label>
                <Input
                  id="embarcacao_nr_inscricao_barco"
                  type="text"
                  value={formData.embarcacao_nr_inscricao_barco}
                  onChange={(e) => setFormData({ ...formData, embarcacao_nr_inscricao_barco: e.target.value })}
                  required
                  placeholder="Ex: BR123456789"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="embarcacao_proprietario_nome">Nome do Proprietário</Label>
                <Input
                  id="embarcacao_proprietario_nome"
                  type="text"
                  value={formData.embarcacao_proprietario_nome}
                  onChange={(e) => setFormData({ ...formData, embarcacao_proprietario_nome: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="embarcacao_proprietario_cpf">CPF do Proprietário</Label>
                <Input
                  id="embarcacao_proprietario_cpf"
                  type="text"
                  value={formData.embarcacao_proprietario_cpf}
                  onChange={(e) => setFormData({ ...formData, embarcacao_proprietario_cpf: mascaraCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  disabled={modoEmbarcacao === 'selecionar'}
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  {modoEmbarcacao === 'criar' && !cpfBusca 
                    ? 'Formato: 000.000.000-00 (opcional)' 
                    : modoEmbarcacao === 'selecionar' 
                    ? 'CPF já preenchido da embarcação selecionada' 
                    : 'Preenchido automaticamente da busca'}
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="embarcacao_proprietario_telefone">Telefone do Proprietário</Label>
                <Input
                  id="embarcacao_proprietario_telefone"
                  type="text"
                  value={formData.embarcacao_proprietario_telefone_e164}
                  onChange={(e) => {
                    const telefone = e.target.value;
                    // Aplicar máscara apenas se não estiver em formato E.164
                    if (!telefone.startsWith('+')) {
                      const masked = telefone.replace(/\D/g, '')
                        .replace(/^(\d{2})(\d)/g, '($1) $2')
                        .replace(/(\d{5})(\d)/, '$1-$2')
                        .slice(0, 15);
                      setFormData({ ...formData, embarcacao_proprietario_telefone_e164: masked });
                    } else {
                      setFormData({ ...formData, embarcacao_proprietario_telefone_e164: telefone });
                    }
                  }}
                  placeholder="(11) 99999-8888"
                  maxLength={15}
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Formato: (DD) 9XXXX-XXXX (opcional)
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="embarcacao_proprietario_email">Email do Proprietário</Label>
                <Input
                  id="embarcacao_proprietario_email"
                  type="email"
                  value={formData.embarcacao_proprietario_email}
                  onChange={(e) => setFormData({ ...formData, embarcacao_proprietario_email: e.target.value })}
                  placeholder="Ex: joao@email.com"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="seguradora_id">Seguradora *</Label>
                <Select
                  id="seguradora_id"
                  value={formData.seguradora_id}
                  onChange={async (e) => {
                    const segId = parseInt(e.target.value);
                    setFormData({ ...formData, seguradora_id: segId, embarcacao_tipo: '' });
                    
                    // Carregar tipos permitidos da seguradora
                    if (segId > 0) {
                      try {
                        const { seguradoraService } = await import('../services/api');
                        const seg = seguradoras.find((s: any) => s.id === segId);
                        if (seg && seg.tiposPermitidos) {
                          const tipos = seg.tiposPermitidos.map((t: any) => t.tipo_embarcacao);
                          setTiposPermitidos(tipos);
                          console.log('Tipos permitidos:', tipos);
                        }
                      } catch (err) {
                        console.error('Erro ao carregar tipos:', err);
                      }
                    } else {
                      setTiposPermitidos([]);
                    }
                  }}
                  required
                >
                  <option value="0">Selecione a seguradora</option>
                  {seguradoras.map((seg: any) => (
                    <option key={seg.id} value={seg.id}>
                      {seg.nome}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="embarcacao_tipo">Tipo de Embarcação *</Label>
                <Select
                  id="embarcacao_tipo"
                  value={formData.embarcacao_tipo}
                  onChange={(e) => setFormData({ ...formData, embarcacao_tipo: e.target.value })}
                  required
                  disabled={!formData.seguradora_id || formData.seguradora_id === 0}
                >
                  <option value="">
                    {formData.seguradora_id === 0 ? 'Selecione a seguradora primeiro' : 'Selecione o tipo'}
                  </option>
                  {tiposPermitidos.map((tipo: string) => (
                    <option key={tipo} value={tipo}>
                      {tipo === 'JET_SKI' ? 'Jet Ski' : tipo === 'LANCHA' ? 'Lancha' : 'Embarcação Comercial'}
                    </option>
                  ))}
                </Select>
                {formData.seguradora_id > 0 && tiposPermitidos.length > 0 && (
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Tipos permitidos para esta seguradora: {tiposPermitidos.length}
                  </small>
                )}
              </FormGroup>

              {/* Valor da embarcação agora está cadastrado na própria embarcação */}

              <FormGroup>
                <Label htmlFor="embarcacao_ano_fabricacao">Ano de Fabricação</Label>
                <Input
                  id="embarcacao_ano_fabricacao"
                  type="number"
                  value={formData.embarcacao_ano_fabricacao}
                  onChange={(e) => setFormData({ ...formData, embarcacao_ano_fabricacao: e.target.value })}
                  placeholder="Ex: 2020"
                  min="1900"
                  max="2100"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Ano de fabricação da embarcação
                </small>
              </FormGroup>

              {/* Seção do Local */}
              <SectionTitle>
                <MapPin size={20} />
                Endereço para Realização da Vistoria / Local da Embarcação
              </SectionTitle>
              <small style={{ color: '#6b7280', fontSize: '0.875rem', display: 'block', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                Este endereço é onde a vistoria será realizada (pode ser diferente do endereço do cliente)
              </small>

              <FormGroup>
                <Label htmlFor="local_tipo">Tipo de Local *</Label>
                <Select
                  id="local_tipo"
                  value={formData.local_tipo}
                  onChange={(e) => setFormData({ ...formData, local_tipo: e.target.value as 'MARINA' | 'RESIDENCIA' })}
                  required
                >
                  <option value="MARINA">Marina</option>
                  <option value="RESIDENCIA">Residência</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="local_nome_local">Nome do Local</Label>
                <Input
                  id="local_nome_local"
                  type="text"
                  value={formData.local_nome_local}
                  onChange={(e) => setFormData({ ...formData, local_nome_local: e.target.value })}
                  placeholder="Ex: Marina Sul"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="local_cep">
                  CEP
                  {cepLoading && (
                    <LoadingIcon style={{ marginLeft: '0.5rem', color: '#3b82f6' }}>
                      <Search size={14} />
                    </LoadingIcon>
                  )}
                </Label>
                <Input
                  id="local_cep"
                  type="text"
                  value={formData.local_cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="Ex: 12345-678"
                  maxLength={9}
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Digite o CEP para preenchimento automático do endereço
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="local_logradouro">
                  Logradouro
                  {camposBloqueados.local_logradouro && (
                    <span style={{ marginLeft: '0.5rem', color: '#10b981' }}>
                      <CheckCircle size={14} />
                    </span>
                  )}
                </Label>
                <Input
                  id="local_logradouro"
                  type="text"
                  value={formData.local_logradouro}
                  onChange={(e) => setFormData({ ...formData, local_logradouro: e.target.value })}
                  placeholder="Ex: Rua das Palmeiras"
                  disabled={camposBloqueados.local_logradouro}
                  style={{
                    backgroundColor: camposBloqueados.local_logradouro ? '#f3f4f6' : 'white',
                    color: camposBloqueados.local_logradouro ? '#6b7280' : '#111827'
                  }}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="local_numero">Número</Label>
                <Input
                  id="local_numero"
                  type="text"
                  value={formData.local_numero}
                  onChange={(e) => setFormData({ ...formData, local_numero: e.target.value })}
                  placeholder="Ex: 123"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="local_complemento">Complemento</Label>
                <Input
                  id="local_complemento"
                  type="text"
                  value={formData.local_complemento}
                  onChange={(e) => setFormData({ ...formData, local_complemento: e.target.value })}
                  placeholder="Ex: Apto 45"
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="local_bairro">
                  Bairro
                  {camposBloqueados.local_bairro && (
                    <span style={{ marginLeft: '0.5rem', color: '#10b981' }}>
                      <CheckCircle size={14} />
                    </span>
                  )}
                </Label>
                <Input
                  id="local_bairro"
                  type="text"
                  value={formData.local_bairro}
                  onChange={(e) => setFormData({ ...formData, local_bairro: e.target.value })}
                  placeholder="Ex: Centro"
                  disabled={camposBloqueados.local_bairro}
                  style={{
                    backgroundColor: camposBloqueados.local_bairro ? '#f3f4f6' : 'white',
                    color: camposBloqueados.local_bairro ? '#6b7280' : '#111827'
                  }}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="local_cidade">
                  Cidade
                  {camposBloqueados.local_cidade && (
                    <span style={{ marginLeft: '0.5rem', color: '#10b981' }}>
                      <CheckCircle size={14} />
                    </span>
                  )}
                </Label>
                <Input
                  id="local_cidade"
                  type="text"
                  value={formData.local_cidade}
                  onChange={(e) => setFormData({ ...formData, local_cidade: e.target.value })}
                  placeholder="Ex: Santos"
                  disabled={camposBloqueados.local_cidade}
                  style={{
                    backgroundColor: camposBloqueados.local_cidade ? '#f3f4f6' : 'white',
                    color: camposBloqueados.local_cidade ? '#6b7280' : '#111827'
                  }}
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="local_estado">
                  Estado
                  {camposBloqueados.local_estado && (
                    <span style={{ marginLeft: '0.5rem', color: '#10b981' }}>
                      <CheckCircle size={14} />
                    </span>
                  )}
                </Label>
                <Input
                  id="local_estado"
                  type="text"
                  value={formData.local_estado}
                  onChange={(e) => setFormData({ ...formData, local_estado: e.target.value })}
                  placeholder="Ex: SP"
                  maxLength={2}
                  disabled={camposBloqueados.local_estado}
                  style={{
                    backgroundColor: camposBloqueados.local_estado ? '#f3f4f6' : 'white',
                    color: camposBloqueados.local_estado ? '#6b7280' : '#111827'
                  }}
                />
              </FormGroup>

              {/* Seção da Vistoria */}
              <SectionTitle>
                <ClipboardList size={20} />
                Dados da Vistoria
              </SectionTitle>

              <FormGroup>
                <Label htmlFor="vistoriador_id">Vistoriador *</Label>
                {editingVistoria && isAdmin && (
                  <div style={{ 
                    background: '#fef3c7', 
                    border: '1px solid #f59e0b', 
                    borderRadius: '6px', 
                    padding: '0.75rem', 
                    marginBottom: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#92400e'
                  }}>
                    <strong>Dica:</strong> Como administrador, você pode alterar o vistoriador responsável por esta vistoria.
                  </div>
                )}
                <Select
                  id="vistoriador_id"
                  value={formData.vistoriador_id}
                  onChange={(e) => setFormData({ ...formData, vistoriador_id: parseInt(e.target.value) })}
                  required
                >
                  <option value={0}>Selecione um vistoriador</option>
                  {vistoriadores.map((vistoriador) => (
                    <option key={vistoriador.id} value={vistoriador.id}>
                      {vistoriador.nome}
                    </option>
                  ))}
                </Select>
              </FormGroup>

              {/* Seção de Valores Financeiros */}
              <SectionTitle>
                <DollarSign size={20} />
                Valores Financeiros
              </SectionTitle>

              <FormGroup>
                <Label htmlFor="valor_vistoria">Valor Total da Vistoria (R$)</Label>
                <Input
                  id="valor_vistoria"
                  type="text"
                  value={formData.valor_vistoria}
                  onChange={(e) => setFormData({ ...formData, valor_vistoria: mascaraValorMonetario(e.target.value) })}
                  placeholder="0,00"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Valor total cobrado pela vistoria
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="valor_vistoriador">Valor do Vistoriador (R$)</Label>
                <Input
                  id="valor_vistoriador"
                  type="text"
                  value={formData.valor_vistoriador}
                  onChange={(e) => setFormData({ ...formData, valor_vistoriador: mascaraValorMonetario(e.target.value) })}
                  placeholder="0,00"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Valor a ser pago ao vistoriador
                </small>
              </FormGroup>

              {/* Seção de Dados da Corretora */}
              <SectionTitle>
                <Mail size={20} />
                Dados da Corretora
              </SectionTitle>

              <FormGroup>
                <Label htmlFor="corretora_nome">Nome da Corretora *</Label>
                <Input
                  id="corretora_nome"
                  type="text"
                  value={formData.corretora_nome}
                  onChange={(e) => setFormData({ ...formData, corretora_nome: e.target.value })}
                  required
                  placeholder="Ex: XYZ Corretora de Seguros"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Nome completo da corretora responsável
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="corretora_telefone_e164">Telefone de Contato da Corretora *</Label>
                <Input
                  id="corretora_telefone_e164"
                  type="text"
                  value={formData.corretora_telefone_e164}
                  onChange={(e) => setFormData({ ...formData, corretora_telefone_e164: mascaraTelefone(e.target.value) })}
                  required
                  placeholder="(11) 99999-8888"
                  maxLength={15}
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Telefone principal para contato
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="corretora_email_laudo">E-mail para Envio do Laudo *</Label>
                <Input
                  id="corretora_email_laudo"
                  type="email"
                  value={formData.corretora_email_laudo}
                  onChange={(e) => setFormData({ ...formData, corretora_email_laudo: e.target.value })}
                  required
                  placeholder="Ex: laudos@corretora.com.br"
                />
                <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  E-mail onde o laudo será enviado após aprovação
                </small>
              </FormGroup>

              {/* Botão para desbloquear campos */}
              {(camposBloqueados.local_logradouro || camposBloqueados.local_bairro || camposBloqueados.local_cidade || camposBloqueados.local_estado) && (
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
                      {editingVistoria ? 'Atualizando...' : 'Criando...'}
                    </>
                  ) : (
                    editingVistoria ? 'Atualizar' : 'Criar'
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
              <h2>Excluir Vistoria</h2>
              <button onClick={() => setShowDeleteModal(false)}>&times;</button>
            </ModalHeader>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>
                Tem certeza que deseja excluir a vistoria{' '}
                <strong>#{deletingVistoria?.id}</strong> da embarcação{' '}
                <strong>{deletingVistoria?.Embarcacao?.nome || deletingVistoria?.embarcacao?.nome || 'N/A'}</strong>?
              </p>
              <p style={{ color: '#dc2626', marginBottom: '1.5rem' }}>
                Esta ação não pode ser desfeita.
              </p>
              <ModalButtons>
                <Button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  style={{ background: '#6b7280' }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}
                >
                  Excluir
                </Button>
              </ModalButtons>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Modal de Cadastro de Cliente */}
      {showClienteModal && (
        <ModalOverlay onClick={handleCloseClienteModal}>
          <ModalContent 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <ModalHeader>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={24} />
                Cadastrar Novo Cliente
              </h2>
              <button
                onClick={handleCloseClienteModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#64748b'
                }}
              >
                <X size={24} />
              </button>
            </ModalHeader>

            <Form onSubmit={handleClienteSubmit}>
              {/* Tipo de Pessoa */}
              <FormGroup>
                <Label>Tipo de Pessoa *</Label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="tipo_pessoa"
                      value="FISICA"
                      checked={clienteFormData.tipo_pessoa === 'FISICA'}
                      onChange={(e) => setClienteFormData({ ...clienteFormData, tipo_pessoa: e.target.value as TipoPessoa, cpf: '', cnpj: '' })}
                    />
                    <User size={16} />
                    Pessoa Física
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="tipo_pessoa"
                      value="JURIDICA"
                      checked={clienteFormData.tipo_pessoa === 'JURIDICA'}
                      onChange={(e) => setClienteFormData({ ...clienteFormData, tipo_pessoa: e.target.value as TipoPessoa, cpf: '', cnpj: '' })}
                    />
                    <Building2 size={16} />
                    Pessoa Jurídica
                  </label>
                </div>
              </FormGroup>

              {/* Nome */}
              <FormGroup>
                <Label htmlFor="cliente_nome">
                  {clienteFormData.tipo_pessoa === 'FISICA' ? 'Nome Completo' : 'Razão Social'} *
                </Label>
                <Input
                  id="cliente_nome"
                  type="text"
                  value={clienteFormData.nome}
                  onChange={(e) => setClienteFormData({ ...clienteFormData, nome: e.target.value })}
                  placeholder={clienteFormData.tipo_pessoa === 'FISICA' ? 'Ex: João da Silva' : 'Ex: Empresa XYZ Ltda'}
                  required
                />
              </FormGroup>

              {/* CPF/CNPJ e Telefone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {clienteFormData.tipo_pessoa === 'FISICA' ? (
                  <FormGroup>
                    <Label htmlFor="cliente_cpf">CPF *</Label>
                    <Input
                      id="cliente_cpf"
                      type="text"
                      value={clienteFormData.cpf}
                      onChange={(e) => setClienteFormData({ ...clienteFormData, cpf: mascaraCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </FormGroup>
                ) : (
                  <FormGroup>
                    <Label htmlFor="cliente_cnpj">CNPJ *</Label>
                    <Input
                      id="cliente_cnpj"
                      type="text"
                      value={clienteFormData.cnpj}
                      onChange={(e) => setClienteFormData({ ...clienteFormData, cnpj: mascaraDocumento(e.target.value) })}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      required
                    />
                  </FormGroup>
                )}
                
                <FormGroup>
                  <Label htmlFor="cliente_telefone">Telefone</Label>
                  <Input
                    id="cliente_telefone"
                    type="text"
                    value={clienteFormData.telefone_e164}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, telefone_e164: mascaraTelefone(e.target.value) })}
                    placeholder="(11) 99999-8888"
                    maxLength={15}
                  />
                </FormGroup>
              </div>

              {/* Email */}
              <FormGroup>
                <Label htmlFor="cliente_email">E-mail</Label>
                <Input
                  id="cliente_email"
                  type="email"
                  value={clienteFormData.email}
                  onChange={(e) => setClienteFormData({ ...clienteFormData, email: e.target.value })}
                  placeholder="exemplo@email.com"
                />
              </FormGroup>

              {/* Seção de Endereço */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                margin: '1.5rem 0 1rem 0',
                padding: '0.75rem',
                background: '#f8fafc',
                borderRadius: '6px'
              }}>
                <MapPin size={20} color="#3b82f6" />
                <strong style={{ color: '#1e293b' }}>Endereço</strong>
              </div>

              {/* CEP e Número */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormGroup>
                  <Label htmlFor="cliente_cep">
                    CEP
                    {clienteCepLoading && (
                      <span style={{ marginLeft: '0.5rem', color: '#3b82f6', fontSize: '0.85rem' }}>
                        Buscando...
                      </span>
                    )}
                  </Label>
                  <Input
                    id="cliente_cep"
                    type="text"
                    value={clienteFormData.cep}
                    onChange={(e) => handleClienteCepChange(e.target.value)}
                    placeholder="00000000"
                    maxLength={8}
                    disabled={clienteCepLoading}
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Digite o CEP para preenchimento automático
                  </small>
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="cliente_numero">Número</Label>
                  <Input
                    id="cliente_numero"
                    type="text"
                    value={clienteFormData.numero}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, numero: e.target.value })}
                    placeholder="Ex: 1000"
                  />
                </FormGroup>
              </div>

              {/* Rua */}
              <FormGroup>
                <Label htmlFor="cliente_logradouro">
                  Rua/Avenida
                  {clienteFormData.logradouro && clienteFormData.cep.length === 8 && (
                    <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '0.85rem' }}>
                      Preenchido pelo CEP
                    </span>
                  )}
                </Label>
                <Input
                  id="cliente_logradouro"
                  type="text"
                  value={clienteFormData.logradouro}
                  onChange={(e) => setClienteFormData({ ...clienteFormData, logradouro: e.target.value })}
                  placeholder="Ex: Av. Paulista"
                  style={{
                    background: clienteFormData.logradouro && clienteFormData.cep.length === 8 ? '#f0fdf4' : 'white',
                    borderColor: clienteFormData.logradouro && clienteFormData.cep.length === 8 ? '#10b981' : '#e5e7eb'
                  }}
                />
              </FormGroup>

              {/* Complemento e Bairro */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormGroup>
                  <Label htmlFor="cliente_complemento">Complemento</Label>
                  <Input
                    id="cliente_complemento"
                    type="text"
                    value={clienteFormData.complemento}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, complemento: e.target.value })}
                    placeholder="Ex: Apto 501"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="cliente_bairro">
                    Bairro
                    {clienteFormData.bairro && clienteFormData.cep.length === 8 && (
                      <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '0.85rem' }}>
                        OK
                      </span>
                    )}
                  </Label>
                  <Input
                    id="cliente_bairro"
                    type="text"
                    value={clienteFormData.bairro}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, bairro: e.target.value })}
                    placeholder="Ex: Centro"
                    style={{
                      background: clienteFormData.bairro && clienteFormData.cep.length === 8 ? '#f0fdf4' : 'white',
                      borderColor: clienteFormData.bairro && clienteFormData.cep.length === 8 ? '#10b981' : '#e5e7eb'
                    }}
                  />
                </FormGroup>
              </div>

              {/* Cidade e Estado */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <FormGroup>
                  <Label htmlFor="cliente_cidade">
                    Cidade
                    {clienteFormData.cidade && clienteFormData.cep.length === 8 && (
                      <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '0.85rem' }}>
                        OK
                      </span>
                    )}
                  </Label>
                  <Input
                    id="cliente_cidade"
                    type="text"
                    value={clienteFormData.cidade}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, cidade: e.target.value })}
                    placeholder="Ex: São Paulo"
                    style={{
                      background: clienteFormData.cidade && clienteFormData.cep.length === 8 ? '#f0fdf4' : 'white',
                      borderColor: clienteFormData.cidade && clienteFormData.cep.length === 8 ? '#10b981' : '#e5e7eb'
                    }}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="cliente_estado">
                    Estado (UF)
                    {clienteFormData.estado && clienteFormData.cep.length === 8 && (
                      <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '0.85rem' }}>
                        OK
                      </span>
                    )}
                  </Label>
                  <Input
                    id="cliente_estado"
                    type="text"
                    value={clienteFormData.estado}
                    onChange={(e) => setClienteFormData({ ...clienteFormData, estado: e.target.value.toUpperCase().slice(0, 2) })}
                    placeholder="Ex: SP"
                    maxLength={2}
                    style={{
                      background: clienteFormData.estado && clienteFormData.cep.length === 8 ? '#f0fdf4' : 'white',
                      borderColor: clienteFormData.estado && clienteFormData.cep.length === 8 ? '#10b981' : '#e5e7eb'
                    }}
                  />
                </FormGroup>
              </div>

              {/* Observações */}
              <FormGroup>
                <Label htmlFor="cliente_observacoes">Observações</Label>
                <Textarea
                  id="cliente_observacoes"
                  value={clienteFormData.observacoes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setClienteFormData({ ...clienteFormData, observacoes: e.target.value })}
                  placeholder="Informações adicionais sobre o cliente..."
                  rows={3}
                />
              </FormGroup>

              {/* Botões */}
              <ModalButtons>
                <Button
                  type="button"
                  onClick={handleCloseClienteModal}
                  style={{ background: '#6b7280' }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  Cadastrar Cliente
                </Button>
              </ModalButtons>
            </Form>
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

export default Vistorias;
