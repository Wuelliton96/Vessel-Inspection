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
  Navigation,
  Eye
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { vistoriadorService, checklistService } from '../services/api';
import { API_CONFIG } from '../config/api';
import { ChecklistStatus, ChecklistItem, VistoriaChecklistItem, ChecklistProgresso } from '../types';
import PreloadedImage from '../components/PreloadedImage';

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

const PhotoModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 2rem;
`;

const PhotoModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
`;

const PhotoModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const PhotoModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const PhotoPreviewContainer = styled.div`
  margin-bottom: 1.5rem;
  text-align: center;
`;

const PhotoPreviewImage = styled.img`
  max-width: 100%;
  max-height: 400px;
  border-radius: 0.5rem;
  border: 2px solid #e5e7eb;
`;

const CameraContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 100%;
  background: #000;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const CameraVideo = styled.video`
  width: 100%;
  max-height: 600px;
  display: block;
  object-fit: contain;
  transform: scaleX(-1); /* Espelhar para parecer mais natural */
  background: #000;
  min-height: 300px;
`;

const CameraControls = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.8);
`;

const CaptureButton = styled.button`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 4px solid white;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const CameraInnerCircle = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #3b82f6;
`;

const StopCameraButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #dc2626;
  }
`;

const PhotoModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
`;

const PhotoButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-top: 1rem;
`;

const PhotoUploadButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  
  ${props => {
    if (props.variant === 'primary') {
      return `
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4);
        }
      `;
    }
    return `
      background: #f3f4f6;
      color: #374151;
      &:hover {
        background: #e5e7eb;
      }
    `;
  }}
`;

const PhotoDisplay = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 2px solid #10b981;
`;

const PhotoDisplayImage = styled.img`
  width: 100%;
  max-width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  margin-bottom: 0.5rem;
`;

const FotoVisualizacaoModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
`;

const FotoVisualizacaoContent = styled.div`
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FotoVisualizacaoImage = styled.img`
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
`;

const FotoVisualizacaoHeader = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
  z-index: 10;
`;

const FotoVisualizacaoTitle = styled.h3`
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
`;

const FotoVisualizacaoCloseButton = styled.button`
  background: rgba(239, 68, 68, 0.9);
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background: rgba(220, 38, 38, 1);
    transform: scale(1.1);
  }
`;

const FotoVisualizacaoErro = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.5);
  border-radius: 1rem;
  color: white;
  text-align: center;
  max-width: 500px;
  margin: 2rem auto;
`;

const FotoVisualizacaoErroTitulo = styled.h3`
  color: #fecaca;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FotoVisualizacaoErroMensagem = styled.p`
  color: #fca5a5;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
`;

const FotoVisualizacaoErroDetalhes = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #fca5a5;
  font-family: monospace;
`;

const CloseModalButton = styled.button`
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: #f3f4f6;
    color: #1f2937;
  }
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
  const [tiposFoto, setTiposFoto] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState<number | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);
  const [selectedItemForPhoto, setSelectedItemForPhoto] = useState<VistoriaChecklistItem | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [fotoVisualizada, setFotoVisualizada] = useState<{ id: number; nome: string } | null>(null);
  const [erroCarregamentoImagem, setErroCarregamentoImagem] = useState(false);
  const [urlImagem, setUrlImagem] = useState<string | null>(null);
  const [carregandoImagem, setCarregandoImagem] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

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
        console.log(`Checklist carregado: ${itens.length} itens`);
        
        // Verificar quantos itens têm foto
        const itensComFoto = itens.filter(item => item.foto && item.status === 'CONCLUIDO');
        console.log(`Itens com foto: ${itensComFoto.length}`);
        if (itensComFoto.length > 0) {
          console.log('Itens com foto:');
          itensComFoto.forEach(item => {
            console.log(`  - "${item.nome}" (ID: ${item.id}) - Foto ID: ${item.foto?.id}`);
          });
        }
        
        setChecklistItens(itens);
        
        const prog = await checklistService.getProgresso(parseInt(id));
        console.log(`Progresso: ${prog.concluidos}/${prog.total} (${prog.percentual}%)`);
        setProgresso(prog);
      } catch (checkErr) {
        console.error('Erro ao carregar checklist:', checkErr);
        console.log('Checklist ainda não copiado para esta vistoria');
      }
      
      // Carregar tipos de foto
      try {
        const tipos = await vistoriadorService.getTiposFotoChecklist();
        if (tipos && tipos.length > 0) {
          setTiposFoto(tipos);
          console.log(`Tipos de foto carregados: ${tipos.length}`);
        } else {
          console.log('ATENCAO: Nenhum tipo de foto encontrado. O backend criara automaticamente na proxima requisicao.');
          // Não definir erro aqui, pois o backend criará automaticamente
        }
      } catch (tiposErr) {
        console.error('Erro ao carregar tipos de foto:', tiposErr);
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
    
    // Limpar stream da câmera ao desmontar o componente
    return () => {
      stopCamera();
    };
  }, [loadVistoria]);

  // Efeito para garantir que o vídeo seja iniciado quando o modal abrir
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      const video = videoRef.current;
      
      // Se o srcObject não está definido, definir agora
      if (!video.srcObject) {
        video.srcObject = cameraStream;
      }
      
      // Tentar iniciar reprodução
      const startPlay = async () => {
        try {
          if (video.paused) {
            await video.play();
            console.log('Vídeo iniciado via useEffect');
          }
        } catch (error) {
          console.error('Erro ao iniciar vídeo no useEffect:', error);
          // Tentar novamente após um delay
          setTimeout(() => {
            if (video && video.paused) {
              video.play().catch(err => {
                console.error('Erro ao iniciar vídeo (retry):', err);
              });
            }
          }, 500);
        }
      };
      
      // Aguardar metadata se necessário
      if (video.readyState >= 1) {
        startPlay();
      } else {
        video.addEventListener('loadedmetadata', startPlay, { once: true });
        video.addEventListener('canplay', startPlay, { once: true });
      }
    }
  }, [showCamera, cameraStream]);

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
      console.log('[FRONTEND] Marcando item como concluído:', itemId);
      setError('');
      setSuccess('');
      
      const result = await checklistService.atualizarStatusItem(itemId, { status: 'CONCLUIDO' });
      console.log('[FRONTEND] Item atualizado com sucesso:', result);
      
      if (result && result.status === 'CONCLUIDO') {
        console.log('[FRONTEND] Item atualizado com sucesso no backend');
        console.log('[FRONTEND] Status retornado:', result.status);
        console.log('[FRONTEND] Foto ID:', result.foto_id);
        console.log('[FRONTEND] Concluído em:', result.concluido_em);
        
        setSuccess('Item marcado como concluído sem foto!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Atualizar estado local imediatamente para feedback visual
        setChecklistItens(prevItens => {
          const updated = prevItens.map(item => 
            item.id === itemId 
              ? { ...item, status: 'CONCLUIDO' as const, concluido_em: result.concluido_em || new Date().toISOString(), foto_id: null, foto: null }
              : item
          );
          console.log('[FRONTEND] Estado atualizado. Itens pendentes:', updated.filter(i => i.status !== 'CONCLUIDO').length);
          console.log('[FRONTEND] Itens concluídos:', updated.filter(i => i.status === 'CONCLUIDO').length);
          return updated;
        });
        
        // Recarregar para atualizar progresso e garantir sincronização
        await loadVistoria();
      } else {
        console.error('[FRONTEND] Resultado inesperado:', result);
        throw new Error('Item não foi atualizado corretamente');
      }
    } catch (err: any) {
      console.error('[FRONTEND] Erro ao marcar item como concluído:', err);
      console.error('[FRONTEND] Resposta do erro:', err.response?.data);
      console.error('[FRONTEND] Status do erro:', err.response?.status);
      console.error('[FRONTEND] Mensagem completa:', err.message);
      
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao marcar item como concluído';
      setError(`Erro ao marcar item como concluído: ${errorMessage}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleMarcarPendente = async (itemId: number) => {
    try {
      console.log('[FRONTEND] Marcando item como pendente:', itemId);
      setError('');
      setSuccess('');
      
      const result = await checklistService.atualizarStatusItem(itemId, { status: 'PENDENTE', foto_id: null });
      console.log('[FRONTEND] Item atualizado com sucesso:', result);
      
      if (result && result.status === 'PENDENTE') {
        setSuccess('Item marcado como pendente!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Atualizar estado local imediatamente
        setChecklistItens(prevItens => {
          const updated = prevItens.map(item => 
            item.id === itemId 
              ? { ...item, status: 'PENDENTE' as const, concluido_em: null, foto_id: null, foto: null }
              : item
          );
          console.log('[FRONTEND] Estado atualizado. Itens pendentes:', updated.filter(i => i.status !== 'CONCLUIDO').length);
          return updated;
        });
        
        await loadVistoria();
      } else {
        throw new Error('Item não foi atualizado corretamente');
      }
    } catch (err: any) {
      console.error('[FRONTEND] Erro ao marcar item como pendente:', err);
      console.error('[FRONTEND] Resposta do erro:', err.response?.data);
      
      const errorMessage = err.response?.data?.error || err.message || 'Erro ao atualizar item';
      setError(`Erro ao atualizar item: ${errorMessage}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const getTipoFotoPorItem = (item: VistoriaChecklistItem) => {
    if (!tiposFoto || tiposFoto.length === 0) {
      console.error('Nenhum tipo de foto disponível! Carregando tipos...');
      // Tentar recarregar tipos de foto
      vistoriadorService.getTiposFotoChecklist().then(tipos => {
        setTiposFoto(tipos);
      }).catch(err => {
        console.error('Erro ao carregar tipos de foto:', err);
      });
      return null;
    }
    
    console.log('=== BUSCANDO TIPO DE FOTO ===');
    console.log('Item do checklist:', item.nome);
    console.log('Tipos de foto disponíveis:', tiposFoto.map(t => `${t.nome_exibicao} (ID: ${t.id})`));
    
    // 1. Tentar busca exata (case-insensitive)
    let tipoFoto = tiposFoto.find(tipo => 
      tipo.nome_exibicao?.toLowerCase().trim() === item.nome?.toLowerCase().trim()
    );
    
    if (tipoFoto) {
      console.log('Match 1: Busca exata encontrada:', tipoFoto.nome_exibicao);
      return tipoFoto;
    }
    
    // 2. Se não encontrar, tentar busca parcial (contém)
    tipoFoto = tiposFoto.find(tipo => {
      const nomeTipo = tipo.nome_exibicao?.toLowerCase().trim() || '';
      const nomeItem = item.nome?.toLowerCase().trim() || '';
      const match = nomeTipo.includes(nomeItem) || nomeItem.includes(nomeTipo);
      if (match) {
        console.log(`Match 2: Busca parcial - "${nomeTipo}" contém "${nomeItem}" ou vice-versa`);
      }
      return match;
    });
    
    if (tipoFoto) {
      console.log('Match 2: Busca parcial encontrada:', tipoFoto.nome_exibicao);
      return tipoFoto;
    }
    
    // 3. Se ainda não encontrar, tentar remover "Foto do" / "Foto da" / "Foto dos" e buscar
    const nomeItemLimpo = item.nome?.replace(/^Foto\s+(do|da|dos|das)\s+/i, '').trim() || '';
    tipoFoto = tiposFoto.find(tipo => {
      const nomeTipo = tipo.nome_exibicao?.replace(/^Foto\s+(do|da|dos|das)\s+/i, '').trim() || '';
      const match = nomeTipo.toLowerCase() === nomeItemLimpo.toLowerCase();
      if (match) {
        console.log(`Match 3: Sem prefixo - "${nomeTipo}" = "${nomeItemLimpo}"`);
      }
      return match;
    });
    
    if (tipoFoto) {
      console.log('Match 3: Sem prefixo encontrada:', tipoFoto.nome_exibicao);
      return tipoFoto;
    }
    
    // 4. Busca por palavras-chave comuns
    const palavrasChave: { [key: string]: string[] } = {
      'casco': ['casco', 'hull', 'casca'],
      'motor': ['motor', 'engine', 'maquina'],
      'interior': ['interior', 'inside', 'interno'],
      'documento': ['documento', 'document', 'papel'],
      'proa': ['proa', 'bow', 'frente'],
      'popa': ['popa', 'stern', 'traseira'],
      'convés': ['conves', 'deck', 'coberta'],
      'cabine': ['cabine', 'cabin', 'interior'],
      'timão': ['timao', 'rudder', 'leme'],
      'hélice': ['helice', 'propeller', 'propulsao']
    };
    
    for (const [chave, variações] of Object.entries(palavrasChave)) {
      const nomeItemLower = item.nome?.toLowerCase() || '';
      const temPalavraChave = variações.some(v => nomeItemLower.includes(v));
      
      if (temPalavraChave) {
        tipoFoto = tiposFoto.find(tipo => {
          const nomeTipoLower = tipo.nome_exibicao?.toLowerCase() || '';
          return variações.some(v => nomeTipoLower.includes(v));
        });
        
        if (tipoFoto) {
          console.log(`Match 4: Palavra-chave "${chave}" encontrada:`, tipoFoto.nome_exibicao);
          return tipoFoto;
        }
      }
    }
    
    // 5. Fallback final: usar o primeiro tipo disponível (SEMPRE retorna algo se houver tipos)
    if (tiposFoto.length > 0) {
      console.warn('Nenhum match encontrado. Usando primeiro tipo disponível como fallback:', tiposFoto[0].nome_exibicao);
      return tiposFoto[0];
    }
    
    console.error('CRÍTICO: Nenhum tipo de foto disponível!');
    return null;
  };

  const handleOpenPhotoModal = (item: VistoriaChecklistItem) => {
    setSelectedItemForPhoto(item);
    setPhotoPreview(null);
    setPhotoFile(null);
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleClosePhotoModal = () => {
    stopCamera();
    setSelectedItemForPhoto(null);
    setPhotoPreview(null);
    setPhotoFile(null);
    setShowCamera(false);
    // Limpar estados de upload ao fechar o modal
    setUploading(null);
    setUploadingItemId(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError('Por favor, selecione apenas imagens');
      }
    }
  };

  const startCamera = async () => {
    try {
      stopCamera(); // Parar qualquer stream anterior
      
      // Configuração para modo retrato (portrait)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Câmera traseira no mobile, webcam no desktop
          // Modo retrato: altura maior que largura
          width: { ideal: 720, max: 1280 },
          height: { ideal: 1280, max: 1920 },
          aspectRatio: { ideal: 9 / 16 }, // Proporção retrato (vertical)
        }
      };
      
      console.log('Solicitando acesso à câmera com constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Câmera acessada com sucesso');
      setCameraStream(stream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Aguardar o vídeo estar pronto e iniciar reprodução
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Elemento de vídeo não encontrado'));
            return;
          }
          
          const video = videoRef.current;
          
          const handleLoadedMetadata = () => {
            console.log('Vídeo carregado. Dimensões:', 
              video.videoWidth, 'x', video.videoHeight);
            
            // Iniciar reprodução explicitamente
            video.play()
              .then(() => {
                console.log('Vídeo iniciado com sucesso');
                resolve();
              })
              .catch((playError) => {
                console.error('Erro ao iniciar vídeo:', playError);
                // Mesmo com erro de play, continuar (pode ser bloqueio de autoplay)
                resolve();
              });
          };
          
          const handleError = () => {
            reject(new Error('Erro ao carregar vídeo'));
          };
          
          // Se já tem metadata, chamar imediatamente
          if (video.readyState >= 1) {
            handleLoadedMetadata();
          } else {
            video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
            video.addEventListener('error', handleError, { once: true });
            
            // Timeout de segurança
            setTimeout(() => {
              if (video.readyState < 1) {
                console.warn('Timeout aguardando metadata do vídeo');
                resolve(); // Continuar mesmo sem metadata
              }
            }, 3000);
          }
        });
      }
    } catch (error: any) {
      console.error('Erro ao acessar câmera:', error);
      
      let errorMessage = 'Não foi possível acessar a câmera.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada. Usando galeria...';
        handleTakePhotoFallback();
        return;
      } else if (error.name === 'OverconstrainedError') {
        // Tentar com constraints mais simples
        console.log('Tentando com constraints mais simples...');
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' } // Câmera frontal como fallback
          });
          setCameraStream(simpleStream);
          setShowCamera(true);
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            // Aguardar um pouco e iniciar reprodução
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().catch(err => {
                  console.error('Erro ao iniciar vídeo (fallback):', err);
                });
              }
            }, 100);
          }
          return;
        } catch (fallbackError) {
          errorMessage = 'Não foi possível acessar a câmera. Use a opção de escolher da galeria.';
        }
      }
      
      setError(errorMessage);
      // Fallback para input com capture
      handleTakePhotoFallback();
    }
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current || !cameraStream) {
      console.error('Vídeo ou stream da câmera não disponível');
      setError('Câmera não está pronta. Aguarde a câmera carregar completamente.');
      return;
    }
    
    try {
      const video = videoRef.current;
      
      // Aguardar o vídeo estar pronto com dimensões válidas
      const waitForVideoReady = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            console.log('Vídeo pronto. Dimensões:', video.videoWidth, 'x', video.videoHeight);
            resolve();
            return;
          }
          
          console.log('Aguardando vídeo carregar... Estado:', video.readyState);
          
          const checkReady = () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              console.log('Vídeo carregado. Dimensões:', video.videoWidth, 'x', video.videoHeight);
              resolve();
            } else {
              console.log('Ainda aguardando... Estado:', video.readyState, 'Dimensões:', video.videoWidth, 'x', video.videoHeight);
            }
          };
          
          video.addEventListener('loadedmetadata', checkReady, { once: true });
          video.addEventListener('loadeddata', checkReady, { once: true });
          video.addEventListener('canplay', checkReady, { once: true });
          
          // Timeout após 5 segundos
          setTimeout(() => {
            if (video.videoWidth === 0 || video.videoHeight === 0) {
              reject(new Error('Timeout aguardando vídeo carregar'));
            }
          }, 5000);
        });
      };
      
      waitForVideoReady().then(() => {
        const canvas = document.createElement('canvas');
        
        // Garantir que temos dimensões válidas
        if (!video.videoWidth || !video.videoHeight) {
          console.error('Dimensões do vídeo inválidas após aguardar:', video.videoWidth, 'x', video.videoHeight);
          setError('Não foi possível capturar a foto. O vídeo não está pronto.');
          return;
        }
      
        // Configurar canvas com dimensões do vídeo (mantendo proporção retrato)
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        console.log('Capturando foto:', canvas.width, 'x', canvas.height);
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Não foi possível criar contexto do canvas');
        }
        
        // Capturar frame do vídeo
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Converter para blob (JPEG com qualidade 0.9)
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error('Erro ao criar blob da foto');
            setError('Erro ao processar a foto capturada');
            return;
          }
          
          console.log('Foto capturada com sucesso. Tamanho:', blob.size, 'bytes');
          
          // Criar File a partir do blob
          const file = new File([blob], `foto-${Date.now()}.jpg`, { 
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          setPhotoFile(file);
          setPhotoPreview(canvas.toDataURL('image/jpeg', 0.9));
          setShowCamera(false);
          stopCamera();
          
          console.log('Preview gerado e câmera parada');
        }, 'image/jpeg', 0.9);
      }).catch((error: any) => {
        console.error('Erro ao aguardar vídeo carregar:', error);
        setError('Não foi possível capturar a foto. Aguarde a câmera carregar completamente ou escolha da galeria.');
      });
    } catch (error: any) {
      console.error('Erro ao capturar foto:', error);
      setError('Erro ao capturar foto da câmera: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleTakePhotoFallback = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      handleFileSelect(e);
    };
    input.click();
  };

  const handleTakePhoto = async () => {
    // Tentar usar a câmera diretamente
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      await startCamera();
    } else {
      // Fallback para input com capture
      handleTakePhotoFallback();
    }
  };

  const handleChooseFromGallery = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      handleFileSelect(e);
    };
    input.click();
  };

  const handleConfirmPhotoUpload = async () => {
    if (!photoFile || !selectedItemForPhoto || !id) {
      setError('Por favor, selecione uma foto antes de enviar');
      return;
    }
    
    console.log('=== INICIANDO UPLOAD DE FOTO ===');
    console.log('Item do checklist:', selectedItemForPhoto.nome);
    console.log('Tipos de foto disponíveis:', tiposFoto.length);
    
    // Garantir que tipos de foto foram carregados
    if (!tiposFoto || tiposFoto.length === 0) {
      console.error('Tipos de foto não foram carregados ainda');
      setError('Carregando tipos de foto... Por favor, aguarde e tente novamente.');
      
      // Tentar carregar tipos de foto
      try {
        const tiposRecarregados = await vistoriadorService.getTiposFotoChecklist();
        if (tiposRecarregados && tiposRecarregados.length > 0) {
          setTiposFoto(tiposRecarregados);
          setError(''); // Limpar erro se tipos foram carregados
            console.log(`Tipos de foto carregados: ${tiposRecarregados.length}`);
        } else {
          // Se ainda não houver tipos, aguardar um pouco e tentar novamente
          console.log('ATENCAO: Ainda nao ha tipos de foto. Aguardando criacao automatica...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          const tiposSegundaTentativa = await vistoriadorService.getTiposFotoChecklist();
          if (tiposSegundaTentativa && tiposSegundaTentativa.length > 0) {
            setTiposFoto(tiposSegundaTentativa);
            setError(''); // Limpar erro se tipos foram carregados
            console.log(`Tipos de foto carregados na segunda tentativa: ${tiposSegundaTentativa.length}`);
          } else {
            setError('Nenhum tipo de foto configurado no sistema. Por favor, entre em contato com o administrador.');
            return;
          }
        }
      } catch (err) {
        console.error('Erro ao carregar tipos de foto:', err);
        setError('Erro ao carregar tipos de foto. Por favor, recarregue a página.');
        return;
      }
    }
    
    const tipoFoto = getTipoFotoPorItem(selectedItemForPhoto);
    if (!tipoFoto) {
      console.error('ERRO CRÍTICO: Tipo de foto não encontrado após todas as tentativas');
      console.error('Item:', selectedItemForPhoto);
      console.error('Tipos disponíveis:', tiposFoto);
      setError('Erro ao identificar tipo de foto. Por favor, entre em contato com o administrador ou tente novamente.');
      return;
    }
    
    console.log('Tipo de foto selecionado:', tipoFoto.nome_exibicao, '(ID:', tipoFoto.id, ')');
    
    try {
      setUploading(tipoFoto.id);
      setUploadingItemId(selectedItemForPhoto.id);
      
      const formData = new FormData();
      formData.append('foto', photoFile);
      
      // IMPORTANTE: Garantir que vistoria_id seja uma string
      const vistoriaIdStr = String(id!);
      formData.append('vistoria_id', vistoriaIdStr);
      formData.append('tipo_foto_id', tipoFoto.id.toString());
      formData.append('checklist_item_id', selectedItemForPhoto.id.toString()); // Enviar ID do item para mapeamento preciso
      formData.append('observacao', '');
      
      console.log('\n[FRONTEND] === INICIANDO UPLOAD DE FOTO ===');
      console.log('[FRONTEND] Dados do upload:');
      console.log('  - vistoria_id:', vistoriaIdStr, '(tipo:', typeof vistoriaIdStr, ')');
      console.log('  - tipo_foto_id:', tipoFoto.id);
      console.log('  - checklist_item_id:', selectedItemForPhoto.id, '(tipo:', typeof selectedItemForPhoto.id, ')');
      console.log('  - Item do checklist:', selectedItemForPhoto.nome);
      console.log('  - Tipo de foto:', tipoFoto.nome_exibicao);
      console.log('  - Arquivo:', photoFile.name || 'captured-photo', `(${photoFile.size} bytes)`);
      console.log('  - URL da API:', `${API_CONFIG.BASE_URL}/api/fotos`);
      console.log('[FRONTEND] Enviando requisição...\n');
      
      // Verificar se a URL da API está configurada
      if (!API_CONFIG.BASE_URL) {
        throw new Error('URL da API não configurada. Verifique as configurações.');
      }

      // Verificar se o token está disponível
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Por favor, faça login novamente.');
      }

      let response;
      try {
        response = await fetch(`${API_CONFIG.BASE_URL}/api/fotos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // NÃO definir Content-Type para FormData - o browser faz isso automaticamente com boundary
          },
          body: formData
        });
      } catch (fetchError: any) {
        console.error('[FRONTEND] Erro na requisição fetch:', fetchError);
        console.error('[FRONTEND] Tipo do erro:', fetchError.name);
        console.error('[FRONTEND] Mensagem:', fetchError.message);
        console.error('[FRONTEND] URL tentada:', `${API_CONFIG.BASE_URL}/api/fotos`);
        
        // Verificar se é erro de conexão
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError') || fetchError.name === 'TypeError') {
          throw new Error(`Não foi possível conectar ao servidor. Verifique se o backend está rodando em ${API_CONFIG.BASE_URL}. Erro: ${fetchError.message}`);
        }
        
        throw new Error(`Erro de conexão: ${fetchError.message}`);
      }
      
      if (!response.ok) {
        let errorMessage = 'Erro ao fazer upload da foto';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('[FRONTEND] Erro do servidor:', errorData);
        } catch (e) {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
          console.error('[FRONTEND] Status da resposta:', response.status, response.statusText);
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      
      console.log('\n[FRONTEND] === RESPOSTA DO UPLOAD ===');
      console.log('[FRONTEND] Upload realizado com sucesso!');
      console.log('[FRONTEND] Dados recebidos:');
      console.log('  - Foto ID:', responseData.id);
      console.log('  - url_arquivo:', responseData.url_arquivo);
      console.log('  - url_completa:', responseData.url_completa);
      console.log('  - checklist_item_id_enviado:', responseData.checklist_item_id_enviado || 'null');
      console.log('  - checklist_atualizado:', responseData.checklist_atualizado ? 'sim' : 'não');
      
      if (responseData.checklist_atualizado) {
        console.log('[FRONTEND] Detalhes do checklist atualizado:');
        console.log('  - Item ID:', responseData.checklist_atualizado.item_id);
        console.log('  - Item Nome:', responseData.checklist_atualizado.item_nome);
        console.log('  - Status:', responseData.checklist_atualizado.status);
        console.log('  - Foto ID vinculada:', responseData.checklist_atualizado.foto_id);
        
        // Verificar se o ID enviado corresponde ao ID atualizado
        if (responseData.checklist_item_id_enviado && responseData.checklist_atualizado.item_id) {
          const idEnviado = parseInt(responseData.checklist_item_id_enviado);
          const idAtualizado = responseData.checklist_atualizado.item_id;
          if (idEnviado === idAtualizado) {
            console.log(`[FRONTEND] OK: IDs correspondem: ${idEnviado} === ${idAtualizado}`);
          } else {
            console.error(`[FRONTEND] ERRO: IDs NÃO correspondem!`);
            console.error(`[FRONTEND]   Enviado: ${idEnviado}`);
            console.error(`[FRONTEND]   Atualizado: ${idAtualizado}`);
          }
        }
      } else {
        console.warn('[FRONTEND] ATENCAO: Checklist NÃO foi atualizado!');
        console.warn('[FRONTEND]   Verifique os logs do servidor para mais detalhes.');
      }
      
      // Verificar se o nome do arquivo contém checklist_item_id
      if (responseData.checklist_item_id_enviado && responseData.url_arquivo) {
        const itemId = responseData.checklist_item_id_enviado;
        if (responseData.url_arquivo.includes(`checklist-${itemId}`)) {
          console.log(`[FRONTEND] OK: Nome do arquivo contém checklist_item_id: checklist-${itemId}`);
        } else {
          console.warn(`[FRONTEND] ATENCAO: Nome do arquivo NÃO contém checklist_item_id esperado`);
          console.warn(`[FRONTEND]   Esperado: checklist-${itemId}`);
          console.warn(`[FRONTEND]   Recebido: ${responseData.url_arquivo}`);
        }
      }
      
      console.log('[FRONTEND] === FIM DA RESPOSTA ===\n');
      
      // VALIDAÇÃO: Confirmar que a foto foi realmente salva
      if (!responseData.id) {
        throw new Error('Foto não foi criada. ID não retornado pelo servidor.');
      }
      
      if (!responseData.url_arquivo) {
        throw new Error('Foto não tem url_arquivo. Upload pode ter falhado.');
      }
      
      // VALIDAÇÃO: Testar se a imagem realmente existe e é acessível
      // Se não tem url_completa, usar a rota da API que serve a imagem corretamente (S3 ou local)
      const imageUrl = responseData.url_completa || `${API_CONFIG.BASE_URL}/api/fotos/${responseData.id}/imagem`;
      console.log('Validando se a imagem existe:', imageUrl);
      
      try {
        const imageValidation = await fetch(imageUrl, { method: 'HEAD' });
        if (!imageValidation.ok) {
          console.warn('[FRONTEND] ATENCAO: Imagem não acessível ainda, mas continuando... Status:', imageValidation.status);
        } else {
          console.log('[FRONTEND] OK: Imagem validada e acessível');
        }
      } catch (imgError) {
        console.warn('[FRONTEND] ATENCAO: Não foi possível validar imagem imediatamente:', imgError);
        // Não falhar o upload por isso, pois pode ser um problema de rede/cache
      }
      
      setSuccess(`Foto anexada com sucesso! Foto ID: ${responseData.id}. Item marcado como concluído.`);
      setTimeout(() => setSuccess(''), 8000);
      
      // Limpar estados de upload antes de fechar o modal
      setUploading(null);
      setUploadingItemId(null);
      
      handleClosePhotoModal();
      
      // Aguardar um pouco para garantir que o backend processou tudo
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Recarregar status do checklist
      console.log('Recarregando dados da vistoria...');
      await loadVistoria();
      console.log('Dados da vistoria recarregados');
      
      // VALIDAÇÃO FINAL: Verificar se o item foi atualizado no checklist
      const itemAtualizado = checklistItens.find(item => 
        item.id === selectedItemForPhoto.id && 
        item.status === 'CONCLUIDO' && 
        item.foto && 
        item.foto.id === responseData.id
      );
      
      if (itemAtualizado) {
        console.log('[FRONTEND] OK: Validação completa: Item do checklist atualizado com foto vinculada');
        console.log(`  - Item: "${itemAtualizado.nome}"`);
        console.log(`  - Status: ${itemAtualizado.status}`);
        console.log(`  - Foto ID: ${itemAtualizado.foto.id}`);
      } else {
        // Aguardar mais um pouco e verificar novamente
        await new Promise(resolve => setTimeout(resolve, 500));
        await loadVistoria();
        
        const itemNovamente = checklistItens.find(item => 
          item.id === selectedItemForPhoto.id && 
          item.status === 'CONCLUIDO' && 
          item.foto
        );
        
        if (itemNovamente && itemNovamente.foto) {
          console.log('[FRONTEND] OK: Validação confirmada após segunda verificação');
          console.log(`  - Foto ID encontrada: ${itemNovamente.foto.id}`);
        } else {
          console.warn('[FRONTEND] ATENCAO: Item do checklist pode não ter sido atualizado automaticamente');
          console.warn('  A foto foi salva, mas o item pode precisar ser atualizado manualmente');
        }
      }
      
    } catch (err: any) {
      console.error('[FRONTEND] Erro completo ao fazer upload:', err);
      console.error('[FRONTEND] Tipo do erro:', err.name);
      console.error('[FRONTEND] Mensagem:', err.message);
      console.error('[FRONTEND] Stack:', err.stack);
      
      let errorMessage = 'Erro ao fazer upload da foto';
      
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('conectar ao servidor')) {
        errorMessage = `Não foi possível conectar ao servidor. Verifique se o backend está rodando em ${API_CONFIG.BASE_URL}. Se estiver usando localhost, certifique-se de que o servidor está iniciado.`;
      } else if (err.message.includes('Token')) {
        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
      } else {
        errorMessage = err.message || 'Erro desconhecido ao fazer upload da foto';
      }
      
      setError(errorMessage);
      setTimeout(() => setError(''), 10000); // Manter erro visível por 10 segundos
    } finally {
      setUploading(null);
      setUploadingItemId(null);
    }
  };

  const handlePhotoUpload = async (tipoId: number, file: File) => {
    if (!token || !id) return;
    
    try {
      setUploading(tipoId);
      
      const formData = new FormData();
      formData.append('foto', file);
      
      // IMPORTANTE: Garantir que vistoria_id seja uma string
      const vistoriaIdStr = String(id);
      formData.append('vistoria_id', vistoriaIdStr);
      formData.append('tipo_foto_id', tipoId.toString());
      // Não temos checklist_item_id aqui, mas o backend usará mapeamento por nome
      
      console.log('Enviando upload (file):');
      console.log('  - vistoria_id:', vistoriaIdStr, '(tipo:', typeof vistoriaIdStr, ')');
      console.log('  - tipo_foto_id:', tipoId);
      console.log('  - Arquivo:', file.name, `(${file.size} bytes)`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/fotos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        let errorMessage = 'Erro ao fazer upload da foto';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log('Upload realizado com sucesso:', responseData);
      console.log('  - Foto ID:', responseData.id);
      console.log('  - url_arquivo:', responseData.url_arquivo);
      console.log('  - checklist_atualizado:', responseData.checklist_atualizado);
      
      // VALIDAÇÃO: Confirmar que a foto foi realmente salva
      if (!responseData.id) {
        throw new Error('Foto não foi criada. ID não retornado pelo servidor.');
      }
      
      if (!responseData.url_arquivo) {
        throw new Error('Foto não tem url_arquivo. Upload pode ter falhado.');
      }
      
      // VALIDAÇÃO: Testar se a imagem realmente existe e é acessível
      // Se não tem url_completa, usar a rota da API que serve a imagem corretamente (S3 ou local)
      const imageUrl = responseData.url_completa || `${API_CONFIG.BASE_URL}/api/fotos/${responseData.id}/imagem`;
      console.log('Validando se a imagem existe:', imageUrl);
      
      try {
        const imageValidation = await fetch(imageUrl, { method: 'HEAD' });
        if (!imageValidation.ok) {
          console.warn('[FRONTEND] ATENCAO: Imagem não acessível ainda, mas continuando... Status:', imageValidation.status);
        } else {
          console.log('[FRONTEND] OK: Imagem validada e acessível');
        }
      } catch (imgError) {
        console.warn('[FRONTEND] ATENCAO: Não foi possível validar imagem imediatamente:', imgError);
        // Não falhar o upload por isso, pois pode ser um problema de rede/cache
      }
      
      setSuccess(`Foto anexada com sucesso! Foto ID: ${responseData.id}. Item marcado como concluído.`);
      setTimeout(() => setSuccess(''), 8000);
      
      // Aguardar um pouco para garantir que o backend processou tudo
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Recarregar status do checklist
      console.log('Recarregando dados da vistoria...');
      await loadVistoria();
      console.log('Dados da vistoria recarregados');
      
      // VALIDAÇÃO FINAL: Aguardar mais um pouco e verificar se o item foi atualizado
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadVistoria();
      
      const itemAtualizado = checklistItens.find(item => 
        item.id === tipoId && 
        item.status === 'CONCLUIDO' && 
        item.foto
      );
      
      if (itemAtualizado && itemAtualizado.foto) {
        console.log('[FRONTEND] OK: Validação completa: Item do checklist atualizado com foto vinculada');
        console.log(`  - Item: "${itemAtualizado.nome}"`);
        console.log(`  - Foto ID: ${itemAtualizado.foto.id}`);
      } else {
        console.warn('[AVISO] Item do checklist pode não ter sido atualizado automaticamente');
        console.warn('  A foto foi salva, mas o item pode precisar ser atualizado manualmente');
      }
      
    } catch (err: any) {
      console.error('Erro ao fazer upload:', err);
      setError('Erro ao fazer upload da foto: ' + err.message);
    } finally {
      setUploading(null);
      setUploadingItemId(null);
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
          {vistoria.StatusVistoria?.nome === 'EM_ANDAMENTO' && vistoria.data_inicio ? (
            <InfoItem>
              <InfoLabel>Data de Início</InfoLabel>
              <InfoValue>{new Date(vistoria.data_inicio).toLocaleString('pt-BR')}</InfoValue>
            </InfoItem>
          ) : (
            <>
              <InfoItem>
                <InfoLabel>Local</InfoLabel>
                <InfoValue>
                  {(() => {
                    const local = vistoria.Local;
                    if (!local) return 'N/A';
                    
                    const partes = [];
                    // Se tem nome_local, adiciona primeiro
                    if (local.nome_local) partes.push(local.nome_local);
                    
                    // Monta endereço completo
                    if (local.logradouro) {
                      const endereco = `${local.logradouro}${local.numero ? `, ${local.numero}` : ''}`;
                      partes.push(endereco);
                    }
                    if (local.bairro) partes.push(local.bairro);
                    if (local.cidade || local.estado) {
                      const cidadeEstado = [local.cidade, local.estado].filter(Boolean).join(', ');
                      if (cidadeEstado) partes.push(cidadeEstado);
                    }
                    
                    // Se não tem nenhuma parte, retorna tipo ou N/A
                    if (partes.length === 0) {
                      return local.tipo || 'N/A';
                    }
                    
                    return partes.join(' - ');
                  })()}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Vistoriador</InfoLabel>
                <InfoValue>{vistoria.vistoriador?.nome || 'N/A'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Data de Criação</InfoLabel>
                <InfoValue>
                  {vistoria.createdAt 
                    ? new Date(vistoria.createdAt).toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : vistoria.created_at
                      ? new Date(vistoria.created_at).toLocaleDateString('pt-BR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'N/A'}
                </InfoValue>
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
            </>
          )}
        </InfoGrid>
      </VistoriaInfo>

      {/* Contato e Localização - Ocultar quando em andamento */}
      {vistoria.StatusVistoria?.nome !== 'EM_ANDAMENTO' && (
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
      )}

      {/* MENSAGEM DE TODAS AS FOTOS OBRIGATÓRIAS CONCLUÍDAS - NO INÍCIO */}
      {vistoria.StatusVistoria?.nome === 'EM_ANDAMENTO' && progresso && progresso.obrigatoriosPendentes === 0 && progresso.concluidos > 0 && (
        <div style={{
          background: '#dcfce7',
          border: '2px solid #10b981',
          borderRadius: '1rem',
          padding: '2.5rem',
          textAlign: 'center',
          marginTop: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <CheckCircle size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#166534', marginBottom: '0.75rem' }}>
            Todas as fotos obrigatórias foram concluídas!
          </h3>
          <p style={{ color: '#065f46', marginBottom: '2rem', fontSize: '1.125rem' }}>
            Você pode finalizar a vistoria agora.
          </p>
          <ActionButton 
            variant="primary" 
            onClick={() => handleStatusUpdate(3)} // CONCLUIDA
            disabled={loading}
            style={{
              fontSize: '1.25rem',
              padding: '1.25rem 3rem',
              minWidth: '300px',
              height: 'auto',
              fontWeight: '600',
              background: '#10b981',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            <CheckCircle size={28} style={{ marginRight: '0.75rem' }} />
            {loading ? 'Finalizando...' : 'Finalizar Vistoria'}
          </ActionButton>
        </div>
      )}

      {/* NOVO SISTEMA DE CHECKLIST - APENAS QUANDO EM_ANDAMENTO */}
      {vistoria.StatusVistoria?.nome === 'EM_ANDAMENTO' && checklistItens.length > 0 && (
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
                  Todos os itens obrigatórios concluídos! Você pode finalizar a vistoria.
                </div>
              )}
            </>
          )}

          {/* SEÇÃO: ITENS PENDENTES */}
          {checklistItens.filter(item => item.status !== 'CONCLUIDO').length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#1f2937',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Clock size={20} style={{ color: '#f59e0b' }} />
                Pendentes ({checklistItens.filter(item => item.status !== 'CONCLUIDO').length})
              </h3>
              {checklistItens
                .filter(item => item.status !== 'CONCLUIDO')
                .map((item) => {
                  return (
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
                  {item.status === 'CONCLUIDO' && item.foto ? (
                    <>
                      <PhotoDisplay>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <CheckCircle size={16} color="#10b981" />
                          <strong style={{ color: '#065f46' }}>Foto anexada</strong>
                          <span style={{
                            background: '#dcfce7',
                            color: '#166534',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.7rem',
                            fontWeight: '600'
                          }}>
                            ID: {item.foto.id}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', marginBottom: '1rem' }}>
                          Enviada em: {new Date(item.concluido_em || item.updatedAt).toLocaleString('pt-BR')}
                        </div>
                        {item.foto.url_arquivo && (
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem', marginBottom: '1rem', wordBreak: 'break-all' }}>
                            Arquivo: {item.foto.url_arquivo.substring(0, 50)}...
                          </div>
                        )}
                      </PhotoDisplay>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <ActionButton 
                          variant="primary" 
                          onClick={async () => {
                            setFotoVisualizada({ id: item.foto.id, nome: item.nome });
                            setErroCarregamentoImagem(false);
                            setCarregandoImagem(true);
                            setUrlImagem(null);
                            
                            // Buscar URL da imagem primeiro
                            try {
                              const response = await fetch(`${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem-url`, {
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              });
                              
                              if (response.ok) {
                                const data = await response.json();
                                if (data.encontrada && data.url) {
                                  console.log('[FRONTEND] URL da imagem obtida:', data.url);
                                  setUrlImagem(data.url);
                                  setCarregandoImagem(false);
                                } else {
                                  console.error('[FRONTEND] Imagem não encontrada');
                                  setErroCarregamentoImagem(true);
                                  setCarregandoImagem(false);
                                }
                              } else {
                                console.error('[FRONTEND] Erro ao buscar URL da imagem:', response.status);
                                setErroCarregamentoImagem(true);
                                setCarregandoImagem(false);
                              }
                            } catch (error) {
                              console.error('[FRONTEND] Erro ao buscar URL da imagem:', error);
                              setErroCarregamentoImagem(true);
                              setCarregandoImagem(false);
                            }
                          }}
                          style={{ background: '#3b82f6' }}
                        >
                          <Eye size={16} />
                          Visualizar Foto
                        </ActionButton>
                        <ActionButton 
                          variant="primary" 
                          onClick={() => handleOpenPhotoModal(item)}
                          style={{ background: '#10b981' }}
                        >
                          <Camera size={16} />
                          Trocar Foto
                        </ActionButton>
                        {!item.obrigatorio && (
                          <ActionButton variant="danger" onClick={() => handleMarcarPendente(item.id)}>
                            <X size={16} />
                            Desmarcar
                          </ActionButton>
                        )}
                      </div>
                    </>
                  ) : item.status === 'CONCLUIDO' && !item.foto ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#10b981' }}>
                        <CheckCircle size={16} />
                        <strong>Item concluído sem foto</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <PhotoUploadButton 
                          variant="primary" 
                          onClick={() => handleOpenPhotoModal(item)}
                          disabled={uploadingItemId === item.id}
                        >
                          <Camera size={18} />
                          {uploadingItemId === item.id ? 'Enviando...' : 'Anexar Foto'}
                        </PhotoUploadButton>
                        {!item.obrigatorio && (
                          <ActionButton variant="danger" onClick={() => handleMarcarPendente(item.id)}>
                            <X size={16} />
                            Desmarcar
                          </ActionButton>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <PhotoButtonGroup>
                        <PhotoUploadButton 
                          variant="primary" 
                          onClick={() => handleOpenPhotoModal(item)}
                          disabled={uploadingItemId === item.id}
                        >
                          <Camera size={18} />
                          {uploadingItemId === item.id ? 'Enviando...' : 'Tirar/Anexar Foto'}
                        </PhotoUploadButton>
                        {!item.obrigatorio && (
                          <ActionButton onClick={() => handleMarcarConcluido(item.id)}>
                            <CheckCircle size={16} />
                            Concluir sem foto
                          </ActionButton>
                        )}
                      </PhotoButtonGroup>
                      {item.obrigatorio && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#ef4444', 
                          marginTop: '0.5rem',
                          fontWeight: 500
                        }}>
                          Foto obrigatória para este item
                        </div>
                      )}
                    </>
                  )}
                </ChecklistActions>
              </ChecklistHeader>
            </ChecklistItemStyled>
                  );
                })}
            </div>
          )}

          {/* SEÇÃO: ITENS CONCLUÍDOS */}
          {checklistItens.filter(item => item.status === 'CONCLUIDO').length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#1f2937',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle size={20} style={{ color: '#10b981' }} />
                Concluídos ({checklistItens.filter(item => item.status === 'CONCLUIDO').length})
              </h3>
              {checklistItens
                .filter(item => item.status === 'CONCLUIDO')
                .map((item) => (
                  <ChecklistItemStyled key={item.id} completed={true}>
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
                            <CheckCircle size={20} style={{ color: '#10b981' }} />
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
                          </div>
                        </ChecklistTitle>
                        {item.descricao && (
                          <ChecklistDescription>{item.descricao}</ChecklistDescription>
                        )}
                        {item.concluido_em && (
                          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                            Concluído em: {new Date(item.concluido_em).toLocaleString('pt-BR')}
                          </div>
                        )}
                      </ChecklistInfo>
                      
                      <ChecklistActions>
                        {item.foto ? (
                          <>
                            <PhotoDisplay>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <CheckCircle size={16} color="#10b981" />
                                <strong style={{ color: '#065f46' }}>Foto anexada</strong>
                                <span style={{
                                  background: '#dcfce7',
                                  color: '#166534',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.7rem',
                                  fontWeight: '600'
                                }}>
                                  ID: {item.foto.id}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', marginBottom: '1rem' }}>
                                Enviada em: {new Date(item.concluido_em || item.updatedAt).toLocaleString('pt-BR')}
                              </div>
                            </PhotoDisplay>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                              <ActionButton 
                                variant="primary" 
                                onClick={async () => {
                                  setFotoVisualizada({ id: item.foto.id, nome: item.nome });
                                  setErroCarregamentoImagem(false);
                                  setCarregandoImagem(true);
                                  setUrlImagem(null);
                                  
                                  try {
                                    const response = await fetch(`${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem-url`, {
                                      headers: {
                                        'Authorization': `Bearer ${token}`
                                      }
                                    });
                                    
                                    if (response.ok) {
                                      const data = await response.json();
                                      if (data.encontrada && data.url) {
                                        setUrlImagem(data.url);
                                        setCarregandoImagem(false);
                                      } else {
                                        setErroCarregamentoImagem(true);
                                        setCarregandoImagem(false);
                                      }
                                    } else {
                                      setErroCarregamentoImagem(true);
                                      setCarregandoImagem(false);
                                    }
                                  } catch (error) {
                                    setErroCarregamentoImagem(true);
                                    setCarregandoImagem(false);
                                  }
                                }}
                                style={{ background: '#3b82f6' }}
                              >
                                <Eye size={16} />
                                Visualizar Foto
                              </ActionButton>
                              <ActionButton 
                                variant="primary" 
                                onClick={() => handleOpenPhotoModal(item)}
                                style={{ background: '#10b981' }}
                              >
                                <Camera size={16} />
                                Trocar Foto
                              </ActionButton>
                              <ActionButton variant="danger" onClick={() => handleMarcarPendente(item.id)}>
                                <X size={16} />
                                Voltar para Pendente
                              </ActionButton>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#10b981' }}>
                              <CheckCircle size={16} />
                              <strong>Item concluído sem foto</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                              <PhotoUploadButton 
                                variant="primary" 
                                onClick={() => handleOpenPhotoModal(item)}
                                disabled={uploadingItemId === item.id}
                              >
                                <Camera size={18} />
                                {uploadingItemId === item.id ? 'Enviando...' : 'Anexar Foto'}
                              </PhotoUploadButton>
                              <ActionButton variant="danger" onClick={() => handleMarcarPendente(item.id)}>
                                <X size={16} />
                                Voltar para Pendente
                              </ActionButton>
                            </div>
                          </>
                        )}
                      </ChecklistActions>
                    </ChecklistHeader>
                  </ChecklistItemStyled>
                ))}
            </div>
          )}
        </ChecklistSection>
      )}

      {/* MENSAGEM QUANDO VISTORIA NÃO ESTÁ INICIADA */}
      {vistoria.StatusVistoria?.nome === 'PENDENTE' && !vistoria.data_inicio && (
        <div style={{
          background: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '1rem',
          padding: '2.5rem',
          textAlign: 'center',
          marginTop: '2rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <AlertCircle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#92400e', marginBottom: '0.75rem' }}>
            Vistoria não iniciada
          </h3>
          <p style={{ color: '#78350f', marginBottom: '2rem', fontSize: '1.125rem' }}>
            Você precisa iniciar a vistoria para poder tirar as fotos do checklist.
          </p>
          <ActionButton 
            variant="primary" 
            onClick={handleIniciarVistoria}
            disabled={loading}
            style={{
              fontSize: '1.25rem',
              padding: '1.25rem 3rem',
              minWidth: '300px',
              height: 'auto',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            <Play size={28} style={{ marginRight: '0.75rem' }} />
            {loading ? 'Iniciando...' : 'Iniciar Vistoria'}
          </ActionButton>
        </div>
      )}

      <StatusActions>
        
        {vistoria.StatusVistoria?.nome === 'EM_ANDAMENTO' && (
          <>
            {progresso && progresso.obrigatoriosPendentes > 0 ? (
              <div style={{ 
                background: '#fef3c7', 
                border: '1px solid #f59e0b', 
                borderRadius: '0.5rem', 
                padding: '1rem',
                color: '#92400e'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={20} />
                  <div>
                    <strong>Ainda há {progresso.obrigatoriosPendentes} foto(s) obrigatória(s) pendente(s)</strong>
                    <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      Complete todas as fotos obrigatórias para finalizar a vistoria.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </>
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

      {/* Modal de Foto */}
      {selectedItemForPhoto && (
        <PhotoModal onClick={(e) => {
          if (e.target === e.currentTarget) handleClosePhotoModal();
        }}>
          <PhotoModalContent onClick={(e) => e.stopPropagation()}>
            <PhotoModalHeader>
              <PhotoModalTitle>
                {selectedItemForPhoto.nome}
                {selectedItemForPhoto.obrigatorio && (
                  <span style={{
                    marginLeft: '0.5rem',
                    background: '#fee2e2',
                    color: '#991b1b',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    Obrigatório
                  </span>
                )}
              </PhotoModalTitle>
              <CloseModalButton onClick={handleClosePhotoModal}>
                <X size={24} />
              </CloseModalButton>
            </PhotoModalHeader>

            {selectedItemForPhoto.descricao && (
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                {selectedItemForPhoto.descricao}
              </p>
            )}

            {showCamera && cameraStream ? (
              <>
                <CameraContainer>
                  <CameraVideo
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ 
                      width: '100%', 
                      height: 'auto',
                      minHeight: '300px',
                      background: '#000',
                      display: 'block'
                    }}
                  />
                </CameraContainer>
                <CameraControls>
                  <StopCameraButton onClick={() => {
                    setShowCamera(false);
                    stopCamera();
                  }}>
                    Cancelar
                  </StopCameraButton>
                  <CaptureButton onClick={capturePhotoFromCamera}>
                    <CameraInnerCircle />
                  </CaptureButton>
                  <div style={{ width: '70px' }}></div>
                </CameraControls>
              </>
            ) : photoPreview ? (
              <>
                <PhotoPreviewContainer>
                  <PhotoPreviewImage src={photoPreview} alt="Preview" />
                </PhotoPreviewContainer>
                <PhotoModalActions>
                  <ActionButton variant="secondary" onClick={() => {
                    setPhotoPreview(null);
                    setPhotoFile(null);
                  }}>
                    Escolher outra
                  </ActionButton>
                  <ActionButton 
                    variant="primary" 
                    onClick={handleConfirmPhotoUpload}
                    disabled={uploadingItemId !== null}
                  >
                    {uploadingItemId !== null ? 'Enviando...' : 'Confirmar e Enviar'}
                  </ActionButton>
                </PhotoModalActions>
              </>
            ) : (
              <PhotoModalActions style={{ flexDirection: 'column', gap: '1rem' }}>
                <PhotoUploadButton variant="primary" onClick={handleTakePhoto}>
                  <Camera size={20} />
                  Tirar Foto com Câmera
                </PhotoUploadButton>
                <PhotoUploadButton variant="secondary" onClick={handleChooseFromGallery}>
                  <Upload size={20} />
                  Escolher da Galeria
                </PhotoUploadButton>
              </PhotoModalActions>
            )}
          </PhotoModalContent>
        </PhotoModal>
      )}

      {/* Modal de Visualização de Foto */}
      {fotoVisualizada && (
        <FotoVisualizacaoModal onClick={() => {
          setFotoVisualizada(null);
          setErroCarregamentoImagem(false);
          setUrlImagem(null);
          setCarregandoImagem(false);
        }}>
          <FotoVisualizacaoContent onClick={(e) => e.stopPropagation()}>
            <FotoVisualizacaoHeader>
              <FotoVisualizacaoTitle>{fotoVisualizada.nome}</FotoVisualizacaoTitle>
              <FotoVisualizacaoCloseButton onClick={() => {
                setFotoVisualizada(null);
                setErroCarregamentoImagem(false);
                setUrlImagem(null);
                setCarregandoImagem(false);
              }}>
                <X size={24} />
              </FotoVisualizacaoCloseButton>
            </FotoVisualizacaoHeader>
            {carregandoImagem ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: '#6b7280' }}>
                <div style={{ marginBottom: '1rem' }}>Carregando imagem...</div>
                <div style={{ fontSize: '0.875rem' }}>Verificando se a imagem existe no servidor...</div>
              </div>
            ) : erroCarregamentoImagem ? (
              <FotoVisualizacaoErro>
                <FotoVisualizacaoErroTitulo>
                  <AlertCircle size={32} />
                  Erro ao Carregar Imagem
                </FotoVisualizacaoErroTitulo>
                <FotoVisualizacaoErroMensagem>
                  Não foi possível carregar a imagem. Isso pode acontecer se:
                </FotoVisualizacaoErroMensagem>
                <FotoVisualizacaoErroMensagem style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  • A imagem foi removida ou não existe mais<br/>
                  • Há um problema de conexão com o servidor<br/>
                  • O arquivo está corrompido ou inacessível
                </FotoVisualizacaoErroMensagem>
                <FotoVisualizacaoErroDetalhes>
                  Foto ID: {fotoVisualizada.id}<br/>
                  URL: {urlImagem || `${API_CONFIG.BASE_URL}/api/fotos/${fotoVisualizada.id}/imagem`}
                </FotoVisualizacaoErroDetalhes>
              </FotoVisualizacaoErro>
            ) : (
              <PreloadedImage
                src={urlImagem || `${API_CONFIG.BASE_URL}/api/fotos/${fotoVisualizada.id}/imagem`}
                alt={fotoVisualizada.nome}
                fallbackSrc={urlImagem ? `${API_CONFIG.BASE_URL}/api/fotos/${fotoVisualizada.id}/imagem` : undefined}
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '0.5rem'
                }}
                timeout={15000}
                showLoading={true}
                onLoad={() => {
                  console.log('[FRONTEND] OK: Imagem carregada com sucesso:', fotoVisualizada.id);
                  setErroCarregamentoImagem(false);
                }}
                onError={(error) => {
                  console.error('[FRONTEND] ERRO ao carregar imagem:', fotoVisualizada.id, error);
                  setErroCarregamentoImagem(true);
                }}
              />
            )}
          </FotoVisualizacaoContent>
        </FotoVisualizacaoModal>
      )}
    </Container>
  );
};

export default VistoriadorVistoria;
