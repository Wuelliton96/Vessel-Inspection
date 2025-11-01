import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Ship, MapPin, ClipboardCheck, FileText, Calendar } from 'lucide-react';
import { embarcacaoService, localService, vistoriaService } from '../services/api';
import { useAccessControl } from '../hooks/useAccessControl';
import VistoriadorDashboard from './VistoriadorDashboard';

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

const RecentSection = styled.div`
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

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ListItem = styled.div`
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

const ListItemText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ListItemTitle = styled.div`
  font-weight: 500;
  color: #1f2937;
  font-size: 0.9rem;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const ListItemSubtitle = styled.div`
  font-size: 0.8rem;
  color: #6b7280;
  
  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const ListItemDate = styled.div`
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

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
`;

interface DashboardStats {
  embarcacoes: number;
  locais: number;
  vistorias: number;
  laudos: number;
}

const Dashboard: React.FC = () => {
  const { isAdmin, isVistoriador } = useAccessControl();
  const [stats, setStats] = useState<DashboardStats>({
    embarcacoes: 0,
    locais: 0,
    vistorias: 0,
    laudos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentVistorias, setRecentVistorias] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setError(null);
        if (isAdmin) {
          const [embarcacoes, locais, vistorias] = await Promise.all([
            embarcacaoService.getAll(),
            localService.getAll(),
            vistoriaService.getAll(),
          ]);

          setStats({
            embarcacoes: embarcacoes.length,
            locais: locais.length,
            vistorias: vistorias.length,
            laudos: vistorias.filter(v => v.data_conclusao).length, // Vistorias concluídas têm laudos
          });

          // Pegar as 5 vistorias mais recentes
          const sortedVistorias = vistorias
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
          
          setRecentVistorias(sortedVistorias);
        }
      } catch (error: any) {
        console.error('Erro ao carregar dados do dashboard:', error);
        setError('Erro ao carregar dados do dashboard: ' + (error.response?.data?.error || error.message));
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [isAdmin]);

  // Se for vistoriador, mostrar dashboard personalizado
  if (isVistoriador) {
    return <VistoriadorDashboard />;
  }

  // Dashboard para administrador
  if (loading) {
    return (
      <DashboardContainer>
        <LoadingMessage>Carregando dados do dashboard...</LoadingMessage>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>Dashboard Administrativo</Title>
        <UserInfo>
          <Calendar size={16} />
          Administrador - Acesso Completo
        </UserInfo>
      </Header>

      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      <StatsGrid>
        <StatCard>
          <StatIcon color="#3b82f6">
            <Ship size={20} />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.embarcacoes}</StatNumber>
            <StatLabel>Embarcações</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon color="#10b981">
            <MapPin size={20} />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.locais}</StatNumber>
            <StatLabel>Locais</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon color="#f59e0b">
            <ClipboardCheck size={20} />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.vistorias}</StatNumber>
            <StatLabel>Vistorias</StatLabel>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon color="#8b5cf6">
            <FileText size={20} />
          </StatIcon>
          <StatContent>
            <StatNumber>{stats.laudos}</StatNumber>
            <StatLabel>Laudos</StatLabel>
          </StatContent>
        </StatCard>
      </StatsGrid>

      <RecentSection>
        <SectionTitle>Vistorias Recentes</SectionTitle>
        <List>
          {recentVistorias.length > 0 ? (
            recentVistorias.map((vistoria) => (
              <ListItem key={vistoria.id}>
                <ListItemText>
                  <ListItemTitle>
                    {vistoria.embarcacao?.nome || 'Vistoria sem embarcação'}
                  </ListItemTitle>
                  <ListItemSubtitle>
                    {vistoria.local?.nome_local || 'Local não informado'}
                  </ListItemSubtitle>
                </ListItemText>
                <ListItemDate>
                  {new Date(vistoria.createdAt).toLocaleDateString('pt-BR')}
                </ListItemDate>
              </ListItem>
            ))
          ) : (
            <EmptyMessage>
              Nenhuma vistoria encontrada
            </EmptyMessage>
          )}
        </List>
      </RecentSection>
    </DashboardContainer>
  );
};

export default Dashboard;