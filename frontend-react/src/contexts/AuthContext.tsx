import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Usuario } from '../types';
import { authService } from '../services/api';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (cpf: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  updatePassword: (token: string, novaSenha: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUsuario = localStorage.getItem('usuario');

    if (storedToken && storedUsuario) {
      setToken(storedToken);
      setUsuario(JSON.parse(storedUsuario));
    }
    setLoading(false);
  }, []);

  const login = async (cpf: string, senha: string) => {
    try {
      const response = await authService.login({ cpf, senha });
      const { token: newToken, usuario: newUsuario } = response;
      
      setToken(newToken);
      setUsuario(newUsuario);
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('usuario', JSON.stringify(newUsuario));
      
      // Marcar que o usuário acabou de fazer login (para mostrar alertas de novas vistorias)
      sessionStorage.setItem('justLoggedIn', 'true');
      // Limpar flag de alerta fechado ao fazer novo login
      sessionStorage.removeItem('newVistoriaAlertDismissed');
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const register = async (nome: string, email: string, senha: string) => {
    try {
      const response = await authService.register({ nome, email, senha });
      const { token: newToken, usuario: newUsuario } = response;
      
      setToken(newToken);
      setUsuario(newUsuario);
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('usuario', JSON.stringify(newUsuario));
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  };

  const logout = useCallback(() => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    // Limpar flags de sessão ao fazer logout
    sessionStorage.removeItem('justLoggedIn');
    sessionStorage.removeItem('newVistoriaAlertDismissed');
  }, []);

  const isAuthenticated = !!token && !!usuario;

  // Função para logout automático por inatividade
  const handleInactivityLogout = useCallback(() => {
    // Só faz logout se o usuário estiver autenticado
    if (token && usuario) {
      logout();
      // Usar window.location para garantir redirecionamento
      window.location.href = '/login';
    }
  }, [token, usuario, logout]);

  // Hook de timeout de inatividade (2 minutos) - só ativo se estiver autenticado
  useInactivityTimeout(
    handleInactivityLogout,
    isAuthenticated ? 2 * 60 * 1000 : Infinity // Se não autenticado, não faz nada
  );

  const updatePassword = async (token: string, novaSenha: string) => {
    try {
      const response = await authService.updatePassword(token, novaSenha);
      const { token: newToken, usuario: newUsuario } = response;

      setToken(newToken);
      setUsuario(newUsuario);

      localStorage.setItem('token', newToken);
      localStorage.setItem('usuario', JSON.stringify(newUsuario));
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    usuario,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};