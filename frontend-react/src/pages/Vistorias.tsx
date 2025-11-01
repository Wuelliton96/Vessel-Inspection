import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
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
  ClipboardCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Vistoria, Usuario } from '../types';
import { vistoriaService, usuarioService } from '../services/api';
import { useAccessControl } from '../hooks/useAccessControl';
import { buscarCEP, formatarCEP, validarCEP } from '../utils/cepUtils';

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
  const { isAdmin } = useAccessControl();
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [vistoriadores, setVistoriadores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVistoria, setEditingVistoria] = useState<Vistoria | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [camposBloqueados, setCamposBloqueados] = useState({
    local_logradouro: false,
    local_bairro: false,
    local_cidade: false,
    local_estado: false
  });
  const [formData, setFormData] = useState({
    // Campos da Embarcação
    embarcacao_nome: '',
    embarcacao_numero_casco: '',
    embarcacao_proprietario_nome: '',
    embarcacao_proprietario_email: '',
    
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
    dados_rascunho: null as any
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('=== CARREGANDO DADOS DE VISTORIAS ===');
      console.log('isAdmin:', isAdmin);
      
      // Carregar vistorias baseado no nível de acesso
      const vistoriasData = isAdmin 
        ? await vistoriaService.getAll() 
        : await vistoriaService.getByVistoriador();
      
      console.log('Vistorias carregadas:', vistoriasData.length);
      console.log('Primeira vistoria:', vistoriasData[0]);
      console.log('Estrutura da primeira vistoria:', JSON.stringify(vistoriasData[0], null, 2));
      
      setVistorias(vistoriasData);
      
      // Carregar vistoriadores apenas se for admin
      if (isAdmin) {
        const vistoriadoresData = await usuarioService.getAll();
        
        // Filtrar apenas vistoriadores (nivelAcessoId === 2)
        const vistoriadoresFiltrados = vistoriadoresData.filter(u => u.nivelAcessoId === 2);
        
        console.log('Vistoriadores carregados:', vistoriadoresFiltrados.length);
        setVistoriadores(vistoriadoresFiltrados);
      } else {
        setVistoriadores([]);
      }
      
      console.log('=== DADOS CARREGADOS COM SUCESSO ===');
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar dados: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setEditingVistoria(null);
    setFormData({
      // Campos da Embarcação
      embarcacao_nome: '',
      embarcacao_numero_casco: '',
      embarcacao_proprietario_nome: '',
      embarcacao_proprietario_email: '',
      
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
      dados_rascunho: null
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
      embarcacao_numero_casco: vistoria.Embarcacao?.numero_casco || vistoria.embarcacao?.numero_casco || '',
      embarcacao_proprietario_nome: vistoria.Embarcacao?.proprietario_nome || vistoria.embarcacao?.proprietario_nome || '',
      embarcacao_proprietario_email: vistoria.Embarcacao?.proprietario_email || vistoria.embarcacao?.proprietario_email || '',
      
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
      dados_rascunho: vistoria.dados_rascunho
    };
    
    console.log('FormData configurado:', formDataToSet);
    setFormData(formDataToSet);
    setShowModal(true);
    
    console.log('=== EDIÇÃO INICIADA COM SUCESSO ===');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta vistoria?')) {
      return;
    }

    try {
      await vistoriaService.delete(id);
      setSuccess('Vistoria excluída com sucesso!');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao excluir vistoria: ' + (err.response?.data?.error || err.message));
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

    try {
      console.log('=== INICIANDO ATUALIZAÇÃO DE VISTORIA ===');
      console.log('editingVistoria:', editingVistoria);
      console.log('formData:', formData);
      
      if (editingVistoria) {
        console.log('Atualizando vistoria ID:', editingVistoria.id);
        console.log('Dados para atualização:', formData);
        
        const response = await vistoriaService.update(editingVistoria.id, formData);
        console.log('Resposta da atualização:', response);
        
        setSuccess('Vistoria atualizada com sucesso!');
      } else {
        console.log('Criando nova vistoria');
        console.log('Dados para criação:', formData);
        
        const response = await vistoriaService.create(formData);
        console.log('Resposta da criação:', response);
        
        setSuccess('Vistoria criada com sucesso!');
      }
      
      setShowModal(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
      
      console.log('=== ATUALIZAÇÃO CONCLUÍDA COM SUCESSO ===');
    } catch (err: any) {
      console.error('Erro ao salvar vistoria:', err);
      console.error('Erro completo:', JSON.stringify(err, null, 2));
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      
      setError('Erro ao salvar vistoria: ' + (err.response?.data?.error || err.message));
    }
  };

  const filteredVistorias = vistorias.filter(vistoria => {
    const searchLower = searchTerm.toLowerCase();
    const embarcacaoNome = (vistoria.Embarcacao?.nome || vistoria.embarcacao?.nome || '').toLowerCase();
    const embarcacaoNumero = (vistoria.Embarcacao?.numero_casco || vistoria.embarcacao?.numero_casco || '').toLowerCase();
    const localNome = (vistoria.Local?.nome_local || vistoria.local?.nome_local || '').toLowerCase();
    const vistoriadorNome = vistoria.vistoriador?.nome?.toLowerCase() || '';
    const statusNome = (vistoria.StatusVistoria?.nome || vistoria.statusVistoria?.nome || '').toLowerCase();
    
    return embarcacaoNome.includes(searchLower) ||
           embarcacaoNumero.includes(searchLower) ||
           localNome.includes(searchLower) ||
           vistoriadorNome.includes(searchLower) ||
           statusNome.includes(searchLower);
  });

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
          {isAdmin && <AdminBadge>Admin</AdminBadge>}
        </Title>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Buscar vistorias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isAdmin && (
            <Button variant="primary" onClick={handleCreate} title="Criar nova vistoria (Admin)">
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

      {isAdmin && (
        <AdminInfo>
          <InfoIcon>
            <User size={16} />
          </InfoIcon>
          <InfoText>
            <strong>Modo Administrador:</strong> Você tem acesso completo a todas as vistorias. 
            Pode criar, editar, excluir e alterar vistoriadores de qualquer vistoria.
          </InfoText>
        </AdminInfo>
      )}

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
              <TableHeaderCell>Embarcação</TableHeaderCell>
              <TableHeaderCell>Local</TableHeaderCell>
              <TableHeaderCell>Vistoriador</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Data</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {filteredVistorias.map((vistoria) => (
              <TableRow key={vistoria.id} isAdmin={isAdmin}>
                <TableCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Ship size={20} color="#3b82f6" />
                    <div>
                      <div style={{ fontWeight: '600' }}>{vistoria.Embarcacao?.nome || vistoria.embarcacao?.nome || 'N/A'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                        {vistoria.Embarcacao?.numero_casco || vistoria.embarcacao?.numero_casco || 'N/A'}
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
                    {vistoria.vistoriador?.nome || 'N/A'}
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
                    {new Date(vistoria.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <ActionButtons>
                      <IconButton 
                        variant="edit" 
                        onClick={() => handleEdit(vistoria)}
                        title="Editar vistoria (Admin)"
                      >
                        <Edit size={16} />
                      </IconButton>
                      <IconButton 
                        variant="delete" 
                        onClick={() => handleDelete(vistoria.id)}
                        title="Excluir vistoria (Admin)"
                      >
                        <Trash2 size={16} />
                      </IconButton>
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
                <Label htmlFor="embarcacao_numero_casco">Número do Casco *</Label>
                <Input
                  id="embarcacao_numero_casco"
                  type="text"
                  value={formData.embarcacao_numero_casco}
                  onChange={(e) => setFormData({ ...formData, embarcacao_numero_casco: e.target.value })}
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
                <Label htmlFor="embarcacao_proprietario_email">Email do Proprietário</Label>
                <Input
                  id="embarcacao_proprietario_email"
                  type="email"
                  value={formData.embarcacao_proprietario_email}
                  onChange={(e) => setFormData({ ...formData, embarcacao_proprietario_email: e.target.value })}
                  placeholder="Ex: joao@email.com"
                />
              </FormGroup>

              {/* Seção do Local */}
              <SectionTitle>
                <MapPin size={20} />
                Dados do Local
              </SectionTitle>

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
                    <strong>💡 Dica:</strong> Como administrador, você pode alterar o vistoriador responsável por esta vistoria.
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
                <Button type="submit" variant="primary">
                  {editingVistoria ? 'Atualizar' : 'Criar'}
                </Button>
              </ModalButtons>
            </Form>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default Vistorias;
