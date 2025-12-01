/**
 * Testes básicos para componentes shared
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Container,
  Header,
  Title,
  AdminBadge,
  AdminInfo,
  InfoIcon,
  InfoText,
  SearchContainer,
  SearchInput,
  Button,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  ActionButtons,
  IconButton,
  EmptyState,
  LoadingState,
  ErrorMessage,
  SuccessMessage,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  CloseButton,
  Form,
  FormGroup,
  Label,
  Input,
  Select,
  ModalButtons,
  ModalBody,
  Textarea,
  StatusBadge,
  Card,
  Grid,
  InfoBox,
  ButtonGroup,
  SectionTitle,
  ActionsBar,
} from '../StyledComponents';

describe('Shared Components', () => {
  describe('Container', () => {
    it('deve renderizar com props padrão', () => {
      render(<Container data-testid="container">Conteúdo</Container>);
      expect(screen.getByTestId('container')).toBeInTheDocument();
    });

    it('deve renderizar com maxWidth personalizado', () => {
      render(<Container maxWidth="800px" data-testid="container">Conteúdo</Container>);
      expect(screen.getByTestId('container')).toBeInTheDocument();
    });

    it('deve renderizar com padding personalizado', () => {
      render(<Container padding="1rem" data-testid="container">Conteúdo</Container>);
      expect(screen.getByTestId('container')).toBeInTheDocument();
    });

    it('deve renderizar com responsive', () => {
      render(<Container responsive data-testid="container">Conteúdo</Container>);
      expect(screen.getByTestId('container')).toBeInTheDocument();
    });
  });

  describe('Header', () => {
    it('deve renderizar corretamente', () => {
      render(<Header data-testid="header">Header Content</Header>);
      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });

  describe('Title', () => {
    it('deve renderizar corretamente', () => {
      render(<Title data-testid="title">Título</Title>);
      expect(screen.getByTestId('title')).toHaveTextContent('Título');
    });
  });

  describe('AdminBadge', () => {
    it('deve renderizar corretamente', () => {
      render(<AdminBadge data-testid="badge">Admin</AdminBadge>);
      expect(screen.getByTestId('badge')).toHaveTextContent('Admin');
    });
  });

  describe('AdminInfo', () => {
    it('deve renderizar corretamente', () => {
      render(<AdminInfo data-testid="info">Informação</AdminInfo>);
      expect(screen.getByTestId('info')).toBeInTheDocument();
    });
  });

  describe('Button', () => {
    it('deve renderizar botão primário', () => {
      render(<Button variant="primary" data-testid="btn">Primário</Button>);
      expect(screen.getByTestId('btn')).toHaveTextContent('Primário');
    });

    it('deve renderizar botão secundário', () => {
      render(<Button variant="secondary" data-testid="btn">Secundário</Button>);
      expect(screen.getByTestId('btn')).toBeInTheDocument();
    });

    it('deve renderizar botão danger', () => {
      render(<Button variant="danger" data-testid="btn">Excluir</Button>);
      expect(screen.getByTestId('btn')).toBeInTheDocument();
    });

    it('deve renderizar botão success', () => {
      render(<Button variant="success" data-testid="btn">Sucesso</Button>);
      expect(screen.getByTestId('btn')).toBeInTheDocument();
    });

    it('deve renderizar botão sem variante', () => {
      render(<Button data-testid="btn">Default</Button>);
      expect(screen.getByTestId('btn')).toBeInTheDocument();
    });
  });

  describe('Table Components', () => {
    it('deve renderizar tabela completa', () => {
      render(
        <Table data-testid="table">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Coluna 1</TableHeaderCell>
              <TableHeaderCell>Coluna 2</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Dado 1</TableCell>
              <TableCell>Dado 2</TableCell>
            </TableRow>
            <TableRow isAdmin>
              <TableCell>Admin</TableCell>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
      expect(screen.getByTestId('table')).toBeInTheDocument();
      expect(screen.getByText('Coluna 1')).toBeInTheDocument();
      expect(screen.getByText('Dado 1')).toBeInTheDocument();
    });
  });

  describe('IconButton', () => {
    it('deve renderizar botão de edição', () => {
      render(<IconButton variant="edit" data-testid="btn">E</IconButton>);
      expect(screen.getByTestId('btn')).toBeInTheDocument();
    });

    it('deve renderizar botão de exclusão', () => {
      render(<IconButton variant="delete" data-testid="btn">X</IconButton>);
      expect(screen.getByTestId('btn')).toBeInTheDocument();
    });

    it('deve renderizar botão sem variante', () => {
      render(<IconButton data-testid="btn">?</IconButton>);
      expect(screen.getByTestId('btn')).toBeInTheDocument();
    });
  });

  describe('StatusBadge', () => {
    it('deve renderizar com status active', () => {
      render(<StatusBadge status="active" data-testid="badge">Ativo</StatusBadge>);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('deve renderizar com status inactive', () => {
      render(<StatusBadge status="inactive" data-testid="badge">Inativo</StatusBadge>);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('deve renderizar com status pending', () => {
      render(<StatusBadge status="pending" data-testid="badge">Pendente</StatusBadge>);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('deve renderizar com status concluida', () => {
      render(<StatusBadge status="concluida" data-testid="badge">Concluída</StatusBadge>);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('deve renderizar com ativo true', () => {
      render(<StatusBadge ativo={true} data-testid="badge">Ativo</StatusBadge>);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('deve renderizar com ativo false', () => {
      render(<StatusBadge ativo={false} data-testid="badge">Inativo</StatusBadge>);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    it('deve renderizar com status desconhecido', () => {
      render(<StatusBadge status="outro" data-testid="badge">Outro</StatusBadge>);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });
  });

  describe('InfoBox', () => {
    it('deve renderizar info box de sucesso', () => {
      render(<InfoBox type="success" data-testid="box">Sucesso</InfoBox>);
      expect(screen.getByTestId('box')).toBeInTheDocument();
    });

    it('deve renderizar info box de warning', () => {
      render(<InfoBox type="warning" data-testid="box">Aviso</InfoBox>);
      expect(screen.getByTestId('box')).toBeInTheDocument();
    });

    it('deve renderizar info box de error', () => {
      render(<InfoBox type="error" data-testid="box">Erro</InfoBox>);
      expect(screen.getByTestId('box')).toBeInTheDocument();
    });

    it('deve renderizar info box de info', () => {
      render(<InfoBox type="info" data-testid="box">Info</InfoBox>);
      expect(screen.getByTestId('box')).toBeInTheDocument();
    });

    it('deve renderizar info box sem tipo', () => {
      render(<InfoBox data-testid="box">Default</InfoBox>);
      expect(screen.getByTestId('box')).toBeInTheDocument();
    });
  });

  describe('Grid', () => {
    it('deve renderizar grid com colunas padrão', () => {
      render(<Grid data-testid="grid">Conteúdo</Grid>);
      expect(screen.getByTestId('grid')).toBeInTheDocument();
    });

    it('deve renderizar grid com colunas personalizadas', () => {
      render(<Grid cols={2} data-testid="grid">Conteúdo</Grid>);
      expect(screen.getByTestId('grid')).toBeInTheDocument();
    });
  });

  describe('Form Components', () => {
    it('deve renderizar form completo', () => {
      render(
        <Form data-testid="form">
          <FormGroup>
            <Label>Nome</Label>
            <Input placeholder="Digite o nome" data-testid="input" />
          </FormGroup>
          <FormGroup>
            <Label>Descrição</Label>
            <Textarea placeholder="Descrição" data-testid="textarea" />
          </FormGroup>
          <FormGroup>
            <Label>Tipo</Label>
            <Select data-testid="select">
              <option>Opção 1</option>
              <option>Opção 2</option>
            </Select>
          </FormGroup>
        </Form>
      );
      expect(screen.getByTestId('form')).toBeInTheDocument();
      expect(screen.getByTestId('input')).toBeInTheDocument();
      expect(screen.getByTestId('textarea')).toBeInTheDocument();
      expect(screen.getByTestId('select')).toBeInTheDocument();
    });
  });

  describe('Modal Components', () => {
    it('deve renderizar modal completo', () => {
      render(
        <ModalOverlay data-testid="overlay">
          <ModalContent data-testid="content">
            <ModalHeader>
              <ModalTitle>Título do Modal</ModalTitle>
              <CloseButton>X</CloseButton>
            </ModalHeader>
            <ModalBody>Conteúdo do modal</ModalBody>
            <ModalButtons>
              <Button>Cancelar</Button>
              <Button variant="primary">Confirmar</Button>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      );
      expect(screen.getByTestId('overlay')).toBeInTheDocument();
      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Título do Modal')).toBeInTheDocument();
    });
  });

  describe('Other Components', () => {
    it('deve renderizar EmptyState', () => {
      render(<EmptyState data-testid="empty">Nenhum item</EmptyState>);
      expect(screen.getByTestId('empty')).toBeInTheDocument();
    });

    it('deve renderizar LoadingState', () => {
      render(<LoadingState data-testid="loading">Carregando...</LoadingState>);
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('deve renderizar ErrorMessage', () => {
      render(<ErrorMessage data-testid="error">Erro!</ErrorMessage>);
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });

    it('deve renderizar SuccessMessage', () => {
      render(<SuccessMessage data-testid="success">Sucesso!</SuccessMessage>);
      expect(screen.getByTestId('success')).toBeInTheDocument();
    });

    it('deve renderizar Card', () => {
      render(<Card data-testid="card">Conteúdo do card</Card>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('deve renderizar ButtonGroup', () => {
      render(<ButtonGroup data-testid="group"><button>Btn 1</button></ButtonGroup>);
      expect(screen.getByTestId('group')).toBeInTheDocument();
    });

    it('deve renderizar ActionButtons', () => {
      render(<ActionButtons data-testid="actions"><button>Action</button></ActionButtons>);
      expect(screen.getByTestId('actions')).toBeInTheDocument();
    });

    it('deve renderizar SectionTitle', () => {
      render(<SectionTitle data-testid="section">Seção</SectionTitle>);
      expect(screen.getByTestId('section')).toBeInTheDocument();
    });

    it('deve renderizar ActionsBar', () => {
      render(<ActionsBar data-testid="bar"><button>Action</button></ActionsBar>);
      expect(screen.getByTestId('bar')).toBeInTheDocument();
    });

    it('deve renderizar SearchContainer', () => {
      render(<SearchContainer data-testid="search"><SearchInput /></SearchContainer>);
      expect(screen.getByTestId('search')).toBeInTheDocument();
    });

    it('deve renderizar InfoIcon', () => {
      render(<InfoIcon data-testid="icon">!</InfoIcon>);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('deve renderizar InfoText', () => {
      render(<InfoText data-testid="text">Texto informativo</InfoText>);
      expect(screen.getByTestId('text')).toBeInTheDocument();
    });
  });
});

