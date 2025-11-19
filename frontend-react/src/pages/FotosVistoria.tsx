import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Camera, Download, Trash2, Image as ImageIcon, ArrowLeft, RefreshCw, ZoomIn, X } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { checklistService, vistoriaService } from '../services/api';
import { VistoriaChecklistItem, Vistoria } from '../types';
import { API_CONFIG } from '../config/api';

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
  gap: 1rem;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #4b5563;
  }
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

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(102, 126, 234, 0.35);
  }
`;

const InfoCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  color: #1e293b;
  font-weight: 600;
`;

const FotosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const FotoCard = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }
`;

const FotoHeader = styled.div`
  padding: 1rem;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
`;

const FotoTitulo = styled.div`
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const FotoDescricao = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const FotoImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 250px;
  background: #f1f5f9;
  overflow: hidden;
  cursor: pointer;
`;

const FotoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.05);
  }
`;

const FotoActions = styled.div`
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  background: #f8fafc;
`;

const IconButton = styled.button<{ variant?: string }>`
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  
  background: ${props => {
    switch (props.variant) {
      case 'danger': return '#fee2e2';
      case 'primary': return '#dbeafe';
      default: return '#f1f5f9';
    }
  }};
  
  color: ${props => {
    switch (props.variant) {
      case 'danger': return '#991b1b';
      case 'primary': return '#1e40af';
      default: return '#475569';
    }
  }};

  &:hover {
    transform: translateY(-2px);
  }
`;

const Badge = styled.span<{ variant?: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${props => props.variant === 'success' ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.variant === 'success' ? '#166534' : '#991b1b'};
`;

const Modal = styled.div`
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

const ModalImage = styled.img`
  max-width: 90%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 0.5rem;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 2rem;
  right: 2rem;
  background: white;
  color: #1e293b;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #f1f5f9;
    transform: scale(1.1);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #94a3b8;
`;

const OrderBadge = styled.div`
  background: #667eea;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
`;

const FotosVistoria: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vistoria, setVistoria] = useState<Vistoria | null>(null);
  const [checklistItens, setChecklistItens] = useState<VistoriaChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);

  useEffect(() => {
    loadDados();
  }, [id]);

  const loadDados = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Carregar vistoria
      const vistoriaData = await vistoriaService.getById(parseInt(id));
      setVistoria(vistoriaData);
      
      // Carregar checklist com fotos
      const itens = await checklistService.getChecklistVistoria(parseInt(id));
      setChecklistItens(itens);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fotoId: number | undefined, nomeItem: string) => {
    if (!fotoId) return;
    
    try {
      // Buscar URL da imagem primeiro
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/fotos/${fotoId}/imagem-url`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.encontrada && data.url) {
          const link = document.createElement('a');
          link.href = data.url;
          link.download = `${nomeItem}.jpg`;
          link.click();
          return;
        }
      }
      
      // Fallback: usar rota antiga
      const link = document.createElement('a');
      link.href = `${API_CONFIG.BASE_URL}/api/fotos/${fotoId}/imagem`;
      link.download = `${nomeItem}.jpg`;
      link.click();
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      // Fallback: usar rota antiga
      const link = document.createElement('a');
      link.href = `${API_CONFIG.BASE_URL}/api/fotos/${fotoId}/imagem`;
      link.download = `${nomeItem}.jpg`;
      link.click();
    }
  };

  if (loading) {
    return <Container><EmptyState>Carregando...</EmptyState></Container>;
  }

  if (!vistoria) {
    return <Container><EmptyState>Vistoria não encontrada</EmptyState></Container>;
  }

  const itensComFoto = checklistItens.filter(item => item.foto_id);
  const totalItens = checklistItens.length;
  const percentual = totalItens > 0 ? Math.round((itensComFoto.length / totalItens) * 100) : 0;

  return (
    <Container>
      <Header>
        <Title>
          <Camera size={32} />
          Fotos da Vistoria #{vistoria.id}
        </Title>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <ButtonPrimary onClick={loadDados}>
            <RefreshCw size={20} />
            Atualizar
          </ButtonPrimary>
          <BackButton onClick={() => navigate('/vistorias')}>
            <ArrowLeft size={20} />
            Voltar
          </BackButton>
        </div>
      </Header>

      <InfoCard>
        <InfoGrid>
          <InfoItem>
            <InfoLabel>Embarcação</InfoLabel>
            <InfoValue>{vistoria.Embarcacao?.nome || 'N/A'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Tipo</InfoLabel>
            <InfoValue>{vistoria.Embarcacao?.tipo_embarcacao || 'N/A'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Vistoriador</InfoLabel>
            <InfoValue>{vistoria.vistoriador?.nome || 'N/A'}</InfoValue>
          </InfoItem>
          <InfoItem>
            <InfoLabel>Fotos Enviadas</InfoLabel>
            <InfoValue>{itensComFoto.length} de {totalItens} ({percentual}%)</InfoValue>
          </InfoItem>
        </InfoGrid>
      </InfoCard>

      {itensComFoto.length > 0 ? (
        <FotosGrid>
          {checklistItens
            .filter(item => item.foto_id && item.foto)
            .map((item) => (
              <FotoCard key={item.id}>
                <FotoHeader>
                  <FotoTitulo>
                    <OrderBadge>{item.ordem}</OrderBadge>
                    {item.nome}
                    {item.obrigatorio && <Badge variant="danger">Obrigatório</Badge>}
                    {item.status === 'CONCLUIDO' && <Badge variant="success">Concluído</Badge>}
                  </FotoTitulo>
                  {item.descricao && (
                    <FotoDescricao>{item.descricao}</FotoDescricao>
                  )}
                </FotoHeader>

                <FotoImageContainer onClick={async () => {
                  if (!item.foto?.id) return;
                  
                  try {
                    // Buscar URL da imagem primeiro
                    const response = await fetch(`${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem-url`, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });
                    
                    if (response.ok) {
                      const data = await response.json();
                      if (data.encontrada && data.url) {
                        setImagemAmpliada(data.url);
                        return;
                      }
                    }
                    
                    // Fallback: usar rota antiga
                    setImagemAmpliada(`${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem`);
                  } catch (error) {
                    console.error('Erro ao buscar URL da imagem:', error);
                    // Fallback: usar rota antiga
                    setImagemAmpliada(`${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem`);
                  }
                }}>
                  <FotoImage 
                    src={item.foto?.id ? `${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem` : ''} 
                    alt={item.nome}
                    onError={async (e) => {
                      // Se falhar, tentar buscar URL via API
                      if (item.foto?.id) {
                        try {
                          const response = await fetch(`${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem-url`, {
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            if (data.encontrada && data.url) {
                              e.currentTarget.src = data.url;
                            }
                          }
                        } catch (error) {
                          console.error('Erro ao buscar URL alternativa:', error);
                        }
                      }
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <ZoomIn size={18} />
                  </div>
                </FotoImageContainer>

                <FotoActions>
                  <IconButton 
                    variant="primary"
                    onClick={() => handleDownload(item.foto?.id, item.nome)}
                  >
                    <Download size={16} />
                    Baixar
                  </IconButton>
                </FotoActions>
              </FotoCard>
            ))}
        </FotosGrid>
      ) : (
        <EmptyState>
          <ImageIcon size={64} />
          <h3>Nenhuma foto enviada ainda</h3>
          <p>As fotos aparecerão aqui conforme o vistoriador for tirando.</p>
        </EmptyState>
      )}

      {imagemAmpliada && (
        <Modal onClick={() => setImagemAmpliada(null)}>
          <CloseButton onClick={() => setImagemAmpliada(null)}>
            <X size={20} />
          </CloseButton>
          <ModalImage src={imagemAmpliada} alt="Foto ampliada" />
        </Modal>
      )}
    </Container>
  );
};

export default FotosVistoria;

