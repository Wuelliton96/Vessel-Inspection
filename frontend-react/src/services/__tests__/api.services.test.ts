/**
 * Testes para serviços da API
 */

import axios from 'axios';
import {
  authService,
  usuarioService,
  embarcacaoService,
  localService,
  vistoriaService,
  vistoriadorService,
  pagamentoService,
  seguradoraService,
  clienteService,
  checklistService,
  laudoService,
  configuracaoLaudoService,
  auditoriaService,
  dashboardService
} from '../api';

// Mock do axios
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  };
  return mockAxios;
});

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authService', () => {
    describe('login', () => {
      it('deve fazer login e retornar dados formatados', async () => {
        const mockResponse = {
          data: {
            token: 'test-token',
            user: {
              id: 1,
              nome: 'Test User',
              email: 'test@example.com',
              cpf: '12345678901',
              nivelAcessoId: 1,
              nivelAcesso: 'ADMIN',
              deveAtualizarSenha: false
            }
          }
        };
        
        (mockedAxios.post as jest.Mock).mockResolvedValue(mockResponse);
        
        const result = await authService.login({ cpf: '12345678901', senha: 'senha123' });
        
        expect(result.token).toBe('test-token');
        expect(result.usuario.nome).toBe('Test User');
        expect(result.usuario.nivelAcesso.nome).toBe('ADMIN');
      });

      it('deve lançar erro se token não encontrado', async () => {
        const mockResponse = {
          data: {
            user: { id: 1 }
          }
        };
        
        (mockedAxios.post as jest.Mock).mockResolvedValue(mockResponse);
        
        await expect(authService.login({ cpf: '123', senha: '123' }))
          .rejects.toThrow('Token não encontrado na resposta');
      });

      it('deve lançar erro se user não encontrado', async () => {
        const mockResponse = {
          data: {
            token: 'test-token'
          }
        };
        
        (mockedAxios.post as jest.Mock).mockResolvedValue(mockResponse);
        
        await expect(authService.login({ cpf: '123', senha: '123' }))
          .rejects.toThrow('Dados do usuário não encontrados na resposta');
      });
    });

    describe('register', () => {
      it('deve registrar e retornar dados formatados', async () => {
        const mockResponse = {
          data: {
            token: 'new-token',
            user: {
              id: 2,
              nome: 'New User',
              email: 'new@example.com',
              cpf: '98765432100',
              nivelAcessoId: 2,
              nivelAcesso: 'VISTORIADOR'
            }
          }
        };
        
        (mockedAxios.post as jest.Mock).mockResolvedValue(mockResponse);
        
        const result = await authService.register({
          nome: 'New User',
          cpf: '98765432100',
          senha: 'senha123'
        });
        
        expect(result.token).toBe('new-token');
        expect(result.usuario.nome).toBe('New User');
      });
    });

    describe('getMe', () => {
      it('deve retornar dados do usuário atual', async () => {
        const mockResponse = {
          data: {
            user: {
              id: 1,
              nome: 'Current User',
              email: 'current@example.com',
              cpf: '12345678901',
              nivelAcessoId: 1,
              nivelAcesso: 'ADMIN'
            }
          }
        };
        
        (mockedAxios.get as jest.Mock).mockResolvedValue(mockResponse);
        
        const result = await authService.getMe();
        
        expect(result.nome).toBe('Current User');
        expect(result.nivelAcesso.nome).toBe('ADMIN');
      });
    });

    describe('updatePassword', () => {
      it('deve atualizar senha e retornar dados', async () => {
        const mockResponse = {
          data: {
            token: 'new-token',
            user: {
              id: 1,
              nome: 'User',
              cpf: '12345678901',
              nivelAcessoId: 1,
              nivelAcesso: 'ADMIN',
              deveAtualizarSenha: false
            }
          }
        };
        
        (mockedAxios.put as jest.Mock).mockResolvedValue(mockResponse);
        
        const result = await authService.updatePassword('token', 'novaSenha123');
        
        expect(result.token).toBe('new-token');
        expect(result.usuario.deveAtualizarSenha).toBe(false);
      });
    });

    describe('changePassword', () => {
      it('deve alterar senha', async () => {
        (mockedAxios.put as jest.Mock).mockResolvedValue({ data: {} });
        
        await expect(authService.changePassword('senhaAtual', 'novaSenha'))
          .resolves.not.toThrow();
        
        expect(mockedAxios.put).toHaveBeenCalledWith('/api/auth/change-password', {
          senhaAtual: 'senhaAtual',
          novaSenha: 'novaSenha'
        });
      });
    });
  });

  describe('usuarioService', () => {
    it('deve listar todos os usuários', async () => {
      const mockUsers = [{ id: 1, nome: 'User 1' }, { id: 2, nome: 'User 2' }];
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: mockUsers });
      
      const result = await usuarioService.getAll();
      
      expect(result).toEqual(mockUsers);
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/usuarios');
    });

    it('deve buscar usuário por id', async () => {
      const mockUser = { id: 1, nome: 'User 1' };
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: mockUser });
      
      const result = await usuarioService.getById(1);
      
      expect(result).toEqual(mockUser);
    });

    it('deve criar usuário', async () => {
      const newUser = { nome: 'New User', cpf: '12345678901' };
      (mockedAxios.post as jest.Mock).mockResolvedValue({ data: { id: 1, ...newUser } });
      
      const result = await usuarioService.create(newUser);
      
      expect(result.nome).toBe('New User');
    });

    it('deve atualizar usuário', async () => {
      const updatedUser = { nome: 'Updated User' };
      (mockedAxios.put as jest.Mock).mockResolvedValue({ data: { id: 1, ...updatedUser } });
      
      const result = await usuarioService.update(1, updatedUser);
      
      expect(result.nome).toBe('Updated User');
    });

    it('deve deletar usuário', async () => {
      (mockedAxios.delete as jest.Mock).mockResolvedValue({});
      
      await expect(usuarioService.delete(1)).resolves.not.toThrow();
      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/usuarios/1');
    });

    it('deve resetar senha', async () => {
      (mockedAxios.post as jest.Mock).mockResolvedValue({});
      
      await usuarioService.resetPassword(1, { novaSenha: 'nova123' });
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/usuarios/1/reset-password', { novaSenha: 'nova123' });
    });

    it('deve toggle status', async () => {
      (mockedAxios.patch as jest.Mock).mockResolvedValue({ data: { id: 1, ativo: false } });
      
      const result = await usuarioService.toggleStatus(1);
      
      expect(result.ativo).toBe(false);
    });
  });

  describe('embarcacaoService', () => {
    it('deve listar embarcações', async () => {
      const mockEmbarcacoes = [{ id: 1, nome: 'Barco 1' }];
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: mockEmbarcacoes });
      
      const result = await embarcacaoService.getAll();
      
      expect(result).toEqual(mockEmbarcacoes);
    });

    it('deve listar embarcações por CPF do proprietário', async () => {
      const mockEmbarcacoes = [{ id: 1, nome: 'Barco 1' }];
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: mockEmbarcacoes });
      
      const result = await embarcacaoService.getAll('12345678901');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/embarcacoes', { params: { proprietario_cpf: '12345678901' } });
    });

    it('deve buscar embarcações por CPF', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [] });
      
      await embarcacaoService.getByCPF('12345678901');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/embarcacoes', { params: { proprietario_cpf: '12345678901' } });
    });

    it('deve criar embarcação', async () => {
      const newEmbarcacao = { nome: 'Nova Embarcação' };
      (mockedAxios.post as jest.Mock).mockResolvedValue({ data: { id: 1, ...newEmbarcacao } });
      
      const result = await embarcacaoService.create(newEmbarcacao);
      
      expect(result.nome).toBe('Nova Embarcação');
    });
  });

  describe('localService', () => {
    it('deve listar locais', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [] });
      
      await localService.getAll();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/locais');
    });

    it('deve atualizar local', async () => {
      (mockedAxios.put as jest.Mock).mockResolvedValue({ data: { id: 1, nome: 'Local Atualizado' } });
      
      const result = await localService.update(1, { nome: 'Local Atualizado' });
      
      expect(result.nome).toBe('Local Atualizado');
    });
  });

  describe('vistoriaService', () => {
    it('deve listar vistorias', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [] });
      
      await vistoriaService.getAll();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/vistorias');
    });

    it('deve atualizar vistoria', async () => {
      (mockedAxios.put as jest.Mock).mockResolvedValue({ data: { id: 1 } });
      
      await vistoriaService.update(1, { status_id: 2 });
      
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/vistorias/1', { status_id: 2 });
    });
  });

  describe('vistoriadorService', () => {
    it('deve listar vistorias do vistoriador', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [] });
      
      await vistoriadorService.getVistorias();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/vistoriador/vistorias');
    });

    it('deve iniciar vistoria', async () => {
      (mockedAxios.put as jest.Mock).mockResolvedValue({ 
        data: { message: 'ok', vistoria: {}, data_inicio: '2024-01-01' } 
      });
      
      const result = await vistoriadorService.iniciarVistoria(1);
      
      expect(result.message).toBe('ok');
    });

    it('deve atualizar status', async () => {
      (mockedAxios.put as jest.Mock).mockResolvedValue({ data: { id: 1 } });
      
      await vistoriadorService.updateStatus(1, 2, { dados: 'teste' });
      
      expect(mockedAxios.put).toHaveBeenCalledWith('/api/vistoriador/vistorias/1/status', {
        status_id: 2,
        dados_rascunho: { dados: 'teste' }
      });
    });

    it('deve obter status do checklist', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: { completed: 5, total: 10 } });
      
      const result = await vistoriadorService.getChecklistStatus(1);
      
      expect(result.completed).toBe(5);
    });

    it('deve obter tipos de foto do checklist', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [{ id: 1, nome: 'Frontal' }] });
      
      const result = await vistoriadorService.getTiposFotoChecklist();
      
      expect(result[0].nome).toBe('Frontal');
    });
  });

  describe('pagamentoService', () => {
    it('deve listar pagamentos com filtros', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [] });
      
      await pagamentoService.getAll({ status: 'PENDENTE' });
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/pagamentos', { params: { status: 'PENDENTE' } });
    });

    it('deve gerar lote', async () => {
      (mockedAxios.post as jest.Mock).mockResolvedValue({ data: { id: 1 } });
      
      const result = await pagamentoService.gerarLote({
        vistoriador_id: 1,
        periodo_tipo: 'MENSAL',
        data_inicio: '2024-01-01',
        data_fim: '2024-01-31'
      });
      
      expect(result.id).toBe(1);
    });

    it('deve marcar como pago', async () => {
      (mockedAxios.put as jest.Mock).mockResolvedValue({ data: { id: 1, status: 'PAGO' } });
      
      const result = await pagamentoService.marcarPago(1, { forma_pagamento: 'PIX' });
      
      expect(result.status).toBe('PAGO');
    });

    it('deve obter resumo financeiro', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ 
        data: { recebido: { total: 1000 }, pendente: { total: 500 } }
      });
      
      const result = await pagamentoService.getResumoFinanceiro();
      
      expect(result.recebido.total).toBe(1000);
    });
  });

  describe('seguradoraService', () => {
    it('deve listar seguradoras', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [] });
      
      await seguradoraService.getAll();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/seguradoras', { params: {} });
    });

    it('deve obter tipos permitidos (array de strings)', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: ['LANCHA', 'JET_SKI'] });
      
      const result = await seguradoraService.getTiposPermitidos(1);
      
      expect(result[0].tipo_embarcacao).toBe('LANCHA');
    });

    it('deve obter tipos permitidos (array de objetos)', async () => {
      const mockData = [{ id: 1, tipo_embarcacao: 'LANCHA' }];
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: mockData });
      
      const result = await seguradoraService.getTiposPermitidos(1);
      
      expect(result).toEqual(mockData);
    });

    it('deve retornar array vazio se não houver tipos', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [] });
      
      const result = await seguradoraService.getTiposPermitidos(1);
      
      expect(result).toEqual([]);
    });
  });

  describe('clienteService', () => {
    it('deve buscar cliente por documento', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: { id: 1, nome: 'Cliente' } });
      
      const result = await clienteService.buscarPorDocumento('12345678901');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/clientes/buscar/12345678901');
    });
  });

  describe('checklistService', () => {
    it('deve obter templates', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [] });
      
      await checklistService.getTemplates();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/checklists/templates');
    });

    it('deve copiar template para vistoria', async () => {
      (mockedAxios.post as jest.Mock).mockResolvedValue({ data: {} });
      
      await checklistService.copiarTemplateParaVistoria(1);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/checklists/vistoria/1/copiar-template');
    });

    it('deve atualizar status do item', async () => {
      (mockedAxios.patch as jest.Mock).mockResolvedValue({ data: { id: 1 } });
      
      await checklistService.atualizarStatusItem(1, { status: 'OK' as any });
      
      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/checklists/vistoria/item/1/status', { status: 'OK' });
    });
  });

  describe('laudoService', () => {
    it('deve listar laudos', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [] });
      
      await laudoService.listar();
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/laudos');
    });

    it('deve gerar PDF', async () => {
      (mockedAxios.post as jest.Mock).mockResolvedValue({ data: { url: '/laudos/1.pdf' } });
      
      const result = await laudoService.gerarPDF(1);
      
      expect(result.url).toBe('/laudos/1.pdf');
    });

    it('deve fazer download', async () => {
      const mockBlob = new Blob(['test']);
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: mockBlob });
      
      await laudoService.download(1);
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/laudos/1/download', { responseType: 'blob' });
    });
  });

  describe('configuracaoLaudoService', () => {
    it('deve obter configurações', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: { nome_empresa: 'Empresa' } });
      
      const result = await configuracaoLaudoService.get();
      
      expect(result.nome_empresa).toBe('Empresa');
    });

    it('deve atualizar configurações', async () => {
      (mockedAxios.put as jest.Mock).mockResolvedValue({ data: { nome_empresa: 'Nova Empresa' } });
      
      const result = await configuracaoLaudoService.update({ nome_empresa: 'Nova Empresa' });
      
      expect(result.nome_empresa).toBe('Nova Empresa');
    });
  });

  describe('auditoriaService', () => {
    it('deve listar com parâmetros', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: { registros: [] } });
      
      await auditoriaService.listar({ acao: 'LOGIN', page: 1 });
      
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('deve obter estatísticas', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: {} });
      
      await auditoriaService.estatisticas({ dataInicio: '2024-01-01' });
      
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('deve obter registros críticos', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: [] });
      
      await auditoriaService.criticos({ page: 1 });
      
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });

  describe('dashboardService', () => {
    it('deve obter estatísticas', async () => {
      (mockedAxios.get as jest.Mock).mockResolvedValue({ data: { total: 100 } });
      
      const result = await dashboardService.getEstatisticas();
      
      expect(result.total).toBe(100);
    });
  });
});



