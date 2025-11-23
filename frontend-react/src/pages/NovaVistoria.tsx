import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  User,
  Ship,
  MapPin,
  FileText,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Search,
  Plus,
  AlertCircle
} from 'lucide-react';
import ProgressBar from '../components/Wizard/ProgressBar';
import { Cliente, Embarcacao, Local, Usuario, Seguradora, SeguradoraTipoEmbarcacao } from '../types';
import {
  vistoriaService,
  clienteService,
  embarcacaoService,
  localService,
  usuarioService,
  seguradoraService
} from '../services/api';
import { useAccessControl } from '../hooks/useAccessControl';
import {
  limparCPF,
  limparCNPJ,
  mascaraCPF,
  mascaraCNPJ,
  mascaraTelefone,
  mascaraDocumento,
  converterParaE164,
  mascaraValorMonetario,
  limparValorMonetario,
  validarCPF,
  validarCNPJ
} from '../utils/validators';
import { buscarCEP, formatarCEP } from '../utils/cepUtils';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 200px);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const StepContent = styled.div`
  min-height: 400px;
`;

const FormGroup = styled.div`
  margin-bottom: 0;
  
  &:not(:last-child) {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;

  &::after {
    content: '*';
    color: #ef4444;
    margin-left: 0.25rem;
  }

  &.optional::after {
    content: '';
  }
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

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
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
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ${props => {
    if (props.variant === 'primary') {
      return `
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
        }

        &:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
        }
      `;
    } else if (props.variant === 'danger') {
      return `
        background: #ef4444;
        color: white;

        &:hover {
          background: #dc2626;
        }
      `;
    } else {
      return `
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #e5e7eb;

        &:hover {
          background: #e5e7eb;
        }
      `;
    }
  }}
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
`;

const SearchBox = styled.div`
  background: #f0f9ff;
  border: 2px dashed #3b82f6;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const SearchInputGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
`;

const InfoBox = styled.div<{ type?: 'success' | 'warning' | 'error' }>`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  ${props => {
    if (props.type === 'success') {
      return `
        background: #dcfce7;
        border: 1px solid #10b981;
        color: #166534;
      `;
    } else if (props.type === 'warning') {
      return `
        background: #fef3c7;
        border: 1px solid #f59e0b;
        color: #92400e;
      `;
    } else {
      return `
        background: #fee2e2;
        border: 1px solid #ef4444;
        color: #991b1b;
      `;
    }
  }}
`;

const Grid = styled.div<{ cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.cols || 2}, 1fr);
  gap: 1.25rem;
  margin-bottom: 1.25rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ReviewSection = styled.div`
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
`;

const ReviewTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ReviewItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const ReviewLabel = styled.span`
  font-weight: 500;
  color: #6b7280;
`;

const ReviewValue = styled.span`
  color: #1f2937;
  text-align: right;
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: white;
  font-size: 1.25rem;
`;

// Interface para os dados do wizard
interface WizardData {
  // Step 1: Cliente
  cliente_id?: number;
  cliente?: Cliente;
  documento_busca?: string;

  // Step 2: Embarcação
  embarcacao_id?: number;
  embarcacao?: Embarcacao;
  embarcacao_nome?: string;
  embarcacao_nr_inscricao_barco?: string;
  embarcacao_proprietario_nome?: string;
  embarcacao_proprietario_cpf?: string;
  embarcacao_proprietario_telefone_e164?: string;
  embarcacao_proprietario_email?: string;
  embarcacao_tipo?: string;
  embarcacao_porte?: string;
  embarcacao_valor?: string;
  embarcacao_ano_fabricacao?: string;
  seguradora_id?: number;
  cliente_id_embarcacao?: number;

  // Step 3: Local
  local_id?: number;
  local?: Local;
  local_tipo?: 'MARINA' | 'RESIDENCIA';
  local_nome_local?: string;
  local_cep?: string;
  local_logradouro?: string;
  local_numero?: string;
  local_complemento?: string;
  local_bairro?: string;
  local_cidade?: string;
  local_estado?: string;

  // Step 4: Informações
  vistoriador_id?: number;
  valor_embarcacao?: string;
  valor_vistoria?: string;
  valor_vistoriador?: string;
  contato_acompanhante_tipo?: string;
  contato_acompanhante_nome?: string;
  contato_acompanhante_telefone_e164?: string;
  contato_acompanhante_email?: string;
  corretora_nome?: string;
  corretora_telefone_e164?: string;
  corretora_email_laudo?: string;
}

const NovaVistoria: React.FC = () => {
  const navigate = useNavigate();
  const { canAccess } = useAccessControl();
  const isAdmin = canAccess('admin');

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dados do wizard
  const [wizardData, setWizardData] = useState<WizardData>({});

  // Dados auxiliares
  const [vistoriadores, setVistoriadores] = useState<Usuario[]>([]);
  const [seguradoras, setSeguradoras] = useState<Seguradora[]>([]);
  const [tiposEmbarcacao, setTiposEmbarcacao] = useState<SeguradoraTipoEmbarcacao[]>([]);
  const [carregandoTipos, setCarregandoTipos] = useState(false);
  const [embarcacoesEncontradas, setEmbarcacoesEncontradas] = useState<Embarcacao[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [modoEmbarcacao, setModoEmbarcacao] = useState<'buscar' | 'criar'>('buscar');
  const [modoLocal, setModoLocal] = useState<'buscar' | 'criar'>('buscar');
  const [buscandoEmbarcacoes, setBuscandoEmbarcacoes] = useState(false);
  const [buscandoLocais, setBuscandoLocais] = useState(false);
  const [todasEmbarcacoes, setTodasEmbarcacoes] = useState<Embarcacao[]>([]);
  const [locaisFiltrados, setLocaisFiltrados] = useState<Local[]>([]);
  const [filtroBuscaEmbarcacao, setFiltroBuscaEmbarcacao] = useState('');
  const [filtroBuscaLocal, setFiltroBuscaLocal] = useState('');
  const [filtroBuscaVistoriador, setFiltroBuscaVistoriador] = useState('');
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false);
  const [criandoCliente, setCriandoCliente] = useState(false);
  const [formCliente, setFormCliente] = useState({
    tipo_pessoa: 'FISICA' as 'FISICA' | 'JURIDICA',
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

  const steps = [
    { label: 'Cliente', icon: <User size={18} /> },
    { label: 'Embarcação', icon: <Ship size={18} /> },
    { label: 'Local', icon: <MapPin size={18} /> },
    { label: 'Informações', icon: <FileText size={18} /> },
    { label: 'Revisão', icon: <CheckCircle size={18} /> }
  ];

  useEffect(() => {
    if (!isAdmin) {
      navigate('/vistorias');
      return;
    }

    loadInitialData();
  }, [isAdmin, navigate]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Carregar vistoriadores
      console.log('Carregando vistoriadores...');
      const usuarios = await usuarioService.getAll();
      console.log('Usuários carregados:', usuarios.length);
      
      // Filtrar apenas vistoriadores ativos (nível 2 = Vistoriador)
      const vistoriadoresList = usuarios.filter(u => 
        u.nivelAcessoId === 2 && u.ativo === true
      );
      console.log('Vistoriadores encontrados:', vistoriadoresList.length);
      setVistoriadores(vistoriadoresList);

      // Carregar seguradoras ativas
      console.log('Carregando seguradoras...');
      const segs = await seguradoraService.getAll(true);
      console.log('Seguradoras carregadas:', segs.length);
      setSeguradoras(segs);
      
      if (vistoriadoresList.length === 0) {
        setError('Nenhum vistoriador ativo encontrado. É necessário cadastrar pelo menos um vistoriador.');
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados iniciais:', err);
      setError('Erro ao carregar dados: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Buscar cliente por documento
  const buscarCliente = async () => {
    if (!wizardData.documento_busca) {
      setError('Digite um CPF ou CNPJ para buscar');
      return;
    }

    try {
      setBuscando(true);
      setError('');
      const docLimpo = wizardData.documento_busca.replace(/\D/g, '');
      
      const cliente = await clienteService.buscarPorDocumento(docLimpo);
      
      setWizardData({
        ...wizardData,
        cliente_id: cliente.id,
        cliente,
        cliente_id_embarcacao: cliente.id,
        embarcacao_proprietario_nome: cliente.nome,
        embarcacao_proprietario_cpf: cliente.cpf || undefined,
        embarcacao_proprietario_telefone_e164: cliente.telefone_e164 || undefined,
        embarcacao_proprietario_email: cliente.email || undefined
      });

      // Buscar embarcações do cliente
      if (cliente.id && cliente.cpf) {
        try {
          const embarcacoes = await embarcacaoService.getByCPF(cliente.cpf);
          setEmbarcacoesEncontradas(embarcacoes || []);
        } catch (err) {
          console.error('Erro ao buscar embarcações:', err);
          setEmbarcacoesEncontradas([]);
        }
      } else {
        setEmbarcacoesEncontradas([]);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('');
        setMostrarFormCliente(true);
        // Preencher o documento no formulário
        const docLimpo = wizardData.documento_busca?.replace(/\D/g, '') || '';
        if (docLimpo.length === 11) {
          setFormCliente(prev => ({
            ...prev,
            tipo_pessoa: 'FISICA',
            cpf: wizardData.documento_busca || ''
          }));
        } else if (docLimpo.length === 14) {
          setFormCliente(prev => ({
            ...prev,
            tipo_pessoa: 'JURIDICA',
            cnpj: wizardData.documento_busca || ''
          }));
        }
      } else {
        setError('Erro ao buscar cliente: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setBuscando(false);
    }
  };

  // Buscar tipos de embarcação quando seleciona seguradora
  const handleSeguradoraChange = async (seguradoraId: number) => {
    try {
      setCarregandoTipos(true);
      setTiposEmbarcacao([]); // Limpar tipos anteriores
      setError('');
      
      console.log('Buscando tipos permitidos para seguradora:', seguradoraId);
      const tipos = await seguradoraService.getTiposPermitidos(seguradoraId);
      console.log('Tipos encontrados:', tipos);
      
      if (tipos && Array.isArray(tipos) && tipos.length > 0) {
        setTiposEmbarcacao(tipos);
      } else {
        setTiposEmbarcacao([]);
        setError('Nenhum tipo de embarcação encontrado para esta seguradora.');
      }
      
      setWizardData({ ...wizardData, seguradora_id: seguradoraId, embarcacao_tipo: undefined });
    } catch (err: any) {
      console.error('Erro ao carregar tipos de embarcação:', err);
      setTiposEmbarcacao([]);
      setError('Erro ao carregar tipos de embarcação: ' + (err.response?.data?.error || err.message || 'Erro desconhecido'));
    } finally {
      setCarregandoTipos(false);
    }
  };

  // Estado para loading do CEP
  const [loadingCEP, setLoadingCEP] = useState(false);

  // Buscar local por CEP
  const buscarLocalPorCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      return;
    }

    setLoadingCEP(true);
    setError('');

    try {
      const endereco = await buscarCEP(cepLimpo);
      
      if (endereco && !endereco.erro) {
        setWizardData({
          ...wizardData,
          local_logradouro: endereco.logradouro || '',
          local_bairro: endereco.bairro || '',
          local_cidade: endereco.localidade || '',
          local_estado: endereco.uf || ''
        });
      } else {
        setError('CEP não encontrado. Por favor, preencha os dados manualmente.');
      }
    } catch (err: any) {
      console.error('Erro ao buscar CEP:', err);
      setError('Erro ao buscar CEP. Por favor, preencha os dados manualmente.');
    } finally {
      setLoadingCEP(false);
    }
  };

  // Buscar CEP para o formulário de cliente
  const buscarCEPCliente = async (cep: string) => {
    try {
      const cepLimpo = cep.replace(/\D/g, '');
      if (cepLimpo.length !== 8) return;

      const endereco = await buscarCEP(cepLimpo);
      if (endereco) {
        setFormCliente(prev => ({
          ...prev,
          logradouro: endereco.logradouro || '',
          bairro: endereco.bairro || '',
          cidade: endereco.localidade || '',
          estado: endereco.uf || ''
        }));
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    }
  };

  // Criar cliente
  const handleCriarCliente = async () => {
    setError('');
    
    // Validações
    if (!formCliente.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (formCliente.tipo_pessoa === 'FISICA') {
      if (!formCliente.cpf || !validarCPF(formCliente.cpf)) {
        setError('CPF inválido');
        return;
      }
    } else {
      if (!formCliente.cnpj || !validarCNPJ(formCliente.cnpj)) {
        setError('CNPJ inválido');
        return;
      }
    }

    try {
      setCriandoCliente(true);
      const payload = {
        tipo_pessoa: formCliente.tipo_pessoa,
        nome: formCliente.nome.trim(),
        cpf: formCliente.tipo_pessoa === 'FISICA' ? limparCPF(formCliente.cpf) : null,
        cnpj: formCliente.tipo_pessoa === 'JURIDICA' ? limparCNPJ(formCliente.cnpj) : null,
        telefone_e164: formCliente.telefone_e164 ? converterParaE164(formCliente.telefone_e164) : null,
        email: formCliente.email.trim() || null,
        cep: formCliente.cep.replace(/\D/g, '') || null,
        logradouro: formCliente.logradouro.trim() || null,
        numero: formCliente.numero.trim() || null,
        complemento: formCliente.complemento.trim() || null,
        bairro: formCliente.bairro.trim() || null,
        cidade: formCliente.cidade.trim() || null,
        estado: formCliente.estado.trim().toUpperCase() || null,
        observacoes: formCliente.observacoes.trim() || null
      };

      const cliente = await clienteService.create(payload);

      // Usar o cliente criado
      setWizardData({
        ...wizardData,
        cliente_id: cliente.id,
        cliente,
        cliente_id_embarcacao: cliente.id,
        embarcacao_proprietario_nome: cliente.nome,
        embarcacao_proprietario_cpf: cliente.cpf || undefined,
        embarcacao_proprietario_telefone_e164: cliente.telefone_e164 || undefined,
        embarcacao_proprietario_email: cliente.email || undefined
      });

      // Limpar formulário e esconder
      setMostrarFormCliente(false);
      setFormCliente({
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

      // Buscar embarcações do cliente se tiver CPF
      if (cliente.cpf) {
        try {
          const embarcacoes = await embarcacaoService.getByCPF(cliente.cpf);
          setEmbarcacoesEncontradas(embarcacoes || []);
        } catch (err) {
          console.error('Erro ao buscar embarcações:', err);
          setEmbarcacoesEncontradas([]);
        }
      } else {
        setEmbarcacoesEncontradas([]);
      }
    } catch (err: any) {
      console.error('Erro ao criar cliente:', err);
      setError('Erro ao criar cliente: ' + (err.response?.data?.error || err.message));
    } finally {
      setCriandoCliente(false);
    }
  };

  const handleNext = () => {
    // Validações por etapa
    if (currentStep === 1) {
      if (!wizardData.cliente_id) {
        setError('Por favor, busque e selecione um cliente');
        return;
      }
    } else if (currentStep === 2) {
      // Se não tem embarcação selecionada, precisa criar uma nova
      if (!wizardData.embarcacao_id) {
        if (!wizardData.embarcacao_nome || !wizardData.embarcacao_nr_inscricao_barco) {
          setError('Nome da embarcação e número de inscrição são obrigatórios');
          return;
        }
        if (!wizardData.embarcacao_proprietario_nome) {
          setError('Nome do proprietário é obrigatório');
          return;
        }
        if (!wizardData.seguradora_id) {
          setError('Selecione a seguradora');
          return;
        }
        if (!wizardData.embarcacao_tipo) {
          setError('Selecione o tipo de embarcação');
          return;
        }
      }
    } else if (currentStep === 3) {
      if (!wizardData.local_tipo) {
        setError('Tipo do local é obrigatório');
        return;
      }
      // Se tem local_id, significa que selecionou um local existente - não precisa validar campos individuais
      if (!wizardData.local_id) {
        // Se não tem local_id, precisa preencher os campos manualmente
        if (wizardData.local_tipo === 'MARINA' && !wizardData.local_nome_local) {
          setError('Nome do local é obrigatório para MARINA');
          return;
        }
        if (!wizardData.local_cep || !wizardData.local_logradouro || !wizardData.local_cidade || !wizardData.local_estado) {
          setError('Preencha o endereço completo do local');
          return;
        }
      }
    } else if (currentStep === 4) {
      if (!wizardData.vistoriador_id) {
        setError('Selecione o vistoriador responsável');
        return;
      }
    }

    setError('');
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Preparar dados para envio
      const dataToSend: any = {
        vistoriador_id: wizardData.vistoriador_id,
        valor_embarcacao: wizardData.valor_embarcacao ? limparValorMonetario(wizardData.valor_embarcacao) : undefined,
        valor_vistoria: wizardData.valor_vistoria ? limparValorMonetario(wizardData.valor_vistoria) : undefined,
        valor_vistoriador: wizardData.valor_vistoriador ? limparValorMonetario(wizardData.valor_vistoriador) : undefined,
        contato_acompanhante_tipo: wizardData.contato_acompanhante_tipo || undefined,
        contato_acompanhante_nome: wizardData.contato_acompanhante_nome || undefined,
        contato_acompanhante_telefone_e164: wizardData.contato_acompanhante_telefone_e164 
          ? converterParaE164(wizardData.contato_acompanhante_telefone_e164) 
          : undefined,
        contato_acompanhante_email: wizardData.contato_acompanhante_email || undefined,
        corretora_nome: wizardData.corretora_nome || undefined,
        corretora_telefone_e164: wizardData.corretora_telefone_e164 
          ? converterParaE164(wizardData.corretora_telefone_e164) 
          : undefined,
        corretora_email_laudo: wizardData.corretora_email_laudo || undefined
      };

      // Se tem embarcação existente, usar o ID
      if (wizardData.embarcacao_id) {
        dataToSend.embarcacao_id = wizardData.embarcacao_id;
      } else {
        // Criar nova embarcação
        dataToSend.embarcacao_nome = wizardData.embarcacao_nome;
        dataToSend.embarcacao_nr_inscricao_barco = wizardData.embarcacao_nr_inscricao_barco;
        dataToSend.embarcacao_proprietario_nome = wizardData.embarcacao_proprietario_nome;
        dataToSend.embarcacao_proprietario_cpf = wizardData.embarcacao_proprietario_cpf ? limparCPF(wizardData.embarcacao_proprietario_cpf) : undefined;
        dataToSend.embarcacao_proprietario_telefone_e164 = wizardData.embarcacao_proprietario_telefone_e164 
          ? converterParaE164(wizardData.embarcacao_proprietario_telefone_e164) 
          : undefined;
        dataToSend.embarcacao_proprietario_email = wizardData.embarcacao_proprietario_email || undefined;
        dataToSend.embarcacao_tipo = wizardData.embarcacao_tipo;
        dataToSend.embarcacao_porte = wizardData.embarcacao_porte || undefined;
        dataToSend.embarcacao_valor = wizardData.embarcacao_valor ? limparValorMonetario(wizardData.embarcacao_valor) : undefined;
        dataToSend.embarcacao_ano_fabricacao = wizardData.embarcacao_ano_fabricacao || undefined;
        dataToSend.seguradora_id = wizardData.seguradora_id;
        dataToSend.cliente_id = wizardData.cliente_id_embarcacao || wizardData.cliente_id;
      }

      // Se tem local existente, usar o ID
      if (wizardData.local_id) {
        dataToSend.local_id = wizardData.local_id;
      } else {
        // Criar novo local
        dataToSend.local_tipo = wizardData.local_tipo;
        dataToSend.local_nome_local = wizardData.local_nome_local || undefined;
        dataToSend.local_cep = wizardData.local_cep?.replace(/\D/g, '');
        dataToSend.local_logradouro = wizardData.local_logradouro;
        dataToSend.local_numero = wizardData.local_numero || undefined;
        dataToSend.local_complemento = wizardData.local_complemento || undefined;
        dataToSend.local_bairro = wizardData.local_bairro || undefined;
        dataToSend.local_cidade = wizardData.local_cidade;
        dataToSend.local_estado = wizardData.local_estado;
      }

      console.log('Criando vistoria com dados:', JSON.stringify(dataToSend, null, 2));

      // Validação final antes de enviar
      if (!dataToSend.vistoriador_id || isNaN(dataToSend.vistoriador_id)) {
        setError('Vistoriador é obrigatório');
        setLoading(false);
        return;
      }

      const vistoria = await vistoriaService.create(dataToSend);
      
      console.log('Vistoria criada com sucesso:', vistoria);
      setSuccess('Vistoria criada com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate(`/vistorias?created=${vistoria.id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao criar vistoria:', err);
      console.error('Detalhes do erro:', err.response?.data);
      setError('Erro ao criar vistoria: ' + (err.response?.data?.error || err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Renderizar Step 1: Cliente
  const renderStepCliente = () => (
    <StepContent>
      <SearchBox>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Search size={20} color="#3b82f6" />
          <strong style={{ color: '#1e40af' }}>Buscar Cliente por CPF/CNPJ</strong>
        </div>
        <SearchInputGroup>
          <FormGroup style={{ flex: 1, marginBottom: 0 }}>
            <Input
              type="text"
              value={wizardData.documento_busca || ''}
              onChange={(e) => {
                const valor = mascaraDocumento(e.target.value);
                setWizardData({ ...wizardData, documento_busca: valor });
                setError('');
              }}
              placeholder="CPF: 000.000.000-00 ou CNPJ: 00.000.000/0000-00"
              maxLength={18}
            />
          </FormGroup>
          <Button
            type="button"
            variant="primary"
            onClick={buscarCliente}
            disabled={buscando || !wizardData.documento_busca}
          >
            {buscando ? 'Buscando...' : 'Buscar'}
          </Button>
        </SearchInputGroup>
      </SearchBox>

      {wizardData.cliente && (
        <InfoBox type="success">
          <CheckCircle size={20} />
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
              Cliente encontrado: {wizardData.cliente.nome}
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              {wizardData.cliente.cpf ? `CPF: ${wizardData.cliente.cpf}` : `CNPJ: ${wizardData.cliente.cnpj}`}
              {wizardData.cliente.email && ` | Email: ${wizardData.cliente.email}`}
            </div>
          </div>
        </InfoBox>
      )}

      {mostrarFormCliente && (
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '2rem', 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '2px solid #e0e7ff',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            marginBottom: '2rem',
            paddingBottom: '1rem',
            borderBottom: '2px solid #e5e7eb'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '10px',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Plus size={20} color="white" />
            </div>
            <div>
              <strong style={{ 
                color: '#1e293b', 
                fontSize: '1.25rem',
                display: 'block',
                marginBottom: '0.25rem'
              }}>
                Criar Novo Cliente
              </strong>
              <span style={{ 
                color: '#64748b', 
                fontSize: '0.875rem' 
              }}>
                Preencha os dados abaixo para cadastrar um novo cliente
              </span>
            </div>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{
              color: '#1f2937',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              Dados Pessoais
            </h3>
            
            <Grid cols={2}>
              <FormGroup>
                <Label className="optional">Tipo de Pessoa</Label>
                <Select
                  value={formCliente.tipo_pessoa}
                  onChange={(e) => {
                    setFormCliente({ ...formCliente, tipo_pessoa: e.target.value as 'FISICA' | 'JURIDICA' });
                    setError('');
                  }}
                >
                  <option value="FISICA">Pessoa Física</option>
                  <option value="JURIDICA">Pessoa Jurídica</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Nome</Label>
                <Input
                  type="text"
                  value={formCliente.nome}
                  onChange={(e) => {
                    setFormCliente({ ...formCliente, nome: e.target.value });
                    setError('');
                  }}
                  placeholder="Nome completo ou razão social"
                  required
                />
              </FormGroup>
            </Grid>

            <Grid cols={2}>
              {formCliente.tipo_pessoa === 'FISICA' ? (
                <FormGroup>
                  <Label>CPF</Label>
                  <Input
                    type="text"
                    value={mascaraCPF(formCliente.cpf)}
                    onChange={(e) => {
                      const valor = mascaraCPF(e.target.value);
                      setFormCliente({ ...formCliente, cpf: valor });
                      setError('');
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required
                  />
                </FormGroup>
              ) : (
                <FormGroup>
                  <Label>CNPJ</Label>
                  <Input
                    type="text"
                    value={mascaraCNPJ(formCliente.cnpj)}
                    onChange={(e) => {
                      const valor = mascaraCNPJ(e.target.value);
                      setFormCliente({ ...formCliente, cnpj: valor });
                      setError('');
                    }}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    required
                  />
                </FormGroup>
              )}

              <FormGroup>
                <Label className="optional">Telefone</Label>
                <Input
                  type="text"
                  value={mascaraTelefone(formCliente.telefone_e164)}
                  onChange={(e) => {
                    const valor = mascaraTelefone(e.target.value);
                    setFormCliente({ ...formCliente, telefone_e164: valor });
                    setError('');
                  }}
                  placeholder="(00) 90000-0000"
                  maxLength={15}
                />
              </FormGroup>
            </Grid>

            <FormGroup>
              <Label className="optional">Email</Label>
              <Input
                type="email"
                value={formCliente.email}
                onChange={(e) => {
                  setFormCliente({ ...formCliente, email: e.target.value });
                  setError('');
                }}
                placeholder="email@exemplo.com"
              />
            </FormGroup>
          </div>

          <div style={{ 
            marginTop: '2rem', 
            paddingTop: '2rem', 
            borderTop: '2px solid #e5e7eb' 
          }}>
            <h3 style={{
              color: '#1f2937',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '1.5rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Endereço 
              <span style={{ 
                fontSize: '0.875rem', 
                fontWeight: 'normal', 
                color: '#64748b',
                background: '#f1f5f9',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px'
              }}>
                Opcional
              </span>
            </h3>
            
            <Grid cols={4}>
              <FormGroup style={{ gridColumn: 'span 1' }}>
                <Label className="optional">CEP</Label>
                <Input
                  type="text"
                  value={formCliente.cep ? formatarCEP(formCliente.cep) : ''}
                  onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '');
                    // Limitar a 8 dígitos
                    const cepLimpo = valor.slice(0, 8);
                    setFormCliente({ ...formCliente, cep: cepLimpo });
                    setError('');
                  }}
                  onBlur={(e) => {
                    const cepLimpo = e.target.value.replace(/\D/g, '');
                    if (cepLimpo.length === 8) {
                      buscarCEPCliente(cepLimpo);
                    }
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </FormGroup>

              <FormGroup style={{ gridColumn: 'span 3' }}>
                <Label className="optional">Logradouro</Label>
                <Input
                  type="text"
                  value={formCliente.logradouro}
                  onChange={(e) => {
                    setFormCliente({ ...formCliente, logradouro: e.target.value });
                    setError('');
                  }}
                  placeholder="Rua, Avenida, etc."
                />
              </FormGroup>
            </Grid>

            <Grid cols={4}>
              <FormGroup style={{ gridColumn: 'span 1' }}>
                <Label className="optional">Número</Label>
                <Input
                  type="text"
                  value={formCliente.numero}
                  onChange={(e) => {
                    setFormCliente({ ...formCliente, numero: e.target.value });
                    setError('');
                  }}
                  placeholder="123"
                />
              </FormGroup>

              <FormGroup style={{ gridColumn: 'span 3' }}>
                <Label className="optional">Complemento</Label>
                <Input
                  type="text"
                  value={formCliente.complemento}
                  onChange={(e) => {
                    setFormCliente({ ...formCliente, complemento: e.target.value });
                    setError('');
                  }}
                  placeholder="Apto, Bloco, etc."
                />
              </FormGroup>
            </Grid>

            <Grid cols={4}>
              <FormGroup style={{ gridColumn: 'span 2' }}>
                <Label className="optional">Bairro</Label>
                <Input
                  type="text"
                  value={formCliente.bairro}
                  onChange={(e) => {
                    setFormCliente({ ...formCliente, bairro: e.target.value });
                    setError('');
                  }}
                  placeholder="Centro"
                />
              </FormGroup>

              <FormGroup style={{ gridColumn: 'span 1' }}>
                <Label className="optional">Cidade</Label>
                <Input
                  type="text"
                  value={formCliente.cidade}
                  onChange={(e) => {
                    setFormCliente({ ...formCliente, cidade: e.target.value });
                    setError('');
                  }}
                  placeholder="São Paulo"
                />
              </FormGroup>

              <FormGroup style={{ gridColumn: 'span 1' }}>
                <Label className="optional">Estado (UF)</Label>
                <Input
                  type="text"
                  value={formCliente.estado.toUpperCase()}
                  onChange={(e) => {
                    const valor = e.target.value.toUpperCase().substring(0, 2);
                    setFormCliente({ ...formCliente, estado: valor });
                    setError('');
                  }}
                  placeholder="SP"
                  maxLength={2}
                />
              </FormGroup>
            </Grid>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e5e7eb' }}>
            <FormGroup>
              <Label className="optional">Observações</Label>
              <Textarea
                value={formCliente.observacoes}
                onChange={(e) => {
                  setFormCliente({ ...formCliente, observacoes: e.target.value });
                  setError('');
                }}
                placeholder="Observações adicionais sobre o cliente"
                rows={4}
              />
            </FormGroup>
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '2px solid #e5e7eb',
            justifyContent: 'flex-end'
          }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setMostrarFormCliente(false);
                setFormCliente({
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
                setError('');
              }}
              disabled={criandoCliente}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleCriarCliente}
              disabled={criandoCliente}
            >
              {criandoCliente ? 'Criando...' : (
                <>
                  <Plus size={18} />
                  Criar Cliente
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {embarcacoesEncontradas.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <Label>Embarcações do Cliente</Label>
          {embarcacoesEncontradas.map((emb) => (
            <div
              key={emb.id}
              style={{
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                cursor: 'pointer',
                background: wizardData.embarcacao_id === emb.id ? '#f0f9ff' : 'white',
                borderColor: wizardData.embarcacao_id === emb.id ? '#3b82f6' : '#e5e7eb'
              }}
              onClick={() => {
                setWizardData({
                  ...wizardData,
                  embarcacao_id: emb.id,
                  embarcacao: emb,
                  embarcacao_nome: emb.nome,
                  embarcacao_nr_inscricao_barco: emb.nr_inscricao_barco
                });
              }}
            >
              <div style={{ fontWeight: '600' }}>{emb.nome}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Nº Inscrição: {emb.nr_inscricao_barco}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && currentStep === 1 && (
        <ErrorMessage>
          <AlertCircle size={16} />
          {error}
        </ErrorMessage>
      )}
    </StepContent>
  );

  // Buscar todas as embarcações
  const buscarTodasEmbarcacoes = useCallback(async () => {
    setBuscandoEmbarcacoes(true);
    try {
      const embarcacoes = await embarcacaoService.getAll();
      setTodasEmbarcacoes(embarcacoes);
    } catch (err) {
      console.error('Erro ao buscar embarcações:', err);
      setError('Erro ao buscar embarcações');
    } finally {
      setBuscandoEmbarcacoes(false);
    }
  }, []);

  // Carregar embarcações automaticamente quando entrar na etapa de embarcação
  useEffect(() => {
    if (currentStep === 2 && modoEmbarcacao === 'buscar' && todasEmbarcacoes.length === 0 && !buscandoEmbarcacoes) {
      buscarTodasEmbarcacoes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, modoEmbarcacao]);

  // Buscar locais por tipo
  const buscarLocaisPorTipo = async (tipo: 'MARINA' | 'RESIDENCIA') => {
    setBuscandoLocais(true);
    try {
      const locais = await localService.getAll();
      const filtrados = locais.filter(l => l.tipo === tipo);
      setLocaisFiltrados(filtrados);
    } catch (err) {
      console.error('Erro ao buscar locais:', err);
      setError('Erro ao buscar locais');
    } finally {
      setBuscandoLocais(false);
    }
  };

  // Renderizar Step 2: Embarcação
  const renderStepEmbarcacao = () => (
    <StepContent>
      {!wizardData.embarcacao_id ? (
        <>
          {/* Opção: Buscar ou Criar */}
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1rem', 
            background: '#f9fafb', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <Label style={{ marginBottom: '0.75rem', display: 'block' }}>
              Como deseja prosseguir?
            </Label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button
                type="button"
                variant={modoEmbarcacao === 'buscar' ? 'primary' : 'secondary'}
                onClick={() => {
                  setModoEmbarcacao('buscar');
                  setFiltroBuscaEmbarcacao('');
                  buscarTodasEmbarcacoes();
                }}
                style={{ flex: 1 }}
              >
                <Search size={18} />
                Buscar Embarcação Existente
              </Button>
              <Button
                type="button"
                variant={modoEmbarcacao === 'criar' ? 'primary' : 'secondary'}
                onClick={() => {
                  setModoEmbarcacao('criar');
                  setTodasEmbarcacoes([]);
                  setFiltroBuscaEmbarcacao('');
                }}
                style={{ flex: 1 }}
              >
                <Plus size={18} />
                Criar Nova Embarcação
              </Button>
            </div>
          </div>

          {/* Lista de embarcações existentes */}
          {modoEmbarcacao === 'buscar' && (
            <div style={{ marginBottom: '2rem' }}>
              {buscandoEmbarcacoes ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  Buscando embarcações...
                </div>
              ) : todasEmbarcacoes.length > 0 ? (
                <>
                  <Label style={{ marginBottom: '0.75rem', display: 'block' }}>
                    Selecione uma embarcação:
                  </Label>
                  
                  {/* Campo de filtro/busca */}
                  <div style={{ marginBottom: '1rem' }}>
                    <Input
                      type="text"
                      value={filtroBuscaEmbarcacao}
                      onChange={(e) => setFiltroBuscaEmbarcacao(e.target.value)}
                      placeholder="Buscar por nome, número de inscrição ou tipo..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '0.5rem'
                  }}>
                    {todasEmbarcacoes
                      .filter((emb) => {
                        if (!filtroBuscaEmbarcacao.trim()) return true;
                        const busca = filtroBuscaEmbarcacao.toLowerCase();
                        return (
                          emb.nome.toLowerCase().includes(busca) ||
                          emb.nr_inscricao_barco.toLowerCase().includes(busca) ||
                          (emb.tipo_embarcacao && emb.tipo_embarcacao.toLowerCase().replace(/_/g, ' ').includes(busca)) ||
                          (emb.Cliente && emb.Cliente.nome.toLowerCase().includes(busca))
                        );
                      })
                      .map((emb) => (
                      <div
                        key={emb.id}
                        onClick={() => {
                          setWizardData({
                            ...wizardData,
                            embarcacao_id: emb.id,
                            embarcacao: emb,
                            embarcacao_nome: emb.nome,
                            embarcacao_nr_inscricao_barco: emb.nr_inscricao_barco,
                            embarcacao_tipo: emb.tipo_embarcacao || undefined,
                            embarcacao_porte: (emb as any).porte || undefined,
                            embarcacao_ano_fabricacao: (emb as any).ano_fabricacao?.toString() || undefined,
                            embarcacao_valor: (emb as any).valor_embarcacao ? mascaraValorMonetario((emb as any).valor_embarcacao.toString()) : undefined,
                            seguradora_id: emb.seguradora_id || undefined,
                            cliente_id_embarcacao: emb.cliente_id || undefined,
                            // Preencher dados do proprietário
                            embarcacao_proprietario_nome: emb.proprietario_nome || undefined,
                            embarcacao_proprietario_cpf: emb.proprietario_cpf || undefined,
                            embarcacao_proprietario_telefone_e164: emb.proprietario_telefone_e164 || undefined,
                            embarcacao_proprietario_email: emb.proprietario_email || undefined
                          });
                        }}
                        style={{
                          padding: '1rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          cursor: 'pointer',
                          background: 'white',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.background = '#f0f9ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {emb.nome}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          Nº Inscrição: {emb.nr_inscricao_barco} | Tipo: {emb.tipo_embarcacao?.replace(/_/g, ' ') || 'N/A'}
                        </div>
                        {emb.Cliente && (
                          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                            Cliente: {emb.Cliente.nome}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#6b7280',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  Nenhuma embarcação encontrada. Clique em "Criar Nova Embarcação" para cadastrar.
                </div>
              )}
            </div>
          )}

          {/* Formulário de criação de nova embarcação */}
          {modoEmbarcacao === 'criar' && (
            <>
          <Grid cols={2}>
            <FormGroup>
              <Label>Nome da Embarcação</Label>
              <Input
                type="text"
                value={wizardData.embarcacao_nome || ''}
                onChange={(e) => setWizardData({ ...wizardData, embarcacao_nome: e.target.value })}
                placeholder="Ex: Veleiro Azul"
              />
            </FormGroup>
            <FormGroup>
              <Label>Número de Inscrição</Label>
              <Input
                type="text"
                value={wizardData.embarcacao_nr_inscricao_barco || ''}
                onChange={(e) => setWizardData({ ...wizardData, embarcacao_nr_inscricao_barco: e.target.value })}
                placeholder="Ex: BR123456789"
              />
            </FormGroup>
          </Grid>

          <Grid cols={2}>
            <FormGroup>
              <Label>Seguradora</Label>
              <Select
                value={wizardData.seguradora_id || ''}
                onChange={(e) => {
                  const seguradoraId = parseInt(e.target.value);
                  if (seguradoraId && !isNaN(seguradoraId)) {
                    handleSeguradoraChange(seguradoraId);
                  } else {
                    setWizardData({ ...wizardData, seguradora_id: undefined, embarcacao_tipo: undefined });
                    setTiposEmbarcacao([]);
                    setCarregandoTipos(false);
                    setError('');
                  }
                }}
              >
                <option value="">Selecione a seguradora</option>
                {seguradoras.map((seg) => (
                  <option key={seg.id} value={seg.id}>
                    {seg.nome}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>Tipo de Embarcação</Label>
              <Select
                value={wizardData.embarcacao_tipo || ''}
                onChange={(e) => setWizardData({ ...wizardData, embarcacao_tipo: e.target.value })}
                disabled={!wizardData.seguradora_id || carregandoTipos || tiposEmbarcacao.length === 0}
              >
                <option value="">
                  {!wizardData.seguradora_id
                    ? 'Selecione a seguradora primeiro'
                    : carregandoTipos
                    ? 'Carregando tipos...'
                    : tiposEmbarcacao.length === 0
                    ? 'Nenhum tipo disponível'
                    : 'Selecione o tipo'}
                </option>
                {tiposEmbarcacao.map((tipo) => (
                  <option key={tipo.tipo_embarcacao} value={tipo.tipo_embarcacao}>
                    {tipo.tipo_embarcacao.replace(/_/g, ' ')}
                  </option>
                ))}
              </Select>
              {carregandoTipos && (
                <small style={{ color: '#3b82f6', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Carregando tipos de embarcação...
                </small>
              )}
            </FormGroup>
          </Grid>

          <Grid cols={2}>
            <FormGroup>
              <Label className="optional">Porte</Label>
              <Input
                type="text"
                value={wizardData.embarcacao_porte || ''}
                onChange={(e) => setWizardData({ ...wizardData, embarcacao_porte: e.target.value })}
                placeholder="Ex: Pequeno, Médio, Grande"
              />
            </FormGroup>
            <FormGroup>
              <Label className="optional">Ano de Fabricação</Label>
              <Input
                type="number"
                value={wizardData.embarcacao_ano_fabricacao || ''}
                onChange={(e) => setWizardData({ ...wizardData, embarcacao_ano_fabricacao: e.target.value })}
                placeholder="Ex: 2020"
              />
            </FormGroup>
          </Grid>

          <FormGroup>
            <Label className="optional">Valor da Embarcação</Label>
            <Input
              type="text"
              value={wizardData.embarcacao_valor || ''}
              onChange={(e) => {
                const valor = mascaraValorMonetario(e.target.value);
                setWizardData({ ...wizardData, embarcacao_valor: valor });
              }}
              placeholder="R$ 0,00"
            />
          </FormGroup>

          <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
            Dados do Proprietário
          </h3>

          <Grid cols={2}>
            <FormGroup>
              <Label className="optional">Nome do Proprietário</Label>
              <Input
                type="text"
                value={wizardData.embarcacao_proprietario_nome || ''}
                onChange={(e) => setWizardData({ ...wizardData, embarcacao_proprietario_nome: e.target.value })}
                placeholder="Ex: João Silva"
                disabled={!!wizardData.cliente}
              />
            </FormGroup>
            <FormGroup>
              <Label className="optional">CPF do Proprietário</Label>
              <Input
                type="text"
                value={wizardData.embarcacao_proprietario_cpf ? mascaraCPF(wizardData.embarcacao_proprietario_cpf) : ''}
                onChange={(e) => {
                  const valor = mascaraCPF(e.target.value);
                  setWizardData({ ...wizardData, embarcacao_proprietario_cpf: valor });
                }}
                placeholder="000.000.000-00"
                disabled={!!wizardData.cliente}
              />
              {wizardData.cliente && (
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Preenchido automaticamente da busca
                </div>
              )}
            </FormGroup>
          </Grid>

          <Grid cols={2}>
            <FormGroup>
              <Label className="optional">Telefone do Proprietário</Label>
              <Input
                type="text"
                value={wizardData.embarcacao_proprietario_telefone_e164 ? mascaraTelefone(wizardData.embarcacao_proprietario_telefone_e164) : ''}
                onChange={(e) => {
                  const valor = mascaraTelefone(e.target.value);
                  setWizardData({ ...wizardData, embarcacao_proprietario_telefone_e164: valor });
                }}
                placeholder="(11) 99999-8888"
              />
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Formato: (DD) 9XXXX-XXXX (opcional)
              </div>
            </FormGroup>
            <FormGroup>
              <Label className="optional">Email do Proprietário</Label>
              <Input
                type="email"
                value={wizardData.embarcacao_proprietario_email || ''}
                onChange={(e) => setWizardData({ ...wizardData, embarcacao_proprietario_email: e.target.value })}
                placeholder="Ex: joao@email.com"
                disabled={!!wizardData.cliente}
              />
            </FormGroup>
          </Grid>
            </>
          )}
        </>
      ) : (
        <InfoBox type="success">
          <CheckCircle size={20} />
          <div>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
              Embarcação selecionada: {wizardData.embarcacao?.nome}
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              Nº Inscrição: {wizardData.embarcacao?.nr_inscricao_barco}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setWizardData({
                  ...wizardData,
                  embarcacao_id: undefined,
                  embarcacao: undefined
                });
              }}
              style={{ marginTop: '0.5rem' }}
            >
              Usar outra embarcação
            </Button>
          </div>
        </InfoBox>
      )}

      {error && currentStep === 2 && (
        <ErrorMessage>
          <AlertCircle size={16} />
          {error}
        </ErrorMessage>
      )}
    </StepContent>
  );

  // Renderizar Step 3: Local
  const renderStepLocal = () => (
    <StepContent>
      <FormGroup>
        <Label>Tipo do Local *</Label>
        <Select
          value={wizardData.local_tipo || ''}
          onChange={(e) => {
            const tipo = e.target.value as 'MARINA' | 'RESIDENCIA';
            setWizardData({ 
              ...wizardData, 
              local_tipo: tipo, 
              local_id: undefined,
              local: undefined,
              local_nome_local: tipo === 'RESIDENCIA' ? undefined : wizardData.local_nome_local 
            });
            setLocaisFiltrados([]);
            setModoLocal('buscar');
            if (tipo) {
              buscarLocaisPorTipo(tipo);
            }
          }}
        >
          <option value="">Selecione o tipo</option>
          <option value="MARINA">MARINA</option>
          <option value="RESIDENCIA">RESIDÊNCIA</option>
        </Select>
      </FormGroup>

      {wizardData.local_tipo && (
        <>
          {/* Opção: Buscar ou Criar */}
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1rem', 
            background: '#f9fafb', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <Label style={{ marginBottom: '0.75rem', display: 'block' }}>
              Como deseja prosseguir?
            </Label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button
                type="button"
                variant={modoLocal === 'buscar' ? 'primary' : 'secondary'}
                onClick={() => {
                  setModoLocal('buscar');
                  setFiltroBuscaLocal('');
                  if (wizardData.local_tipo) {
                    buscarLocaisPorTipo(wizardData.local_tipo);
                  }
                }}
                style={{ flex: 1 }}
              >
                <Search size={18} />
                {wizardData.local_tipo === 'MARINA' ? 'Buscar Marina Cadastrada' : 'Usar Endereço do Cliente'}
              </Button>
              <Button
                type="button"
                variant={modoLocal === 'criar' ? 'primary' : 'secondary'}
                onClick={() => {
                  setModoLocal('criar');
                  setFiltroBuscaLocal('');
                  setWizardData({
                    ...wizardData,
                    local_id: undefined,
                    local: undefined
                  });
                }}
                style={{ flex: 1 }}
              >
                <Plus size={18} />
                Criar Novo Local
              </Button>
            </div>
          </div>

          {/* Lista de locais existentes */}
          {modoLocal === 'buscar' && (
            <div style={{ marginBottom: '2rem' }}>
              {buscandoLocais ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  Buscando locais...
                </div>
              ) : locaisFiltrados.length > 0 ? (
                <>
                  <Label style={{ marginBottom: '0.75rem', display: 'block' }}>
                    {wizardData.local_tipo === 'MARINA' 
                      ? 'Selecione uma marina:' 
                      : 'Selecione o endereço do cliente:'}
                  </Label>
                  
                  {/* Campo de filtro/busca */}
                  <div style={{ marginBottom: '1rem' }}>
                    <Input
                      type="text"
                      value={filtroBuscaLocal}
                      onChange={(e) => setFiltroBuscaLocal(e.target.value)}
                      placeholder="Buscar por nome, endereço, cidade..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '0.5rem'
                  }}>
                    {locaisFiltrados
                      .filter((local) => {
                        if (!filtroBuscaLocal.trim()) return true;
                        const busca = filtroBuscaLocal.toLowerCase();
                        return (
                          (local.nome_local && local.nome_local.toLowerCase().includes(busca)) ||
                          (local.logradouro && local.logradouro.toLowerCase().includes(busca)) ||
                          (local.cidade && local.cidade.toLowerCase().includes(busca)) ||
                          (local.bairro && local.bairro.toLowerCase().includes(busca)) ||
                          (local.cep && local.cep.includes(busca))
                        );
                      })
                      .map((local) => (
                      <div
                        key={local.id}
                        onClick={() => {
                          setWizardData({
                            ...wizardData,
                            local_id: local.id,
                            local: local,
                            local_nome_local: local.nome_local || undefined,
                            local_cep: local.cep || '',
                            local_logradouro: local.logradouro || '',
                            local_numero: local.numero || '',
                            local_complemento: local.complemento || '',
                            local_bairro: local.bairro || '',
                            local_cidade: local.cidade || '',
                            local_estado: local.estado || ''
                          });
                        }}
                        style={{
                          padding: '1rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          cursor: 'pointer',
                          background: wizardData.local_id === local.id ? '#f0f9ff' : 'white',
                          borderColor: wizardData.local_id === local.id ? '#3b82f6' : '#e5e7eb',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (wizardData.local_id !== local.id) {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.background = '#f0f9ff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (wizardData.local_id !== local.id) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                          {local.nome_local || local.tipo}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {local.logradouro}, {local.numero || 'S/N'}
                          {local.bairro && ` - ${local.bairro}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                          {local.cidade} - {local.estado} | CEP: {formatarCEP(local.cep || '')}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : wizardData.local_tipo === 'RESIDENCIA' && wizardData.cliente ? (
                <div style={{ 
                  padding: '1.5rem', 
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                    Endereço do Cliente: {wizardData.cliente.nome}
                  </div>
                  {wizardData.cliente.logradouro ? (
                    <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                      {wizardData.cliente.logradouro}, {wizardData.cliente.numero || 'S/N'}
                      {wizardData.cliente.bairro && ` - ${wizardData.cliente.bairro}`}
                      <br />
                      {wizardData.cliente.cidade} - {wizardData.cliente.estado} | CEP: {wizardData.cliente.cep ? formatarCEP(wizardData.cliente.cep) : 'N/A'}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Cliente não possui endereço cadastrado. Clique em "Criar Novo Local" para cadastrar.
                    </div>
                  )}
                  {wizardData.cliente.logradouro && (
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        // Usar endereço do cliente
                        setWizardData({
                          ...wizardData,
                          local_cep: wizardData.cliente?.cep || '',
                          local_logradouro: wizardData.cliente?.logradouro || '',
                          local_numero: wizardData.cliente?.numero || '',
                          local_complemento: wizardData.cliente?.complemento || '',
                          local_bairro: wizardData.cliente?.bairro || '',
                          local_cidade: wizardData.cliente?.cidade || '',
                          local_estado: wizardData.cliente?.estado || ''
                        });
                      }}
                      style={{ marginTop: '0.75rem' }}
                    >
                      Usar Este Endereço
                    </Button>
                  )}
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: '#6b7280',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  {wizardData.local_tipo === 'MARINA' 
                    ? 'Nenhuma marina encontrada. Clique em "Criar Novo Local" para cadastrar.'
                    : 'Nenhum endereço disponível. Clique em "Criar Novo Local" para cadastrar.'}
                </div>
              )}
            </div>
          )}

          {/* Mostrar local selecionado */}
          {wizardData.local_id && wizardData.local && (
            <div style={{ 
              padding: '1rem', 
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} color="#10b981" />
                Local selecionado: {wizardData.local.nome_local || wizardData.local.tipo}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                {wizardData.local.logradouro}, {wizardData.local.numero || 'S/N'}
                {wizardData.local.bairro && ` - ${wizardData.local.bairro}`}
                <br />
                {wizardData.local.cidade} - {wizardData.local.estado} | CEP: {formatarCEP(wizardData.local.cep || '')}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setWizardData({
                    ...wizardData,
                    local_id: undefined,
                    local: undefined
                  });
                  setModoLocal('buscar');
                }}
                style={{ marginTop: '0.75rem' }}
              >
                Usar Outro Local
              </Button>
            </div>
          )}

          {/* Formulário de endereço (só aparece se não tiver local selecionado) */}
          {!wizardData.local_id && modoLocal === 'criar' && (
            <>
      <Grid cols={2}>
        <FormGroup>
          <Label>CEP *</Label>
          <div style={{ position: 'relative' }}>
            <Input
              type="text"
              value={wizardData.local_cep ? formatarCEP(wizardData.local_cep) : ''}
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, '');
                // Limitar a 8 dígitos
                const cepLimpo = valor.slice(0, 8);
                setWizardData({ ...wizardData, local_cep: cepLimpo });
                setError('');
                
                // Buscar CEP automaticamente quando tiver 8 dígitos
                if (cepLimpo.length === 8) {
                  buscarLocalPorCEP(cepLimpo);
                } else {
                  // Limpar campos se CEP incompleto
                  if (cepLimpo.length < 8) {
                    setWizardData({
                      ...wizardData,
                      local_cep: cepLimpo,
                      local_logradouro: '',
                      local_bairro: '',
                      local_cidade: '',
                      local_estado: ''
                    });
                  }
                }
              }}
              onBlur={(e) => {
                // Buscar novamente ao sair do campo se tiver 8 dígitos
                const cepLimpo = e.target.value.replace(/\D/g, '');
                if (cepLimpo.length === 8 && !loadingCEP) {
                  buscarLocalPorCEP(cepLimpo);
                }
              }}
              placeholder="00000-000"
              maxLength={9}
              disabled={loadingCEP}
              style={{
                paddingRight: loadingCEP ? '40px' : '12px'
              }}
            />
            {loadingCEP && (
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                border: '2px solid #e5e7eb',
                borderTop: '2px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}>
                <style>{`
                  @keyframes spin {
                    0% { transform: translateY(-50%) rotate(0deg); }
                    100% { transform: translateY(-50%) rotate(360deg); }
                  }
                `}</style>
              </div>
            )}
          </div>
          {loadingCEP && (
            <small style={{ color: '#3b82f6', marginTop: '4px', display: 'block' }}>
              Buscando endereço...
            </small>
          )}
        </FormGroup>
        <FormGroup>
          <Label>Estado</Label>
          <Select
            value={wizardData.local_estado || ''}
            onChange={(e) => setWizardData({ ...wizardData, local_estado: e.target.value })}
          >
            <option value="">Selecione</option>
            <option value="AC">Acre</option>
            <option value="AL">Alagoas</option>
            <option value="AP">Amapá</option>
            <option value="AM">Amazonas</option>
            <option value="BA">Bahia</option>
            <option value="CE">Ceará</option>
            <option value="DF">Distrito Federal</option>
            <option value="ES">Espírito Santo</option>
            <option value="GO">Goiás</option>
            <option value="MA">Maranhão</option>
            <option value="MT">Mato Grosso</option>
            <option value="MS">Mato Grosso do Sul</option>
            <option value="MG">Minas Gerais</option>
            <option value="PA">Pará</option>
            <option value="PB">Paraíba</option>
            <option value="PR">Paraná</option>
            <option value="PE">Pernambuco</option>
            <option value="PI">Piauí</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="RN">Rio Grande do Norte</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="RO">Rondônia</option>
            <option value="RR">Roraima</option>
            <option value="SC">Santa Catarina</option>
            <option value="SP">São Paulo</option>
            <option value="SE">Sergipe</option>
            <option value="TO">Tocantins</option>
          </Select>
        </FormGroup>
      </Grid>

      <FormGroup>
        <Label>Logradouro</Label>
        <Input
          type="text"
          value={wizardData.local_logradouro || ''}
          onChange={(e) => setWizardData({ ...wizardData, local_logradouro: e.target.value })}
          placeholder="Ex: Rua, Avenida, etc."
          readOnly={loadingCEP}
          style={{
            backgroundColor: loadingCEP ? '#f9fafb' : 'white',
            cursor: loadingCEP ? 'not-allowed' : 'text'
          }}
        />
      </FormGroup>

      <Grid cols={3}>
        <FormGroup>
          <Label>Número *</Label>
          <Input
            type="text"
            value={wizardData.local_numero || ''}
            onChange={(e) => setWizardData({ ...wizardData, local_numero: e.target.value })}
            placeholder="Ex: 123"
          />
        </FormGroup>
        <FormGroup>
          <Label className="optional">Complemento</Label>
          <Input
            type="text"
            value={wizardData.local_complemento || ''}
            onChange={(e) => setWizardData({ ...wizardData, local_complemento: e.target.value })}
            placeholder="Ex: Apto 101"
          />
        </FormGroup>
        <FormGroup>
          <Label>Bairro *</Label>
          <Input
            type="text"
            value={wizardData.local_bairro || ''}
            onChange={(e) => setWizardData({ ...wizardData, local_bairro: e.target.value })}
            placeholder="Ex: Centro"
            readOnly={loadingCEP}
            style={{
              backgroundColor: loadingCEP ? '#f9fafb' : 'white',
              cursor: loadingCEP ? 'not-allowed' : 'text'
            }}
          />
        </FormGroup>
      </Grid>

      <FormGroup>
        <Label>Cidade *</Label>
        <Input
          type="text"
          value={wizardData.local_cidade || ''}
          onChange={(e) => setWizardData({ ...wizardData, local_cidade: e.target.value })}
          placeholder="Ex: São Paulo"
          readOnly={loadingCEP}
          style={{
            backgroundColor: loadingCEP ? '#f9fafb' : 'white',
            cursor: loadingCEP ? 'not-allowed' : 'text'
          }}
        />
      </FormGroup>
            </>
          )}
        </>
      )}

      {error && currentStep === 3 && (
        <ErrorMessage>
          <AlertCircle size={16} />
          {error}
        </ErrorMessage>
      )}
    </StepContent>
  );

  // Renderizar Step 4: Informações
  const renderStepInformacoes = () => {
    // Filtrar vistoriadores baseado no termo de busca
    const vistoriadoresFiltrados = vistoriadores.filter((vist) => {
      if (!filtroBuscaVistoriador.trim()) return true;
      const busca = filtroBuscaVistoriador.toLowerCase();
      const cpfLimpo = busca.replace(/\D/g, '');
      return (
        vist.nome.toLowerCase().includes(busca) ||
        (vist.cpf && vist.cpf.replace(/\D/g, '').includes(cpfLimpo)) ||
        (vist.email && vist.email.toLowerCase().includes(busca))
      );
    });

    const vistoriadorSelecionado = vistoriadores.find(v => v.id === wizardData.vistoriador_id);

    return (
      <StepContent>
        <FormGroup>
          <Label>Vistoriador Responsável *</Label>
          
          {vistoriadorSelecionado ? (
            <InfoBox type="success">
              <CheckCircle size={20} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  Vistoriador selecionado: {vistoriadorSelecionado.nome}
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  {vistoriadorSelecionado.cpf && `CPF: ${vistoriadorSelecionado.cpf}`}
                  {vistoriadorSelecionado.email && ` | Email: ${vistoriadorSelecionado.email}`}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setWizardData({ ...wizardData, vistoriador_id: undefined });
                    setFiltroBuscaVistoriador('');
                  }}
                  style={{ marginTop: '0.5rem' }}
                >
                  Selecionar outro vistoriador
                </Button>
              </div>
            </InfoBox>
          ) : (
            <>
              {/* Campo de busca */}
              <div style={{ marginBottom: '1rem' }}>
              <Input
                type="text"
                value={filtroBuscaVistoriador}
                onChange={(e) => setFiltroBuscaVistoriador(e.target.value)}
                placeholder="Buscar por nome, CPF ou email..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Lista de vistoriadores */}
            {vistoriadores.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#6b7280',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                Nenhum vistoriador cadastrado no sistema
              </div>
            ) : vistoriadoresFiltrados.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#6b7280',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                Nenhum vistoriador encontrado com o termo "{filtroBuscaVistoriador}"
              </div>
            ) : (
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '0.5rem'
              }}>
                {vistoriadoresFiltrados.map((vist) => (
                  <div
                    key={vist.id}
                    onClick={() => {
                      setWizardData({ ...wizardData, vistoriador_id: vist.id });
                      setFiltroBuscaVistoriador('');
                      setError('');
                    }}
                    style={{
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      background: 'white',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.background = '#f0f9ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                      {vist.nome}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {vist.cpf && `CPF: ${vist.cpf}`}
                      {vist.cpf && vist.email && ' | '}
                      {vist.email && `Email: ${vist.email}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
          )}
        </FormGroup>

        <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
          Valores
        </h3>

        <Grid cols={3}>
        <FormGroup>
          <Label className="optional">Valor da Embarcação</Label>
          <Input
            type="text"
            value={wizardData.valor_embarcacao || ''}
            onChange={(e) => {
              const valor = mascaraValorMonetario(e.target.value);
              setWizardData({ ...wizardData, valor_embarcacao: valor });
            }}
            placeholder="R$ 0,00"
          />
        </FormGroup>
        <FormGroup>
          <Label className="optional">Valor da Vistoria</Label>
          <Input
            type="text"
            value={wizardData.valor_vistoria || ''}
            onChange={(e) => {
              const valor = mascaraValorMonetario(e.target.value);
              setWizardData({ ...wizardData, valor_vistoria: valor });
            }}
            placeholder="R$ 0,00"
          />
        </FormGroup>
        <FormGroup>
          <Label className="optional">Valor do Vistoriador</Label>
          <Input
            type="text"
            value={wizardData.valor_vistoriador || ''}
            onChange={(e) => {
              const valor = mascaraValorMonetario(e.target.value);
              setWizardData({ ...wizardData, valor_vistoriador: valor });
            }}
            placeholder="R$ 0,00"
          />
        </FormGroup>
        </Grid>

        <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
          Contato / Acompanhante
        </h3>

        <FormGroup>
        <Label className="optional">Tipo de Contato</Label>
        <Select
          value={wizardData.contato_acompanhante_tipo || ''}
          onChange={(e) => {
            const tipo = e.target.value;
            if (tipo === 'PROPRIETARIO') {
              // Preencher automaticamente com dados do proprietário da embarcação
              // Prioridade: dados salvos no wizardData > dados da embarcação selecionada > dados do cliente
              const nomeProprietario = 
                wizardData.embarcacao_proprietario_nome || 
                wizardData.embarcacao?.proprietario_nome || 
                wizardData.cliente?.nome || 
                '';
              
              const telefoneProprietario = 
                wizardData.embarcacao_proprietario_telefone_e164 || 
                wizardData.embarcacao?.proprietario_telefone_e164 || 
                wizardData.cliente?.telefone_e164 || 
                '';
              
              const emailProprietario = 
                wizardData.embarcacao_proprietario_email || 
                wizardData.embarcacao?.proprietario_email || 
                wizardData.cliente?.email || 
                '';
              
              setWizardData({
                ...wizardData,
                contato_acompanhante_tipo: tipo,
                contato_acompanhante_nome: nomeProprietario,
                contato_acompanhante_telefone_e164: telefoneProprietario,
                contato_acompanhante_email: emailProprietario
              });
            } else {
              // Limpar campos se mudar para outro tipo
              setWizardData({
                ...wizardData,
                contato_acompanhante_tipo: tipo,
                contato_acompanhante_nome: '',
                contato_acompanhante_telefone_e164: '',
                contato_acompanhante_email: ''
              });
            }
          }}
        >
          <option value="">Selecione</option>
          <option value="PROPRIETARIO">Proprietário</option>
          <option value="MARINA">Marina</option>
          <option value="TERCEIRO">Terceiro</option>
        </Select>
        </FormGroup>

        <Grid cols={2}>
        <FormGroup>
          <Label className="optional">Nome do Contato</Label>
          <Input
            type="text"
            value={wizardData.contato_acompanhante_nome || ''}
            onChange={(e) => setWizardData({ ...wizardData, contato_acompanhante_nome: e.target.value })}
            placeholder="Ex: João Silva"
          />
        </FormGroup>
        <FormGroup>
          <Label className="optional">Telefone do Contato</Label>
          <Input
            type="text"
            value={wizardData.contato_acompanhante_telefone_e164 ? mascaraTelefone(wizardData.contato_acompanhante_telefone_e164) : ''}
            onChange={(e) => {
              const valor = mascaraTelefone(e.target.value);
              setWizardData({ ...wizardData, contato_acompanhante_telefone_e164: valor });
            }}
            placeholder="(11) 99999-8888"
          />
        </FormGroup>
        </Grid>

        <FormGroup>
          <Label className="optional">Email do Contato</Label>
        <Input
          type="email"
          value={wizardData.contato_acompanhante_email || ''}
          onChange={(e) => setWizardData({ ...wizardData, contato_acompanhante_email: e.target.value })}
          placeholder="Ex: contato@email.com"
        />
        </FormGroup>

        <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
          Dados da Corretora (Opcional)
        </h3>

        <Grid cols={2}>
        <FormGroup>
          <Label className="optional">Nome da Corretora</Label>
          <Input
            type="text"
            value={wizardData.corretora_nome || ''}
            onChange={(e) => setWizardData({ ...wizardData, corretora_nome: e.target.value })}
            placeholder="Ex: Corretora XYZ"
          />
        </FormGroup>
        <FormGroup>
          <Label className="optional">Telefone da Corretora</Label>
          <Input
            type="text"
            value={wizardData.corretora_telefone_e164 ? mascaraTelefone(wizardData.corretora_telefone_e164) : ''}
            onChange={(e) => {
              const valor = mascaraTelefone(e.target.value);
              setWizardData({ ...wizardData, corretora_telefone_e164: valor });
            }}
            placeholder="(11) 99999-8888"
          />
        </FormGroup>
        </Grid>

        <FormGroup>
          <Label className="optional">Email para Envio do Laudo</Label>
        <Input
          type="email"
          value={wizardData.corretora_email_laudo || ''}
          onChange={(e) => setWizardData({ ...wizardData, corretora_email_laudo: e.target.value })}
          placeholder="Ex: laudo@corretora.com"
        />
        </FormGroup>

        {error && currentStep === 4 && (
          <ErrorMessage>
            <AlertCircle size={16} />
            {error}
          </ErrorMessage>
        )}
      </StepContent>
    );
  };

  // Renderizar Step 5: Revisão
  const renderStepRevisao = () => {
    const seguradora = seguradoras.find(s => s.id === wizardData.seguradora_id);
    const vistoriador = vistoriadores.find(v => v.id === wizardData.vistoriador_id);

    return (
      <StepContent>
        <ReviewSection>
          <ReviewTitle>
            <User size={20} />
            Cliente
          </ReviewTitle>
          {wizardData.cliente && (
            <>
              <ReviewItem>
                <ReviewLabel>Nome:</ReviewLabel>
                <ReviewValue>{wizardData.cliente.nome}</ReviewValue>
              </ReviewItem>
              <ReviewItem>
                <ReviewLabel>Documento:</ReviewLabel>
                <ReviewValue>{wizardData.cliente.cpf || wizardData.cliente.cnpj}</ReviewValue>
              </ReviewItem>
              {wizardData.cliente.email && (
                <ReviewItem>
                  <ReviewLabel>Email:</ReviewLabel>
                  <ReviewValue>{wizardData.cliente.email}</ReviewValue>
                </ReviewItem>
              )}
            </>
          )}
        </ReviewSection>

        <ReviewSection>
          <ReviewTitle>
            <Ship size={20} />
            Embarcação
          </ReviewTitle>
          {wizardData.embarcacao_id ? (
            <>
              <ReviewItem>
                <ReviewLabel>Nome:</ReviewLabel>
                <ReviewValue>{wizardData.embarcacao?.nome}</ReviewValue>
              </ReviewItem>
              <ReviewItem>
                <ReviewLabel>Nº Inscrição:</ReviewLabel>
                <ReviewValue>{wizardData.embarcacao?.nr_inscricao_barco}</ReviewValue>
              </ReviewItem>
            </>
          ) : (
            <>
              <ReviewItem>
                <ReviewLabel>Nome:</ReviewLabel>
                <ReviewValue>{wizardData.embarcacao_nome}</ReviewValue>
              </ReviewItem>
              <ReviewItem>
                <ReviewLabel>Nº Inscrição:</ReviewLabel>
                <ReviewValue>{wizardData.embarcacao_nr_inscricao_barco}</ReviewValue>
              </ReviewItem>
              {wizardData.embarcacao_tipo && (
                <ReviewItem>
                  <ReviewLabel>Tipo:</ReviewLabel>
                  <ReviewValue>{wizardData.embarcacao_tipo}</ReviewValue>
                </ReviewItem>
              )}
              {seguradora && (
                <ReviewItem>
                  <ReviewLabel>Seguradora:</ReviewLabel>
                  <ReviewValue>{seguradora.nome}</ReviewValue>
                </ReviewItem>
              )}
            </>
          )}
        </ReviewSection>

        <ReviewSection>
          <ReviewTitle>
            <MapPin size={20} />
            Local da Vistoria
          </ReviewTitle>
          <ReviewItem>
            <ReviewLabel>Tipo:</ReviewLabel>
            <ReviewValue>{wizardData.local_tipo}</ReviewValue>
          </ReviewItem>
          {wizardData.local_nome_local && (
            <ReviewItem>
              <ReviewLabel>Nome:</ReviewLabel>
              <ReviewValue>{wizardData.local_nome_local}</ReviewValue>
            </ReviewItem>
          )}
          <ReviewItem>
            <ReviewLabel>Endereço:</ReviewLabel>
            <ReviewValue>
              {wizardData.local_logradouro}
              {wizardData.local_numero && `, ${wizardData.local_numero}`}
              {wizardData.local_complemento && ` - ${wizardData.local_complemento}`}
            </ReviewValue>
          </ReviewItem>
          <ReviewItem>
            <ReviewLabel>Bairro:</ReviewLabel>
            <ReviewValue>{wizardData.local_bairro}</ReviewValue>
          </ReviewItem>
          <ReviewItem>
            <ReviewLabel>Cidade/Estado:</ReviewLabel>
            <ReviewValue>{wizardData.local_cidade} - {wizardData.local_estado}</ReviewValue>
          </ReviewItem>
          <ReviewItem>
            <ReviewLabel>CEP:</ReviewLabel>
            <ReviewValue>{wizardData.local_cep ? formatarCEP(wizardData.local_cep) : '-'}</ReviewValue>
          </ReviewItem>
        </ReviewSection>

        <ReviewSection>
          <ReviewTitle>
            <FileText size={20} />
            Informações da Vistoria
          </ReviewTitle>
          <ReviewItem>
            <ReviewLabel>Vistoriador:</ReviewLabel>
            <ReviewValue>{vistoriador?.nome}</ReviewValue>
          </ReviewItem>
          {wizardData.valor_embarcacao && (
            <ReviewItem>
              <ReviewLabel>Valor da Embarcação:</ReviewLabel>
              <ReviewValue>{wizardData.valor_embarcacao}</ReviewValue>
            </ReviewItem>
          )}
          {wizardData.valor_vistoria && (
            <ReviewItem>
              <ReviewLabel>Valor da Vistoria:</ReviewLabel>
              <ReviewValue>{wizardData.valor_vistoria}</ReviewValue>
            </ReviewItem>
          )}
          {wizardData.valor_vistoriador && (
            <ReviewItem>
              <ReviewLabel>Valor do Vistoriador:</ReviewLabel>
              <ReviewValue>{wizardData.valor_vistoriador}</ReviewValue>
            </ReviewItem>
          )}
          {wizardData.contato_acompanhante_nome && (
            <ReviewItem>
              <ReviewLabel>Contato:</ReviewLabel>
              <ReviewValue>
                {wizardData.contato_acompanhante_nome}
                {wizardData.contato_acompanhante_tipo && ` (${wizardData.contato_acompanhante_tipo})`}
              </ReviewValue>
            </ReviewItem>
          )}
          {wizardData.corretora_nome && (
            <ReviewItem>
              <ReviewLabel>Corretora:</ReviewLabel>
              <ReviewValue>{wizardData.corretora_nome}</ReviewValue>
            </ReviewItem>
          )}
        </ReviewSection>

        {error && (
          <ErrorMessage>
            <AlertCircle size={16} />
            {error}
          </ErrorMessage>
        )}

        {success && (
          <InfoBox type="success">
            <CheckCircle size={20} />
            {success}
          </InfoBox>
        )}
      </StepContent>
    );
  };

  if (loading && !buscando) {
    return (
      <LoadingOverlay>
        <div>Carregando...</div>
      </LoadingOverlay>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/vistorias')}>
          <ArrowLeft size={18} />
          Voltar
        </BackButton>
        <Title>Nova Vistoria</Title>
      </Header>

      <Card>
        <ProgressBar currentStep={currentStep} totalSteps={5} steps={steps} />

        {currentStep === 1 && renderStepCliente()}
        {currentStep === 2 && renderStepEmbarcacao()}
        {currentStep === 3 && renderStepLocal()}
        {currentStep === 4 && renderStepInformacoes()}
        {currentStep === 5 && renderStepRevisao()}

        <ButtonGroup>
          <Button variant="secondary" onClick={handleBack} disabled={currentStep === 1}>
            <ArrowLeft size={18} />
            Anterior
          </Button>
          {currentStep < 5 ? (
            <Button variant="primary" onClick={handleNext}>
              Próximo
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Criando...' : (
                <>
                  <CheckCircle size={18} />
                  Criar Vistoria
                </>
              )}
            </Button>
          )}
        </ButtonGroup>
      </Card>
    </Container>
  );
};

export default NovaVistoria;

