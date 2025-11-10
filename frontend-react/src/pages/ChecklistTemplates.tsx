import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ClipboardList, Plus, Edit2, Trash2, Save, X, CheckCircle, AlertCircle, Video } from 'lucide-react';
import { checklistService } from '../services/api';
import { ChecklistTemplate, ChecklistTemplateItem } from '../types';

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

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
`;

const TemplateCard = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid #e2e8f0;
  transition: all 0.3s;

  &:hover {
    border-color: #667eea;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }
`;

const TemplateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
`;

const TemplateTitle = styled.h3`
  font-size: 1.25rem;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
`;

const TemplateSubtitle = styled.div`
  font-size: 0.875rem;
  color: #64748b;
`;

const ItemsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ItemRow = styled.div<{ isEditing?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: ${props => props.isEditing ? '#fef3c7' : '#f8fafc'};
  border-radius: 0.5rem;
  border: 1px solid ${props => props.isEditing ? '#fbbf24' : '#e2e8f0'};
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

const ItemContent = styled.div`
  flex: 1;
`;

const ItemName = styled.div`
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
`;

const ItemDesc = styled.div`
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
`;

const Badge = styled.span<{ variant?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${props => {
    switch (props.variant) {
      case 'required': return '#fee2e2';
      case 'optional': return '#e0e7ff';
      case 'video': return '#fef3c7';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'required': return '#991b1b';
      case 'optional': return '#3730a3';
      case 'video': return '#92400e';
      default: return '#475569';
    }
  }};
`;

const IconButton = styled.button<{ variant?: string }>`
  padding: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: ${props => {
    switch (props.variant) {
      case 'danger': return '#fee2e2';
      case 'success': return '#dcfce7';
      default: return '#f1f5f9';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'danger': return '#991b1b';
      case 'success': return '#166534';
      default: return '#475569';
    }
  }};

  &:hover {
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  min-height: 80px;
  font-family: inherit;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #667eea;
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
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonSecondary = styled.button`
  background: #e2e8f0;
  color: #475569;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #cbd5e1;
  }
`;

const AddItemButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: #f0f9ff;
  border: 2px dashed #3b82f6;
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
    border-color: #2563eb;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const ChecklistTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ nome: '', descricao: '' });
  
  // Estados para modals
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  
  // Formulários
  const [newTemplateForm, setNewTemplateForm] = useState({
    tipo_embarcacao: '',
    nome: '',
    descricao: ''
  });
  
  const [newItemForm, setNewItemForm] = useState({
    ordem: 1,
    nome: '',
    descricao: '',
    obrigatorio: true,
    permite_video: false
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await checklistService.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: ChecklistTemplateItem) => {
    setEditingItemId(item.id);
    setEditForm({ nome: item.nome, descricao: item.descricao || '' });
  };

  const handleSave = async (itemId: number) => {
    try {
      await checklistService.updateItem(itemId, editForm);
      setEditingItemId(null);
      loadTemplates();
    } catch (err) {
      alert('Erro ao salvar item');
    }
  };

  const handleDelete = async (itemId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este item?')) return;
    
    try {
      await checklistService.deleteItem(itemId);
      loadTemplates();
    } catch (err) {
      alert('Erro ao excluir item');
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTemplateForm.tipo_embarcacao || !newTemplateForm.nome) {
      alert('Preencha tipo e nome do checklist');
      return;
    }
    
    try {
      await checklistService.createTemplate({
        tipo_embarcacao: newTemplateForm.tipo_embarcacao,
        nome: newTemplateForm.nome,
        descricao: newTemplateForm.descricao || null,
        ativo: true
      });
      
      setShowNewTemplateModal(false);
      setNewTemplateForm({ tipo_embarcacao: '', nome: '', descricao: '' });
      loadTemplates();
    } catch (err: any) {
      alert('Erro ao criar template: ' + (err.response?.data?.error || 'Erro desconhecido'));
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplateId || !newItemForm.nome) {
      alert('Preencha o nome do item');
      return;
    }
    
    try {
      await checklistService.addItemToTemplate(selectedTemplateId, newItemForm);
      
      setShowNewItemModal(false);
      setNewItemForm({
        ordem: 1,
        nome: '',
        descricao: '',
        obrigatorio: true,
        permite_video: false
      });
      loadTemplates();
    } catch (err: any) {
      alert('Erro ao adicionar item: ' + (err.response?.data?.error || 'Erro desconhecido'));
    }
  };

  const handleOpenAddItem = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    const proximaOrdem = template?.itens ? template.itens.length + 1 : 1;
    
    setSelectedTemplateId(templateId);
    setNewItemForm({
      ...newItemForm,
      ordem: proximaOrdem
    });
    setShowNewItemModal(true);
  };

  if (loading) {
    return <Container><p>Carregando...</p></Container>;
  }

  return (
    <Container>
      <Header>
        <Title>
          <ClipboardList size={32} />
          Gestão de Checklists de Fotos
        </Title>
        <ButtonPrimary onClick={() => setShowNewTemplateModal(true)}>
          <Plus size={20} />
          Novo Checklist
        </ButtonPrimary>
      </Header>

      <TemplateGrid>
        {templates.map(template => (
          <TemplateCard key={template.id}>
            <TemplateHeader>
              <div>
                <TemplateTitle>{template.nome}</TemplateTitle>
                <TemplateSubtitle>
                  Tipo: {template.tipo_embarcacao} | {template.itens?.length || 0} itens
                </TemplateSubtitle>
              </div>
            </TemplateHeader>

            <ItemsList>
              {template.itens && template.itens.length > 0 ? template.itens.map(item => (
                <ItemRow key={item.id} isEditing={editingItemId === item.id}>
                  <OrderBadge>{item.ordem}</OrderBadge>
                  
                  {editingItemId === item.id ? (
                    <>
                      <ItemContent>
                        <Input
                          value={editForm.nome}
                          onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                          placeholder="Nome do item"
                        />
                        <Input
                          value={editForm.descricao}
                          onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                          placeholder="Descrição"
                          style={{ marginTop: '0.5rem' }}
                        />
                      </ItemContent>
                      <IconButton variant="success" onClick={() => handleSave(item.id)}>
                        <Save size={16} />
                      </IconButton>
                      <IconButton onClick={() => setEditingItemId(null)}>
                        <X size={16} />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <ItemContent>
                        <ItemName>{item.nome}</ItemName>
                        {item.descricao && <ItemDesc>{item.descricao}</ItemDesc>}
                        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
                          {item.obrigatorio && (
                            <Badge variant="required">
                              <AlertCircle size={10} /> Obrigatório
                            </Badge>
                          )}
                          {!item.obrigatorio && (
                            <Badge variant="optional">Opcional</Badge>
                          )}
                          {item.permite_video && (
                            <Badge variant="video">
                              <Video size={10} /> Permite vídeo
                            </Badge>
                          )}
                        </div>
                      </ItemContent>
                      <IconButton onClick={() => handleEdit(item)}>
                        <Edit2 size={16} />
                      </IconButton>
                      <IconButton variant="danger" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={16} />
                      </IconButton>
                    </>
                  )}
                </ItemRow>
              )) : (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8' }}>
                  Nenhum item cadastrado
                </div>
              )}
            </ItemsList>
            
            <AddItemButton onClick={() => handleOpenAddItem(template.id)}>
              <Plus size={18} />
              Adicionar Item
            </AddItemButton>
          </TemplateCard>
        ))}
      </TemplateGrid>

      {/* Modal: Novo Template */}
      {showNewTemplateModal && (
        <Modal onClick={() => setShowNewTemplateModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Plus size={24} />
                Novo Checklist
              </ModalTitle>
              <IconButton onClick={() => setShowNewTemplateModal(false)}>
                <X size={20} />
              </IconButton>
            </ModalHeader>

            <form onSubmit={handleCreateTemplate}>
              <FormGroup>
                <Label htmlFor="tipo_embarcacao">Tipo de Embarcação *</Label>
                <Select
                  id="tipo_embarcacao"
                  value={newTemplateForm.tipo_embarcacao}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, tipo_embarcacao: e.target.value })}
                  required
                >
                  <option value="">Selecione o tipo</option>
                  <option value="JET_SKI">Jet Ski</option>
                  <option value="LANCHA">Lancha</option>
                  <option value="IATE">Iate</option>
                  <option value="VELEIRO">Veleiro</option>
                  <option value="BARCO">Barco</option>
                  <option value="BALSA">Balsa</option>
                  <option value="REBOCADOR">Rebocador</option>
                  <option value="EMPURRADOR">Empurrador</option>
                  <option value="OUTRO">Outro</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="nome_template">Nome do Checklist *</Label>
                <FormInput
                  id="nome_template"
                  type="text"
                  value={newTemplateForm.nome}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, nome: e.target.value })}
                  placeholder="Ex: Checklist Padrão - Iate"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="descricao_template">Descrição</Label>
                <TextArea
                  id="descricao_template"
                  value={newTemplateForm.descricao}
                  onChange={(e) => setNewTemplateForm({ ...newTemplateForm, descricao: e.target.value })}
                  placeholder="Descreva o propósito deste checklist..."
                />
              </FormGroup>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <ButtonSecondary type="button" onClick={() => setShowNewTemplateModal(false)}>
                  Cancelar
                </ButtonSecondary>
                <ButtonPrimary type="submit">
                  Criar Checklist
                </ButtonPrimary>
              </div>
            </form>
          </ModalContent>
        </Modal>
      )}

      {/* Modal: Adicionar Item */}
      {showNewItemModal && (
        <Modal onClick={() => setShowNewItemModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Plus size={24} />
                Adicionar Item ao Checklist
              </ModalTitle>
              <IconButton onClick={() => setShowNewItemModal(false)}>
                <X size={20} />
              </IconButton>
            </ModalHeader>

            <form onSubmit={handleAddItem}>
              <FormGroup>
                <Label htmlFor="ordem_item">Ordem *</Label>
                <FormInput
                  id="ordem_item"
                  type="number"
                  value={newItemForm.ordem}
                  onChange={(e) => setNewItemForm({ ...newItemForm, ordem: parseInt(e.target.value) })}
                  min="1"
                  required
                />
                <small style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  Posição do item na sequência de fotos
                </small>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="nome_item">Nome do Item *</Label>
                <FormInput
                  id="nome_item"
                  type="text"
                  value={newItemForm.nome}
                  onChange={(e) => setNewItemForm({ ...newItemForm, nome: e.target.value })}
                  placeholder="Ex: Proa (frente)"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="descricao_item">Descrição/Instruções</Label>
                <TextArea
                  id="descricao_item"
                  value={newItemForm.descricao}
                  onChange={(e) => setNewItemForm({ ...newItemForm, descricao: e.target.value })}
                  placeholder="Descreva o que deve ser fotografado..."
                />
              </FormGroup>

              <FormGroup>
                <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <Checkbox
                    type="checkbox"
                    checked={newItemForm.obrigatorio}
                    onChange={(e) => setNewItemForm({ ...newItemForm, obrigatorio: e.target.checked })}
                  />
                  Foto obrigatória
                </Label>
              </FormGroup>

              <FormGroup>
                <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <Checkbox
                    type="checkbox"
                    checked={newItemForm.permite_video}
                    onChange={(e) => setNewItemForm({ ...newItemForm, permite_video: e.target.checked })}
                  />
                  Permite vídeo ao invés de foto
                </Label>
              </FormGroup>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <ButtonSecondary type="button" onClick={() => setShowNewItemModal(false)}>
                  Cancelar
                </ButtonSecondary>
                <ButtonPrimary type="submit">
                  Adicionar Item
                </ButtonPrimary>
              </div>
            </form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default ChecklistTemplates;

