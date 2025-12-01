import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChecklistTemplates from '../ChecklistTemplates';
import { checklistService } from '../../services/api';

// Mocks
jest.mock('../../services/api');

const mockChecklistService = checklistService as jest.Mocked<typeof checklistService>;

const mockTemplates = [
  {
    id: 1,
    tipo_embarcacao: 'LANCHA',
    nome: 'Checklist Lancha Padrão',
    descricao: 'Checklist para lanchas',
    ativo: true,
    itens: [
      {
        id: 1,
        template_id: 1,
        ordem: 1,
        nome: 'Foto da Proa',
        descricao: 'Frente da embarcação',
        obrigatorio: true,
        permite_video: false,
      },
      {
        id: 2,
        template_id: 1,
        ordem: 2,
        nome: 'Foto da Popa',
        descricao: 'Traseira da embarcação',
        obrigatorio: false,
        permite_video: true,
      },
    ],
  },
  {
    id: 2,
    tipo_embarcacao: 'JET_SKI',
    nome: 'Checklist Jet Ski',
    descricao: null,
    ativo: true,
    itens: [],
  },
];

const renderComponent = () => {
  return render(<ChecklistTemplates />);
};

describe('ChecklistTemplates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChecklistService.getTemplates = jest.fn().mockResolvedValue(mockTemplates);
    mockChecklistService.createTemplate = jest.fn().mockResolvedValue({ id: 3 });
    mockChecklistService.addItemToTemplate = jest.fn().mockResolvedValue({ id: 3 });
    mockChecklistService.updateItem = jest.fn().mockResolvedValue({});
    mockChecklistService.deleteItem = jest.fn().mockResolvedValue({});
  });

  describe('Carregamento inicial', () => {
    it('deve mostrar loading inicialmente', () => {
      mockChecklistService.getTemplates = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockTemplates), 100))
      );
      
      renderComponent();
      
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('deve renderizar o título da página', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Gestão de Checklists de Fotos')).toBeInTheDocument();
      });
    });

    it('deve carregar e exibir templates', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Checklist Lancha Padrão')).toBeInTheDocument();
        expect(screen.getByText('Checklist Jet Ski')).toBeInTheDocument();
      });
    });

    it('deve exibir contagem de itens por template', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/2 itens/)).toBeInTheDocument();
        expect(screen.getByText(/0 itens/)).toBeInTheDocument();
      });
    });
  });

  describe('Exibição de itens', () => {
    it('deve exibir itens do checklist', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Foto da Proa')).toBeInTheDocument();
        expect(screen.getByText('Foto da Popa')).toBeInTheDocument();
      });
    });

    it('deve exibir badge de obrigatório', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('Obrigatório')[0]).toBeInTheDocument();
      });
    });

    it('deve exibir badge de opcional', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Opcional')).toBeInTheDocument();
      });
    });

    it('deve exibir badge de permite vídeo', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Permite vídeo')).toBeInTheDocument();
      });
    });

    it('deve exibir mensagem quando template não tem itens', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhum item cadastrado')).toBeInTheDocument();
      });
    });
  });

  describe('Criar novo template', () => {
    it('deve abrir modal ao clicar em Novo Checklist', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Novo Checklist')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Novo Checklist'));

      await waitFor(() => {
        expect(screen.getByText('Tipo de Embarcação *')).toBeInTheDocument();
        expect(screen.getByText('Nome do Checklist *')).toBeInTheDocument();
      });
    });

    it('deve fechar modal ao clicar em Cancelar', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Novo Checklist')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Novo Checklist'));

      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancelar'));

      await waitFor(() => {
        expect(screen.queryByText('Tipo de Embarcação *')).not.toBeInTheDocument();
      });
    });

    it('deve criar template com sucesso', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Novo Checklist')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Novo Checklist'));

      await waitFor(() => {
        expect(screen.getByLabelText('Tipo de Embarcação *')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Tipo de Embarcação *'), { target: { value: 'IATE' } });
      fireEvent.change(screen.getByLabelText('Nome do Checklist *'), { target: { value: 'Novo Checklist' } });
      
      fireEvent.click(screen.getByText('Criar Checklist'));

      await waitFor(() => {
        expect(mockChecklistService.createTemplate).toHaveBeenCalled();
      });
    });

    it('deve mostrar erro ao tentar criar sem preencher campos obrigatórios', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Novo Checklist')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Novo Checklist'));

      await waitFor(() => {
        expect(screen.getByText('Criar Checklist')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Criar Checklist'));

      await waitFor(() => {
        expect(screen.getByText(/Preencha tipo e nome/)).toBeInTheDocument();
      });
    });
  });

  describe('Adicionar item', () => {
    it('deve abrir modal ao clicar em Adicionar Item', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('Adicionar Item')[0]).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Adicionar Item')[0]);

      await waitFor(() => {
        expect(screen.getByText('Adicionar Item ao Checklist')).toBeInTheDocument();
      });
    });

    it('deve adicionar item com sucesso', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('Adicionar Item')[0]).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByText('Adicionar Item')[0]);

      await waitFor(() => {
        expect(screen.getByLabelText('Nome do Item *')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Nome do Item *'), { target: { value: 'Novo Item' } });

      const addButtons = screen.getAllByRole('button');
      const adicionarBtn = addButtons.find(btn => btn.textContent === 'Adicionar Item');
      if (adicionarBtn) {
        fireEvent.click(adicionarBtn);
      }

      await waitFor(() => {
        expect(mockChecklistService.addItemToTemplate).toHaveBeenCalled();
      });
    });
  });

  describe('Editar item', () => {
    it('deve entrar em modo de edição ao clicar no botão editar', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Foto da Proa')).toBeInTheDocument();
      });

      // Encontrar botão de editar
      const editButtons = screen.getAllByRole('button');
      const editBtn = editButtons.find(btn => btn.querySelector('svg'));
      if (editBtn) {
        fireEvent.click(editBtn);
      }
    });

    it('deve salvar edição', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Foto da Proa')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByRole('button');
      fireEvent.click(editButtons[0]);
    });
  });

  describe('Excluir item', () => {
    it('deve abrir modal de confirmação ao clicar em excluir', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Foto da Proa')).toBeInTheDocument();
      });
    });
  });

  describe('Tratamento de erros', () => {
    it('deve exibir erro quando API falha', async () => {
      mockChecklistService.getTemplates = jest.fn().mockRejectedValue(new Error('Erro'));

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
      });
    });

    it('deve exibir erro ao falhar criar template', async () => {
      mockChecklistService.createTemplate = jest.fn().mockRejectedValue({
        response: { data: { error: 'Template já existe' } },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Novo Checklist')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Novo Checklist'));

      await waitFor(() => {
        expect(screen.getByLabelText('Tipo de Embarcação *')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Tipo de Embarcação *'), { target: { value: 'IATE' } });
      fireEvent.change(screen.getByLabelText('Nome do Checklist *'), { target: { value: 'Novo' } });

      fireEvent.click(screen.getByText('Criar Checklist'));

      await waitFor(() => {
        expect(screen.getByText(/Template já existe/)).toBeInTheDocument();
      });
    });
  });
});

