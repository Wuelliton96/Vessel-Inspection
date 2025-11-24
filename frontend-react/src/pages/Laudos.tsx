import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FileText, Download, Plus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { laudoService, vistoriaService } from '../services/api';
import { Laudo, Vistoria } from '../types';

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
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: #f9fafb;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
`;

const ActionButton = styled.button<{ variant?: string }>`
  padding: 0.5rem;
  border: none;
  background: ${props => {
    if (props.variant === 'download') return '#3b82f6';
    if (props.variant === 'edit') return '#10b981';
    if (props.variant === 'delete') return '#ef4444';
    return '#6b7280';
  }};
  color: white;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    opacity: 0.8;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  background: ${props => props.status === 'gerado' ? '#dcfce7' : '#fef3c7'};
  color: ${props => props.status === 'gerado' ? '#166534' : '#92400e'};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #9ca3af;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
`;

const ErrorState = styled.div`
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #991b1b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Laudos: React.FC = () => {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [vistoriasConcluidas, setVistoriasConcluidas] = useState<Vistoria[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    carregarLaudos();
    carregarVistoriasConcluidas();
  }, []);

  const carregarLaudos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await laudoService.listar();
      setLaudos(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar laudos:', err);
      setError(err.response?.data?.error || 'Erro ao carregar laudos');
      setLaudos([]); // Garantir que laudos seja um array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const carregarVistoriasConcluidas = async () => {
    try {
      const todasVistorias = await vistoriaService.getAll();
      // Filtrar apenas vistorias concluídas
      const concluidas = todasVistorias.filter(v => 
        v.StatusVistoria?.nome === 'CONCLUIDA' || v.status_id === 3
      );
      
      // Buscar quais já têm laudo
      const laudosExistentes = await laudoService.listar().catch(() => []);
      const vistoriaIdsComLaudo = new Set(
        (laudosExistentes || []).map((l: Laudo) => l.vistoria_id)
      );
      
      // Filtrar apenas as que não têm laudo
      const semLaudo = concluidas.filter(v => !vistoriaIdsComLaudo.has(v.id));
      setVistoriasConcluidas(semLaudo);
    } catch (err: any) {
      console.error('Erro ao carregar vistorias concluídas:', err);
      setVistoriasConcluidas([]);
    }
  };

  const handleDownload = async (laudo: Laudo) => {
    try {
      setDownloadingId(laudo.id);
      
      const blob = await laudoService.download(laudo.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laudo-${laudo.numero_laudo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Erro ao baixar laudo:', err);
      alert('Erro ao baixar laudo');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este laudo?')) {
      return;
    }

    try {
      await laudoService.excluir(id);
      alert('Laudo excluído com sucesso!');
      carregarLaudos();
    } catch (err: any) {
      console.error('Erro ao excluir laudo:', err);
      alert(err.response?.data?.error || 'Erro ao excluir laudo');
    }
  };

  const formatarData = (data: string | undefined) => {
    if (!data) return '---';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>Carregando laudos...</LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FileText size={32} />
          Laudos de Vistoria
        </Title>
      </Header>

      {error && (
        <ErrorState>
          <AlertCircle size={20} />
          {error}
        </ErrorState>
      )}

      {/* Seção de Vistorias Concluídas sem Laudo */}
      {vistoriasConcluidas.length > 0 && (
        <Card style={{ marginBottom: '2rem' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
              Vistorias Concluídas Aguardando Laudo
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {vistoriasConcluidas.length} vistoria(s) concluída(s) sem laudo. Clique para criar o laudo.
            </p>
          </div>
          <div style={{ padding: '1rem' }}>
            {vistoriasConcluidas.map((vistoria) => (
              <div
                key={vistoria.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  marginBottom: '0.5rem',
                  background: '#f9fafb'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
                    Vistoria #{vistoria.id} - {vistoria.Embarcacao?.nome || 'N/A'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Concluída em: {vistoria.data_conclusao ? new Date(vistoria.data_conclusao).toLocaleDateString('pt-BR') : 'N/A'}
                  </div>
                </div>
                <ActionButton
                  variant="edit"
                  onClick={() => navigate(`/vistorias/${vistoria.id}/laudo/novo`)}
                  title="Criar Laudo"
                  style={{ background: '#10b981' }}
                >
                  <Plus size={16} />
                  Criar Laudo
                </ActionButton>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        {laudos.length === 0 ? (
          <EmptyState>
            <FileText size={48} style={{ margin: '0 auto 1rem' }} />
            <p>Nenhum laudo encontrado</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {vistoriasConcluidas.length > 0 
                ? 'Crie um laudo para uma das vistorias concluídas acima'
                : 'Os laudos são criados após a conclusão das vistorias'}
            </p>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Número</Th>
                <Th>Vistoria</Th>
                <Th>Embarcação</Th>
                <Th>Data Geração</Th>
                <Th>Status</Th>
                <Th>Ações</Th>
              </tr>
            </thead>
            <tbody>
              {laudos.map((laudo) => (
                <tr key={laudo.id}>
                  <Td>
                    <strong>{laudo.numero_laudo}</strong>
                  </Td>
                  <Td>#{laudo.vistoria_id}</Td>
                  <Td>{laudo.Vistoria?.Embarcacao?.nome || '---'}</Td>
                  <Td>{formatarData(laudo.data_geracao)}</Td>
                  <Td>
                    <StatusBadge status={laudo.url_pdf ? 'gerado' : 'rascunho'}>
                      {laudo.url_pdf ? (
                        <>
                          <CheckCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                          PDF Gerado
                        </>
                      ) : (
                        'Rascunho'
                      )}
                    </StatusBadge>
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {laudo.url_pdf && (
                        <ActionButton
                          variant="download"
                          onClick={() => handleDownload(laudo)}
                          disabled={downloadingId === laudo.id}
                          title="Baixar PDF"
                        >
                          <Download size={16} />
                        </ActionButton>
                      )}
                      <ActionButton
                        variant="edit"
                        onClick={() => navigate(`/laudos/${laudo.id}/editar`)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </ActionButton>
                      <ActionButton
                        variant="delete"
                        onClick={() => handleDelete(laudo.id)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </ActionButton>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </Container>
  );
};

export default Laudos;

