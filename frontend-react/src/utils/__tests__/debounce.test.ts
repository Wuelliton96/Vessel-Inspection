/**
 * Testes para debounce.ts
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { debounce, useDebounce } from '../debounce';

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce function', () => {
    it('deve atrasar execução da função', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('arg1');
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(499);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledWith('arg1');
    });

    it('deve cancelar chamadas anteriores', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 500);

      debouncedFn('arg1');
      jest.advanceTimersByTime(200);
      
      debouncedFn('arg2');
      jest.advanceTimersByTime(200);
      
      debouncedFn('arg3');
      jest.advanceTimersByTime(500);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3');
    });

    it('deve passar múltiplos argumentos', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2', 123);
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    it('deve permitir múltiplas execuções após timeout', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('first');

      debouncedFn('second');
      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('second');

      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('useDebounce hook', () => {
    it('deve retornar valor inicial imediatamente', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      
      expect(result.current).toBe('initial');
    });

    it('deve atrasar atualização do valor', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'updated', delay: 500 });
      
      // Valor ainda não mudou
      expect(result.current).toBe('initial');

      // Avançar o tempo
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Agora o valor deve ter mudado
      expect(result.current).toBe('updated');
    });

    it('deve cancelar atualização se valor mudar antes do delay', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'first', delay: 500 });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      rerender({ value: 'second', delay: 500 });
      act(() => {
        jest.advanceTimersByTime(200);
      });

      rerender({ value: 'third', delay: 500 });
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('third');
    });

    it('deve funcionar com diferentes tipos de dados', async () => {
      // Com número
      const { result: numResult, rerender: numRerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 0, delay: 100 } }
      );

      numRerender({ value: 42, delay: 100 });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(numResult.current).toBe(42);

      // Com objeto
      const { result: objResult, rerender: objRerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: { a: 1 }, delay: 100 } }
      );

      objRerender({ value: { a: 2, b: 3 }, delay: 100 });
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(objResult.current).toEqual({ a: 2, b: 3 });
    });

    it('deve limpar timeout ao desmontar', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const { unmount } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'test', delay: 500 } }
      );

      unmount();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});
