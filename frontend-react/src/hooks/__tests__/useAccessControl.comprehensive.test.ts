/**
 * Testes abrangentes para hooks/useAccessControl.ts
 */

import { renderHook } from '@testing-library/react';
import { useAccessControl } from '../useAccessControl';
import { useAuth } from '../../contexts/AuthContext';

// Mock do useAuth
jest.mock('../../contexts/AuthContext');

const mockUseAuth = useAuth as jest.Mock;

describe('useAccessControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAdmin', () => {
    it('deve retornar true para admin (nivelAcessoId = 1)', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nivelAcessoId: 1 },
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isAdmin).toBe(true);
    });

    it('deve retornar false para vistoriador', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 2, nivelAcessoId: 2 },
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isAdmin).toBe(false);
    });

    it('deve retornar false quando usuário é null', () => {
      mockUseAuth.mockReturnValue({
        usuario: null,
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isAdmin).toBe(false);
    });

    it('deve retornar false quando usuário é undefined', () => {
      mockUseAuth.mockReturnValue({
        usuario: undefined,
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isAdmin).toBe(false);
    });
  });

  describe('isVistoriador', () => {
    it('deve retornar true para vistoriador (nivelAcessoId = 2)', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 2, nivelAcessoId: 2 },
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isVistoriador).toBe(true);
    });

    it('deve retornar false para admin', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nivelAcessoId: 1 },
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isVistoriador).toBe(false);
    });

    it('deve retornar false quando usuário é null', () => {
      mockUseAuth.mockReturnValue({
        usuario: null,
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.isVistoriador).toBe(false);
    });
  });

  describe('canAccess', () => {
    it('deve retornar true para admin em requiredLevel admin', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nivelAcessoId: 1 },
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canAccess('admin')).toBe(true);
    });

    it('deve retornar true para qualquer usuário em requiredLevel all', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 2, nivelAcessoId: 2 },
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canAccess('all')).toBe(true);
    });

    it('deve retornar true para vistoriador em requiredLevel vistoriador', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 2, nivelAcessoId: 2 },
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canAccess('vistoriador')).toBe(true);
    });

    it('deve retornar true para admin em requiredLevel vistoriador', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nivelAcessoId: 1 },
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canAccess('vistoriador')).toBe(true);
    });

    it('deve retornar false para vistoriador em requiredLevel admin', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 2, nivelAcessoId: 2 },
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.canAccess('admin')).toBe(false);
    });
  });

  describe('getVisibleMenuItems', () => {
    it('deve retornar itens de menu para admin', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nivelAcessoId: 1 },
      });

      const { result } = renderHook(() => useAccessControl());
      const menuItems = result.current.getVisibleMenuItems();

      expect(Array.isArray(menuItems)).toBe(true);
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('deve incluir auditoria apenas para admin primário (id=1)', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nivelAcessoId: 1 },
      });

      const { result } = renderHook(() => useAccessControl());
      const menuItems = result.current.getVisibleMenuItems();

      const auditoriaItem = menuItems.find(item => item.path === '/auditoria');
      expect(auditoriaItem).toBeDefined();
    });

    it('não deve incluir auditoria para outros admins', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 2, nivelAcessoId: 1 },
      });

      const { result } = renderHook(() => useAccessControl());
      const menuItems = result.current.getVisibleMenuItems();

      const auditoriaItem = menuItems.find(item => item.path === '/auditoria');
      expect(auditoriaItem).toBeUndefined();
    });

    it('deve retornar itens de menu limitados para vistoriador', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 2, nivelAcessoId: 2 },
      });

      const { result } = renderHook(() => useAccessControl());
      const menuItems = result.current.getVisibleMenuItems();

      expect(Array.isArray(menuItems)).toBe(true);
      expect(menuItems.length).toBe(2);
      expect(menuItems.find(item => item.path === '/')).toBeDefined();
      expect(menuItems.find(item => item.path === '/vistorias')).toBeDefined();
    });

    it('deve retornar lista vazia quando usuário é null', () => {
      mockUseAuth.mockReturnValue({
        usuario: null,
      });

      const { result } = renderHook(() => useAccessControl());
      const menuItems = result.current.getVisibleMenuItems();

      expect(menuItems).toEqual([]);
    });

    it('itens devem ter path, label e icon', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nivelAcessoId: 1 },
      });

      const { result } = renderHook(() => useAccessControl());
      const menuItems = result.current.getVisibleMenuItems();

      menuItems.forEach(item => {
        expect(item).toHaveProperty('path');
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('icon');
      });
    });
  });

  describe('userLevel', () => {
    it('deve retornar nome do nível de acesso', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nivelAcessoId: 1, nivelAcesso: { nome: 'ADMIN' } },
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.userLevel).toBe('ADMIN');
    });

    it('deve retornar DESCONHECIDO quando nivelAcesso é undefined', () => {
      mockUseAuth.mockReturnValue({
        usuario: { id: 1, nivelAcessoId: 1 },
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.userLevel).toBe('DESCONHECIDO');
    });

    it('deve retornar DESCONHECIDO quando usuário é null', () => {
      mockUseAuth.mockReturnValue({
        usuario: null,
      });

      const { result } = renderHook(() => useAccessControl());

      expect(result.current.userLevel).toBe('DESCONHECIDO');
    });
  });
});

