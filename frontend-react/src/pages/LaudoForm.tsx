import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FileText, Save, FileCheck, ArrowLeft, Loader } from 'lucide-react';
import { laudoService } from '../services/api';
import { Laudo, ChecklistEletrica, ChecklistHidraulica, ChecklistGeral } from '../types';

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const Button = styled.button<{ variant?: string }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 0.95rem;

  ${props => {
    if (props.variant === 'primary') return `
      background: #3b82f6;
      color: white;
      &:hover { background: #2563eb; }
    `;
    if (props.variant === 'success') return `
      background: #10b981;
      color: white;
      &:hover { background: #059669; }
    `;
    return `
      background: #6b7280;
      color: white;
      &:hover { background: #4b5563; }
    `;
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
`;

const TabContainer = styled.div`
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 2rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  font-weight: 600;
  color: ${props => props.active ? '#3b82f6' : '#6b7280'};
  border-bottom: 3px solid ${props => props.active ? '#3b82f6' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;

  &:hover {
    color: #3b82f6;
  }
`;

const FormSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const FormGroup = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  ${props => props.fullWidth && 'grid-column: 1 / -1;'}
`;

const Label = styled.label`
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
`;

const CheckboxInput = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const SectionTitle = styled.h3`
  font-size: 1.25rem;
  color: #1f2937;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
`;

const ChecklistQuestion = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
`;

const QuestionText = styled.p`
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.75rem;
`;

const LaudoForm: React.FC = () => {
  const { id, vistoriaId } = useParams<{ id?: string; vistoriaId?: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dados-gerais');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Laudo>>({
    versao: 'BS 2021-01',
    checklist_eletrica: {},
    checklist_hidraulica: {},
    checklist_geral: {}
  });

  useEffect(() => {
    if (id) {
      carregarLaudo();
    } else if (vistoriaId) {
      tentarCarregarLaudoExistente();
    }
  }, [id, vistoriaId]);

  const carregarLaudo = async () => {
    try {
      setLoading(true);
      const data = await laudoService.buscarPorId(Number(id));
      setFormData(data);
    } catch (err) {
      console.error('Erro ao carregar laudo:', err);
    } finally {
      setLoading(false);
    }
  };

  const tentarCarregarLaudoExistente = async () => {
    try {
      const data = await laudoService.buscarPorVistoria(Number(vistoriaId));
      setFormData(data);
    } catch (err) {
      console.log('Nenhum laudo existente, criando novo');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChecklistChange = (checklist: 'checklist_eletrica' | 'checklist_hidraulica' | 'checklist_geral', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [checklist]: {
        ...(prev[checklist] || {}),
        [field]: value
      }
    }));
  };

  const handleSalvar = async () => {
    try {
      setSaving(true);
      
      const targetVistoriaId = vistoriaId || formData.vistoria_id;
      
      if (!targetVistoriaId) {
        alert('Vistoria não identificada');
        return;
      }

      const laudoSalvo = await laudoService.criar(Number(targetVistoriaId), formData);
      
      alert('Laudo salvo com sucesso!');
      navigate(`/laudos/${laudoSalvo.id}/editar`);
    } catch (err: any) {
      console.error('Erro ao salvar laudo:', err);
      alert(err.response?.data?.error || err.response?.data?.message || 'Erro ao salvar laudo');
    } finally {
      setSaving(false);
    }
  };

  const handleGerarPDF = async () => {
    try {
      if (!formData.id) {
        alert('Salve o laudo antes de gerar o PDF');
        return;
      }

      setGenerating(true);
      
      const resultado = await laudoService.gerarPDF(formData.id);
      
      alert('PDF gerado com sucesso!');
      
      const blob = await laudoService.download(formData.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laudo-${formData.numero_laudo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      carregarLaudo();
    } catch (err: any) {
      console.error('Erro ao gerar PDF:', err);
      alert(err.response?.data?.error || 'Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  const tabs = [
    { id: 'dados-gerais', label: 'Dados Gerais' },
    { id: 'embarcacao', label: '1. Dados da Embarcação' },
    { id: 'casco', label: '2. Casco' },
    { id: 'propulsao', label: '3. Propulsão' },
    { id: 'eletricos', label: '4. Sistemas Elétricos' },
    { id: 'fundeio', label: '5. Fundeio' },
    { id: 'navegacao', label: '6. Navegação' },
    { id: 'incendio', label: '7. Combate a Incêndio' },
    { id: 'vistoria', label: '8. Vistoria' },
    { id: 'checklists', label: '9-11. Checklists' },
    { id: 'configuracoes', label: 'Configurações' }
  ];

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <Loader size={48} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Carregando...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          <FileText size={32} />
          {id ? 'Editar Laudo' : 'Novo Laudo'}
          {formData.numero_laudo && <span style={{ fontSize: '1rem', color: '#6b7280' }}>({formData.numero_laudo})</span>}
        </Title>
        <ButtonGroup>
          <Button onClick={() => navigate('/laudos')}>
            <ArrowLeft size={18} />
            Voltar
          </Button>
          <Button variant="primary" onClick={handleSalvar} disabled={saving}>
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Rascunho'}
          </Button>
          {formData.id && (
            <Button variant="success" onClick={handleGerarPDF} disabled={generating}>
              <FileCheck size={18} />
              {generating ? 'Gerando...' : 'Gerar PDF'}
            </Button>
          )}
        </ButtonGroup>
      </Header>

      <Card>
        <TabContainer>
          {tabs.map(tab => (
            <Tab
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Tab>
          ))}
        </TabContainer>

        {activeTab === 'dados-gerais' && (
          <>
            <SectionTitle>Dados Gerais do Laudo</SectionTitle>
            <FormSection>
              <FormGroup>
                <Label>Versão</Label>
                <Input
                  value={formData.versao || ''}
                  onChange={(e) => handleChange('versao', e.target.value)}
                  placeholder="Ex: BS 2021-01"
                />
              </FormGroup>
              
              <FormGroup>
                <Label>Nome da Moto Aquática</Label>
                <Input
                  value={formData.nome_moto_aquatica || ''}
                  onChange={(e) => handleChange('nome_moto_aquatica', e.target.value)}
                  placeholder="Ex: Sea Doo RXT X 325"
                />
              </FormGroup>

              <FormGroup fullWidth>
                <Label>Local de Guarda</Label>
                <Input
                  value={formData.local_guarda || ''}
                  onChange={(e) => handleChange('local_guarda', e.target.value)}
                  placeholder="Ex: Em vaga seca e coberta na Marina..."
                />
              </FormGroup>

              <FormGroup>
                <Label>Proprietário</Label>
                <Input
                  value={formData.proprietario || ''}
                  onChange={(e) => handleChange('proprietario', e.target.value)}
                  placeholder="Nome completo"
                />
              </FormGroup>

              <FormGroup>
                <Label>CPF / CNPJ</Label>
                <Input
                  value={formData.cpf_cnpj || ''}
                  onChange={(e) => handleChange('cpf_cnpj', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </FormGroup>

              <FormGroup fullWidth>
                <Label>Endereço do Proprietário</Label>
                <Input
                  value={formData.endereco_proprietario || ''}
                  onChange={(e) => handleChange('endereco_proprietario', e.target.value)}
                  placeholder="Endereço completo"
                />
              </FormGroup>

              <FormGroup>
                <Label>Responsável</Label>
                <Input
                  value={formData.responsavel || ''}
                  onChange={(e) => handleChange('responsavel', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>Data da Inspeção</Label>
                <Input
                  type="date"
                  value={formData.data_inspecao || ''}
                  onChange={(e) => handleChange('data_inspecao', e.target.value)}
                />
              </FormGroup>

              <FormGroup fullWidth>
                <Label>Local da Vistoria</Label>
                <Input
                  value={formData.local_vistoria || ''}
                  onChange={(e) => handleChange('local_vistoria', e.target.value)}
                  placeholder="Endereço completo do local"
                />
              </FormGroup>

              <FormGroup>
                <Label>Empresa Prestadora</Label>
                <Input
                  value={formData.empresa_prestadora || ''}
                  onChange={(e) => handleChange('empresa_prestadora', e.target.value)}
                  placeholder="Nome da empresa"
                />
              </FormGroup>

              <FormGroup>
                <Label>Responsável pela Inspeção</Label>
                <Input
                  value={formData.responsavel_inspecao || ''}
                  onChange={(e) => handleChange('responsavel_inspecao', e.target.value)}
                />
              </FormGroup>

              <FormGroup fullWidth>
                <Label>Participantes na Inspeção</Label>
                <Input
                  value={formData.participantes_inspecao || ''}
                  onChange={(e) => handleChange('participantes_inspecao', e.target.value)}
                  placeholder="Lista de participantes"
                />
              </FormGroup>
            </FormSection>
          </>
        )}

        {activeTab === 'embarcacao' && (
          <>
            <SectionTitle>1. Dados da Moto Aquática</SectionTitle>
            <FormSection>
              <FormGroup>
                <Label>1.1. Inscrição na Capitania dos Portos</Label>
                <Input
                  value={formData.inscricao_capitania || ''}
                  onChange={(e) => handleChange('inscricao_capitania', e.target.value)}
                  placeholder="Ex: A ser inscrita"
                />
              </FormGroup>

              <FormGroup>
                <Label>1.2. Estaleiro Construtor</Label>
                <Input
                  value={formData.estaleiro_construtor || ''}
                  onChange={(e) => handleChange('estaleiro_construtor', e.target.value)}
                  placeholder="Ex: Sea Doo / BRP"
                />
              </FormGroup>

              <FormGroup>
                <Label>1.3. Tipo de Embarcação</Label>
                <Input
                  value={formData.tipo_embarcacao || ''}
                  onChange={(e) => handleChange('tipo_embarcacao', e.target.value)}
                  placeholder="Ex: Moto aquática"
                />
              </FormGroup>

              <FormGroup>
                <Label>1.4. Modelo</Label>
                <Input
                  value={formData.modelo_embarcacao || ''}
                  onChange={(e) => handleChange('modelo_embarcacao', e.target.value)}
                  placeholder="Ex: RXT X 325"
                />
              </FormGroup>

              <FormGroup>
                <Label>1.5. Ano de Fabricação</Label>
                <Input
                  type="number"
                  value={formData.ano_fabricacao || ''}
                  onChange={(e) => handleChange('ano_fabricacao', e.target.value)}
                  placeholder="Ex: 2025"
                />
              </FormGroup>

              <FormGroup>
                <Label>1.6. Capacidade</Label>
                <Input
                  value={formData.capacidade || ''}
                  onChange={(e) => handleChange('capacidade', e.target.value)}
                  placeholder="Ex: 01 Tripulante / 02 Passageiros"
                />
              </FormGroup>

              <FormGroup>
                <Label>1.7. Classificação da Embarcação</Label>
                <Input
                  value={formData.classificacao_embarcacao || ''}
                  onChange={(e) => handleChange('classificacao_embarcacao', e.target.value)}
                  placeholder="Ex: Esporte e recreio"
                />
              </FormGroup>

              <FormGroup>
                <Label>1.8. Área de Navegação</Label>
                <Input
                  value={formData.area_navegacao || ''}
                  onChange={(e) => handleChange('area_navegacao', e.target.value)}
                  placeholder="Ex: Interior"
                />
              </FormGroup>

              <FormGroup fullWidth>
                <Label>1.9. Situação perante a Capitania dos Portos</Label>
                <Input
                  value={formData.situacao_capitania || ''}
                  onChange={(e) => handleChange('situacao_capitania', e.target.value)}
                  placeholder="Ex: A informar, embarcação nova a ser regularizada"
                />
              </FormGroup>

              <FormGroup>
                <Label>1.10. Valor em Risco (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_risco || ''}
                  onChange={(e) => handleChange('valor_risco', e.target.value)}
                  placeholder="Ex: 175000.00"
                />
              </FormGroup>
            </FormSection>
          </>
        )}

        {activeTab === 'casco' && (
          <>
            <SectionTitle>2. Casco</SectionTitle>
            <FormSection>
              <FormGroup>
                <Label>2.1. Material do Casco</Label>
                <Input
                  value={formData.material_casco || ''}
                  onChange={(e) => handleChange('material_casco', e.target.value)}
                  placeholder="Ex: Fibra de vidro"
                />
              </FormGroup>

              <FormGroup fullWidth>
                <Label>2.2. Observações</Label>
                <TextArea
                  value={formData.observacoes_casco || ''}
                  onChange={(e) => handleChange('observacoes_casco', e.target.value)}
                  placeholder="Descreva características especiais, equipamentos, etc..."
                />
              </FormGroup>
            </FormSection>
          </>
        )}

        {activeTab === 'propulsao' && (
          <>
            <SectionTitle>3. Propulsão</SectionTitle>
            <FormSection>
              <FormGroup>
                <Label>3.1. Quantidade de Motores</Label>
                <Input
                  type="number"
                  value={formData.quantidade_motores || ''}
                  onChange={(e) => handleChange('quantidade_motores', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>3.2. Tipo</Label>
                <Input
                  value={formData.tipo_motor || ''}
                  onChange={(e) => handleChange('tipo_motor', e.target.value)}
                  placeholder="Ex: Centro"
                />
              </FormGroup>

              <FormGroup>
                <Label>3.3. Fabricante do(s) Motor(es)</Label>
                <Input
                  value={formData.fabricante_motor || ''}
                  onChange={(e) => handleChange('fabricante_motor', e.target.value)}
                  placeholder="Ex: Rotax"
                />
              </FormGroup>

              <FormGroup>
                <Label>3.4. Modelo do(s) Motor(es)</Label>
                <Input
                  value={formData.modelo_motor || ''}
                  onChange={(e) => handleChange('modelo_motor', e.target.value)}
                  placeholder="Ex: Rotax 1603"
                />
              </FormGroup>

              <FormGroup>
                <Label>3.5. Número(s) de Série</Label>
                <Input
                  value={formData.numero_serie_motor || ''}
                  onChange={(e) => handleChange('numero_serie_motor', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>3.6. Potência do(s) Motor(es)</Label>
                <Input
                  value={formData.potencia_motor || ''}
                  onChange={(e) => handleChange('potencia_motor', e.target.value)}
                  placeholder="Ex: 325 HP"
                />
              </FormGroup>

              <FormGroup>
                <Label>3.7. Combustível Utilizado</Label>
                <Input
                  value={formData.combustivel_utilizado || ''}
                  onChange={(e) => handleChange('combustivel_utilizado', e.target.value)}
                  placeholder="Ex: Gasolina"
                />
              </FormGroup>

              <FormGroup>
                <Label>3.8. Capacidade do Tanque</Label>
                <Input
                  value={formData.capacidade_tanque || ''}
                  onChange={(e) => handleChange('capacidade_tanque', e.target.value)}
                  placeholder="Ex: 70 litros"
                />
              </FormGroup>

              <FormGroup>
                <Label>3.9. Ano de Fabricação do Motor</Label>
                <Input
                  type="number"
                  value={formData.ano_fabricacao_motor || ''}
                  onChange={(e) => handleChange('ano_fabricacao_motor', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>3.10. Número de Hélices e Material</Label>
                <Input
                  value={formData.numero_helices || ''}
                  onChange={(e) => handleChange('numero_helices', e.target.value)}
                  placeholder="Ex: 01 Em aço inox"
                />
              </FormGroup>

              <FormGroup>
                <Label>3.11. Rabeta / Reversora</Label>
                <Input
                  value={formData.rabeta_reversora || ''}
                  onChange={(e) => handleChange('rabeta_reversora', e.target.value)}
                  placeholder="Ex: Sistema propulsor Hidrojato"
                />
              </FormGroup>

              <FormGroup>
                <Label>3.12. Blower</Label>
                <Input
                  value={formData.blower || ''}
                  onChange={(e) => handleChange('blower', e.target.value)}
                />
              </FormGroup>
            </FormSection>
          </>
        )}

        {activeTab === 'eletricos' && (
          <>
            <SectionTitle>4. Sistemas Elétricos e de Suporte</SectionTitle>
            <FormSection>
              <FormGroup>
                <Label>4.1. Quantidade de Baterias</Label>
                <Input
                  type="number"
                  value={formData.quantidade_baterias || ''}
                  onChange={(e) => handleChange('quantidade_baterias', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.2. Marca das Baterias</Label>
                <Input
                  value={formData.marca_baterias || ''}
                  onChange={(e) => handleChange('marca_baterias', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.3. Capacidade (Ah)</Label>
                <Input
                  value={formData.capacidade_baterias || ''}
                  onChange={(e) => handleChange('capacidade_baterias', e.target.value)}
                  placeholder="Ex: 18 Ah"
                />
              </FormGroup>

              <FormGroup>
                <Label>4.4. Carregador de Bateria</Label>
                <Input
                  value={formData.carregador_bateria || ''}
                  onChange={(e) => handleChange('carregador_bateria', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.5. Transformador</Label>
                <Input
                  value={formData.transformador || ''}
                  onChange={(e) => handleChange('transformador', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.6. Quantidade de Geradores</Label>
                <Input
                  type="number"
                  value={formData.quantidade_geradores || ''}
                  onChange={(e) => handleChange('quantidade_geradores', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.7. Fabricante do(s) Gerador(es)</Label>
                <Input
                  value={formData.fabricante_geradores || ''}
                  onChange={(e) => handleChange('fabricante_geradores', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.8. Tipo e Modelo</Label>
                <Input
                  value={formData.tipo_modelo_geradores || ''}
                  onChange={(e) => handleChange('tipo_modelo_geradores', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.9. Capacidade de Geração</Label>
                <Input
                  value={formData.capacidade_geracao || ''}
                  onChange={(e) => handleChange('capacidade_geracao', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.10. Quantidade de Bombas de Porão</Label>
                <Input
                  type="number"
                  value={formData.quantidade_bombas_porao || ''}
                  onChange={(e) => handleChange('quantidade_bombas_porao', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.11. Fabricante da(s) Bomba(s) de Porão</Label>
                <Input
                  value={formData.fabricante_bombas_porao || ''}
                  onChange={(e) => handleChange('fabricante_bombas_porao', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.12. Modelo da(s) Bomba(s) de Porão</Label>
                <Input
                  value={formData.modelo_bombas_porao || ''}
                  onChange={(e) => handleChange('modelo_bombas_porao', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.13. Quantidade de Bombas de Água Doce</Label>
                <Input
                  type="number"
                  value={formData.quantidade_bombas_agua_doce || ''}
                  onChange={(e) => handleChange('quantidade_bombas_agua_doce', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.14. Fabricante da(s) Bomba(s) de Água Doce</Label>
                <Input
                  value={formData.fabricante_bombas_agua_doce || ''}
                  onChange={(e) => handleChange('fabricante_bombas_agua_doce', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>4.15. Modelo da(s) Bomba(s) de Água Doce</Label>
                <Input
                  value={formData.modelo_bombas_agua_doce || ''}
                  onChange={(e) => handleChange('modelo_bombas_agua_doce', e.target.value)}
                />
              </FormGroup>

              <FormGroup fullWidth>
                <Label>4.16. Observações</Label>
                <TextArea
                  value={formData.observacoes_eletricos || ''}
                  onChange={(e) => handleChange('observacoes_eletricos', e.target.value)}
                />
              </FormGroup>
            </FormSection>
          </>
        )}

        {activeTab === 'fundeio' && (
          <>
            <SectionTitle>5. Materiais de Fundeio</SectionTitle>
            <FormSection>
              <FormGroup>
                <Label>5.1. Guincho Elétrico</Label>
                <Input
                  value={formData.guincho_eletrico || ''}
                  onChange={(e) => handleChange('guincho_eletrico', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>5.2. Ancora</Label>
                <Input
                  value={formData.ancora || ''}
                  onChange={(e) => handleChange('ancora', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>5.3. Cabos</Label>
                <Input
                  value={formData.cabos || ''}
                  onChange={(e) => handleChange('cabos', e.target.value)}
                />
              </FormGroup>
            </FormSection>
          </>
        )}

        {activeTab === 'navegacao' && (
          <>
            <SectionTitle>6. Equipamentos de Navegação</SectionTitle>
            <FormSection>
              <FormGroup><Label>6.1. Agulha Giroscópica</Label><Input value={formData.agulha_giroscopica || ''} onChange={(e) => handleChange('agulha_giroscopica', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.2. Agulha Magnética</Label><Input value={formData.agulha_magnetica || ''} onChange={(e) => handleChange('agulha_magnetica', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.3. Antena</Label><Input value={formData.antena || ''} onChange={(e) => handleChange('antena', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.4. Bidata</Label><Input value={formData.bidata || ''} onChange={(e) => handleChange('bidata', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.5. Barômetro</Label><Input value={formData.barometro || ''} onChange={(e) => handleChange('barometro', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.6. Buzina</Label><Input value={formData.buzina || ''} onChange={(e) => handleChange('buzina', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.7. Conta Giros</Label><Input value={formData.conta_giros || ''} onChange={(e) => handleChange('conta_giros', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.8. Farol de Milha</Label><Input value={formData.farol_milha || ''} onChange={(e) => handleChange('farol_milha', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.9. GPS</Label><Input value={formData.gps || ''} onChange={(e) => handleChange('gps', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.10. Higrômetro</Label><Input value={formData.higrometro || ''} onChange={(e) => handleChange('higrometro', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.11. Horímetro</Label><Input value={formData.horimetro || ''} onChange={(e) => handleChange('horimetro', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.12. Limpador de Para-brisas</Label><Input value={formData.limpador_parabrisa || ''} onChange={(e) => handleChange('limpador_parabrisa', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.13. Manômetros</Label><Input value={formData.manometros || ''} onChange={(e) => handleChange('manometros', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.14. Odômetro de Fundo</Label><Input value={formData.odometro_fundo || ''} onChange={(e) => handleChange('odometro_fundo', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.15. Passarela de Embarque</Label><Input value={formData.passarela_embarque || ''} onChange={(e) => handleChange('passarela_embarque', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.16. Piloto Automático</Label><Input value={formData.piloto_automatico || ''} onChange={(e) => handleChange('piloto_automatico', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.17. PSI</Label><Input value={formData.psi || ''} onChange={(e) => handleChange('psi', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.18. Radar</Label><Input value={formData.radar || ''} onChange={(e) => handleChange('radar', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.19. Rádio SSB</Label><Input value={formData.radio_ssb || ''} onChange={(e) => handleChange('radio_ssb', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.20. Rádio VHF</Label><Input value={formData.radio_vhf || ''} onChange={(e) => handleChange('radio_vhf', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.21. Radiogoniometro</Label><Input value={formData.radiogoniometro || ''} onChange={(e) => handleChange('radiogoniometro', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.22. Sonda</Label><Input value={formData.sonda || ''} onChange={(e) => handleChange('sonda', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.23. Speed Log</Label><Input value={formData.speed_log || ''} onChange={(e) => handleChange('speed_log', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.24. Strobow</Label><Input value={formData.strobow || ''} onChange={(e) => handleChange('strobow', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.25. Termômetro</Label><Input value={formData.termometro || ''} onChange={(e) => handleChange('termometro', e.target.value)} /></FormGroup>
              <FormGroup><Label>6.26. Voltímetro</Label><Input value={formData.voltimetro || ''} onChange={(e) => handleChange('voltimetro', e.target.value)} /></FormGroup>
              
              <FormGroup fullWidth>
                <Label>6.27. Outros</Label>
                <TextArea
                  value={formData.outros_equipamentos || ''}
                  onChange={(e) => handleChange('outros_equipamentos', e.target.value)}
                />
              </FormGroup>
            </FormSection>
          </>
        )}

        {activeTab === 'incendio' && (
          <>
            <SectionTitle>7. Sistemas de Combate a Incêndio</SectionTitle>
            <FormSection>
              <FormGroup>
                <Label>7.1. Extintores Automáticos</Label>
                <Input
                  value={formData.extintores_automaticos || ''}
                  onChange={(e) => handleChange('extintores_automaticos', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>7.2. Extintores Portáteis</Label>
                <Input
                  value={formData.extintores_portateis || ''}
                  onChange={(e) => handleChange('extintores_portateis', e.target.value)}
                />
              </FormGroup>

              <FormGroup fullWidth>
                <Label>7.3. Outros</Label>
                <TextArea
                  value={formData.outros_incendio || ''}
                  onChange={(e) => handleChange('outros_incendio', e.target.value)}
                />
              </FormGroup>

              <FormGroup>
                <Label>7.4. Atendimento às Normas de Segurança</Label>
                <Input
                  value={formData.atendimento_normas || ''}
                  onChange={(e) => handleChange('atendimento_normas', e.target.value)}
                  placeholder="Ex: Sim de acordo"
                />
              </FormGroup>
            </FormSection>
          </>
        )}

        {activeTab === 'vistoria' && (
          <>
            <SectionTitle>8. Vistoria</SectionTitle>
            <FormSection>
              <FormGroup>
                <Label>8.1. Acúmulo de água no fundo</Label>
                <Input
                  value={formData.acumulo_agua || ''}
                  onChange={(e) => handleChange('acumulo_agua', e.target.value)}
                  placeholder="Ex: Não há"
                />
              </FormGroup>

              <FormGroup>
                <Label>8.2. Avarias no casco</Label>
                <Input
                  value={formData.avarias_casco || ''}
                  onChange={(e) => handleChange('avarias_casco', e.target.value)}
                  placeholder="Ex: Não há"
                />
              </FormGroup>

              <FormGroup fullWidth>
                <Label>8.3. Estado Geral de Limpeza e Conservação</Label>
                <Input
                  value={formData.estado_geral_limpeza || ''}
                  onChange={(e) => handleChange('estado_geral_limpeza', e.target.value)}
                  placeholder="Ex: Bom, satisfatório"
                />
              </FormGroup>

              <FormGroup fullWidth>
                <Label>8.4. Teste de Funcionamento do Motor</Label>
                <Input
                  value={formData.teste_funcionamento_motor || ''}
                  onChange={(e) => handleChange('teste_funcionamento_motor', e.target.value)}
                  placeholder="Ex: Bom, satisfatório"
                />
              </FormGroup>

              <FormGroup>
                <Label>8.5. Funcionamento de Bombas de Porão</Label>
                <Input
                  value={formData.funcionamento_bombas_porao || ''}
                  onChange={(e) => handleChange('funcionamento_bombas_porao', e.target.value)}
                  placeholder="Ex: Não se aplica"
                />
              </FormGroup>

              <FormGroup>
                <Label>8.6. Manutenção</Label>
                <Input
                  value={formData.manutencao || ''}
                  onChange={(e) => handleChange('manutencao', e.target.value)}
                  placeholder="Ex: Preventiva"
                />
              </FormGroup>

              <FormGroup fullWidth>
                <Label>8.7. Observações</Label>
                <TextArea
                  value={formData.observacoes_vistoria || ''}
                  onChange={(e) => handleChange('observacoes_vistoria', e.target.value)}
                />
              </FormGroup>
            </FormSection>
          </>
        )}

        {activeTab === 'checklists' && (
          <>
            <SectionTitle>9. Instalações Elétricas</SectionTitle>
            
            <ChecklistQuestion>
              <QuestionText>9.1. Os terminais de cabos elétricos estão devidamente estanhados?</QuestionText>
              <CheckboxGroup>
                <CheckboxLabel>
                  <CheckboxInput
                    type="radio"
                    name="terminais_estanhados"
                    checked={formData.checklist_eletrica?.terminais_estanhados === 'Sim'}
                    onChange={() => handleChecklistChange('checklist_eletrica', 'terminais_estanhados', 'Sim')}
                  />
                  Sim
                </CheckboxLabel>
                <CheckboxLabel>
                  <CheckboxInput
                    type="radio"
                    name="terminais_estanhados"
                    checked={formData.checklist_eletrica?.terminais_estanhados === 'Não'}
                    onChange={() => handleChecklistChange('checklist_eletrica', 'terminais_estanhados', 'Não')}
                  />
                  Não
                </CheckboxLabel>
                <CheckboxLabel>
                  <CheckboxInput
                    type="radio"
                    name="terminais_estanhados"
                    checked={formData.checklist_eletrica?.terminais_estanhados === 'Não possui'}
                    onChange={() => handleChecklistChange('checklist_eletrica', 'terminais_estanhados', 'Não possui')}
                  />
                  Não possui
                </CheckboxLabel>
              </CheckboxGroup>
            </ChecklistQuestion>

            <ChecklistQuestion>
              <QuestionText>9.2. Circuitos elétricos estão protegidos por disjuntores ou fusíveis?</QuestionText>
              <CheckboxGroup>
                <CheckboxLabel><CheckboxInput type="radio" name="circuitos_protegidos" checked={formData.checklist_eletrica?.circuitos_protegidos === 'Sim'} onChange={() => handleChecklistChange('checklist_eletrica', 'circuitos_protegidos', 'Sim')} />Sim</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="circuitos_protegidos" checked={formData.checklist_eletrica?.circuitos_protegidos === 'Não'} onChange={() => handleChecklistChange('checklist_eletrica', 'circuitos_protegidos', 'Não')} />Não</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="circuitos_protegidos" checked={formData.checklist_eletrica?.circuitos_protegidos === 'Não possui'} onChange={() => handleChecklistChange('checklist_eletrica', 'circuitos_protegidos', 'Não possui')} />Não possui</CheckboxLabel>
              </CheckboxGroup>
            </ChecklistQuestion>

            <ChecklistQuestion>
              <QuestionText>9.3. A chave geral é de uso náutico, está em local de fácil acesso e protegido de respingos?</QuestionText>
              <CheckboxGroup>
                <CheckboxLabel><CheckboxInput type="radio" name="chave_geral" checked={formData.checklist_eletrica?.chave_geral === 'Sim'} onChange={() => handleChecklistChange('checklist_eletrica', 'chave_geral', 'Sim')} />Sim</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="chave_geral" checked={formData.checklist_eletrica?.chave_geral === 'Não'} onChange={() => handleChecklistChange('checklist_eletrica', 'chave_geral', 'Não')} />Não</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="chave_geral" checked={formData.checklist_eletrica?.chave_geral === 'Não possui'} onChange={() => handleChecklistChange('checklist_eletrica', 'chave_geral', 'Não possui')} />Não possui</CheckboxLabel>
              </CheckboxGroup>
            </ChecklistQuestion>

            <ChecklistQuestion>
              <QuestionText>9.4. Os terminais de cabos de baterias estão devidamente prensados?</QuestionText>
              <CheckboxGroup>
                <CheckboxLabel><CheckboxInput type="radio" name="terminais_baterias" checked={formData.checklist_eletrica?.terminais_baterias === 'Sim'} onChange={() => handleChecklistChange('checklist_eletrica', 'terminais_baterias', 'Sim')} />Sim</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="terminais_baterias" checked={formData.checklist_eletrica?.terminais_baterias === 'Não'} onChange={() => handleChecklistChange('checklist_eletrica', 'terminais_baterias', 'Não')} />Não</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="terminais_baterias" checked={formData.checklist_eletrica?.terminais_baterias === 'Não possui'} onChange={() => handleChecklistChange('checklist_eletrica', 'terminais_baterias', 'Não possui')} />Não possui</CheckboxLabel>
              </CheckboxGroup>
            </ChecklistQuestion>

            <ChecklistQuestion>
              <QuestionText>9.5. As baterias estão devidamente fixadas, sem apresentar movimento?</QuestionText>
              <CheckboxGroup>
                <CheckboxLabel><CheckboxInput type="radio" name="baterias_fixadas" checked={formData.checklist_eletrica?.baterias_fixadas === 'Sim'} onChange={() => handleChecklistChange('checklist_eletrica', 'baterias_fixadas', 'Sim')} />Sim</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="baterias_fixadas" checked={formData.checklist_eletrica?.baterias_fixadas === 'Não'} onChange={() => handleChecklistChange('checklist_eletrica', 'baterias_fixadas', 'Não')} />Não</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="baterias_fixadas" checked={formData.checklist_eletrica?.baterias_fixadas === 'Não possui'} onChange={() => handleChecklistChange('checklist_eletrica', 'baterias_fixadas', 'Não possui')} />Não possui</CheckboxLabel>
              </CheckboxGroup>
            </ChecklistQuestion>

            <ChecklistQuestion>
              <QuestionText>9.6. A passagem dos chicotes elétricos pelas anteparas estão protegidos com anéis de borracha?</QuestionText>
              <CheckboxGroup>
                <CheckboxLabel><CheckboxInput type="radio" name="passagem_chicotes" checked={formData.checklist_eletrica?.passagem_chicotes === 'Sim'} onChange={() => handleChecklistChange('checklist_eletrica', 'passagem_chicotes', 'Sim')} />Sim</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="passagem_chicotes" checked={formData.checklist_eletrica?.passagem_chicotes === 'Não'} onChange={() => handleChecklistChange('checklist_eletrica', 'passagem_chicotes', 'Não')} />Não</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="passagem_chicotes" checked={formData.checklist_eletrica?.passagem_chicotes === 'Não possui'} onChange={() => handleChecklistChange('checklist_eletrica', 'passagem_chicotes', 'Não possui')} />Não possui</CheckboxLabel>
              </CheckboxGroup>
            </ChecklistQuestion>

            <ChecklistQuestion>
              <QuestionText>9.7. O cabo de alimentação do motor de arranque tem fusível próprio?</QuestionText>
              <CheckboxGroup>
                <CheckboxLabel><CheckboxInput type="radio" name="cabo_arranque" checked={formData.checklist_eletrica?.cabo_arranque === 'Sim'} onChange={() => handleChecklistChange('checklist_eletrica', 'cabo_arranque', 'Sim')} />Sim</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="cabo_arranque" checked={formData.checklist_eletrica?.cabo_arranque === 'Não'} onChange={() => handleChecklistChange('checklist_eletrica', 'cabo_arranque', 'Não')} />Não</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="cabo_arranque" checked={formData.checklist_eletrica?.cabo_arranque === 'Não possui'} onChange={() => handleChecklistChange('checklist_eletrica', 'cabo_arranque', 'Não possui')} />Não possui</CheckboxLabel>
              </CheckboxGroup>
            </ChecklistQuestion>

            <SectionTitle style={{ marginTop: '2rem' }}>10. Instalação Hidráulica</SectionTitle>
            
            <ChecklistQuestion>
              <QuestionText>10.1. O material de fabricação dos tanques de combustível está de acordo?</QuestionText>
              <CheckboxGroup>
                <CheckboxLabel><CheckboxInput type="radio" name="material_tanques" checked={formData.checklist_hidraulica?.material_tanques === 'Sim'} onChange={() => handleChecklistChange('checklist_hidraulica', 'material_tanques', 'Sim')} />Sim</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="material_tanques" checked={formData.checklist_hidraulica?.material_tanques === 'Não'} onChange={() => handleChecklistChange('checklist_hidraulica', 'material_tanques', 'Não')} />Não</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="material_tanques" checked={formData.checklist_hidraulica?.material_tanques === 'Não possui'} onChange={() => handleChecklistChange('checklist_hidraulica', 'material_tanques', 'Não possui')} />Não possui</CheckboxLabel>
              </CheckboxGroup>
            </ChecklistQuestion>

            <ChecklistQuestion>
              <QuestionText>10.2. As abraçadeiras usadas a bordo são de aço inox?</QuestionText>
              <CheckboxGroup>
                <CheckboxLabel><CheckboxInput type="radio" name="abracadeiras_inox" checked={formData.checklist_hidraulica?.abracadeiras_inox === 'Sim'} onChange={() => handleChecklistChange('checklist_hidraulica', 'abracadeiras_inox', 'Sim')} />Sim</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="abracadeiras_inox" checked={formData.checklist_hidraulica?.abracadeiras_inox === 'Não'} onChange={() => handleChecklistChange('checklist_hidraulica', 'abracadeiras_inox', 'Não')} />Não</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="abracadeiras_inox" checked={formData.checklist_hidraulica?.abracadeiras_inox === 'Não possui'} onChange={() => handleChecklistChange('checklist_hidraulica', 'abracadeiras_inox', 'Não possui')} />Não possui</CheckboxLabel>
              </CheckboxGroup>
            </ChecklistQuestion>

            <SectionTitle style={{ marginTop: '2rem' }}>11. Geral</SectionTitle>
            
            <ChecklistQuestion>
              <QuestionText>11.1. A carreta da embarcação se encontra em boas condições e com manutenção em dia?</QuestionText>
              <CheckboxGroup>
                <CheckboxLabel><CheckboxInput type="radio" name="carreta_condicoes" checked={formData.checklist_geral?.carreta_condicoes === 'Sim'} onChange={() => handleChecklistChange('checklist_geral', 'carreta_condicoes', 'Sim')} />Sim</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="carreta_condicoes" checked={formData.checklist_geral?.carreta_condicoes === 'Não'} onChange={() => handleChecklistChange('checklist_geral', 'carreta_condicoes', 'Não')} />Não</CheckboxLabel>
                <CheckboxLabel><CheckboxInput type="radio" name="carreta_condicoes" checked={formData.checklist_geral?.carreta_condicoes === 'Não possui'} onChange={() => handleChecklistChange('checklist_geral', 'carreta_condicoes', 'Não possui')} />Não possui</CheckboxLabel>
              </CheckboxGroup>
            </ChecklistQuestion>
          </>
        )}

        {activeTab === 'configuracoes' && (
          <>
            <SectionTitle>Configurações do Laudo</SectionTitle>
            <FormSection>
              <FormGroup>
                <Label>Nome da Empresa</Label>
                <Input
                  value={formData.nome_empresa || ''}
                  onChange={(e) => handleChange('nome_empresa', e.target.value)}
                  placeholder="Ex: Tech Survey Vistorias Ltda"
                />
              </FormGroup>

              <FormGroup>
                <Label>URL do Logo da Empresa</Label>
                <Input
                  value={formData.logo_empresa_url || ''}
                  onChange={(e) => handleChange('logo_empresa_url', e.target.value)}
                  placeholder="URL da imagem do logo"
                />
              </FormGroup>

              <FormGroup fullWidth>
                <Label>Nota de Rodapé</Label>
                <TextArea
                  value={formData.nota_rodape || ''}
                  onChange={(e) => handleChange('nota_rodape', e.target.value)}
                  placeholder="Ex: Relatório exclusivo para [Seguradora], não tem validade para outra finalidade..."
                />
              </FormGroup>
            </FormSection>
          </>
        )}
      </Card>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <Button onClick={() => navigate('/laudos')}>
          <ArrowLeft size={18} />
          Voltar
        </Button>
        <Button variant="primary" onClick={handleSalvar} disabled={saving}>
          <Save size={18} />
          {saving ? 'Salvando...' : 'Salvar Rascunho'}
        </Button>
        {formData.id && (
          <Button variant="success" onClick={handleGerarPDF} disabled={generating}>
            <FileCheck size={18} />
            {generating ? 'Gerando PDF...' : 'Gerar PDF'}
          </Button>
        )}
      </div>
    </Container>
  );
};

export default LaudoForm;

