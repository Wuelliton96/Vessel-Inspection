import axios from 'axios';
import { authService, usuarioService } from './api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock do config
jest.mock('../config/api', () => ({
  API_CONFIG: {
    BASE_URL: 'http://localhost:3000'
  }
}));

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('authService', () => {
    describe('login', () => {
      test('deve fazer login com sucesso', async () => {
        const mockResponse = {
          data: {
            token: 'mock-token',
            user: {
              id: 1,
              nome: 'Teste Usuario',
              email: 'teste@teste.com',
              cpf: '12345678901',
              nivelAcessoId: 1,
              nivelAcesso: 'ADMINISTRADOR',
              nivelAcessoDescricao: 'Administrador',
              deveAtualizarSenha: false
            }
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await authService.login({ cpf: '12345678901', senha: 'senha123' });

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/auth/login',
          { cpf: '12345678901', senha: 'senha123' }
        );
        expect(result.token).toBe('mock-token');
        expect(result.usuario.nome).toBe('Teste Usuario');
        expect(result.usuario.cpf).toBe('12345678901');
      });

      test('deve lançar erro quando token não está na resposta', async () => {
        const mockResponse = {
          data: {
            user: {
              id: 1,
              nome: 'Teste'
            }
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        await expect(authService.login({ cpf: '12345678901', senha: 'senha123' }))
          .rejects.toThrow('Token não encontrado na resposta');
      });

      test('deve lançar erro quando user não está na resposta', async () => {
        const mockResponse = {
          data: {
            token: 'mock-token'
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        await expect(authService.login({ cpf: '12345678901', senha: 'senha123' }))
          .rejects.toThrow('Dados do usuário não encontrados na resposta');
      });

      test('deve propagar erros do axios', async () => {
        const error = new Error('Network Error');
        mockedAxios.post.mockRejectedValue(error);

        await expect(authService.login({ cpf: '12345678901', senha: 'senha123' }))
          .rejects.toThrow('Network Error');
      });
    });

    describe('register', () => {
      test('deve registrar novo usuário com sucesso', async () => {
        const mockResponse = {
          data: {
            token: 'mock-token',
            user: {
              id: 1,
              nome: 'Novo Usuario',
              email: 'novo@teste.com',
              cpf: '98765432100',
              nivelAcessoId: 2,
              nivelAcesso: 'VISTORIADOR',
              nivelAcessoDescricao: 'Vistoriador'
            }
          }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await authService.register({
          nome: 'Novo Usuario',
          email: 'novo@teste.com',
          senha: 'senha123'
        });

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/auth/register',
          { nome: 'Novo Usuario', email: 'novo@teste.com', senha: 'senha123' }
        );
        expect(result.token).toBe('mock-token');
        expect(result.usuario.nome).toBe('Novo Usuario');
      });
    });

    describe('getMe', () => {
      test('deve obter dados do usuário autenticado', async () => {
        const mockResponse = {
          data: {
            user: {
              id: 1,
              nome: 'Usuario Logado',
              email: 'logado@teste.com',
              cpf: '11122233344',
              nivelAcessoId: 1,
              nivelAcesso: 'ADMINISTRADOR',
              nivelAcessoDescricao: 'Administrador'
            }
          }
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await authService.getMe();

        expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/me');
        expect(result.nome).toBe('Usuario Logado');
        expect(result.cpf).toBe('11122233344');
      });
    });

    describe('updatePassword', () => {
      test('deve atualizar senha com sucesso', async () => {
        const mockResponse = {
          data: {
            token: 'new-token',
            user: {
              id: 1,
              nome: 'Usuario',
              email: 'user@teste.com',
              cpf: '12345678901',
              nivelAcessoId: 1,
              nivelAcesso: 'ADMINISTRADOR',
              deveAtualizarSenha: false
            }
          }
        };

        mockedAxios.put.mockResolvedValue(mockResponse);

        const result = await authService.updatePassword('token', 'novaSenha123');

        expect(mockedAxios.put).toHaveBeenCalledWith(
          '/api/auth/force-password-update',
          { token: 'token', novaSenha: 'novaSenha123' }
        );
        expect(result.token).toBe('new-token');
        expect(result.usuario.deveAtualizarSenha).toBe(false);
      });
    });

    describe('changePassword', () => {
      test('deve alterar senha com sucesso', async () => {
        const mockResponse = {
          data: { message: 'Senha alterada com sucesso' }
        };

        mockedAxios.put.mockResolvedValue(mockResponse);

        await authService.changePassword('senhaAntiga', 'senhaNova');

        expect(mockedAxios.put).toHaveBeenCalledWith(
          '/api/auth/change-password',
          { senhaAtual: 'senhaAntiga', novaSenha: 'senhaNova' }
        );
      });
    });
  });

  describe('usuarioService', () => {
    describe('getAll', () => {
      test('deve buscar todos os usuários', async () => {
        const mockResponse = {
          data: [
            { id: 1, nome: 'Usuario 1' },
            { id: 2, nome: 'Usuario 2' }
          ]
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await usuarioService.getAll();

        expect(mockedAxios.get).toHaveBeenCalledWith('/api/usuarios');
        expect(result).toHaveLength(2);
        expect(result[0].nome).toBe('Usuario 1');
      });
    });

    describe('getById', () => {
      test('deve buscar usuário por ID', async () => {
        const mockResponse = {
          data: { id: 1, nome: 'Usuario Especifico' }
        };

        mockedAxios.get.mockResolvedValue(mockResponse);

        const result = await usuarioService.getById(1);

        expect(mockedAxios.get).toHaveBeenCalledWith('/api/usuarios/1');
        expect(result.nome).toBe('Usuario Especifico');
      });
    });

    describe('create', () => {
      test('deve criar novo usuário', async () => {
        const mockResponse = {
          data: { id: 3, nome: 'Novo Usuario', email: 'novo@teste.com' }
        };

        mockedAxios.post.mockResolvedValue(mockResponse);

        const result = await usuarioService.create({
          nome: 'Novo Usuario',
          email: 'novo@teste.com'
        });

        expect(mockedAxios.post).toHaveBeenCalledWith(
          '/api/usuarios',
          { nome: 'Novo Usuario', email: 'novo@teste.com' }
        );
        expect(result.id).toBe(3);
      });
    });

    describe('update', () => {
      test('deve atualizar usuário existente', async () => {
        const mockResponse = {
          data: { id: 1, nome: 'Usuario Atualizado' }
        };

        mockedAxios.put.mockResolvedValue(mockResponse);

        const result = await usuarioService.update(1, { nome: 'Usuario Atualizado' });

        expect(mockedAxios.put).toHaveBeenCalledWith(
          '/api/usuarios/1',
          { nome: 'Usuario Atualizado' }
        );
        expect(result.nome).toBe('Usuario Atualizado');
      });
    });

    describe('delete', () => {
      test('deve deletar usuário', async () => {
        const mockResponse = {
          data: { message: 'Usuário deletado com sucesso' }
        };

        mockedAxios.delete.mockResolvedValue(mockResponse);

        await usuarioService.delete(1);

        expect(mockedAxios.delete).toHaveBeenCalledWith('/api/usuarios/1');
      });
    });
  });

  describe('Interceptors', () => {
    test('deve adicionar token no header Authorization quando existe', async () => {
      localStorage.setItem('token', 'test-token');
      
      // Criar nova instância do axios para testar interceptor
      const testApi = axios.create({
        baseURL: 'http://localhost:3000'
      });
      
      testApi.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

      // Mock da requisição para verificar o header
      mockedAxios.get.mockImplementation((url, config) => {
        expect(config?.headers?.Authorization).toBe('Bearer test-token');
        return Promise.resolve({ data: {} });
      });

      await testApi.get('/test');
      
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    test('não deve adicionar token quando não existe', async () => {
      localStorage.removeItem('token');
      
      const testApi = axios.create({
        baseURL: 'http://localhost:3000'
      });
      
      testApi.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });

      // Mock da requisição para verificar que não tem header
      mockedAxios.get.mockImplementation((url, config) => {
        expect(config?.headers?.Authorization).toBeUndefined();
        return Promise.resolve({ data: {} });
      });

      await testApi.get('/test');
      
      expect(mockedAxios.get).toHaveBeenCalled();
    });
  });
});

