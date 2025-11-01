import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ClipboardCheck, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { vistoriaService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Vistoria } from '../types';

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

const VistoriadorDashboard: React.FC = () => {
  const { usuario } = useAuth();
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVistorias = async () => {
      try {
        const response = await vistoriaService.getAll();
        // Filtrar apenas vistorias do usuário logado
        const userVistorias = response.filter((v: Vistoria) => v.vistoriador_id === usuario?.id);
        setVistorias(userVistorias);
      } catch (error) {
        console.error('Erro ao carregar vistorias:', error);
      } finally {
        setLoading(false);
      }
    };

    if (usuario?.id) {
      loadVistorias();
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
    pendentes: vistorias.filter(v => v.statusVistoria?.nome === 'PENDENTE').length,
    aprovadas: vistorias.filter(v => v.statusVistoria?.nome === 'APROVADA').length,
    reprovadas: vistorias.filter(v => v.statusVistoria?.nome === 'REPROVADA').length,
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
                    <VistoriaStatus status={vistoria.statusVistoria?.nome || 'DESCONHECIDO'}>
                      {getStatusIcon(vistoria.statusVistoria?.nome || '')}
                      {vistoria.statusVistoria?.nome || 'DESCONHECIDO'}
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
