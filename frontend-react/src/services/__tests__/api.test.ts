import axios from 'axios';
import {
  authService,
  usuarioService,
  embarcacaoService,
  localService,
  vistoriaService,
  clienteService,
  seguradoraService,
  checklistService,
  laudoService,
  configuracaoLaudoService,
  auditoriaService,
  pagamentoService,
  dashboardService,
  vistoriadorService
} from '../api';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock axios.create
    (axios.create as jest.Mock).mockReturnValue(mockedAxios);
    
    // Mock axios methods
    mockedAxios.get = jest.fn();
    mockedAxios.post = jest.fn();
    mockedAxios.put = jest.fn();
    mockedAxios.patch = jest.fn();
    mockedAxios.delete = jest.fn();
  });

  describe('authService', () => {
    describe('login', () => {
      it('deve fazer login com sucesso', async () => {
        const mockResponse = {
          data: {
            token: 'test-token',
            user: {
              id: 1,
              nome: 'Test User',
              email: 'test@example.com',
              cpf: '12345678901',
              nivelAcessoId: 1,
              nivelAcesso: 'Admin',
              nivelAcessoDescricao: 'Administrador',
              deveAtualizarSenha: false
            }
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await authService.login({
          cpf: '12345678901',
          senha: 'password'
        });

        expect(result.token).toBe('test-token');
        expect(result.usuario.nome).toBe('Test User');
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/auth/login', {
          cpf: '12345678901',
          senha: 'password'
        });
      });

      it('deve lançar erro se token não for encontrado', async () => {
        mockedAxios.post.mockResolvedValue({
          data: { user: { id: 1 } }
        });

        await expect(authService.login({
          cpf: '12345678901',
          senha: 'password'
        })).rejects.toThrow('Token não encontrado na resposta');
      });
    });

    describe('register', () => {
      it('deve registrar novo usuário', async () => {
        const mockResponse = {
          data: {
            token: 'test-token',
            user: {
              id: 1,
              nome: 'New User',
              email: 'new@example.com',
              cpf: '12345678901',
              nivelAcessoId: 2,
              nivelAcesso: 'User'
            }
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await authService.register({
          nome: 'New User',
          cpf: '12345678901',
          senha: 'password'
        });

        expect(result.token).toBe('test-token');
        expect(result.usuario.nome).toBe('New User');
      });
    });

    describe('getMe', () => {
      it('deve obter dados do usuário atual', async () => {
        const mockResponse = {
          data: {
            user: {
              id: 1,
              nome: 'Test User',
              email: 'test@example.com',
              cpf: '12345678901',
              nivelAcessoId: 1,
              nivelAcesso: 'Admin',
              nivelAcessoDescricao: 'Administrador'
            }
          }
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await authService.getMe();

        expect(result.id).toBe(1);
        expect(result.nome).toBe('Test User');
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/me');
      });
    });

    describe('changePassword', () => {
      it('deve alterar senha', async () => {
        mockedAxios.put.mockResolvedValue({ data: { success: true } });

        await authService.changePassword('oldPassword', 'newPassword');

        expect(mockedAxios.put).toHaveBeenCalledWith('/api/auth/change-password', {
          senhaAtual: 'oldPassword',
          novaSenha: 'newPassword'
        });
      });
    });
  });

  describe('usuarioService', () => {
    it('deve listar todos os usuários', async () => {
      mockedAxios.get.mockResolvedValue({ data: [{ id: 1, nome: 'User 1' }] });

      const result = await usuarioService.getAll();

      expect(result).toHaveLength(1);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/usuarios');
    });

    it('deve criar novo usuário', async () => {
      const userData = { nome: 'New User', cpf: '12345678901' };
      mockedAxios.post.mockResolvedValue({ data: { id: 1, ...userData } });

      const result = await usuarioService.create(userData);

      expect(result.id).toBe(1);
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/usuarios', userData);
    });

    it('deve atualizar usuário', async () => {
      mockedAxios.put.mockResolvedValue({ data: { id: 1, nome: 'Updated' } });

      const result = await usuarioService.update(1, { nome: 'Updated' });

      expect(result.nome).toBe('Updated');
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/usuarios/1', { nome: 'Updated' });
    });

    it('deve deletar usuário', async () => {
      mockedAxios.delete.mockResolvedValue({});

      await usuarioService.delete(1);

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/usuarios/1');
    });
  });

  describe('embarcacaoService', () => {
    it('deve listar embarcações', async () => {
      mockedAxios.get.mockResolvedValue({ data: [{ id: 1, nome: 'Embarcação 1' }] });

      const result = await embarcacaoService.getAll();

      expect(result).toHaveLength(1);
    });

    it('deve buscar embarcações por CPF', async () => {
      mockedAxios.get.mockResolvedValue({ data: [{ id: 1 }] });

      await embarcacaoService.getByCPF('12345678901');

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/embarcacoes', {
        params: { proprietario_cpf: '12345678901' }
      });
    });
  });

  describe('clienteService', () => {
    it('deve listar clientes', async () => {
      mockedAxios.get.mockResolvedValue({ data: [{ id: 1, nome: 'Cliente 1' }] });

      const result = await clienteService.getAll();

      expect(result).toHaveLength(1);
    });

    it('deve buscar cliente por documento', async () => {
      mockedAxios.get.mockResolvedValue({ data: { id: 1, cpf: '12345678901' } });

      const result = await clienteService.buscarPorDocumento('12345678901');

      expect(result.cpf).toBe('12345678901');
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/clientes/buscar/12345678901');
    });
  });

  describe('vistoriaService', () => {
    it('deve obter vistoria por ID', async () => {
      mockedAxios.get.mockResolvedValue({ data: { id: 1, status: 'pendente' } });

      const result = await vistoriaService.getById(1);

      expect(result.id).toBe(1);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/vistorias/1');
    });

    it('deve criar nova vistoria', async () => {
      const vistoriaData = { embarcacao_id: 1, local_id: 1 };
      mockedAxios.post.mockResolvedValue({ data: { id: 1, ...vistoriaData } });

      const result = await vistoriaService.create(vistoriaData);

      expect(result.id).toBe(1);
    });
  });

  describe('seguradoraService', () => {
    it('deve listar seguradoras', async () => {
      mockedAxios.get.mockResolvedValue({ data: [{ id: 1, nome: 'Seguradora 1' }] });

      const result = await seguradoraService.getAll();

      expect(result).toHaveLength(1);
    });

    it('deve obter tipos permitidos', async () => {
      mockedAxios.get.mockResolvedValue({ data: ['LANCHA', 'JET_SKI'] });

      const result = await seguradoraService.getTiposPermitidos(1);

      expect(result).toHaveLength(2);
      expect(result[0].tipo_embarcacao).toBe('LANCHA');
    });
  });

  describe('checklistService', () => {
    it('deve listar templates', async () => {
      mockedAxios.get.mockResolvedValue({ data: [{ id: 1, nome: 'Template 1' }] });

      const result = await checklistService.getTemplates();

      expect(result).toHaveLength(1);
    });

    it('deve obter template por tipo', async () => {
      mockedAxios.get.mockResolvedValue({ data: { id: 1, tipo_embarcacao: 'LANCHA' } });

      const result = await checklistService.getTemplateByTipo('LANCHA');

      expect(result.tipo_embarcacao).toBe('LANCHA');
    });
  });

  describe('laudoService', () => {
    it('deve listar laudos', async () => {
      mockedAxios.get.mockResolvedValue({ data: [{ id: 1 }] });

      const result = await laudoService.listar();

      expect(result).toHaveLength(1);
    });

    it('deve buscar laudo por ID', async () => {
      mockedAxios.get.mockResolvedValue({ data: { id: 1, numero_laudo: '202401A' } });

      const result = await laudoService.buscarPorId(1);

      expect(result.numero_laudo).toBe('202401A');
    });
  });

  describe('pagamentoService', () => {
    it('deve listar pagamentos', async () => {
      mockedAxios.get.mockResolvedValue({ data: [{ id: 1, status: 'pendente' }] });

      const result = await pagamentoService.getAll();

      expect(result).toHaveLength(1);
    });

    it('deve gerar lote de pagamento', async () => {
      const loteData = {
        vistoriador_id: 1,
        periodo_tipo: 'mensal',
        data_inicio: '2024-01-01',
        data_fim: '2024-01-31'
      };

      mockedAxios.post.mockResolvedValue({ data: { id: 1, ...loteData } });

      const result = await pagamentoService.gerarLote(loteData);

      expect(result.id).toBe(1);
    });
  });

  describe('dashboardService', () => {
    it('deve obter estatísticas', async () => {
      mockedAxios.get.mockResolvedValue({ data: { total: 100 } });

      const result = await dashboardService.getEstatisticas();

      expect(result.total).toBe(100);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/dashboard/estatisticas');
    });
  });

  describe('vistoriadorService', () => {
    it('deve obter vistorias do vistoriador', async () => {
      mockedAxios.get.mockResolvedValue({ data: [{ id: 1 }] });

      const result = await vistoriadorService.getVistorias();

      expect(result).toHaveLength(1);
    });

    it('deve iniciar vistoria', async () => {
      mockedAxios.put.mockResolvedValue({
        data: {
          message: 'Vistoria iniciada',
          vistoria: { id: 1 },
          data_inicio: '2024-01-01'
        }
      });

      const result = await vistoriadorService.iniciarVistoria(1);

      expect(result.message).toBe('Vistoria iniciada');
    });
  });
});


