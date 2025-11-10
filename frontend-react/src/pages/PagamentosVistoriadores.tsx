import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  DollarSign,
  Calendar,
  User,
  Check,
  X,
  Clock,
  Search,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye
} from 'lucide-react';
import { LotePagamento, Usuario, VistoriaLotePagamento } from '../types';
import { pagamentoService, usuarioService } from '../services/api';
import { formatarValorMonetario } from '../utils/validators';
import { useAccessControl } from '../hooks/useAccessControl';

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
  color: #1f2937;
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const FiltersCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResumoCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ResumoCard = styled.div<{ variant?: 'pendente' | 'pago' }>`
  background: ${props => props.variant === 'pago' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'};
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const ResumoLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
`;

const ResumoValor = styled.div`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const ResumoQtd = styled.div`
  font-size: 0.85rem;
  opacity: 0.8;
`;

const LotesGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const LoteCard = styled.div<{ status: string }>`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => 
    props.status === 'PAGO' ? '#10b981' : 
    props.status === 'CANCELADO' ? '#ef4444' : 
    '#f59e0b'};
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
`;

const LoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const LoteInfo = styled.div`
  flex: 1;
`;

const LoteVistoriador = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const LoteDetalhes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  color: #6b7280;
  font-size: 0.9rem;
`;

const LoteDetalhe = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${props => 
    props.status === 'PAGO' ? '#d1fae5' : 
    props.status === 'CANCELADO' ? '#fee2e2' : 
    '#fef3c7'};
  color: ${props => 
    props.status === 'PAGO' ? '#065f46' : 
    props.status === 'CANCELADO' ? '#991b1b' : 
    '#92400e'};
`;

const LoteActions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'success' | 'danger' | 'secondary' }>`
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  border: none;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.2s ease;
  
  background: ${props => {
    switch(props.variant) {
      case 'success': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      case 'danger': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'secondary': return '#6b7280';
      default: return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    }
  }};
  color: white;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #3b82f6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const AlertMessage = styled.div<{ variant: 'error' | 'success' | 'info' }>`
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: ${props => 
    props.variant === 'error' ? '#fee2e2' : 
    props.variant === 'success' ? '#d1fae5' : 
    '#dbeafe'};
  color: ${props => 
    props.variant === 'error' ? '#991b1b' : 
    props.variant === 'success' ? '#065f46' : 
    '#1e40af'};
  border: 1px solid ${props => 
    props.variant === 'error' ? '#fecaca' : 
    props.variant === 'success' ? '#a7f3d0' : 
    '#bfdbfe'};
`;

const Modal = styled.div<{ show: boolean }>`
  display: ${props => props.show ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #1f2937;
  }
`;

const VistoriaItem = styled.div`
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  background: #f9fafb;
`;

const VistoriaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 0.5rem;
`;

const VistoriaInfo = styled.div`
  flex: 1;
`;

const VistoriaTitulo = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const VistoriaDetalhe = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const VistoriaValor = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #10b981;
`;

const PagamentosVistoriadores: React.FC = () => {
  const { isAdmin } = useAccessControl();
  const [lotes, setLotes] = useState<LotePagamento[]>([]);
  const [vistoriadores, setVistoriadores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroPeriodoTipo, setFiltroPeriodoTipo] = useState('MENSAL');
  const [filtroVistoriador, setFiltroVistoriador] = useState('');
  
  // Filtro de período - padrão mês atual
  const getMesAtual = () => {
    const now = new Date();
    const ano = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  };
  
  const [mesAnoSelecionado, setMesAnoSelecionado] = useState(getMesAtual());
  
  // Calcular data_inicio e data_fim baseado no mês selecionado
  const getPeriodoDoMes = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-');
    const dataInicio = `${ano}-${mes}-01`;
    const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
    const dataFim = `${ano}-${mes}-${ultimoDia}`;
    return { dataInicio, dataFim };
  };
  
  // Modal de detalhes
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [loteDetalhes, setLoteDetalhes] = useState<any>(null);
  const [vistoriasLote, setVistoriasLote] = useState<VistoriaLotePagamento[]>([]);
  
  // Modal de pagamento
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [lotePagando, setLotePagando] = useState<LotePagamento | null>(null);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  
  // Modal de cancelamento
  const [showCancelarModal, setShowCancelarModal] = useState(false);
  const [loteCancelando, setLoteCancelando] = useState<LotePagamento | null>(null);
  
  // Modal de gerar lote
  const [showGerarLoteModal, setShowGerarLoteModal] = useState(false);
  const [vistoriadoresDisponiveis, setVistoriadoresDisponiveis] = useState<any[]>([]);
  const [vistoriadorSelecionado, setVistoriadorSelecionado] = useState('');
  const [gerandoLote, setGerandoLote] = useState(false);
  
  // Resumo
  const [resumo, setResumo] = useState({
    pendente: { quantidade: 0, valor_total: 0 },
    pago: { quantidade: 0, valor_total: 0 }
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {};
      if (filtroStatus !== 'TODOS') params.status = filtroStatus;
      if (filtroPeriodoTipo !== 'TODOS') params.periodo_tipo = filtroPeriodoTipo;
      if (filtroVistoriador) params.vistoriador_id = filtroVistoriador;
      
      // Adicionar filtro de período baseado no mês selecionado
      if (filtroPeriodoTipo === 'MENSAL' && mesAnoSelecionado) {
        const { dataInicio, dataFim } = getPeriodoDoMes(mesAnoSelecionado);
        params.data_inicio = dataInicio;
        params.data_fim = dataFim;
      }

      const [lotesData, resumoData] = await Promise.all([
        pagamentoService.getAll(params),
        pagamentoService.getResumoGeral({
          periodo_inicio: filtroPeriodoTipo === 'MENSAL' && mesAnoSelecionado ? getPeriodoDoMes(mesAnoSelecionado).dataInicio : undefined,
          periodo_fim: filtroPeriodoTipo === 'MENSAL' && mesAnoSelecionado ? getPeriodoDoMes(mesAnoSelecionado).dataFim : undefined
        })
      ]);

      setLotes(lotesData);
      setResumo(resumoData);
    } catch (err: any) {
      console.error('=== ERRO AO CARREGAR PAGAMENTOS ===');
      console.error('Erro completo:', err);
      console.error('Response:', err.response);
      console.error('Status:', err.response?.status);
      console.error('Data:', err.response?.data);
      console.error('Message:', err.message);
      
      // Se o erro for 404 ou tabela não existe, não mostrar como erro crítico
      const errorMessage = err.response?.data?.error || err.message || '';
      const statusCode = err.response?.status;
      
      // Erros que não devem ser mostrados como críticos
      const errosNaoCriticos = [
        'não existe',
        'does not exist',
        'relation',
        'lotes_pagamento',
        'vistorias_lote_pagamento'
      ];
      
      const isErroBanco = errosNaoCriticos.some(msg => errorMessage.toLowerCase().includes(msg.toLowerCase()));
      
      if (isErroBanco || statusCode === 404 || statusCode === 500) {
        console.log('Erro de banco detectado - tratando silenciosamente');
        setLotes([]);
        setResumo({
          pendente: { quantidade: 0, valor_total: 0 },
          pago: { quantidade: 0, valor_total: 0 }
        });
        setError(''); // Limpar erro para não mostrar mensagem vermelha
      } else {
        setError('Erro ao carregar dados: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [filtroStatus, filtroPeriodoTipo, filtroVistoriador, mesAnoSelecionado]);

  const loadVistoriadores = useCallback(async () => {
    try {
      const data = await usuarioService.getAll();
      const vistoriadoresAtivos = data.filter(u => u.nivelAcesso?.id === 2 || u.nivelAcessoId === 2);
      setVistoriadores(vistoriadoresAtivos);
    } catch (err: any) {
      console.error('Erro ao carregar vistoriadores:', err);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadData();
      loadVistoriadores();
    }
  }, [isAdmin, loadData, loadVistoriadores]);

  const handleVerDetalhes = async (lote: LotePagamento) => {
    try {
      const detalhes = await pagamentoService.getById(lote.id);
      setLoteDetalhes(detalhes);
      setVistoriasLote(detalhes.vistorias || []);
      setShowDetalhesModal(true);
    } catch (err: any) {
      setError('Erro ao carregar detalhes: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAbrirPagamento = (lote: LotePagamento) => {
    setLotePagando(lote);
    setFormaPagamento('PIX');
    setObservacoes('');
    setShowPagamentoModal(true);
  };

  const handleMarcarPago = async () => {
    if (!lotePagando) return;

    try {
      await pagamentoService.marcarPago(lotePagando.id, {
        forma_pagamento: formaPagamento,
        observacoes: observacoes || undefined
      });

      setSuccess('Pagamento registrado com sucesso!');
      setShowPagamentoModal(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao registrar pagamento: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCancelarClick = (lote: LotePagamento) => {
    setLoteCancelando(lote);
    setShowCancelarModal(true);
  };

  const handleConfirmCancelar = async () => {
    if (!loteCancelando) return;

    try {
      await pagamentoService.cancelar(loteCancelando.id);
      setSuccess('Lote cancelado com sucesso!');
      setShowCancelarModal(false);
      setLoteCancelando(null);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao cancelar lote: ' + (err.response?.data?.error || err.message));
      setShowCancelarModal(false);
      setLoteCancelando(null);
    }
  };

  const handleAbrirGerarLote = async () => {
    try {
      setGerandoLote(true);
      const { dataInicio, dataFim } = getPeriodoDoMes(mesAnoSelecionado);
      
      // Buscar vistoriadores com vistorias disponíveis no período
      const vistoriadoresComDados = [];
      for (const v of vistoriadores) {
        try {
          const resultado = await pagamentoService.getVistoriasDisponiveis(v.id, {
            data_inicio: dataInicio,
            data_fim: dataFim
          });
          
          if (resultado.quantidade > 0) {
            vistoriadoresComDados.push({
              ...v,
              quantidadeVistorias: resultado.quantidade,
              valorTotal: resultado.valor_total
            });
          }
        } catch (err) {
          console.log(`Sem vistorias para ${v.nome}`);
        }
      }
      
      setVistoriadoresDisponiveis(vistoriadoresComDados);
      setShowGerarLoteModal(true);
    } catch (err: any) {
      setError('Erro ao buscar dados: ' + (err.response?.data?.error || err.message));
    } finally {
      setGerandoLote(false);
    }
  };

  const handleGerarLote = async () => {
    if (!vistoriadorSelecionado) {
      setError('Selecione um vistoriador');
      return;
    }

    try {
      setGerandoLote(true);
      const { dataInicio, dataFim } = getPeriodoDoMes(mesAnoSelecionado);
      
      await pagamentoService.gerarLote({
        vistoriador_id: parseInt(vistoriadorSelecionado),
        periodo_tipo: 'MENSAL',
        data_inicio: dataInicio,
        data_fim: dataFim
      });

      setSuccess('Lote de pagamento gerado com sucesso!');
      setShowGerarLoteModal(false);
      setVistoriadorSelecionado('');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Erro ao gerar lote: ' + (err.response?.data?.error || err.message));
    } finally {
      setGerandoLote(false);
    }
  };

  const formatarData = (data: string | null | undefined) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const getPeriodoLabel = (tipo: string) => {
    switch (tipo) {
      case 'DIARIO': return 'Diário';
      case 'SEMANAL': return 'Semanal';
      case 'MENSAL': return 'Mensal';
      default: return tipo;
    }
  };

  // Gerar lista de meses (atual + 11 meses anteriores)
  const getMesesDisponiveis = () => {
    const meses = [];
    const hoje = new Date();
    
    for (let i = 0; i < 12; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const valor = `${ano}-${mes}`;
      const label = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      meses.push({ valor, label });
    }
    
    return meses;
  };

  if (!isAdmin) {
    return (
      <Container>
        <AlertMessage variant="error">
          <AlertCircle size={20} />
          Você não tem permissão para acessar esta página.
        </AlertMessage>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <DollarSign size={48} />
          <p>Carregando pagamentos do mês atual...</p>
        </LoadingState>
      </Container>
    );
  }

  // Verificar se as tabelas existem (se erro específico de tabela)
  const tabelasNaoExistem = error && (
    error.includes('não existe') || 
    error.includes('does not exist') ||
    error.includes('relation') ||
    error.includes('lotes_pagamento')
  );

  if (tabelasNaoExistem) {
    return (
      <Container>
        <Header>
          <Title>
            <DollarSign size={32} />
            Pagamentos de Vistoriadores
          </Title>
        </Header>

        <AlertMessage variant="info">
          <AlertCircle size={20} />
          <div>
            <strong>Sistema de Pagamentos não configurado</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
              As tabelas de pagamento ainda não foram criadas no banco de dados.
              Execute o arquivo <code style={{ background: '#dbeafe', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                migrations/EXECUTAR_TODAS_MIGRATIONS.sql
              </code> e reinicie o backend.
            </p>
          </div>
        </AlertMessage>

        <EmptyState>
          <DollarSign size={64} color="#d1d5db" />
          <h3>Aguardando configuração inicial</h3>
          <p>Execute as migrations SQL para habilitar o sistema de pagamentos.</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <DollarSign size={32} />
          Pagamentos de Vistoriadores
        </Title>
        <Button onClick={handleAbrirGerarLote} disabled={gerandoLote}>
          <DollarSign size={18} />
          {gerandoLote ? 'Buscando...' : 'Gerar Lote de Pagamento'}
        </Button>
      </Header>

      {error && (
        <AlertMessage variant="error">
          <AlertCircle size={20} />
          {error}
        </AlertMessage>
      )}

      {success && (
        <AlertMessage variant="success">
          <CheckCircle size={20} />
          {success}
        </AlertMessage>
      )}
      
      {!error && lotes.length === 0 && !loading && (
        <AlertMessage variant="info">
          <AlertCircle size={20} />
          Mostrando resultados para: <strong>{new Date(mesAnoSelecionado + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
        </AlertMessage>
      )}

      {/* Resumo */}
      <ResumoCards>
        <ResumoCard variant="pendente">
          <ResumoLabel>Pagamentos Pendentes</ResumoLabel>
          <ResumoValor>{formatarValorMonetario(resumo.pendente.valor_total)}</ResumoValor>
          <ResumoQtd>{resumo.pendente.quantidade} lote(s)</ResumoQtd>
        </ResumoCard>

        <ResumoCard variant="pago">
          <ResumoLabel>Total Pago</ResumoLabel>
          <ResumoValor>{formatarValorMonetario(resumo.pago.valor_total)}</ResumoValor>
          <ResumoQtd>{resumo.pago.quantidade} lote(s)</ResumoQtd>
        </ResumoCard>
      </ResumoCards>

      {/* Filtros */}
      <FiltersCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Search size={20} color="#3b82f6" />
          <strong>Filtros</strong>
        </div>
        <FiltersGrid>
          <FormGroup>
            <Label htmlFor="filtro_vistoriador">Vistoriador</Label>
            <Select
              id="filtro_vistoriador"
              value={filtroVistoriador}
              onChange={(e) => setFiltroVistoriador(e.target.value)}
            >
              <option value="">Todos</option>
              {vistoriadores.map(v => (
                <option key={v.id} value={v.id}>{v.nome}</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="filtro_periodo">Tipo de Período</Label>
            <Select
              id="filtro_periodo"
              value={filtroPeriodoTipo}
              onChange={(e) => setFiltroPeriodoTipo(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="DIARIO">Diário</option>
              <option value="SEMANAL">Semanal</option>
              <option value="MENSAL">Mensal</option>
            </Select>
          </FormGroup>

          {filtroPeriodoTipo === 'MENSAL' && (
            <FormGroup>
              <Label htmlFor="mes_ano">Mês/Ano</Label>
              <Select
                id="mes_ano"
                value={mesAnoSelecionado}
                onChange={(e) => setMesAnoSelecionado(e.target.value)}
              >
                {getMesesDisponiveis().map((mes) => (
                  <option key={mes.valor} value={mes.valor}>
                    {mes.label}
                  </option>
                ))}
              </Select>
              <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                {mesAnoSelecionado === getMesAtual() ? 'Mês atual (padrão)' : 'Mês anterior'}
              </small>
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="filtro_status">Status</Label>
            <Select
              id="filtro_status"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
              <option value="CANCELADO">Cancelado</option>
            </Select>
          </FormGroup>

          <FormGroup style={{ justifyContent: 'flex-end' }}>
            <Label>&nbsp;</Label>
            <Button onClick={loadData}>
              <Search size={18} />
              Filtrar
            </Button>
          </FormGroup>
        </FiltersGrid>
      </FiltersCard>

      {/* Lista de Lotes */}
      {lotes.length === 0 ? (
        <EmptyState>
          <DollarSign size={64} color="#d1d5db" />
          <h3>Nenhum pagamento encontrado</h3>
          {filtroPeriodoTipo === 'MENSAL' && mesAnoSelecionado ? (
            <p>
              Não há lotes de pagamento para{' '}
              <strong>
                {new Date(mesAnoSelecionado + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </strong>
              {filtroVistoriador && ' para o vistoriador selecionado'}
              {filtroStatus !== 'TODOS' && ` com status "${filtroStatus}"`}.
            </p>
          ) : (
            <p>Não há lotes de pagamento com os filtros selecionados.</p>
          )}
        </EmptyState>
      ) : (
        <LotesGrid>
          {lotes.map(lote => (
            <LoteCard key={lote.id} status={lote.status}>
              <LoteHeader>
                <LoteInfo>
                  <LoteVistoriador>
                    <User size={20} />
                    {lote.vistoriador?.nome || 'Vistoriador não informado'}
                  </LoteVistoriador>
                  <LoteDetalhes>
                    <LoteDetalhe>
                      <Calendar size={16} />
                      {getPeriodoLabel(lote.periodo_tipo)}
                    </LoteDetalhe>
                    <LoteDetalhe>
                      <Clock size={16} />
                      {formatarData(lote.data_inicio)} a {formatarData(lote.data_fim)}
                    </LoteDetalhe>
                    <LoteDetalhe>
                      <FileText size={16} />
                      {lote.quantidade_vistorias} vistoria(s)
                    </LoteDetalhe>
                    <LoteDetalhe>
                      <DollarSign size={16} />
                      {formatarValorMonetario(lote.valor_total)}
                    </LoteDetalhe>
                  </LoteDetalhes>
                </LoteInfo>
                <StatusBadge status={lote.status}>
                  {lote.status}
                </StatusBadge>
              </LoteHeader>

              {lote.status === 'PAGO' && (
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  <strong>Pago em:</strong> {formatarData(lote.data_pagamento)}
                  {lote.forma_pagamento && <> • <strong>Forma:</strong> {lote.forma_pagamento}</>}
                  {lote.pagoPor && <> • <strong>Por:</strong> {lote.pagoPor.nome}</>}
                </div>
              )}

              <LoteActions>
                <ActionButton
                  variant="primary"
                  onClick={() => handleVerDetalhes(lote)}
                >
                  <Eye size={16} />
                  Ver Detalhes
                </ActionButton>

                {lote.status === 'PENDENTE' && (
                  <>
                    <ActionButton
                      variant="success"
                      onClick={() => handleAbrirPagamento(lote)}
                    >
                      <Check size={16} />
                      Marcar como Pago
                    </ActionButton>
                    <ActionButton
                      variant="danger"
                      onClick={() => handleCancelarClick(lote)}
                    >
                      <X size={16} />
                      Cancelar
                    </ActionButton>
                  </>
                )}
              </LoteActions>
            </LoteCard>
          ))}
        </LotesGrid>
      )}

      {/* Modal de Detalhes */}
      <Modal show={showDetalhesModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              <FileText size={20} />
              Detalhes do Pagamento
            </ModalTitle>
            <CloseButton onClick={() => setShowDetalhesModal(false)}>&times;</CloseButton>
          </ModalHeader>
          <ModalBody>
            {loteDetalhes && (
              <>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <div><strong>Vistoriador:</strong> {loteDetalhes.vistoriador?.nome}</div>
                    <div><strong>Período:</strong> {getPeriodoLabel(loteDetalhes.periodo_tipo)}</div>
                    <div><strong>Data:</strong> {formatarData(loteDetalhes.data_inicio)} a {formatarData(loteDetalhes.data_fim)}</div>
                    <div><strong>Status:</strong> <StatusBadge status={loteDetalhes.status}>{loteDetalhes.status}</StatusBadge></div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981', marginTop: '0.5rem' }}>
                      <strong>Total:</strong> {formatarValorMonetario(loteDetalhes.valor_total)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>
                    Vistorias Incluídas ({vistoriasLote.length})
                  </h3>
                  {vistoriasLote.map((vl, index) => (
                    <VistoriaItem key={vl.id}>
                      <VistoriaHeader>
                        <VistoriaInfo>
                          <VistoriaTitulo>
                            #{index + 1} - Vistoria #{vl.vistoria_id}
                          </VistoriaTitulo>
                          {vl.vistoria && (
                            <>
                              <VistoriaDetalhe>
                                Embarcação: {vl.vistoria.Embarcacao?.nome || vl.vistoria.embarcacao?.nome || 'N/A'}
                              </VistoriaDetalhe>
                              <VistoriaDetalhe>
                                Concluída em: {formatarData(vl.vistoria.data_conclusao)}
                              </VistoriaDetalhe>
                            </>
                          )}
                        </VistoriaInfo>
                        <VistoriaValor>
                          {formatarValorMonetario(vl.valor_vistoriador)}
                        </VistoriaValor>
                      </VistoriaHeader>
                    </VistoriaItem>
                  ))}
                </div>

                {loteDetalhes.observacoes && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
                    <strong>Observações:</strong>
                    <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>{loteDetalhes.observacoes}</p>
                  </div>
                )}
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de Pagamento */}
      <Modal show={showPagamentoModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              <Check size={20} />
              Registrar Pagamento
            </ModalTitle>
            <CloseButton onClick={() => setShowPagamentoModal(false)}>&times;</CloseButton>
          </ModalHeader>
          <ModalBody>
            {lotePagando && (
              <>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#dbeafe', borderRadius: '8px' }}>
                  <div><strong>Vistoriador:</strong> {lotePagando.vistoriador?.nome}</div>
                  <div><strong>Período:</strong> {formatarData(lotePagando.data_inicio)} a {formatarData(lotePagando.data_fim)}</div>
                  <div><strong>Vistorias:</strong> {lotePagando.quantidade_vistorias}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', marginTop: '0.5rem' }}>
                    Total: {formatarValorMonetario(lotePagando.valor_total)}
                  </div>
                </div>

                <FormGroup>
                  <Label htmlFor="forma_pagamento">Forma de Pagamento *</Label>
                  <Select
                    id="forma_pagamento"
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    required
                  >
                    <option value="">Selecione...</option>
                    <option value="PIX">PIX</option>
                    <option value="TRANSFERENCIA">Transferência Bancária</option>
                    <option value="DINHEIRO">Dinheiro</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="OUTRO">Outro</option>
                  </Select>
                </FormGroup>

                <FormGroup style={{ marginTop: '1rem' }}>
                  <Label htmlFor="observacoes">Observações</Label>
                  <textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações sobre o pagamento (opcional)"
                    style={{
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      minHeight: '100px',
                      fontFamily: 'inherit'
                    }}
                  />
                </FormGroup>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <ActionButton
                    variant="success"
                    onClick={handleMarcarPago}
                    disabled={!formaPagamento}
                    style={{ flex: 1 }}
                  >
                    <Check size={18} />
                    Confirmar Pagamento
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    onClick={() => setShowPagamentoModal(false)}
                  >
                    Cancelar
                  </ActionButton>
                </div>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de Confirmação de Cancelamento */}
      <Modal show={showCancelarModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              <X size={20} />
              Cancelar Lote de Pagamento
            </ModalTitle>
            <CloseButton onClick={() => setShowCancelarModal(false)}>&times;</CloseButton>
          </ModalHeader>
          <ModalBody>
            {loteCancelando && (
              <>
                <p style={{ marginBottom: '1rem', fontSize: '1.05rem' }}>
                  Tem certeza que deseja cancelar o lote de pagamento de{' '}
                  <strong>{loteCancelando.vistoriador?.nome}</strong>?
                </p>
                <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px', marginBottom: '1rem' }}>
                  <div><strong>Período:</strong> {formatarData(loteCancelando.data_inicio)} a {formatarData(loteCancelando.data_fim)}</div>
                  <div><strong>Vistorias:</strong> {loteCancelando.quantidade_vistorias}</div>
                  <div><strong>Valor:</strong> {formatarValorMonetario(loteCancelando.valor_total)}</div>
                </div>
                <p style={{ color: '#dc2626', marginBottom: '1.5rem' }}>
                  Esta ação não pode ser desfeita. O lote ficará marcado como CANCELADO.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <ActionButton
                    variant="secondary"
                    onClick={() => setShowCancelarModal(false)}
                    style={{ flex: 1 }}
                  >
                    Voltar
                  </ActionButton>
                  <ActionButton
                    variant="danger"
                    onClick={handleConfirmCancelar}
                    style={{ flex: 1 }}
                  >
                    <X size={18} />
                    Confirmar Cancelamento
                  </ActionButton>
                </div>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de Gerar Lote */}
      <Modal show={showGerarLoteModal}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>
              <DollarSign size={20} />
              Gerar Lote de Pagamento
            </ModalTitle>
            <CloseButton onClick={() => setShowGerarLoteModal(false)}>&times;</CloseButton>
          </ModalHeader>
          <ModalBody>
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#dbeafe', borderRadius: '8px' }}>
              <div><strong>Período:</strong> {new Date(mesAnoSelecionado + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
              <div style={{ fontSize: '0.875rem', color: '#3b82f6', marginTop: '0.5rem' }}>
                Apenas vistorias <strong>concluídas</strong> com <strong>valor_vistoriador</strong> preenchido serão incluídas.
              </div>
            </div>

            {vistoriadoresDisponiveis.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <AlertCircle size={48} color="#f59e0b" />
                <h3 style={{ marginTop: '1rem' }}>Nenhum vistoriador disponível</h3>
                <p>Não há vistorias concluídas com valor preenchido no período selecionado.</p>
              </div>
            ) : (
              <>
                <FormGroup>
                  <Label htmlFor="vistoriador_gerar">Selecione o Vistoriador *</Label>
                  <Select
                    id="vistoriador_gerar"
                    value={vistoriadorSelecionado}
                    onChange={(e) => setVistoriadorSelecionado(e.target.value)}
                    required
                  >
                    <option value="">Selecione...</option>
                    {vistoriadoresDisponiveis.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.nome} - {v.quantidadeVistorias} vistoria(s) - {formatarValorMonetario(v.valorTotal)}
                      </option>
                    ))}
                  </Select>
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    {vistoriadoresDisponiveis.length} vistoriador(es) com vistorias concluídas disponíveis
                  </small>
                </FormGroup>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <ActionButton
                    variant="secondary"
                    onClick={() => {
                      setShowGerarLoteModal(false);
                      setVistoriadorSelecionado('');
                    }}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </ActionButton>
                  <ActionButton
                    variant="success"
                    onClick={handleGerarLote}
                    disabled={!vistoriadorSelecionado || gerandoLote}
                    style={{ flex: 1 }}
                  >
                    <Check size={18} />
                    {gerandoLote ? 'Gerando...' : 'Gerar Lote'}
                  </ActionButton>
                </div>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default PagamentosVistoriadores;

