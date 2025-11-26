import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Camera, Download, Image as ImageIcon, ArrowLeft, RefreshCw, ZoomIn, X, Eye, AlertCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { checklistService, vistoriaService } from '../services/api';
import { VistoriaChecklistItem, Vistoria } from '../types';
import { API_CONFIG } from '../config/api';
import { mascaraCPF } from '../utils/validators';
import PreloadedImage from '../components/PreloadedImage';
import { imageCacheManager } from '../utils/imageCache';
import { buildImageUrl, buildImageUrlEndpoint } from '../utils/urlHelper';

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
  const [imagemUrls, setImagemUrls] = useState<Record<number, string>>({});
  const [errosCarregamento, setErrosCarregamento] = useState<number>(0);
  const [mostrarAvisoRecarregar, setMostrarAvisoRecarregar] = useState(false);

  const loadDados = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Carregar vistoria
      const vistoriaData = await vistoriaService.getById(parseInt(id));
      setVistoria(vistoriaData);
      
      // Carregar checklist com fotos
      const itens = await checklistService.getChecklistVistoria(parseInt(id));
      setChecklistItens(itens);
      
      // Buscar URLs de todas as imagens em paralelo (otimizado)
      const urls: Record<number, string> = {};
      const token = localStorage.getItem('token');
      const errosCountRef = { count: 0 };
      
      // Filtrar itens com foto
      const itensComFoto = itens.filter(item => item.foto?.id);
      
      // Carregar URLs em paralelo (máximo 10 por vez para não sobrecarregar)
      const batchSize = 10;
      for (let i = 0; i < itensComFoto.length; i += batchSize) {
        const batch = itensComFoto.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (item) => {
            if (!item.foto?.id) return;
            
            try {
              const response = await fetch(buildImageUrlEndpoint(API_CONFIG.BASE_URL, item.foto.id), {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.encontrada && data.url) {
                  urls[item.foto.id] = data.url;
                } else {
                  errosCountRef.count++;
                  // Fallback: usar rota direta
                  urls[item.foto.id] = buildImageUrl(API_CONFIG.BASE_URL, item.foto.id);
                }
              } else {
                errosCountRef.count++;
                // Fallback: usar rota direta
                urls[item.foto.id] = buildImageUrl(API_CONFIG.BASE_URL, item.foto.id);
              }
            } catch (error) {
              console.error(`Erro ao buscar URL da foto ${item.foto.id}:`, error);
              errosCountRef.count++;
              // Fallback: usar rota direta
              urls[item.foto.id] = buildImageUrl(API_CONFIG.BASE_URL, item.foto.id);
            }
          })
        );
      }
      
      setImagemUrls(urls);
      setErrosCarregamento(errosCountRef.count);
      
      // Se muitos erros, mostrar aviso para recarregar
      if (errosCountRef.count > 3) {
        setMostrarAvisoRecarregar(true);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDados();
    
    // Cleanup: limpar cache quando sair da página
    return () => {
      console.log('[FotosVistoria] Limpando cache de imagens ao sair da página');
      const urlsToClear = Object.values(imagemUrls);
      if (urlsToClear.length > 0) {
        imageCacheManager.clearCacheForUrls(urlsToClear);
      }
      setImagemUrls({});
    };
  }, [loadDados]);

  const handleDownload = async (fotoId: number | undefined, nomeItem: string) => {
    if (!fotoId) return;
    
    try {
      // Buscar URL da imagem primeiro
      const response = await fetch(buildImageUrlEndpoint(API_CONFIG.BASE_URL, fotoId), {
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
      link.href = buildImageUrl(API_CONFIG.BASE_URL, fotoId);
      link.download = `${nomeItem}.jpg`;
      link.click();
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      // Fallback: usar rota antiga
      const link = document.createElement('a');
      link.href = buildImageUrl(API_CONFIG.BASE_URL, fotoId);
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
      {mostrarAvisoRecarregar && (
        <div style={{
          background: '#fef3c7',
          border: '2px solid #f59e0b',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <AlertCircle size={24} color="#f59e0b" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#92400e' }}>
              Muitos erros ao carregar imagens ({errosCarregamento} erro(s))
            </div>
            <div style={{ fontSize: '0.875rem', color: '#78350f' }}>
              Por favor, saia e entre novamente nesta página para recarregar as imagens.
            </div>
          </div>
          <button
            onClick={() => {
              setErrosCarregamento(0);
              setMostrarAvisoRecarregar(false);
              loadDados();
            }}
            style={{
              padding: '0.5rem 1rem',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => {
              navigate(-1);
            }}
            style={{
              padding: '0.5rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            Sair
          </button>
        </div>
      )}
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
            <InfoValue>
              {vistoria.vistoriador?.nome || 'N/A'}
              {vistoria.vistoriador?.cpf && (
                <span style={{ fontSize: '0.875rem', color: '#64748b', marginLeft: '0.5rem', fontWeight: '400' }}>
                  (CPF: {mascaraCPF(vistoria.vistoriador.cpf)})
                </span>
              )}
            </InfoValue>
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

                <FotoImageContainer>
                  {item.foto?.id ? (
                    <PreloadedImage
                      src={imagemUrls[item.foto.id] || buildImageUrl(API_CONFIG.BASE_URL, item.foto.id)}
                      alt={item.nome}
                      fallbackSrc={imagemUrls[item.foto.id] ? buildImageUrl(API_CONFIG.BASE_URL, item.foto.id) : undefined}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '0.5rem'
                      }}
                      timeout={20000}
                      showLoading={true}
                      loadingComponent={
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                          <ImageIcon size={48} color="#9ca3af" />
                          <div style={{ marginTop: '0.5rem', color: '#6b7280' }}>Carregando imagem...</div>
                        </div>
                      }
                      errorComponent={
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                          <ImageIcon size={48} color="#ef4444" />
                          <div style={{ marginTop: '0.5rem', color: '#ef4444' }}>Erro ao carregar imagem</div>
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                            Foto ID: {item.foto.id}
                          </div>
                        </div>
                      }
                    />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: '#f3f4f6',
                      borderRadius: '0.5rem'
                    }}>
                      <ImageIcon size={64} color="#9ca3af" />
                    </div>
                  )}
                </FotoImageContainer>

                <FotoActions>
                  {item.foto?.id && (
                    <IconButton 
                      variant="primary"
                      onClick={() => {
                        // SOMENTE usar imagem já carregada se ela estiver visível/aparecendo
                        // Buscar a imagem no DOM pelo alt text
                        const imgElement = document.querySelector(`img[alt="${item.nome}"]`) as HTMLImageElement;
                        
                        // Verificar se a imagem está realmente carregada e visível
                        if (imgElement && 
                            imgElement.src && 
                            imgElement.complete && 
                            imgElement.naturalWidth > 0 &&
                            imgElement.offsetParent !== null) { // Verifica se está visível
                          // Imagem já está carregada e visível, usar o src dela (SEM nova requisição)
                          console.log('[FotosVistoria] ✅ Imagem já carregada e visível, usando do DOM:', imgElement.src);
                          setImagemAmpliada(imgElement.src);
                        } else {
                          // Imagem não está carregada ainda ou não está visível
                          // Fazer requisição normal ao backend
                          console.log('[FotosVistoria] ⚠️ Imagem não está carregada ainda, fazendo requisição ao backend');
                          const url = imagemUrls[item.foto.id] || buildImageUrl(API_CONFIG.BASE_URL, item.foto.id);
                          setImagemAmpliada(url);
                        }
                      }}
                      style={{ marginRight: '0.5rem' }}
                    >
                      <Eye size={16} />
                      Visualizar Imagem
                    </IconButton>
                  )}
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
          <CloseButton onClick={(e) => {
            e.stopPropagation();
            setImagemAmpliada(null);
          }}>
            <X size={20} />
          </CloseButton>
          <img
            src={imagemAmpliada}
            alt="Foto ampliada"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setImagemAmpliada(null);
              }
            }}
            tabIndex={0}
            role="img"
            style={{
              maxWidth: '95%',
              maxHeight: '95vh',
              objectFit: 'contain',
              borderRadius: '0.5rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              background: '#000',
              padding: '1rem',
              cursor: 'default'
            }}
            onError={(e) => {
              console.error('[FotosVistoria] Erro ao carregar imagem no modal:', imagemAmpliada);
              // Se falhar, tentar recarregar
              const img = e.target as HTMLImageElement;
              img.src = imagemAmpliada + '?t=' + Date.now();
            }}
          />
        </Modal>
      )}
    </Container>
  );
};

export default FotosVistoria;

