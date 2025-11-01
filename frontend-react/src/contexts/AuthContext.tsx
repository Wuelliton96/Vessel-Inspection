import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
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

  const login = async (email: string, senha: string) => {
    try {
      console.log('AuthContext: Iniciando login...');
      console.log('Email recebido:', email);
      console.log('Senha recebida:', senha ? '***' : 'vazia');
      
      console.log('Chamando authService.login...');
      const response = await authService.login({ email, senha });
      console.log('Response recebida:', response);
      
      const { token: newToken, usuario: newUsuario } = response;
      console.log('Token:', newToken ? 'presente' : 'ausente');
      console.log('Usuario:', newUsuario);
      
      console.log('Salvando no estado...');
      setToken(newToken);
      setUsuario(newUsuario);
      
      console.log('Salvando no localStorage...');
      localStorage.setItem('token', newToken);
      localStorage.setItem('usuario', JSON.stringify(newUsuario));
      
      console.log('Login concluído com sucesso!');
    } catch (error: any) {
      console.error('AuthContext: Erro no login:', error);
      console.error('AuthContext: Erro completo:', JSON.stringify(error, null, 2));
      console.error('AuthContext: Error response:', error.response);
      console.error('AuthContext: Error message:', error.message);
      
      // Re-throw o erro para que o componente Login possa tratá-lo
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

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  };

  const isAuthenticated = !!token && !!usuario;

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