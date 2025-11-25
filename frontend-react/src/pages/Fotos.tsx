import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Camera, Image as ImageIcon, Eye, RefreshCw, Calendar, User, Ship, ZoomIn, X, Download, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { vistoriaService, checklistService } from '../services/api';
import { Vistoria, VistoriaChecklistItem, ChecklistProgresso } from '../types';
import { API_CONFIG } from '../config/api';
import PreloadedImage from '../components/PreloadedImage';
import { imageCacheManager } from '../utils/imageCache';

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

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(102, 126, 234, 0.35);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const VistoriasGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const VistoriaCard = styled.div`
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid #e2e8f0;
  transition: all 0.3s;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }
`;

const VistoriaHeader = styled.div`
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const VistoriaTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const VistoriaInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  font-size: 0.875rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.95;
`;

const VistoriaContent = styled.div`
  padding: 1.5rem;
`;

const ProgressContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 24px;
  background: #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  width: ${props => props.progress}%;
  transition: width 0.5s ease;
`;

const ProgressText = styled.div`
  text-align: center;
  font-size: 0.875rem;
  color: #475569;
  font-weight: 600;
  margin-top: 0.5rem;
`;

// Removido FotosGrid e FotoMiniatura - não são mais necessários
// As imagens só serão carregadas quando o usuário clicar em "Ver Todas as Fotos"

const FotoImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const FotoOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  color: white;
  padding: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
`;

const OrderBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: #667eea;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const ViewAllButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #f0f9ff;
  border: 2px solid #3b82f6;
  border-radius: 0.5rem;
  color: #1e40af;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  transition: all 0.2s;

  &:hover {
    background: #dbeafe;
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  color: #1e293b;
  font-weight: 600;
`;

const FotoImageContainer = styled.div`
  position: relative;
  cursor: pointer;
`;

const FotoActions = styled.div`
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
`;

const IconButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: #dbeafe;
  color: #1e40af;
  transition: all 0.2s;

  &:hover {
    background: #bfdbfe;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #94a3b8;
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
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);

  &:hover {
    background: #f1f5f9;
    transform: scale(1.1);
  }
`;

interface VistoriaComFotos {
  vistoria: Vistoria;
  checklist: VistoriaChecklistItem[];
  progresso: ChecklistProgresso | null;
}

const Fotos: React.FC = () => {
  const navigate = useNavigate();
  const [vistoriasComFotos, setVistoriasComFotos] = useState<VistoriaComFotos[]>([]);
  const [vistoriaSelecionada, setVistoriaSelecionada] = useState<VistoriaComFotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagemAmpliada, setImagemAmpliada] = useState<string | null>(null);
  const [imagemUrls, setImagemUrls] = useState<Record<number, string>>({});
  const [errosCarregamento, setErrosCarregamento] = useState<number>(0);
  const [mostrarAvisoRecarregar, setMostrarAvisoRecarregar] = useState(false);

  useEffect(() => {
    loadFotos();
    
    // Cleanup: limpar cache quando sair da página
    return () => {
      console.log('[Fotos] Limpando cache de imagens ao sair da página');
      setImagemUrls(prevUrls => {
        const urlsToClear = Object.values(prevUrls);
        if (urlsToClear.length > 0) {
          imageCacheManager.clearCacheForUrls(urlsToClear);
        }
        return {};
      });
      setErrosCarregamento(0);
      setMostrarAvisoRecarregar(false);
    };
  }, []);

  // Carregar URLs das imagens quando uma vistoria é selecionada
  useEffect(() => {
    if (!vistoriaSelecionada) {
      setImagemUrls({});
      return;
    }

    const carregarUrlsImagens = async () => {
      const { checklist } = vistoriaSelecionada;
      const fotosComImagem = checklist.filter(item => item.foto_id && item.foto);
      
      if (fotosComImagem.length === 0) {
        setImagemUrls({});
        return;
      }

      console.log(`[Fotos] Carregando URLs de ${fotosComImagem.length} imagem(ns)...`);
      
      const urls: Record<number, string> = {};
      const token = localStorage.getItem('token');
      const errosCountRef = { count: 0 };
      
      // Carregar URLs em paralelo (máximo 10 por vez para não sobrecarregar)
      const batchSize = 10;
      for (let i = 0; i < fotosComImagem.length; i += batchSize) {
        const batch = fotosComImagem.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (item) => {
            if (!item.foto?.id) return;
            
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem-url`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.encontrada && data.url) {
                  urls[item.foto.id] = data.url;
                  console.log(`[Fotos] URL carregada para foto ${item.foto.id}`);
                } else {
                  errosCountRef.count++;
                  // Fallback: usar rota direta
                  urls[item.foto.id] = `${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem`;
                  console.log(`[Fotos] Fallback para foto ${item.foto.id}`);
                }
              } else {
                errosCountRef.count++;
                // Fallback: usar rota direta
                urls[item.foto.id] = `${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem`;
                console.log(`[Fotos] Erro ${response.status} para foto ${item.foto.id}, usando fallback`);
              }
            } catch (error) {
              console.error(`[Fotos] Erro ao buscar URL da foto ${item.foto.id}:`, error);
              errosCountRef.count++;
              // Fallback: usar rota direta
              urls[item.foto.id] = `${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem`;
            }
          })
        );
      }
      
      setImagemUrls(urls);
      setErrosCarregamento(errosCountRef.count);
      
      // Se muitos erros, mostrar aviso para recarregar
      if (errosCountRef.count > 3) {
        setMostrarAvisoRecarregar(true);
      } else {
        setMostrarAvisoRecarregar(false);
      }
      
      console.log(`[Fotos] URLs carregadas: ${Object.keys(urls).length} de ${fotosComImagem.length}`);
    };

    carregarUrlsImagens();
  }, [vistoriaSelecionada]);

  const loadFotos = async () => {
    try {
      setLoading(true);
      
      // Buscar todas as vistorias
      const todasVistorias = await vistoriaService.getAll();
      
      // Filtrar apenas vistorias que já foram iniciadas
      const vistoriasIniciadas = todasVistorias.filter(v => v.data_inicio != null);
      
      // Carregar checklist e fotos de cada vistoria
      const vistoriasComDados = await Promise.all(
        vistoriasIniciadas.map(async (vistoria) => {
          try {
            const checklist = await checklistService.getChecklistVistoria(vistoria.id);
            const progresso = await checklistService.getProgresso(vistoria.id);
            
            return {
              vistoria,
              checklist,
              progresso
            };
          } catch (err) {
            return {
              vistoria,
              checklist: [],
              progresso: null
            };
          }
        })
      );
      
      // Ordenar por data de início (mais recentes primeiro)
      vistoriasComDados.sort((a, b) => {
        const dataA = new Date(a.vistoria.data_inicio || 0).getTime();
        const dataB = new Date(b.vistoria.data_inicio || 0).getTime();
        return dataB - dataA;
      });
      
      setVistoriasComFotos(vistoriasComDados);
      
      // Não carregar URLs de imagens aqui - só quando o usuário clicar em "Ver Todas as Fotos"
      // Isso melhora a performance da página inicial
    } catch (err) {
      console.error('Erro ao carregar fotos:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string | null) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container>
        <EmptyState>
          <Camera size={64} />
          <h3>Carregando fotos das vistorias...</h3>
        </EmptyState>
      </Container>
    );
  }

  if (vistoriasComFotos.length === 0) {
    return (
      <Container>
        <Header>
          <Title>
            <Camera size={32} />
            Galeria de Fotos das Vistorias
          </Title>
        </Header>
        <EmptyState>
          <ImageIcon size={64} />
          <h3>Nenhuma vistoria iniciada ainda</h3>
          <p>As vistorias aparecerão aqui quando forem iniciadas pelo vistoriador.</p>
        </EmptyState>
      </Container>
    );
  }

  // Se uma vistoria foi selecionada, mostrar detalhes
  if (vistoriaSelecionada) {
    const { vistoria, checklist, progresso } = vistoriaSelecionada;
    const fotosComImagem = checklist.filter(item => item.foto_id && item.foto);
    
    return (
      <Container>
        <Header>
          <Title>
            <Camera size={32} />
            Vistoria #{vistoria.id} - {vistoria.Embarcacao?.nome || vistoria.embarcacao?.nome}
          </Title>
          <ButtonPrimary onClick={() => setVistoriaSelecionada(null)}>
            <ArrowLeft size={20} />
            Voltar para Lista
          </ButtonPrimary>
        </Header>

        <div style={{
          background: '#dbeafe',
          border: '2px solid #3b82f6',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ color: '#1e40af', fontWeight: '600', marginBottom: '0.5rem' }}>
            Visualizando fotos desta vistoria específica
          </div>
          <InfoGrid style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <InfoItem>
              <InfoLabel>Tipo</InfoLabel>
              <InfoValue>{vistoria.Embarcacao?.tipo_embarcacao || vistoria.embarcacao?.tipo_embarcacao || 'N/A'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Vistoriador</InfoLabel>
              <InfoValue>{vistoria.vistoriador?.nome || 'N/A'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Iniciada em</InfoLabel>
              <InfoValue>{formatarData(vistoria.data_inicio || null)}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Progresso</InfoLabel>
              <InfoValue>
                {progresso ? `${progresso.concluidos}/${progresso.total} (${progresso.percentual}%)` : 'N/A'}
              </InfoValue>
            </InfoItem>
          </InfoGrid>
        </div>

        {progresso && (
          <div style={{ marginBottom: '1.5rem', background: 'white', padding: '1.5rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.75rem' }}>
              Progresso do Checklist de Fotos
            </div>
            <ProgressBar>
              <ProgressFill progress={progresso.percentual} />
            </ProgressBar>
            <ProgressText>
              {progresso.concluidos} de {progresso.total} itens do checklist concluídos ({progresso.percentual}%)
              {progresso.obrigatoriosPendentes > 0 && (
                <span style={{ color: '#ef4444', display: 'block', marginTop: '0.5rem' }}>
                  {progresso.obrigatoriosPendentes} item(ns) obrigatório(s) ainda pendente(s)
                </span>
              )}
            </ProgressText>
          </div>
        )}

        <div style={{ 
          background: 'white', 
          padding: '1rem', 
          borderRadius: '0.75rem', 
          marginBottom: '1rem',
          fontWeight: '600',
          color: '#1e293b'
        }}>
          Fotos Organizadas por Item do Checklist ({fotosComImagem.length} foto(s) enviada(s))
        </div>

        {fotosComImagem.length > 0 ? (
          <div style={{ 
            display: 'grid',
            gap: '1.5rem'
          }}>
            {checklist.map((item) => {
              if (!item.foto_id || !item.foto) return null;
              
              return (
                <VistoriaCard key={item.id}>
                  <VistoriaHeader style={{ padding: '1rem' }}>
                    <VistoriaTitle style={{ fontSize: '1rem', marginBottom: 0 }}>
                      <OrderBadge>{item.ordem}</OrderBadge>
                      {item.nome}
                      {item.obrigatorio && (
                        <span style={{
                          background: '#fee2e2',
                          color: '#991b1b',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.7rem',
                          marginLeft: '0.5rem'
                        }}>
                          Obrigatório
                        </span>
                      )}
                      {item.status === 'CONCLUIDO' && (
                        <span style={{
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.7rem',
                          marginLeft: '0.5rem'
                        }}>
                          Concluído
                        </span>
                      )}
                    </VistoriaTitle>
                    {item.descricao && (
                      <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.5rem' }}>
                        {item.descricao}
                      </div>
                    )}
                  </VistoriaHeader>
                  
                  <div style={{ position: 'relative' }}>
                    <FotoImageContainer>
                      {item.foto?.id ? (
                        <PreloadedImage 
                          src={`${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem`}
                          alt={item.nome}
                          fallbackSrc={imagemUrls[item.foto.id] || `${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem`}
                          style={{ 
                            height: '400px', 
                            width: '100%', 
                            objectFit: 'contain', 
                            background: '#000',
                            borderRadius: '0.5rem'
                          }}
                          timeout={30000}
                          showLoading={true}
                          loadingComponent={
                            <div style={{ 
                              textAlign: 'center', 
                              padding: '4rem',
                              background: '#000',
                              height: '400px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <ImageIcon size={48} color="#9ca3af" />
                              <div style={{ marginTop: '0.5rem', color: '#6b7280' }}>Carregando imagem...</div>
                            </div>
                          }
                          errorComponent={
                            <div style={{ 
                              textAlign: 'center', 
                              padding: '4rem',
                              background: '#000',
                              height: '400px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <ImageIcon size={48} color="#ef4444" />
                              <div style={{ marginTop: '0.5rem', color: '#ef4444' }}>Erro ao carregar imagem</div>
                              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                                Foto ID: {item.foto.id}
                              </div>
                              <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#6b7280' }}>
                                URL: {`${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem`}
                              </div>
                            </div>
                          }
                        />
                      ) : (
                        <div style={{ 
                          height: '400px', 
                          width: '100%', 
                          background: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '0.5rem'
                        }}>
                          <ImageIcon size={64} color="#9ca3af" />
                        </div>
                      )}
                    </FotoImageContainer>
                  </div>

                  <FotoActions>
                    {item.foto?.id && (
                      <IconButton 
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
                            console.log('[Fotos] ✅ Imagem já carregada e visível, usando do DOM:', imgElement.src);
                            setImagemAmpliada(imgElement.src);
                          } else {
                            // Imagem não está carregada ainda ou não está visível
                            // Fazer requisição normal ao backend
                            console.log('[Fotos] ⚠️ Imagem não está carregada ainda, fazendo requisição ao backend');
                            const url = imagemUrls[item.foto.id] || `${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem`;
                            setImagemAmpliada(url);
                          }
                        }}
                        style={{ marginRight: '0.5rem' }}
                      >
                        <Eye size={16} />
                        Visualizar Imagem
                      </IconButton>
                    )}
                    <IconButton onClick={async () => {
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
                            const link = document.createElement('a');
                            link.href = data.url;
                            link.download = `${item.nome}.jpg`;
                            link.click();
                            return;
                          }
                        }
                        
                        // Fallback: usar URL do estado ou rota direta
                        const url = imagemUrls[item.foto.id] || `${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem`;
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${item.nome}.jpg`;
                        link.click();
                      } catch (error) {
                        console.error('Erro ao baixar foto:', error);
                        // Fallback: usar URL do estado ou rota direta
                        const url = imagemUrls[item.foto.id] || `${API_CONFIG.BASE_URL}/api/fotos/${item.foto.id}/imagem`;
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `${item.nome}.jpg`;
                        link.click();
                      }
                    }}>
                      <Download size={16} />
                      Baixar Foto
                    </IconButton>
                  </FotoActions>

                  {item.observacao && (
                    <div style={{ 
                      padding: '1rem', 
                      background: '#f8fafc', 
                      fontSize: '0.875rem',
                      color: '#64748b',
                      fontStyle: 'italic'
                    }}>
                      Obs: {item.observacao}
                    </div>
                  )}
                  
                  {item.concluido_em && (
                    <div style={{ 
                      padding: '0.5rem 1rem', 
                      background: '#f8fafc', 
                      fontSize: '0.75rem',
                      color: '#64748b',
                      borderTop: '1px solid #e2e8f0'
                    }}>
                      Concluído em: {new Date(item.concluido_em).toLocaleString('pt-BR')}
                    </div>
                  )}
                </VistoriaCard>
              );
            })}
          </div>
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
              <X size={24} />
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
                console.error('[Fotos] Erro ao carregar imagem no modal:', imagemAmpliada);
                // Se falhar, tentar recarregar
                const img = e.target as HTMLImageElement;
                img.src = imagemAmpliada + '?t=' + Date.now();
              }}
            />
          </Modal>
        )}
      </Container>
    );
  }

  // Lista de vistorias
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
              loadFotos();
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
        </div>
      )}
      <Header>
        <Title>
          <Camera size={32} />
          Galeria de Fotos das Vistorias
        </Title>
        <ButtonPrimary onClick={loadFotos}>
          <RefreshCw size={20} />
          Atualizar Todas
        </ButtonPrimary>
      </Header>

      <VistoriasGrid>
        {vistoriasComFotos.map(({ vistoria, checklist, progresso }) => {
          const fotosComImagem = checklist.filter(item => item.foto_id && item.foto);
          
          return (
            <VistoriaCard key={vistoria.id}>
              <VistoriaHeader>
                <VistoriaTitle>
                  <Ship size={24} />
                  Vistoria #{vistoria.id} - {vistoria.Embarcacao?.nome || vistoria.embarcacao?.nome}
                </VistoriaTitle>
                <VistoriaInfo>
                  <InfoItem>
                    <User size={16} />
                    {vistoria.vistoriador?.nome || 'N/A'}
                  </InfoItem>
                  <InfoItem>
                    <Calendar size={16} />
                    Iniciada: {formatarData(vistoria.data_inicio || null)}
                  </InfoItem>
                  <InfoItem>
                    <Camera size={16} />
                    {fotosComImagem.length} foto(s)
                  </InfoItem>
                </VistoriaInfo>
              </VistoriaHeader>

              <VistoriaContent>
                {progresso && (
                  <ProgressContainer>
                    <ProgressBar>
                      <ProgressFill progress={progresso.percentual} />
                    </ProgressBar>
                    <ProgressText>
                      {progresso.concluidos} de {progresso.total} itens concluídos ({progresso.percentual}%)
                    </ProgressText>
                  </ProgressContainer>
                )}

                {fotosComImagem.length > 0 ? (
                  <ViewAllButton onClick={() => setVistoriaSelecionada({ vistoria, checklist, progresso })}>
                    <Eye size={18} />
                    Ver Todas as Fotos do Checklist ({fotosComImagem.length})
                  </ViewAllButton>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: '#94a3b8',
                    background: '#f8fafc',
                    borderRadius: '0.5rem'
                  }}>
                    <ImageIcon size={48} />
                    <p>Nenhuma foto enviada ainda</p>
                  </div>
                )}
              </VistoriaContent>
            </VistoriaCard>
          );
        })}
      </VistoriasGrid>

      {imagemAmpliada && (
        <Modal onClick={() => setImagemAmpliada(null)}>
          <CloseButton onClick={() => setImagemAmpliada(null)}>
            <X size={20} />
          </CloseButton>
          <PreloadedImage
            src={imagemAmpliada || ''}
            alt="Foto ampliada"
            style={{
              maxWidth: '90%',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '0.5rem'
            }}
            timeout={15000}
            showLoading={true}
          />
        </Modal>
      )}
    </Container>
  );
};

export default Fotos;

