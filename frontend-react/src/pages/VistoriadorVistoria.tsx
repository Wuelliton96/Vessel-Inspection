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
  Play
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { vistoriadorService } from '../services/api';
import { API_CONFIG } from '../config/api';
import { ChecklistStatus, ChecklistItem } from '../types';

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
      
      // Carregar status do checklist
      const checklistData = await vistoriadorService.getChecklistStatus(parseInt(id));
      setChecklistStatus(checklistData);
      
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
              {vistoria.Embarcacao?.nome || 'N/A'} - {vistoria.Embarcacao?.numero_casco || 'N/A'}
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

      {checklistStatus && (
        <ChecklistSection>
          <SectionTitle>
            <CheckSquare size={24} />
            Checklist de Fotos
          </SectionTitle>
          
          <ProgressBar>
            <ProgressFill progress={checklistStatus.resumo.progresso} />
          </ProgressBar>
          
          <ProgressText>
            {checklistStatus.resumo.fotosObrigatoriasTiradas} de {checklistStatus.resumo.totalObrigatorios} fotos obrigatórias tiradas
            ({Math.round(checklistStatus.resumo.progresso)}%)
          </ProgressText>

          {checklistStatus.checklistStatus.map((item: ChecklistItem) => (
            <ChecklistItemStyled key={item.tipo_id} completed={item.foto_tirada}>
              <ChecklistHeader>
                <ChecklistInfo>
                  <ChecklistTitle>
                    {item.foto_tirada ? (
                      <CheckCircle size={20} style={{ color: '#10b981', marginRight: '0.5rem' }} />
                    ) : (
                      <Square size={20} style={{ color: '#6b7280', marginRight: '0.5rem' }} />
                    )}
                    {item.nome_exibicao}
                    {item.obrigatorio && (
                      <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>*</span>
                    )}
                  </ChecklistTitle>
                  <ChecklistDescription>{item.descricao}</ChecklistDescription>
                </ChecklistInfo>
                
                <ChecklistActions>
                  {item.foto_tirada ? (
                    <>
                      <ActionButton variant="danger" onClick={() => handleDeletePhoto(item.tipo_id)}>
                        <Trash2 size={16} />
                        Excluir
                      </ActionButton>
                    </>
                  ) : (
                    <label>
                      <FileInput
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handlePhotoUpload(item.tipo_id, file);
                          }
                        }}
                        disabled={uploading === item.tipo_id}
                      />
                      <ActionButton variant="primary" as="div">
                        <Camera size={16} />
                        {uploading === item.tipo_id ? 'Enviando...' : 'Tirar Foto'}
                      </ActionButton>
                    </label>
                  )}
                </ChecklistActions>
              </ChecklistHeader>
              
              {item.foto_tirada && item.foto_url && (
                <PhotoPreview>
                  <PhotoImage src={`${API_CONFIG.BASE_URL}${item.foto_url}`} alt={item.nome_exibicao} />
                  <PhotoInfo>
                    Foto tirada em: {new Date().toLocaleDateString('pt-BR')}
                    {item.foto_observacao && (
                      <div>Observação: {item.foto_observacao}</div>
                    )}
                  </PhotoInfo>
                </PhotoPreview>
              )}
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
