/**
 * Hook para executar operacoes assincronas de forma segura
 * Evita erros que travam a aplicacao e fornece tratamento padronizado
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface SafeAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface SafeAsyncOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
}

export function useSafeAsync<T>(
  asyncFn: () => Promise<T>,
  options: SafeAsyncOptions = {}
) {
  const {
    timeout = 30000,
    retries = 2,
    retryDelay = 1000,
    onError
  } = options;

  const [state, setState] = useState<SafeAsyncState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;

    // Cancelar requisicao anterior se existir
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        // Criar promise com timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Tempo limite excedido')), timeout);
        });

        const result = await Promise.race([asyncFn(), timeoutPromise]);

        if (mountedRef.current) {
          setState({ data: result, loading: false, error: null });
        }
        return result;
      } catch (err: any) {
        lastError = err;
        attempt++;

        // Se foi abortado, nao tentar novamente
        if (err.name === 'AbortError') {
          break;
        }

        // Se ainda tem tentativas, aguardar antes de tentar novamente
        if (attempt <= retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    // Todas as tentativas falharam
    if (mountedRef.current) {
      const errorMessage = lastError?.message || 'Erro desconhecido';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      onError?.(lastError as Error);
    }

    return null;
  }, [asyncFn, timeout, retries, retryDelay, onError]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
    isIdle: !state.loading && !state.error && !state.data
  };
}

/**
 * Funcao utilitaria para fetch seguro com timeout e retries
 */
export async function safeFetch(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Tempo limite da requisicao excedido');
    }
    throw error;
  }
}

/**
 * Funcao para carregar imagem de forma segura
 */
export function safeLoadImage(
  src: string,
  timeout: number = 15000
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeoutId = setTimeout(() => {
      img.src = '';
      reject(new Error('Tempo limite para carregar imagem'));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Erro ao carregar imagem'));
    };

    img.src = src;
  });
}

export default useSafeAsync;

