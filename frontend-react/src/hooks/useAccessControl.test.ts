import { renderHook } from '@testing-library/react';
import { useAccessControl } from './useAccessControl';
import { useAuth } from '../contexts/AuthContext';

// Mock do useAuth
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('useAccessControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('identifies admin user correctly', () => {
    (useAuth as jest.Mock).mockReturnValue({
      usuario: {
        id: 1,
        nome: 'Admin User',
        email: 'admin@example.com',
        nivelAcessoId: 1,
        nivelAcesso: { id: 1, nome: 'ADMIN', descricao: 'Administrador' },
        ativo: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      },
    });

    const { result } = renderHook(() => useAccessControl());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isVistoriador).toBe(false);
    expect(result.current.userLevel).toBe('ADMIN');
  });

  test('identifies vistoriador user correctly', () => {
    (useAuth as jest.Mock).mockReturnValue({
      usuario: {
        id: 2,
        nome: 'Vistoriador User',
        email: 'vistoriador@example.com',
        nivelAcessoId: 2,
        nivelAcesso: { id: 2, nome: 'VISTORIADOR', descricao: 'Vistoriador' },
        ativo: true,
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
      },
    });

    const { result } = renderHook(() => useAccessControl());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isVistoriador).toBe(true);
    expect(result.current.userLevel).toBe('VISTORIADOR');
  });

  test('canAccess returns correct permissions for admin', () => {
    (useAuth as jest.Mock).mockReturnValue({
      usuario: {
        id: 1,
        nivelAcessoId: 1,
        nivelAcesso: { id: 1, nome: 'ADMIN' },
      },
    });

    const { result } = renderHook(() => useAccessControl());

    expect(result.current.canAccess('admin')).toBe(true);
    expect(result.current.canAccess('vistoriador')).toBe(true);
    expect(result.current.canAccess('all')).toBe(true);
  });

  test('canAccess returns correct permissions for vistoriador', () => {
    (useAuth as jest.Mock).mockReturnValue({
      usuario: {
        id: 2,
        nivelAcessoId: 2,
        nivelAcesso: { id: 2, nome: 'VISTORIADOR' },
      },
    });

    const { result } = renderHook(() => useAccessControl());

    expect(result.current.canAccess('admin')).toBe(false);
    expect(result.current.canAccess('vistoriador')).toBe(true);
    expect(result.current.canAccess('all')).toBe(true);
  });

  test('getVisibleMenuItems returns all items for admin', () => {
    (useAuth as jest.Mock).mockReturnValue({
      usuario: {
        id: 1,
        nivelAcessoId: 1,
        nivelAcesso: { id: 1, nome: 'ADMIN' },
      },
    });

    const { result } = renderHook(() => useAccessControl());
    const menuItems = result.current.getVisibleMenuItems();

    expect(menuItems.length).toBeGreaterThan(0);
    expect(menuItems.some(item => item.label === 'Dashboard')).toBe(true);
    expect(menuItems.some(item => item.label === 'Embarcações')).toBe(true);
    expect(menuItems.some(item => item.label === 'Gerenciar Usuários')).toBe(true);
  });

  test('getVisibleMenuItems returns limited items for vistoriador', () => {
    (useAuth as jest.Mock).mockReturnValue({
      usuario: {
        id: 2,
        nivelAcessoId: 2,
        nivelAcesso: { id: 2, nome: 'VISTORIADOR' },
      },
    });

    const { result } = renderHook(() => useAccessControl());
    const menuItems = result.current.getVisibleMenuItems();

    expect(menuItems.length).toBe(2);
    expect(menuItems.some(item => item.label === 'Dashboard')).toBe(true);
    expect(menuItems.some(item => item.label === 'Vistorias')).toBe(true);
    expect(menuItems.some(item => item.label === 'Gerenciar Usuários')).toBe(false);
  });

  test('returns empty menu for user without nivel', () => {
    (useAuth as jest.Mock).mockReturnValue({
      usuario: {
        id: 3,
        nivelAcessoId: 999,
      },
    });

    const { result } = renderHook(() => useAccessControl());
    const menuItems = result.current.getVisibleMenuItems();

    expect(menuItems.length).toBe(0);
  });
});

