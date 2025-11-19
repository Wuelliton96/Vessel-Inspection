import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ClipboardCheck, Clock, CheckCircle, AlertCircle, Calendar, Bell, X, DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { vistoriaService, pagamentoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Vistoria } from '../types';
import { useNavigate } from 'react-router-dom';
import { formatarValorMonetario } from '../utils/validators';

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  
  @media (max-width: 768px) {
    padding: 0.5rem;
    gap: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.9rem;
  
  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
  
  @media (max-width: 768px) {
    padding: 1rem;
    gap: 0.75rem;
  }
`;

const StatIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatNumber = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  line-height: 1;
  
  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const VistoriasSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const VistoriaList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const VistoriaItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const VistoriaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const VistoriaTitle = styled.div`
  font-weight: 500;
  color: #1f2937;
  font-size: 0.9rem;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const VistoriaSubtitle = styled.div`
  font-size: 0.8rem;
  color: #6b7280;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const VistoriaStatus = styled.div<{ status: string }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'PENDENTE':
        return 'background: #fef3c7; color: #92400e;';
      case 'APROVADA':
        return 'background: #d1fae5; color: #065f46;';
      case 'REPROVADA':
        return 'background: #fee2e2; color: #991b1b;';
      default:
        return 'background: #f3f4f6; color: #374151;';
    }
  }}
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const VistoriaDate = styled.div`
  font-size: 0.8rem;
  color: #6b7280;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #6b7280;
  padding: 2rem;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #6b7280;
  padding: 2rem;
  font-style: italic;
`;

const AlertBanner = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
  animation: slideDown 0.3s ease-out;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 1rem;
  }
`;

const AlertContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const AlertIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  
  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const AlertText = styled.div`
  flex: 1;
`;

const AlertTitle = styled.div`
  font-weight: 700;
  font-size: 1.1rem;
  color: #92400e;
  margin-bottom: 0.25rem;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const AlertMessage = styled.div`
  font-size: 0.95rem;
  color: #78350f;
  line-height: 1.5;
  
  @media (max-width: 768px) {
    font-size: 0.875rem;
  }
`;

const AlertButton = styled.button`
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
  white-space: nowrap;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(245, 158, 11, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    width: 100%;
    padding: 0.875rem;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #92400e;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(146, 64, 14, 0.1);
  }
`;

const VistoriadorDashboard: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewVistoriaAlert, setShowNewVistoriaAlert] = useState(false);
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const [resumoFinanceiro, setResumoFinanceiro] = useState<{
    recebido: { total: number; quantidade: number; mes: { total: number; quantidade: number } };
    pendente: { total: number; quantidade: number; mes: { total: number; quantidade: number } };
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Carregar vistorias
        const response = await vistoriaService.getByVistoriador();
        setVistorias(response);
        
        // Verificar se há vistorias pendentes e se é o primeiro acesso após login
        const pendentes = response.filter((v: Vistoria) => 
          v.StatusVistoria?.nome === 'PENDENTE' || v.statusVistoria?.nome === 'PENDENTE'
        );
        
        // Verificar se há flag de login recente no sessionStorage
        const justLoggedIn = sessionStorage.getItem('justLoggedIn') === 'true';
        const alertDismissed = sessionStorage.getItem('newVistoriaAlertDismissed') === 'true';
        
        if (pendentes.length > 0 && justLoggedIn && !alertDismissed) {
          setShowNewVistoriaAlert(true);
          // Remover a flag após mostrar o alerta
          sessionStorage.removeItem('justLoggedIn');
        }
        
        // Carregar resumo financeiro
        try {
          const financeiro = await pagamentoService.getResumoFinanceiro();
          setResumoFinanceiro(financeiro);
        } catch (error) {
          console.error('Erro ao carregar resumo financeiro:', error);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (usuario?.id) {
      loadData();
    }
  }, [usuario?.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <Clock size={12} />;
      case 'APROVADA':
        return <CheckCircle size={12} />;
      case 'REPROVADA':
        return <AlertCircle size={12} />;
      default:
        return <ClipboardCheck size={12} />;
    }
  };

  const stats = {
    total: vistorias.length,
    pendentes: vistorias.filter(v => 
      v.StatusVistoria?.nome === 'PENDENTE' || v.statusVistoria?.nome === 'PENDENTE'
    ).length,
    aprovadas: vistorias.filter(v => 
      v.StatusVistoria?.nome === 'APROVADA' || v.statusVistoria?.nome === 'APROVADA'
    ).length,
    reprovadas: vistorias.filter(v => 
      v.StatusVistoria?.nome === 'REPROVADA' || v.statusVistoria?.nome === 'REPROVADA'
    ).length,
  };

  const handleDismissAlert = () => {
    setShowNewVistoriaAlert(false);
    setDismissedAlert(true);
    sessionStorage.setItem('newVistoriaAlertDismissed', 'true');
  };

  const handleViewVistorias = () => {
    handleDismissAlert();
    navigate('/vistorias');
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingMessage>Carregando suas vistorias...</LoadingMessage>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Minhas Vistorias</Title>
        <UserInfo>
          <Calendar size={16} />
          {usuario?.nome} - Vistoriador
        </UserInfo>
      </Header>

      {showNewVistoriaAlert && stats.pendentes > 0 && !dismissedAlert && (
        <AlertBanner>
          <AlertContent>
            <AlertIcon>
              <Bell size={24} />
            </AlertIcon>
            <AlertText>
              <AlertTitle>Você tem {stats.pendentes} nova{stats.pendentes > 1 ? 's' : ''} vistoria{stats.pendentes > 1 ? 's' : ''} pendente{stats.pendentes > 1 ? 's' : ''}!</AlertTitle>
              <AlertMessage>
                {stats.pendentes === 1 
                  ? 'Uma nova vistoria foi atribuída a você. Acesse a lista de vistorias para visualizar e iniciar.'
                  : `${stats.pendentes} novas vistorias foram atribuídas a você. Acesse a lista de vistorias para visualizar e iniciar.`
                }
              </AlertMessage>
            </AlertText>
          </AlertContent>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <AlertButton onClick={handleViewVistorias}>
              Ver Vistorias
            </AlertButton>
            <CloseButton onClick={handleDismissAlert} title="Fechar">
              <X size={20} />
            </CloseButton>
          </div>
        </AlertBanner>
      )}

      <StatsGrid>
        <StatCard>
          <StatIcon color="#3b82f6">
            <ClipboardCheck size={20} />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.total}</StatNumber>
            <StatLabel>Total</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon color="#f59e0b">
            <Clock size={20} />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.pendentes}</StatNumber>
            <StatLabel>Pendentes</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon color="#10b981">
            <CheckCircle size={20} />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.aprovadas}</StatNumber>
            <StatLabel>Aprovadas</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon color="#ef4444">
            <AlertCircle size={20} />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.reprovadas}</StatNumber>
            <StatLabel>Reprovadas</StatLabel>
          </StatContent>
        </StatCard>
      </StatsGrid>

      {resumoFinanceiro && (
        <VistoriasSection>
          <SectionTitle>
            <DollarSign size={20} color="#10b981" style={{ marginRight: '0.5rem' }} />
            Resumo Financeiro
          </SectionTitle>
          <StatsGrid>
            <StatCard>
              <StatIcon color="#10b981">
                <Wallet size={20} />
              </StatIcon>
              <StatContent>
                <StatNumber>{formatarValorMonetario(resumoFinanceiro.recebido.total)}</StatNumber>
                <StatLabel>Total Recebido</StatLabel>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {resumoFinanceiro.recebido.quantidade} vistoria{resumoFinanceiro.recebido.quantidade !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.5rem', fontWeight: 600 }}>
                  Este mês: {formatarValorMonetario(resumoFinanceiro.recebido.mes.total)} ({resumoFinanceiro.recebido.mes.quantidade} vistoria{resumoFinanceiro.recebido.mes.quantidade !== 1 ? 's' : ''})
                </div>
              </StatContent>
            </StatCard>

            <StatCard>
              <StatIcon color="#f59e0b">
                <TrendingUp size={20} />
              </StatIcon>
              <StatContent>
                <StatNumber>{formatarValorMonetario(resumoFinanceiro.pendente.total)}</StatNumber>
                <StatLabel>Pendente de Receber</StatLabel>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  {resumoFinanceiro.pendente.quantidade} vistoria{resumoFinanceiro.pendente.quantidade !== 1 ? 's' : ''} concluída{resumoFinanceiro.pendente.quantidade !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#d97706', marginTop: '0.5rem', fontWeight: 600 }}>
                  Este mês: {formatarValorMonetario(resumoFinanceiro.pendente.mes.total)} ({resumoFinanceiro.pendente.mes.quantidade} vistoria{resumoFinanceiro.pendente.mes.quantidade !== 1 ? 's' : ''})
                </div>
              </StatContent>
            </StatCard>
          </StatsGrid>
        </VistoriasSection>
      )}

      <VistoriasSection>
        <SectionTitle>Vistorias Recentes</SectionTitle>
        <VistoriaList>
          {vistorias.length > 0 ? (
            vistorias
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 10)
              .map((vistoria) => (
                <VistoriaItem key={vistoria.id}>
                  <VistoriaInfo>
                    <VistoriaTitle>
                      {vistoria.embarcacao?.nome || 'Embarcação não informada'}
                    </VistoriaTitle>
                    <VistoriaSubtitle>
                      {vistoria.local?.nome_local || 'Local não informado'}
                    </VistoriaSubtitle>
                  </VistoriaInfo>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <VistoriaStatus status={vistoria.StatusVistoria?.nome || vistoria.statusVistoria?.nome || 'DESCONHECIDO'}>
                      {getStatusIcon(vistoria.StatusVistoria?.nome || vistoria.statusVistoria?.nome || '')}
                      {vistoria.StatusVistoria?.nome || vistoria.statusVistoria?.nome || 'DESCONHECIDO'}
                    </VistoriaStatus>
                    <VistoriaDate>
                      {new Date(vistoria.createdAt).toLocaleDateString('pt-BR')}
                    </VistoriaDate>
                  </div>
                </VistoriaItem>
              ))
          ) : (
            <EmptyMessage>
              Nenhuma vistoria encontrada
            </EmptyMessage>
          )}
        </VistoriaList>
      </VistoriasSection>
    </DashboardContainer>
  );
};

export default VistoriadorDashboard;
