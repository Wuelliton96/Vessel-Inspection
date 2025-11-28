import { renderHook, act, waitFor } from '@testing-library/react';
import { useInactivityTimeout } from '../useInactivityTimeout';

// Mock de eventos do window
const createMockEvent = (type: string) => {
  return new Event(type, { bubbles: true });
};

describe('useInactivityTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('deve executar callback após timeout de inatividade', async () => {
    const callback = jest.fn();
    const timeout = 2000;

    renderHook(() => useInactivityTimeout(callback, timeout));

    // Avançar tempo sem atividade
    act(() => {
      jest.advanceTimersByTime(timeout);
    });

    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  it('não deve executar callback se houver atividade antes do timeout', () => {
    const callback = jest.fn();
    const timeout = 2000;

    renderHook(() => useInactivityTimeout(callback, timeout));

    // Simular atividade antes do timeout
    act(() => {
      jest.advanceTimersByTime(1000);
      window.dispatchEvent(createMockEvent('mousedown'));
    });

    // Avançar tempo restante
    act(() => {
      jest.advanceTimersByTime(timeout);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('deve resetar timeout quando houver atividade', () => {
    const callback = jest.fn();
    const timeout = 2000;

    renderHook(() => useInactivityTimeout(callback, timeout));

    // Simular atividade
    act(() => {
      jest.advanceTimersByTime(1000);
      window.dispatchEvent(createMockEvent('click'));
    });

    // Avançar tempo após atividade
    act(() => {
      jest.advanceTimersByTime(timeout);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('deve responder a múltiplos tipos de eventos', () => {
    const callback = jest.fn();
    const timeout = 2000;

    renderHook(() => useInactivityTimeout(callback, timeout));

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown'];

    events.forEach(eventType => {
      act(() => {
        jest.advanceTimersByTime(500);
        window.dispatchEvent(createMockEvent(eventType));
      });
    });

    // Avançar timeout após última atividade
    act(() => {
      jest.advanceTimersByTime(timeout);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('não deve fazer nada quando timeout é Infinity', () => {
    const callback = jest.fn();

    renderHook(() => useInactivityTimeout(callback, Infinity));

    act(() => {
      jest.advanceTimersByTime(100000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('deve atualizar callback quando mudar', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const timeout = 2000;

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

  it('deve limpar timeout quando componente desmonta', () => {
    const callback = jest.fn();
    const timeout = 2000;

    const { unmount } = renderHook(() => useInactivityTimeout(callback, timeout));

    unmount();

    act(() => {
      jest.advanceTimersByTime(timeout);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('deve remover event listeners quando componente desmonta', () => {
    const callback = jest.fn();
    const timeout = 2000;

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useInactivityTimeout(callback, timeout));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalled();
    removeEventListenerSpy.mockRestore();
  });

  it('deve usar timeout padrão quando não fornecido', () => {
    const callback = jest.fn();
    const defaultTimeout = 2 * 60 * 1000; // 2 minutos

    renderHook(() => useInactivityTimeout(callback));

    act(() => {
      jest.advanceTimersByTime(defaultTimeout);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });
});

