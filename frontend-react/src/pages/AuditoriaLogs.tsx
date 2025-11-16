import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Lock,
  LogIn,
  Trash2,
  UserPlus,
  Edit,
  Key,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auditoriaService } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuditoriaLog {
  id: number;
  usuario_id: number | null;
  usuario_email: string;
  usuario_nome: string;
  acao: string;
  entidade: string;
  entidade_id: number | null;
  dados_anteriores: string | null;
  dados_novos: string | null;
  ip_address: string | null;
  user_agent: string | null;
  nivel_critico: boolean;
  detalhes: string | null;
  createdAt: string;
}

interface Estatisticas {
  acoesPorTipo: Array<{ acao: string; total: string }>;
  acoesCriticas: number;
  loginsFalhados: number;
  operacoesBloqueadas: number;
  totalAcoes: number;
  usuariosMaisAtivos: Array<{
    usuario_nome: string;
    usuario_email: string;
    total: string;
  }>;
}

const Container = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: #e74c3c;
  }
`;

const AdminBadge = styled.div`
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 2px 10px rgba(231, 76, 60, 0.3);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div<{ color?: string }>`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.color || '#3498db'};
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #7f8c8d;
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
`;

const FiltersContainer = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #34495e;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  ${props => {
    switch (props.variant) {
      case 'danger':
        return `
          background: #e74c3c;
          color: white;
          &:hover { background: #c0392b; }
        `;
      case 'secondary':
        return `
          background: #95a5a6;
          color: white;
          &:hover { background: #7f8c8d; }
        `;
      default:
        return `
          background: #3498db;
          color: white;
          &:hover { background: #2980b9; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LogsContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const LogItem = styled.div<{ critical?: boolean }>`
  padding: 1.5rem;
  border-left: 4px solid ${props => props.critical ? '#e74c3c' : '#3498db'};
  border-bottom: 1px solid #ecf0f1;
  transition: background 0.2s;

  &:hover {
    background: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const LogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
`;

const LogInfo = styled.div`
  flex: 1;
`;

const LogAction = styled.div<{ critical?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  background: ${props => props.critical ? '#fee' : '#e3f2fd'};
  color: ${props => props.critical ? '#e74c3c' : '#2196f3'};
  margin-bottom: 0.5rem;
`;

const LogUser = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #34495e;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const LogDetails = styled.div`
  color: #7f8c8d;
  font-size: 0.875rem;
  line-height: 1.6;
`;

const LogMeta = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #ecf0f1;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #7f8c8d;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyState = styled.div`
  padding: 4rem 2rem;
  text-align: center;
  color: #7f8c8d;

  svg {
    width: 64px;
    height: 64px;
    margin-bottom: 1rem;
    opacity: 0.3;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const PageButton = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  border: 2px solid ${props => props.active ? '#3498db' : '#e0e0e0'};
  background: ${props => props.active ? '#3498db' : 'white'};
  color: ${props => props.active ? 'white' : '#34495e'};
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: #3498db;
    background: ${props => props.active ? '#2980b9' : '#f8f9fa'};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  
  svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #e74c3c;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AccessDenied = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: #e74c3c;

  svg {
    width: 100px;
    height: 100px;
    margin-bottom: 2rem;
    opacity: 0.3;
  }

  h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  p {
    color: #7f8c8d;
    font-size: 1.125rem;
  }
`;

const getActionIcon = (acao: string) => {
  const icons: { [key: string]: React.ReactNode } = {
    'CREATE': <UserPlus size={16} />,
    'UPDATE': <Edit size={16} />,
    'DELETE': <Trash2 size={16} />,
    'DELETE_BLOCKED': <Lock size={16} />,
    'LOGIN_SUCCESS': <CheckCircle size={16} />,
    'LOGIN_FAILED': <XCircle size={16} />,
    'RESET_PASSWORD': <Key size={16} />,
    'TOGGLE_STATUS': <Eye size={16} />,
  };
  return icons[acao] || <Shield size={16} />;
};

const getActionLabel = (acao: string) => {
  const labels: { [key: string]: string } = {
    'CREATE': 'Criação',
    'UPDATE': 'Atualização',
    'DELETE': 'Exclusão',
    'DELETE_BLOCKED': 'Exclusão Bloqueada',
    'LOGIN_SUCCESS': 'Login Sucesso',
    'LOGIN_FAILED': 'Login Falhou',
    'RESET_PASSWORD': 'Reset de Senha',
    'TOGGLE_STATUS': 'Status Alterado',
  };
  return labels[acao] || acao;
};

const AuditoriaLogs: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    acao: '',
    entidade: '',
    nivelCritico: '',
    dataInicio: '',
    dataFim: ''
  });
  
  // Paginação
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Verificar se é o admin principal (ID=1)
  const isAdminPrincipal = usuario?.id === 1;

  useEffect(() => {
    if (!isAdminPrincipal) {
      return;
    }
    
    carregarDados();
  }, [page, isAdminPrincipal]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar logs
      const logsResponse = await auditoriaService.listar({
        page,
        limit: 20,
        ...filtros
      });
      
      setLogs(logsResponse.logs);
      setTotalPages(logsResponse.pagination.totalPages);
      setTotalLogs(logsResponse.pagination.total);
      
      // Carregar estatísticas apenas na primeira página
      if (page === 1) {
        const statsResponse = await auditoriaService.estatisticas();
        setEstatisticas(statsResponse);
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados de auditoria:', err);
      setError(err.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    setPage(1);
    carregarDados();
  };

  const limparFiltros = () => {
    setFiltros({
      acao: '',
      entidade: '',
      nivelCritico: '',
      dataInicio: '',
      dataFim: ''
    });
    setPage(1);
    setTimeout(() => carregarDados(), 0);
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificação de acesso
  if (!isAdminPrincipal) {
    return (
      <Container>
        <AccessDenied>
          <Lock />
          <h2>Acesso Restrito</h2>
          <p>Apenas o Administrador Principal tem acesso aos logs de auditoria.</p>
          <Button onClick={() => navigate('/')} style={{ marginTop: '2rem' }}>
            Voltar ao Início
          </Button>
        </AccessDenied>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <Shield size={32} />
          Auditoria do Sistema
        </Title>
        <AdminBadge>
          <Lock size={16} />
          Administrador Principal
        </AdminBadge>
      </Header>

      {error && (
        <ErrorMessage>
          <AlertTriangle size={20} />
          {error}
        </ErrorMessage>
      )}

      {/* Estatísticas */}
      {estatisticas && (
        <StatsGrid>
          <StatCard color="#3498db">
            <StatLabel>Total de Ações</StatLabel>
            <StatValue>{estatisticas.totalAcoes}</StatValue>
          </StatCard>
          <StatCard color="#e74c3c">
            <StatLabel>Ações Críticas</StatLabel>
            <StatValue>{estatisticas.acoesCriticas}</StatValue>
          </StatCard>
          <StatCard color="#e67e22">
            <StatLabel>Logins Falhados</StatLabel>
            <StatValue>{estatisticas.loginsFalhados}</StatValue>
          </StatCard>
          <StatCard color="#f39c12">
            <StatLabel>Operações Bloqueadas</StatLabel>
            <StatValue>{estatisticas.operacoesBloqueadas}</StatValue>
          </StatCard>
        </StatsGrid>
      )}

      {/* Filtros */}
      <FiltersContainer>
        <FiltersGrid>
          <FilterGroup>
            <Label>Ação</Label>
            <Select 
              value={filtros.acao} 
              onChange={(e) => setFiltros({...filtros, acao: e.target.value})}
            >
              <option value="">Todas</option>
              <option value="CREATE">Criação</option>
              <option value="UPDATE">Atualização</option>
              <option value="DELETE">Exclusão</option>
              <option value="DELETE_BLOCKED">Exclusão Bloqueada</option>
              <option value="LOGIN_SUCCESS">Login Sucesso</option>
              <option value="LOGIN_FAILED">Login Falhou</option>
              <option value="RESET_PASSWORD">Reset de Senha</option>
              <option value="TOGGLE_STATUS">Status Alterado</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <Label>Entidade</Label>
            <Select 
              value={filtros.entidade} 
              onChange={(e) => setFiltros({...filtros, entidade: e.target.value})}
            >
              <option value="">Todas</option>
              <option value="Usuario">Usuário</option>
              <option value="Vistoria">Vistoria</option>
              <option value="Embarcacao">Embarcação</option>
              <option value="Cliente">Cliente</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <Label>Criticidade</Label>
            <Select 
              value={filtros.nivelCritico} 
              onChange={(e) => setFiltros({...filtros, nivelCritico: e.target.value})}
            >
              <option value="">Todos</option>
              <option value="true">Críticos</option>
              <option value="false">Normais</option>
            </Select>
          </FilterGroup>

          <FilterGroup>
            <Label>Data Início</Label>
            <Input 
              type="date"
              value={filtros.dataInicio} 
              onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
            />
          </FilterGroup>

          <FilterGroup>
            <Label>Data Fim</Label>
            <Input 
              type="date"
              value={filtros.dataFim} 
              onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
            />
          </FilterGroup>
        </FiltersGrid>

        <ButtonGroup>
          <Button onClick={aplicarFiltros}>
            <Filter size={18} />
            Aplicar Filtros
          </Button>
          <Button variant="secondary" onClick={limparFiltros}>
            <XCircle size={18} />
            Limpar Filtros
          </Button>
          <Button variant="secondary" onClick={carregarDados}>
            <RefreshCw size={18} />
            Atualizar
          </Button>
        </ButtonGroup>
      </FiltersContainer>

      {/* Lista de Logs */}
      {loading ? (
        <LoadingSpinner>
          <RefreshCw size={40} />
        </LoadingSpinner>
      ) : logs.length === 0 ? (
        <LogsContainer>
          <EmptyState>
            <Shield />
            <h3>Nenhum log encontrado</h3>
            <p>Não há registros de auditoria com os filtros selecionados</p>
          </EmptyState>
        </LogsContainer>
      ) : (
        <>
          <LogsContainer>
            {logs.map((log) => (
              <LogItem key={log.id} critical={log.nivel_critico}>
                <LogHeader>
                  <LogInfo>
                    <LogAction critical={log.nivel_critico}>
                      {getActionIcon(log.acao)}
                      {getActionLabel(log.acao)} em {log.entidade}
                    </LogAction>
                    
                    <LogUser>
                      <User size={16} />
                      {log.usuario_nome} ({log.usuario_email})
                    </LogUser>
                    
                    {log.detalhes && (
                      <LogDetails>{log.detalhes}</LogDetails>
                    )}
                  </LogInfo>
                </LogHeader>

                <LogMeta>
                  <MetaItem>
                    <Calendar size={16} />
                    {formatarData(log.createdAt)}
                  </MetaItem>
                  
                  {log.ip_address && (
                    <MetaItem>
                      <Shield size={16} />
                      IP: {log.ip_address}
                    </MetaItem>
                  )}
                  
                  {log.entidade_id && (
                    <MetaItem>
                      ID: #{log.entidade_id}
                    </MetaItem>
                  )}
                </LogMeta>
              </LogItem>
            ))}
          </LogsContainer>

          {/* Paginação */}
          {totalPages > 1 && (
            <Pagination>
              <PageButton 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </PageButton>
              
              <span style={{ color: '#7f8c8d' }}>
                Página {page} de {totalPages} ({totalLogs} registros)
              </span>
              
              <PageButton 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </PageButton>
            </Pagination>
          )}
        </>
      )}
    </Container>
  );
};

export default AuditoriaLogs;

