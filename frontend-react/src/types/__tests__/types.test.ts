/**
 * Testes para verificar que os tipos estão corretos
 */

import type {
  Usuario,
  NivelAcesso,
  TipoEmbarcacao,
  TipoContatoAcompanhante,
  PeriodoTipoPagamento,
  StatusPagamento,
  TipoEmbarcacaoSeguradora,
  TipoPessoa,
  StatusChecklistItem,
  ChecklistTemplate,
  ChecklistTemplateItem,
  VistoriaChecklistItem,
  ChecklistProgresso,
  Cliente,
  Embarcacao,
  Local,
  Vistoria,
  StatusVistoria,
  LotePagamento,
  VistoriaLotePagamento,
  Seguradora,
  SeguradoraTipoEmbarcacao,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ChecklistStatus,
  Foto
} from '../index';

describe('Types', () => {
  describe('Usuario', () => {
    it('deve ter estrutura correta', () => {
      const usuario: Usuario = {
        id: 1,
        nome: 'Test User',
        email: 'test@example.com',
        cpf: '12345678901',
        nivelAcessoId: 1,
        ativo: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      expect(usuario.id).toBe(1);
      expect(usuario.nome).toBe('Test User');
      expect(usuario.email).toBe('test@example.com');
      expect(usuario.cpf).toBe('12345678901');
    });

    it('deve aceitar email null', () => {
      const usuario: Usuario = {
        id: 1,
        nome: 'Test User',
        email: null,
        cpf: '12345678901',
        nivelAcessoId: 1,
        ativo: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      expect(usuario.email).toBeNull();
    });

    it('deve aceitar campos opcionais', () => {
      const usuario: Usuario = {
        id: 1,
        nome: 'Test User',
        email: null,
        cpf: '12345678901',
        nivelAcessoId: 1,
        ativo: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        deveAtualizarSenha: true,
        telefone_e164: '+5511999999999',
        estado: 'SP'
      };

      expect(usuario.deveAtualizarSenha).toBe(true);
      expect(usuario.telefone_e164).toBe('+5511999999999');
      expect(usuario.estado).toBe('SP');
    });
  });

  describe('NivelAcesso', () => {
    it('deve ter estrutura correta', () => {
      const nivelAcesso: NivelAcesso = {
        id: 1,
        nome: 'ADMIN',
        descricao: 'Administrador'
      };

      expect(nivelAcesso.id).toBe(1);
      expect(nivelAcesso.nome).toBe('ADMIN');
    });
  });

  describe('TipoEmbarcacao', () => {
    it('deve aceitar valores válidos', () => {
      const tipos: TipoEmbarcacao[] = [
        'JET_SKI',
        'BALSA',
        'IATE',
        'VELEIRO',
        'REBOCADOR',
        'EMPURRADOR',
        'LANCHA',
        'BARCO',
        'OUTRO'
      ];

      tipos.forEach(tipo => {
        expect(tipo).toBeDefined();
      });
    });
  });

  describe('Cliente', () => {
    it('deve ter estrutura correta para pessoa física', () => {
      const cliente: Cliente = {
        id: 1,
        tipo_pessoa: 'FISICA',
        nome: 'João Silva',
        cpf: '12345678901',
        ativo: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      expect(cliente.tipo_pessoa).toBe('FISICA');
      expect(cliente.cpf).toBe('12345678901');
    });

    it('deve ter estrutura correta para pessoa jurídica', () => {
      const cliente: Cliente = {
        id: 1,
        tipo_pessoa: 'JURIDICA',
        nome: 'Empresa LTDA',
        cnpj: '12345678000199',
        ativo: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      expect(cliente.tipo_pessoa).toBe('JURIDICA');
      expect(cliente.cnpj).toBe('12345678000199');
    });
  });

  describe('ChecklistProgresso', () => {
    it('deve ter estrutura correta', () => {
      const progresso: ChecklistProgresso = {
        total: 10,
        concluidos: 5,
        pendentes: 4,
        naoAplicaveis: 1,
        obrigatoriosPendentes: 2,
        percentual: 50,
        podeAprovar: false
      };

      expect(progresso.total).toBe(10);
      expect(progresso.percentual).toBe(50);
      expect(progresso.podeAprovar).toBe(false);
    });
  });

  describe('LoginRequest', () => {
    it('deve ter estrutura correta', () => {
      const request: LoginRequest = {
        cpf: '12345678901',
        senha: 'senha123'
      };

      expect(request.cpf).toBe('12345678901');
      expect(request.senha).toBe('senha123');
    });
  });

  describe('AuthResponse', () => {
    it('deve ter estrutura correta', () => {
      const response: AuthResponse = {
        token: 'jwt-token',
        usuario: {
          id: 1,
          nome: 'Test User',
          email: null,
          cpf: '12345678901',
          nivelAcessoId: 1,
          ativo: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      };

      expect(response.token).toBe('jwt-token');
      expect(response.usuario.id).toBe(1);
    });
  });

  describe('StatusChecklistItem', () => {
    it('deve aceitar valores válidos', () => {
      const statuses: StatusChecklistItem[] = ['PENDENTE', 'CONCLUIDO', 'NAO_APLICAVEL'];

      statuses.forEach(status => {
        expect(['PENDENTE', 'CONCLUIDO', 'NAO_APLICAVEL']).toContain(status);
      });
    });
  });

  describe('VistoriaChecklistItem', () => {
    it('deve ter estrutura correta', () => {
      const item: VistoriaChecklistItem = {
        id: 1,
        vistoria_id: 1,
        ordem: 1,
        nome: 'Item de checklist',
        obrigatorio: true,
        permite_video: false,
        status: 'PENDENTE',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      expect(item.status).toBe('PENDENTE');
      expect(item.obrigatorio).toBe(true);
    });
  });

  describe('Seguradora', () => {
    it('deve ter estrutura correta', () => {
      const seguradora: Seguradora = {
        id: 1,
        nome: 'Seguradora XYZ',
        ativo: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      expect(seguradora.nome).toBe('Seguradora XYZ');
      expect(seguradora.ativo).toBe(true);
    });
  });

  describe('LotePagamento', () => {
    it('deve ter estrutura correta', () => {
      const lote: LotePagamento = {
        id: 1,
        vistoriador_id: 1,
        periodo_tipo: 'MENSAL',
        data_inicio: '2024-01-01',
        data_fim: '2024-01-31',
        valor_total: 1000,
        quantidade_vistorias: 5,
        status: 'PENDENTE',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      };

      expect(lote.periodo_tipo).toBe('MENSAL');
      expect(lote.status).toBe('PENDENTE');
    });
  });
});

