import { debounce, useDebounce } from '../debounce';
import { renderHook, act } from '@testing-library/react';

describe('debounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve executar a função após o delay', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2');
    
    expect(mockFn).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('deve cancelar execução anterior se chamado novamente antes do delay', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('first');
    
    act(() => {
      jest.advanceTimersByTime(50);
    });
    
    debouncedFn('second');
    
    act(() => {
      jest.advanceTimersByTime(50);
    });
    
    expect(mockFn).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(50);
    });
    
    expect(mockFn).toHaveBeenCalledWith('second');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve retornar o valor inicial imediatamente', () => {
    const { result } = renderHook(() => useDebounce('initial', 100));
    expect(result.current).toBe('initial');
  });

  it('deve atualizar o valor após o delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 100 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 100 });

    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current).toBe('updated');
  });

  it('deve cancelar atualização anterior se o valor mudar novamente', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 100 } }
    );

    rerender({ value: 'second', delay: 100 });

    act(() => {
      jest.advanceTimersByTime(50);
    });

    rerender({ value: 'third', delay: 100 });

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(result.current).toBe('first');

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(result.current).toBe('third');
  });
});

