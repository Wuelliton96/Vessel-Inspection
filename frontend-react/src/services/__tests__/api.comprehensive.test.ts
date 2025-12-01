/**
 * Testes abrangentes para services/api.ts
 */

// Mock axios no início
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockPatch = jest.fn();
const mockDelete = jest.fn();
const mockInterceptorsRequest = { use: jest.fn(), eject: jest.fn() };
const mockInterceptorsResponse = { use: jest.fn(), eject: jest.fn() };

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      get: mockGet,
      post: mockPost,
      put: mockPut,
      patch: mockPatch,
      delete: mockDelete,
      interceptors: {
        request: mockInterceptorsRequest,
        response: mockInterceptorsResponse,
      },
      defaults: { headers: { common: {} } },
    })),
    get: mockGet,
    post: mockPost,
    isAxiosError: jest.fn().mockReturnValue(false),
  },
}));

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockGet.mockResolvedValue({ data: {} });
    mockPost.mockResolvedValue({ data: {} });
    mockPut.mockResolvedValue({ data: {} });
    mockPatch.mockResolvedValue({ data: {} });
    mockDelete.mockResolvedValue({ data: {} });
  });

  describe('authService', () => {
    it('deve existir o serviço de autenticação', async () => {
      const { authService } = await import('../api');
      expect(authService).toBeDefined();
      expect(authService.login).toBeDefined();
      expect(authService.logout).toBeDefined();
    });

    it('deve ter método de login', async () => {
      mockPost.mockResolvedValue({ data: { token: 'test-token', user: { id: 1 } } });
      const { authService } = await import('../api');
      
      expect(typeof authService.login).toBe('function');
    });

    it('deve ter método de logout', async () => {
      const { authService } = await import('../api');
      
      expect(typeof authService.logout).toBe('function');
    });

    it('deve ter método de verificar autenticação', async () => {
      const { authService } = await import('../api');
      
      expect(typeof authService.verificarAutenticacao).toBe('function');
    });

    it('deve ter método de alterar senha', async () => {
      const { authService } = await import('../api');
      
      expect(typeof authService.changePassword).toBe('function');
    });
  });

  describe('usuarioService', () => {
    it('deve existir o serviço de usuários', async () => {
      const { usuarioService } = await import('../api');
      expect(usuarioService).toBeDefined();
    });

    it('deve ter método listar', async () => {
      mockGet.mockResolvedValue({ data: [] });
      const { usuarioService } = await import('../api');
      
      expect(typeof usuarioService.listar).toBe('function');
    });

    it('deve ter método buscarPorId', async () => {
      const { usuarioService } = await import('../api');
      
      expect(typeof usuarioService.buscarPorId).toBe('function');
    });

    it('deve ter método criar', async () => {
      const { usuarioService } = await import('../api');
      
      expect(typeof usuarioService.criar).toBe('function');
    });

    it('deve ter método atualizar', async () => {
      const { usuarioService } = await import('../api');
      
      expect(typeof usuarioService.atualizar).toBe('function');
    });
  });

  describe('vistoriaService', () => {
    it('deve existir o serviço de vistorias', async () => {
      const { vistoriaService } = await import('../api');
      expect(vistoriaService).toBeDefined();
    });

    it('deve ter método listar', async () => {
      mockGet.mockResolvedValue({ data: [] });
      const { vistoriaService } = await import('../api');
      
      expect(typeof vistoriaService.listar).toBe('function');
    });

    it('deve ter método buscarPorId', async () => {
      const { vistoriaService } = await import('../api');
      
      expect(typeof vistoriaService.buscarPorId).toBe('function');
    });

    it('deve ter método criar', async () => {
      const { vistoriaService } = await import('../api');
      
      expect(typeof vistoriaService.criar).toBe('function');
    });

    it('deve ter método atualizar', async () => {
      const { vistoriaService } = await import('../api');
      
      expect(typeof vistoriaService.atualizar).toBe('function');
    });

    it('deve ter método deletar', async () => {
      const { vistoriaService } = await import('../api');
      
      expect(typeof vistoriaService.deletar).toBe('function');
    });

    it('deve ter método getByVistoriador', async () => {
      const { vistoriaService } = await import('../api');
      
      expect(typeof vistoriaService.getByVistoriador).toBe('function');
    });
  });

  describe('embarcacaoService', () => {
    it('deve existir o serviço de embarcações', async () => {
      const { embarcacaoService } = await import('../api');
      expect(embarcacaoService).toBeDefined();
    });

    it('deve ter método listar', async () => {
      const { embarcacaoService } = await import('../api');
      
      expect(typeof embarcacaoService.listar).toBe('function');
    });

    it('deve ter método criar', async () => {
      const { embarcacaoService } = await import('../api');
      
      expect(typeof embarcacaoService.criar).toBe('function');
    });

    it('deve ter método atualizar', async () => {
      const { embarcacaoService } = await import('../api');
      
      expect(typeof embarcacaoService.atualizar).toBe('function');
    });
  });

  describe('clienteService', () => {
    it('deve existir o serviço de clientes', async () => {
      const { clienteService } = await import('../api');
      expect(clienteService).toBeDefined();
    });

    it('deve ter método listar', async () => {
      const { clienteService } = await import('../api');
      
      expect(typeof clienteService.listar).toBe('function');
    });

    it('deve ter método criar', async () => {
      const { clienteService } = await import('../api');
      
      expect(typeof clienteService.criar).toBe('function');
    });

    it('deve ter método buscarPorDocumento', async () => {
      const { clienteService } = await import('../api');
      
      expect(typeof clienteService.buscarPorDocumento).toBe('function');
    });
  });

  describe('localService', () => {
    it('deve existir o serviço de locais', async () => {
      const { localService } = await import('../api');
      expect(localService).toBeDefined();
    });

    it('deve ter método listar', async () => {
      const { localService } = await import('../api');
      
      expect(typeof localService.listar).toBe('function');
    });

    it('deve ter método criar', async () => {
      const { localService } = await import('../api');
      
      expect(typeof localService.criar).toBe('function');
    });
  });

  describe('seguradoraService', () => {
    it('deve existir o serviço de seguradoras', async () => {
      const { seguradoraService } = await import('../api');
      expect(seguradoraService).toBeDefined();
    });

    it('deve ter método listar', async () => {
      const { seguradoraService } = await import('../api');
      
      expect(typeof seguradoraService.listar).toBe('function');
    });

    it('deve ter método criar', async () => {
      const { seguradoraService } = await import('../api');
      
      expect(typeof seguradoraService.criar).toBe('function');
    });
  });

  describe('fotoService', () => {
    it('deve existir o serviço de fotos', async () => {
      const { fotoService } = await import('../api');
      expect(fotoService).toBeDefined();
    });

    it('deve ter método listarPorVistoria', async () => {
      const { fotoService } = await import('../api');
      
      expect(typeof fotoService.listarPorVistoria).toBe('function');
    });

    it('deve ter método uploadFoto', async () => {
      const { fotoService } = await import('../api');
      
      expect(typeof fotoService.uploadFoto).toBe('function');
    });

    it('deve ter método deletar', async () => {
      const { fotoService } = await import('../api');
      
      expect(typeof fotoService.deletar).toBe('function');
    });
  });

  describe('laudoService', () => {
    it('deve existir o serviço de laudos', async () => {
      const { laudoService } = await import('../api');
      expect(laudoService).toBeDefined();
    });

    it('deve ter método buscarPorVistoria', async () => {
      const { laudoService } = await import('../api');
      
      expect(typeof laudoService.buscarPorVistoria).toBe('function');
    });

    it('deve ter método criar', async () => {
      const { laudoService } = await import('../api');
      
      expect(typeof laudoService.criar).toBe('function');
    });

    it('deve ter método atualizar', async () => {
      const { laudoService } = await import('../api');
      
      expect(typeof laudoService.atualizar).toBe('function');
    });

    it('deve ter método gerarPDF', async () => {
      const { laudoService } = await import('../api');
      
      expect(typeof laudoService.gerarPDF).toBe('function');
    });
  });

  describe('checklistService', () => {
    it('deve existir o serviço de checklist', async () => {
      const { checklistService } = await import('../api');
      expect(checklistService).toBeDefined();
    });

    it('deve ter método getTemplates', async () => {
      const { checklistService } = await import('../api');
      
      expect(typeof checklistService.getTemplates).toBe('function');
    });

    it('deve ter método getItemsByVistoria', async () => {
      const { checklistService } = await import('../api');
      
      expect(typeof checklistService.getItemsByVistoria).toBe('function');
    });

    it('deve ter método getProgresso', async () => {
      const { checklistService } = await import('../api');
      
      expect(typeof checklistService.getProgresso).toBe('function');
    });

    it('deve ter método createTemplate', async () => {
      const { checklistService } = await import('../api');
      
      expect(typeof checklistService.createTemplate).toBe('function');
    });

    it('deve ter método addItemToTemplate', async () => {
      const { checklistService } = await import('../api');
      
      expect(typeof checklistService.addItemToTemplate).toBe('function');
    });

    it('deve ter método updateItem', async () => {
      const { checklistService } = await import('../api');
      
      expect(typeof checklistService.updateItem).toBe('function');
    });

    it('deve ter método deleteItem', async () => {
      const { checklistService } = await import('../api');
      
      expect(typeof checklistService.deleteItem).toBe('function');
    });
  });

  describe('pagamentoService', () => {
    it('deve existir o serviço de pagamento', async () => {
      const { pagamentoService } = await import('../api');
      expect(pagamentoService).toBeDefined();
    });

    it('deve ter método listarLotes', async () => {
      const { pagamentoService } = await import('../api');
      
      expect(typeof pagamentoService.listarLotes).toBe('function');
    });

    it('deve ter método criarLote', async () => {
      const { pagamentoService } = await import('../api');
      
      expect(typeof pagamentoService.criarLote).toBe('function');
    });

    it('deve ter método marcarComoPago', async () => {
      const { pagamentoService } = await import('../api');
      
      expect(typeof pagamentoService.marcarComoPago).toBe('function');
    });

    it('deve ter método getResumoFinanceiro', async () => {
      const { pagamentoService } = await import('../api');
      
      expect(typeof pagamentoService.getResumoFinanceiro).toBe('function');
    });
  });

  describe('auditoriaService', () => {
    it('deve existir o serviço de auditoria', async () => {
      const { auditoriaService } = await import('../api');
      expect(auditoriaService).toBeDefined();
    });

    it('deve ter método listar', async () => {
      const { auditoriaService } = await import('../api');
      
      expect(typeof auditoriaService.listar).toBe('function');
    });

    it('deve ter método estatisticas', async () => {
      const { auditoriaService } = await import('../api');
      
      expect(typeof auditoriaService.estatisticas).toBe('function');
    });
  });

  describe('vistoriadorService', () => {
    it('deve existir o serviço de vistoriadores', async () => {
      const { vistoriadorService } = await import('../api');
      expect(vistoriadorService).toBeDefined();
    });

    it('deve ter método listar', async () => {
      const { vistoriadorService } = await import('../api');
      
      expect(typeof vistoriadorService.listar).toBe('function');
    });
  });
});

