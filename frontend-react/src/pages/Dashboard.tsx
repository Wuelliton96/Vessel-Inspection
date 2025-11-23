import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { 
  Ship, 
  MapPin, 
  ClipboardCheck, 
  Users, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle
} from 'lucide-react';
import { dashboardService } from '../services/api';
import { useAccessControl } from '../hooks/useAccessControl';
import { formatarValorMonetario } from '../utils/validators';
import VistoriadorDashboard from './VistoriadorDashboard';

const Container = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #6b7280;
  font-size: 1rem;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled.div<{ variant?: 'primary' | 'success' | 'warning' | 'danger' }>`
  background: ${props => {
    switch(props.variant) {
      case 'success': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      case 'warning': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'danger': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      default: return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    }
  }};
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
`;

const MetricIcon = styled.div`
  opacity: 0.9;
`;

const MetricValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  line-height: 1;
`;

const MetricLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
`;

const MetricComparison = styled.div<{ trend: 'up' | 'down' | 'neutral' }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  opacity: 0.95;
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  width: fit-content;
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ComparisonCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const ComparisonTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ComparisonRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ComparisonLabel = styled.div`
  font-weight: 500;
  color: #374151;
`;

const ComparisonValue = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ComparisonNumber = styled.span<{ variant?: 'success' | 'danger' | 'neutral' }>`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => {
    switch(props.variant) {
      case 'success': return '#10b981';
      case 'danger': return '#ef4444';
      default: return '#6b7280';
    }
  }};
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ProgressFill = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${props => Math.min(props.width, 100)}%;
  background: ${props => props.color};
  transition: width 0.3s ease;
`;

const RankingCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const RankingTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RankingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const RankingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const RankingPosition = styled.div<{ position: number }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  background: ${props => {
    if (props.position === 1) return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
    if (props.position === 2) return 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
    if (props.position === 3) return 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)';
    return '#e5e7eb';
  }};
  color: ${props => props.position <= 3 ? 'white' : '#6b7280'};
`;

const RankingInfo = styled.div`
  flex: 1;
`;

const RankingName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const RankingStats = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const RankingValue = styled.div`
  font-weight: 700;
  color: #10b981;
  font-size: 1.1rem;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatusCard = styled.div<{ color: string }>`
  background: white;
  border-left: 4px solid ${props => props.color};
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const StatusNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const StatusLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #6b7280;
  gap: 1rem;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Dashboard: React.FC = () => {
  const { isAdmin, isVistoriador } = useAccessControl();
  
  // Usar React Query para cache e gerenciamento de estado
  const { data: estatisticas, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getEstatisticas(),
    enabled: isAdmin, // Só executa se for admin
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000, // Mantém em cache por 10 minutos
    refetchOnWindowFocus: false, // Não recarrega ao focar janela
  });

  const error = queryError ? (queryError as any).response?.data?.error || (queryError as any).message : '';

  // Memoizar funções para evitar recriação a cada render
  // IMPORTANTE: Hooks devem ser chamados ANTES de qualquer early return
  const getTrendIcon = useCallback((percentual: number) => {
    if (percentual > 0) return <ArrowUp size={16} />;
    if (percentual < 0) return <ArrowDown size={16} />;
    return <Minus size={16} />;
  }, []);

  const getTrendColor = useCallback((percentual: number, inverso = false) => {
    if (inverso) {
      if (percentual > 0) return '#ef4444'; // Vermelho se aumentou despesa
      if (percentual < 0) return '#10b981'; // Verde se diminuiu despesa
    } else {
      if (percentual > 0) return '#10b981'; // Verde se aumentou
      if (percentual < 0) return '#ef4444'; // Vermelho se diminuiu
    }
    return '#6b7280'; // Neutro
  }, []);

  // Se for vistoriador, mostrar dashboard personalizado
  if (isVistoriador) {
    return <VistoriadorDashboard />;
  }

  // Dashboard para administrador
  if (loading) {
    return (
      <Container>
        <LoadingState>
          <ClipboardCheck size={48} />
          <p>Carregando estatísticas do dashboard...</p>
        </LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Header>
          <Title>Dashboard Administrativo</Title>
        </Header>
        <ErrorMessage>
          <AlertCircle size={20} />
          {error}
        </ErrorMessage>
      </Container>
    );
  }

  if (!estatisticas) {
    return (
      <Container>
        <Header>
          <Title>Dashboard Administrativo</Title>
        </Header>
        <p>Nenhum dado disponível</p>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Dashboard Administrativo</Title>
        <Subtitle>
          Visão geral do sistema - {estatisticas.mes_atual.nome_mes}
        </Subtitle>
      </Header>

      {/* Cards Principais - Métricas do Mês Atual */}
      <MetricsGrid>
        <MetricCard variant="primary">
          <MetricHeader>
            <MetricIcon>
              <ClipboardCheck size={32} />
            </MetricIcon>
          </MetricHeader>
          <MetricValue>{estatisticas.mes_atual.vistorias.total}</MetricValue>
          <MetricLabel>Vistorias este Mês</MetricLabel>
          <MetricComparison trend={estatisticas.comparacao.vistorias.variacao >= 0 ? 'up' : 'down'}>
            {getTrendIcon(estatisticas.comparacao.vistorias.variacao)}
            {Math.abs(estatisticas.comparacao.vistorias.percentual)}% vs mês anterior
          </MetricComparison>
        </MetricCard>

        <MetricCard variant="success">
          <MetricHeader>
            <MetricIcon>
              <DollarSign size={32} />
            </MetricIcon>
          </MetricHeader>
          <MetricValue>{formatarValorMonetario(estatisticas.mes_atual.financeiro.receita)}</MetricValue>
          <MetricLabel>Receita Total</MetricLabel>
          <MetricComparison trend={estatisticas.comparacao.receita.variacao >= 0 ? 'up' : 'down'}>
            {getTrendIcon(estatisticas.comparacao.receita.variacao)}
            {Math.abs(estatisticas.comparacao.receita.percentual)}% vs mês anterior
          </MetricComparison>
        </MetricCard>

        <MetricCard variant="warning">
          <MetricHeader>
            <MetricIcon>
              <Users size={32} />
            </MetricIcon>
          </MetricHeader>
          <MetricValue>{formatarValorMonetario(estatisticas.mes_atual.financeiro.despesa)}</MetricValue>
          <MetricLabel>Custo com Vistoriadores</MetricLabel>
          <MetricComparison trend={estatisticas.comparacao.lucro.variacao >= 0 ? 'up' : 'down'}>
            {estatisticas.mes_atual.vistorias.concluidas} vistorias concluídas
          </MetricComparison>
        </MetricCard>

        <MetricCard variant={estatisticas.mes_atual.financeiro.lucro >= 0 ? 'success' : 'danger'}>
          <MetricHeader>
            <MetricIcon>
              {estatisticas.mes_atual.financeiro.lucro >= 0 ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
            </MetricIcon>
          </MetricHeader>
          <MetricValue>{formatarValorMonetario(estatisticas.mes_atual.financeiro.lucro)}</MetricValue>
          <MetricLabel>Lucro Líquido</MetricLabel>
          <MetricComparison trend={estatisticas.comparacao.lucro.variacao >= 0 ? 'up' : 'down'}>
            {getTrendIcon(estatisticas.comparacao.lucro.variacao)}
            {Math.abs(estatisticas.comparacao.lucro.percentual)}% vs mês anterior
          </MetricComparison>
        </MetricCard>
      </MetricsGrid>

      {/* Comparação Detalhada: Mês Atual vs Anterior */}
      <ComparisonGrid>
        <ComparisonCard>
          <ComparisonTitle>
            <ClipboardCheck size={20} color="#3b82f6" />
            Comparativo de Vistorias
          </ComparisonTitle>
          
          <ComparisonRow>
            <ComparisonLabel>{estatisticas.mes_atual.nome_mes}</ComparisonLabel>
            <ComparisonValue>
              <ComparisonNumber variant="neutral">
                {estatisticas.mes_atual.vistorias.total}
              </ComparisonNumber>
              <span style={{ 
                color: getTrendColor(estatisticas.comparacao.vistorias.variacao),
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {getTrendIcon(estatisticas.comparacao.vistorias.variacao)}
                {estatisticas.comparacao.vistorias.percentual}%
              </span>
            </ComparisonValue>
          </ComparisonRow>

          <ComparisonRow>
            <ComparisonLabel>{estatisticas.mes_anterior.nome_mes}</ComparisonLabel>
            <ComparisonValue>
              <ComparisonNumber variant="neutral">
                {estatisticas.mes_anterior.vistorias.total}
              </ComparisonNumber>
            </ComparisonValue>
          </ComparisonRow>

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#dbeafe', borderRadius: '6px' }}>
            <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
              <strong>Concluídas:</strong> {estatisticas.mes_atual.vistorias.concluidas} | 
              <strong> Em andamento:</strong> {estatisticas.mes_atual.vistorias.em_andamento}
            </div>
          </div>
        </ComparisonCard>

        <ComparisonCard>
          <ComparisonTitle>
            <DollarSign size={20} color="#10b981" />
            Desempenho Financeiro
          </ComparisonTitle>
          
          <ComparisonRow>
            <ComparisonLabel>Receita ({estatisticas.mes_atual.nome_mes.split(' ')[0]})</ComparisonLabel>
            <ComparisonValue>
              <ComparisonNumber variant="success">
                {formatarValorMonetario(estatisticas.mes_atual.financeiro.receita)}
              </ComparisonNumber>
            </ComparisonValue>
          </ComparisonRow>

          <ComparisonRow>
            <ComparisonLabel>Despesas ({estatisticas.mes_atual.nome_mes.split(' ')[0]})</ComparisonLabel>
            <ComparisonValue>
              <ComparisonNumber variant="danger">
                {formatarValorMonetario(estatisticas.mes_atual.financeiro.despesa)}
              </ComparisonNumber>
            </ComparisonValue>
          </ComparisonRow>

          <ComparisonRow style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
            <ComparisonLabel><strong>Lucro Líquido</strong></ComparisonLabel>
            <ComparisonValue>
              <ComparisonNumber variant={estatisticas.mes_atual.financeiro.lucro >= 0 ? 'success' : 'danger'}>
                {formatarValorMonetario(estatisticas.mes_atual.financeiro.lucro)}
              </ComparisonNumber>
              <span style={{ 
                color: getTrendColor(estatisticas.comparacao.lucro.variacao),
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {getTrendIcon(estatisticas.comparacao.lucro.variacao)}
                {estatisticas.comparacao.lucro.percentual}%
              </span>
            </ComparisonValue>
          </ComparisonRow>
        </ComparisonCard>
      </ComparisonGrid>

      {/* Status das Vistorias */}
      <StatusGrid>
        {estatisticas.vistorias_por_status.map((status: any, index: number) => {
          const cores = [
            '#f59e0b', // Amarelo
            '#3b82f6', // Azul
            '#10b981', // Verde
            '#ef4444', // Vermelho
          ];
          return (
            <StatusCard key={index} color={cores[index % cores.length]}>
              <StatusNumber>{status.quantidade}</StatusNumber>
              <StatusLabel>{status.status}</StatusLabel>
            </StatusCard>
          );
        })}
      </StatusGrid>

      {/* Ranking de Vistoriadores */}
      {estatisticas.ranking_vistoriadores.length > 0 && (
        <RankingCard>
          <RankingTitle>
            <Users size={20} color="#3b82f6" />
            Top Vistoriadores do Mês
          </RankingTitle>
          <RankingList>
            {estatisticas.ranking_vistoriadores.map((v: any, index: number) => (
              <RankingItem key={v.id}>
                <RankingPosition position={index + 1}>
                  {index + 1}
                </RankingPosition>
                <RankingInfo>
                  <RankingName>{v.nome}</RankingName>
                  <RankingStats>
                    {v.total_vistorias} vistoria(s) concluída(s)
                  </RankingStats>
                </RankingInfo>
                <RankingValue>
                  {formatarValorMonetario(v.total_ganho)}
                </RankingValue>
              </RankingItem>
            ))}
          </RankingList>
        </RankingCard>
      )}

      {/* Totais Gerais do Sistema */}
      <ComparisonCard style={{ marginTop: '1.5rem' }}>
        <ComparisonTitle>
          <Ship size={20} color="#6b7280" />
          Resumo Geral do Sistema
        </ComparisonTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>
              {estatisticas.totais_gerais.total_vistorias}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Total de Vistorias
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
              {estatisticas.totais_gerais.total_embarcacoes}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Embarcações Cadastradas
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
              {estatisticas.totais_gerais.total_vistoriadores}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Vistoriadores Ativos
            </div>
          </div>
        </div>
      </ComparisonCard>
    </Container>
  );
};

export default Dashboard;
