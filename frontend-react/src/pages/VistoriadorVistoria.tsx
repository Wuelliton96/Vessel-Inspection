// frontend-react/src/pages/VistoriadorVistoria.tsx
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  Trash2, 
  Save, 
  ArrowLeft,
  AlertCircle,
  Info,
  CheckSquare,
  Square,
  Play,
  Video,
  X,
  MessageCircle,
  MapPin,
  Navigation
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { vistoriadorService, checklistService } from '../services/api';
import { API_CONFIG } from '../config/api';
import { ChecklistStatus, ChecklistItem, VistoriaChecklistItem, ChecklistProgresso } from '../types';

// Styled Components
const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #4b5563;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const StatusBadge = styled.div<{ status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'PENDENTE':
        return 'background: #fef3c7; color: #92400e;';
      case 'EM_ANDAMENTO':
        return 'background: #dbeafe; color: #1e40af;';
      case 'CONCLUIDA':
        return 'background: #d1fae5; color: #065f46;';
      case 'APROVADA':
        return 'background: #dcfce7; color: #166534;';
      case 'REJEITADA':
        return 'background: #fee2e2; color: #991b1b;';
      default:
        return 'background: #f3f4f6; color: #374151;';
    }
  }}
`;

const VistoriaInfo = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
`;

const InfoValue = styled.span`
  font-size: 1rem;
  color: #1f2937;
`;

const ChecklistSection = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: #10b981;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
`;

const ChecklistItemStyled = styled.div<{ completed: boolean }>`
  border: 1px solid ${props => props.completed ? '#10b981' : '#e5e7eb'};
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: ${props => props.completed ? '#f0fdf4' : 'white'};
`;

const ChecklistHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const ChecklistInfo = styled.div`
  flex: 1;
`;

const ChecklistTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
`;

const ChecklistDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const ChecklistActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;

  ${props => {
    switch (props.variant) {
      case 'primary':
        return 'background: #3b82f6; color: white; &:hover { background: #2563eb; }';
      case 'danger':
        return 'background: #ef4444; color: white; &:hover { background: #dc2626; }';
      case 'secondary':
        return 'background: #6b7280; color: white; &:hover { background: #4b5563; }';
      default:
        return 'background: #f3f4f6; color: #374151; &:hover { background: #e5e7eb; }';
    }
  }}
`;

const PhotoPreview = styled.div`
  margin-top: 1rem;
`;

const PhotoImage = styled.img`
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const PhotoInfo = styled.div`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const FileInput = styled.input`
  display: none;
`;

const StatusActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const Message = styled.div<{ type: 'success' | 'error' | 'info' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return 'background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0;';
      case 'error':
        return 'background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;';
      case 'info':
        return 'background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe;';
    }
  }}
`;


const VistoriadorVistoria: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [vistoria, setVistoria] = useState<any>(null);
  const [checklistStatus, setChecklistStatus] = useState<ChecklistStatus | null>(null);
  const [checklistItens, setChecklistItens] = useState<VistoriaChecklistItem[]>([]);
  const [progresso, setProgresso] = useState<ChecklistProgresso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState<number | null>(null);

  const loadVistoria = useCallback(async () => {
    if (!id || !token) return;
    
    try {
      setLoading(true);
      setError('');
      console.log('Carregando vistoria:', id);
      
      // Carregar dados da vistoria
      const vistoriaData = await vistoriadorService.getVistoriaById(parseInt(id));
      setVistoria(vistoriaData);
      
      // Carregar status do checklist (antigo - ainda mantém)
      const checklistData = await vistoriadorService.getChecklistStatus(parseInt(id));
      setChecklistStatus(checklistData);
      
      // Carregar novo sistema de checklist
      try {
        const itens = await checklistService.getChecklistVistoria(parseInt(id));
        setChecklistItens(itens);
        
        const prog = await checklistService.getProgresso(parseInt(id));
        setProgresso(prog);
      } catch (checkErr) {
        console.log('Checklist ainda não copiado para esta vistoria');
      }
      
    } catch (err: any) {
      console.error('Erro ao carregar vistoria:', err);
      setError('Erro ao carregar vistoria: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadVistoria();
  }, [loadVistoria]);

  const handleIniciarVistoria = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      console.log('Iniciando vistoria:', id);
      
      const result = await vistoriadorService.iniciarVistoria(parseInt(id));
      
      setSuccess(`Vistoria iniciada com sucesso! Iniciada em: ${new Date(result.data_inicio).toLocaleString('pt-BR')}`);
      setTimeout(() => setSuccess(''), 5000);
      
      // Recarregar dados da vistoria
      await loadVistoria();
      
    } catch (err: any) {
      console.error('Erro ao iniciar vistoria:', err);
      setError('Erro ao iniciar vistoria: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarConcluido = async (itemId: number) => {
    try {
      await checklistService.atualizarStatusItem(itemId, { status: 'CONCLUIDO' });
      setSuccess('Item marcado como concluído!');
      setTimeout(() => setSuccess(''), 2000);
      loadVistoria(); // Recarregar para atualizar progresso
    } catch (err) {
      setError('Erro ao marcar item como concluído');
    }
  };

  const handleMarcarPendente = async (itemId: number) => {
    try {
      await checklistService.atualizarStatusItem(itemId, { status: 'PENDENTE' });
      setSuccess('Item marcado como pendente!');
      setTimeout(() => setSuccess(''), 2000);
      loadVistoria();
    } catch (err) {
      setError('Erro ao atualizar item');
    }
  };

  const handlePhotoUpload = async (tipoId: number, file: File) => {
    if (!token || !id) return;
    
    try {
      setUploading(tipoId);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vistoria_id', id);
      formData.append('tipo_foto_id', tipoId.toString());
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/fotos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer upload da foto');
      }
      
      setSuccess('Foto enviada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Recarregar status do checklist
      await loadVistoria();
      
    } catch (err: any) {
      console.error('Erro ao fazer upload:', err);
      setError('Erro ao fazer upload da foto: ' + err.message);
    } finally {
      setUploading(null);
    }
  };

  const handleDeletePhoto = async (fotoId: number) => {
    if (!token || !window.confirm('Tem certeza que deseja excluir esta foto?')) return;
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/fotos/${fotoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir foto');
      }
      
      setSuccess('Foto excluída com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Recarregar status do checklist
      await loadVistoria();
      
    } catch (err: any) {
      console.error('Erro ao excluir foto:', err);
      setError('Erro ao excluir foto: ' + err.message);
    }
  };

  const handleStatusUpdate = async (statusId: number) => {
    if (!id) return;
    
    try {
      await vistoriadorService.updateStatus(parseInt(id), statusId);
      
      setSuccess('Status atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Recarregar vistoria
      await loadVistoria();
      
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao atualizar status: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Clock size={48} />
          <p>Carregando vistoria...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Message type="error">
          <AlertCircle size={20} />
          {error}
        </Message>
        <BackButton onClick={() => navigate('/vistorias')}>
          <ArrowLeft size={20} />
          Voltar
        </BackButton>
      </Container>
    );
  }

  if (!vistoria) {
    return (
      <Container>
        <Message type="error">
          <AlertCircle size={20} />
          Vistoria não encontrada
        </Message>
        <BackButton onClick={() => navigate('/vistorias')}>
          <ArrowLeft size={20} />
          Voltar
        </BackButton>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/vistorias')}>
          <ArrowLeft size={20} />
          Voltar
        </BackButton>
        <Title>Vistoria #{vistoria.id}</Title>
        <StatusBadge status={vistoria.StatusVistoria?.nome || 'DESCONHECIDO'}>
          {vistoria.StatusVistoria?.nome || 'DESCONHECIDO'}
        </StatusBadge>
      </Header>

      {success && (
        <Message type="success">
          <CheckCircle size={20} />
          {success}
        </Message>
      )}

      {error && (
        <Message type="error">
          <AlertCircle size={20} />
          {error}
        </Message>
      )}

      <VistoriaInfo>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600' }}>
          Informações da Vistoria
        </h2>
        <InfoGrid>
          <InfoItem>
            <InfoLabel>Embarcação</InfoLabel>
            <InfoValue>
              {vistoria.Embarcacao?.nome || 'N/A'} - {vistoria.Embarcacao?.nr_inscricao_barco || 'N/A'}
            </InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Local</InfoLabel>
            <InfoValue>
              {vistoria.Local?.nome_local || 'N/A'} - {vistoria.Local?.cidade || 'N/A'}, {vistoria.Local?.estado || 'N/A'}
            </InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Vistoriador</InfoLabel>
            <InfoValue>{vistoria.vistoriador?.nome || 'N/A'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Data de Criação</InfoLabel>
            <InfoValue>{new Date(vistoria.createdAt).toLocaleDateString('pt-BR')}</InfoValue>
          </InfoItem>
          {vistoria.data_inicio && (
            <InfoItem>
              <InfoLabel>Data de Início</InfoLabel>
              <InfoValue>{new Date(vistoria.data_inicio).toLocaleString('pt-BR')}</InfoValue>
            </InfoItem>
          )}
          {vistoria.data_conclusao && (
            <InfoItem>
              <InfoLabel>Data de Conclusão</InfoLabel>
              <InfoValue>{new Date(vistoria.data_conclusao).toLocaleString('pt-BR')}</InfoValue>
            </InfoItem>
          )}
        </InfoGrid>
      </VistoriaInfo>

      {/* Contato e Localização */}
      <VistoriaInfo style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#0369a1' }}>
          Contato e Localização
        </h2>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* WhatsApp */}
          {vistoria.Embarcacao?.Cliente?.telefone_e164 && (
            <div style={{
              background: 'white',
              border: '2px solid #25D366',
              borderRadius: '0.75rem',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <MessageCircle size={18} color="#25D366" />
                  <strong style={{ color: '#1e293b' }}>Cliente</strong>
                </div>
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  {vistoria.Embarcacao?.Cliente?.nome || 'N/A'}
                </div>
                <div style={{ color: '#0f172a', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  {vistoria.Embarcacao?.Cliente?.telefone_e164 || 'N/A'}
                </div>
              </div>
              <button
                onClick={() => {
                  const telefone = vistoria.Embarcacao?.Cliente?.telefone_e164?.replace(/\D/g, '');
                  const mensagem = `Olá! Sou o vistoriador da vistoria ${vistoria.id}. Gostaria de confirmar o agendamento da vistoria da embarcação *${vistoria.Embarcacao?.nome}*.`;
                  window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, '_blank');
                }}
                style={{
                  background: '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(37, 211, 102, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#20BA5A'}
                onMouseOut={(e) => e.currentTarget.style.background = '#25D366'}
              >
                <MessageCircle size={18} />
                Abrir WhatsApp
              </button>
            </div>
          )}

          {/* Google Maps */}
          {vistoria.Local && (
            <div style={{
              background: 'white',
              border: '2px solid #EA4335',
              borderRadius: '0.75rem',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <MapPin size={18} color="#EA4335" />
                  <strong style={{ color: '#1e293b' }}>Local da Vistoria</strong>
                </div>
                <div style={{ color: '#0f172a', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  {vistoria.Local.logradouro && `${vistoria.Local.logradouro}, `}
                  {vistoria.Local.numero && `${vistoria.Local.numero} `}
                  {vistoria.Local.complemento && `- ${vistoria.Local.complemento}`}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                  {vistoria.Local.bairro && `${vistoria.Local.bairro}, `}
                  {vistoria.Local.cidade} - {vistoria.Local.estado}
                  {vistoria.Local.cep && ` | CEP: ${vistoria.Local.cep}`}
                </div>
              </div>
              <button
                onClick={() => {
                  const endereco = [
                    vistoria.Local?.logradouro,
                    vistoria.Local?.numero,
                    vistoria.Local?.bairro,
                    vistoria.Local?.cidade,
                    vistoria.Local?.estado,
                    vistoria.Local?.cep
                  ].filter(Boolean).join(', ');
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`, '_blank');
                }}
                style={{
                  background: '#EA4335',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(234, 67, 53, 0.3)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#D33426'}
                onMouseOut={(e) => e.currentTarget.style.background = '#EA4335'}
              >
                <Navigation size={18} />
                Abrir no Maps
              </button>
            </div>
          )}

          {/* Dados da Corretora (se houver) */}
          {vistoria.corretora_nome && (
            <div style={{
              background: 'white',
              border: '2px solid #3b82f6',
              borderRadius: '0.75rem',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Info size={18} color="#3b82f6" />
                <strong style={{ color: '#1e293b' }}>Dados da Corretora</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Nome</div>
                  <div style={{ color: '#0f172a', fontSize: '0.9rem' }}>{vistoria.corretora_nome}</div>
                </div>
                {vistoria.corretora_telefone_e164 && (
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Telefone</div>
                    <div style={{ color: '#0f172a', fontSize: '0.9rem' }}>{vistoria.corretora_telefone_e164}</div>
                  </div>
                )}
                {vistoria.corretora_email_laudo && (
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>E-mail para Laudo</div>
                    <div style={{ color: '#0f172a', fontSize: '0.9rem' }}>{vistoria.corretora_email_laudo}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </VistoriaInfo>

      {/* NOVO SISTEMA DE CHECKLIST */}
      {checklistItens.length > 0 && (
        <ChecklistSection>
          <SectionTitle>
            <CheckSquare size={24} />
            Checklist de Fotos - {vistoria.Embarcacao?.tipo_embarcacao || 'Embarcação'}
          </SectionTitle>
          
          {progresso && (
            <>
              <ProgressBar>
                <ProgressFill progress={progresso.percentual} />
              </ProgressBar>
              
              <ProgressText>
                {progresso.concluidos} de {progresso.total} itens ({progresso.percentual}%)
                {progresso.obrigatoriosPendentes > 0 && (
                  <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>
                    | {progresso.obrigatoriosPendentes} obrigatório(s) pendente(s)
                  </span>
                )}
              </ProgressText>
              
              {progresso.podeAprovar && (
                <div style={{ 
                  background: '#dcfce7', 
                  border: '1px solid #10b981', 
                  borderRadius: '0.5rem', 
                  padding: '0.75rem', 
                  marginTop: '0.75rem',
                  fontSize: '0.875rem',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle size={16} />
                  Todos os itens obrigatórios concluídos!
                </div>
              )}
            </>
          )}

          {checklistItens.map((item) => (
            <ChecklistItemStyled key={item.id} completed={item.status === 'CONCLUIDO'}>
              <ChecklistHeader>
                <ChecklistInfo>
                  <ChecklistTitle>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ 
                        background: '#667eea', 
                        color: 'white', 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {item.ordem}
                      </span>
                      {item.status === 'CONCLUIDO' ? (
                        <CheckCircle size={20} style={{ color: '#10b981' }} />
                      ) : (
                        <Square size={20} style={{ color: '#6b7280' }} />
                      )}
                      <span style={{ fontWeight: '600' }}>{item.nome}</span>
                      {item.obrigatorio && (
                        <span style={{
                          background: '#fee2e2',
                          color: '#991b1b',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}>
                          Obrigatório
                        </span>
                      )}
                      {item.permite_video && (
                        <span style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Video size={12} /> Permite vídeo
                        </span>
                      )}
                    </div>
                  </ChecklistTitle>
                  {item.descricao && (
                    <ChecklistDescription>{item.descricao}</ChecklistDescription>
                  )}
                  {item.observacao && (
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      Obs: {item.observacao}
                    </div>
                  )}
                  {item.concluido_em && (
                    <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                      Concluído em: {new Date(item.concluido_em).toLocaleString('pt-BR')}
                    </div>
                  )}
                </ChecklistInfo>
                
                <ChecklistActions>
                  {item.status === 'CONCLUIDO' ? (
                    <ActionButton variant="danger" onClick={() => handleMarcarPendente(item.id)}>
                      <X size={16} />
                      Desmarcar
                    </ActionButton>
                  ) : (
                    <ActionButton variant="primary" onClick={() => handleMarcarConcluido(item.id)}>
                      <CheckCircle size={16} />
                      Concluir
                    </ActionButton>
                  )}
                </ChecklistActions>
              </ChecklistHeader>
            </ChecklistItemStyled>
          ))}
        </ChecklistSection>
      )}

      <StatusActions>
        {vistoria.StatusVistoria?.nome === 'PENDENTE' && !vistoria.data_inicio && (
          <ActionButton 
            variant="primary" 
            onClick={handleIniciarVistoria}
            disabled={loading}
          >
            <Play size={20} />
            {loading ? 'Iniciando...' : 'Iniciar Vistoria'}
          </ActionButton>
        )}
        
        {vistoria.StatusVistoria?.nome === 'EM_ANDAMENTO' && (
          <ActionButton 
            variant="primary" 
            onClick={() => handleStatusUpdate(3)} // CONCLUIDA
            disabled={!checklistStatus?.resumo.checklistCompleto}
          >
            <CheckCircle size={20} />
            Concluir Vistoria
          </ActionButton>
        )}
        
        {vistoria.data_inicio && (
          <div style={{ 
            padding: '1rem', 
            background: '#f0f9ff', 
            border: '1px solid #0ea5e9', 
            borderRadius: '0.5rem',
            color: '#0c4a6e'
          }}>
            <Info size={20} style={{ marginRight: '0.5rem' }} />
            Vistoria iniciada em: {new Date(vistoria.data_inicio).toLocaleString('pt-BR')}
          </div>
        )}
      </StatusActions>
    </Container>
  );
};

export default VistoriadorVistoria;
