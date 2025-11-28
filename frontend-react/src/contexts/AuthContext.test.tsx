import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/api';

// Mock do authService
jest.mock('../services/api', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    updatePassword: jest.fn(),
  },
}));

// Mock do localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  const createMockResponse = (overrides = {}) => ({
    token: 'mock-token',
    usuario: {
      id: 1,
      nome: 'Test User',
      email: 'test@example.com',
      nivelAcessoId: 1,
      ativo: true,
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      ...overrides.usuario,
    },
    ...overrides,
  });

  const renderAuthHook = () => renderHook(() => useAuth(), { wrapper });

  const setupLoginMock = (mockResponse = createMockResponse()) => {
    (authService.login as jest.Mock).mockResolvedValue(mockResponse);
    return mockResponse;
  };

  const performLogin = async (result: ReturnType<typeof renderAuthHook>['result'], email = 'test@example.com', password = 'password') => {
    await act(async () => {
      await result.current.login(email, password);
    });
  };

  const expectUnauthenticatedState = (result: ReturnType<typeof renderAuthHook>['result']) => {
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.usuario).toBeNull();
    expect(result.current.token).toBeNull();
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('provides authentication context', () => {
    const { result } = renderAuthHook();
    
    expect(result.current).toHaveProperty('usuario');
    expect(result.current).toHaveProperty('token');
    expect(result.current).toHaveProperty('login');
    expect(result.current).toHaveProperty('logout');
    expect(result.current).toHaveProperty('isAuthenticated');
  });

  test('initial state is not authenticated', () => {
    const { result } = renderAuthHook();
    expectUnauthenticatedState(result);
  });

  test('login sets user and token', async () => {
    const mockResponse = setupLoginMock();
    const { result } = renderAuthHook();

    await performLogin(result);

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.usuario).toEqual(mockResponse.usuario);
      expect(result.current.token).toBe(mockResponse.token);
    });
  });

  test('logout clears user and token', async () => {
    setupLoginMock();
    const { result } = renderAuthHook();

    await performLogin(result);

    act(() => {
      result.current.logout();
    });

    expectUnauthenticatedState(result);
  });

  test('throws error when useAuth is used outside provider', () => {
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    console.error = originalError;
  });
});

