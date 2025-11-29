/**
 * Testes para useInactivityTimeout.ts
 */

import { renderHook, act } from '@testing-library/react';
import { useInactivityTimeout } from '../useInactivityTimeout';

describe('useInactivityTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve executar callback após timeout de inatividade', () => {
    const callback = jest.fn();
    const timeout = 1000; // 1 segundo

    renderHook(() => useInactivityTimeout(callback, timeout));

    expect(callback).not.toHaveBeenCalled();

    // Avançar tempo
    act(() => {
      jest.advanceTimersByTime(timeout);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('deve usar timeout padrão de 2 minutos', () => {
    const callback = jest.fn();
    const defaultTimeout = 2 * 60 * 1000; // 2 minutos

    renderHook(() => useInactivityTimeout(callback));

    expect(callback).not.toHaveBeenCalled();

    // Avançar tempo menos que 2 minutos
    act(() => {
      jest.advanceTimersByTime(defaultTimeout - 1000);
    });

    expect(callback).not.toHaveBeenCalled();

    // Completar o tempo
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('deve resetar timeout em eventos de atividade', () => {
    const callback = jest.fn();
    const timeout = 1000;

    renderHook(() => useInactivityTimeout(callback, timeout));

    // Avançar metade do tempo
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Simular atividade (click)
    act(() => {
      window.dispatchEvent(new MouseEvent('click'));
    });

    // Avançar mais tempo (mas não deve ter completado porque resetou)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();

    // Completar o tempo desde a última atividade
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('deve resetar timeout em mousedown', () => {
    const callback = jest.fn();
    const timeout = 1000;

    renderHook(() => useInactivityTimeout(callback, timeout));

    act(() => {
      jest.advanceTimersByTime(500);
      window.dispatchEvent(new MouseEvent('mousedown'));
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('deve resetar timeout em mousemove', () => {
    const callback = jest.fn();
    const timeout = 1000;

    renderHook(() => useInactivityTimeout(callback, timeout));

    act(() => {
      jest.advanceTimersByTime(500);
      window.dispatchEvent(new MouseEvent('mousemove'));
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('deve resetar timeout em keypress', () => {
    const callback = jest.fn();
    const timeout = 1000;

    renderHook(() => useInactivityTimeout(callback, timeout));

    act(() => {
      jest.advanceTimersByTime(500);
      window.dispatchEvent(new KeyboardEvent('keypress'));
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('deve resetar timeout em keydown', () => {
    const callback = jest.fn();
    const timeout = 1000;

    renderHook(() => useInactivityTimeout(callback, timeout));

    act(() => {
      jest.advanceTimersByTime(500);
      window.dispatchEvent(new KeyboardEvent('keydown'));
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('deve resetar timeout em scroll', () => {
    const callback = jest.fn();
    const timeout = 1000;

    renderHook(() => useInactivityTimeout(callback, timeout));

    act(() => {
      jest.advanceTimersByTime(500);
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('deve resetar timeout em touchstart', () => {
    const callback = jest.fn();
    const timeout = 1000;

    renderHook(() => useInactivityTimeout(callback, timeout));

    act(() => {
      jest.advanceTimersByTime(500);
      window.dispatchEvent(new TouchEvent('touchstart'));
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('não deve fazer nada se timeout for Infinity', () => {
    const callback = jest.fn();

    renderHook(() => useInactivityTimeout(callback, Infinity));

    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000); // 10 minutos
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('deve limpar event listeners ao desmontar', () => {
    const callback = jest.fn();
    const timeout = 1000;
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useInactivityTimeout(callback, timeout));

    unmount();

    // Verificar que os listeners foram removidos
    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function), true);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), true);

    removeEventListenerSpy.mockRestore();
  });

  it('deve atualizar callback quando mudar', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const timeout = 1000;

    const { rerender } = renderHook(
      ({ callback }) => useInactivityTimeout(callback, timeout),
      { initialProps: { callback: callback1 } }
    );

    rerender({ callback: callback2 });

    act(() => {
      jest.advanceTimersByTime(timeout);
    });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('deve limpar timeout anterior ao atualizar timeout', () => {
    const callback = jest.fn();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { rerender } = renderHook(
      ({ timeout }) => useInactivityTimeout(callback, timeout),
      { initialProps: { timeout: 1000 } }
    );

    rerender({ timeout: 2000 });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
