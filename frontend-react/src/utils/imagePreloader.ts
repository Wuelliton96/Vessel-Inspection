/**
 * Utilitário para preload de imagens
 * Garante que as imagens sejam carregadas antes de serem exibidas
 */

import React from 'react';

export interface ImagePreloadResult {
  success: boolean;
  url: string;
  error?: string;
}

/**
 * Preload uma imagem e retorna uma Promise que resolve quando a imagem está carregada
 */
export function preloadImage(url: string, timeout: number = 10000): Promise<ImagePreloadResult> {
  return new Promise((resolve) => {
    if (!url) {
      resolve({ success: false, url, error: 'URL vazia' });
      return;
    }

    const img = new Image();
    let resolved = false;

    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ success: false, url, error: 'Timeout ao carregar imagem' });
      }
    }, timeout);

    img.onload = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve({ success: true, url });
      }
    };

    img.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve({ success: false, url, error: 'Erro ao carregar imagem' });
      }
    };

    // Iniciar carregamento
    img.src = url;
  });
}

/**
 * Preload múltiplas imagens em paralelo
 */
export async function preloadImages(
  urls: string[],
  timeout: number = 10000
): Promise<ImagePreloadResult[]> {
  const promises = urls.map(url => preloadImage(url, timeout));
  return Promise.all(promises);
}

/**
 * Hook para preload de imagem com estado de loading
 */
export function useImagePreloader() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadedUrl, setLoadedUrl] = React.useState<string | null>(null);

  const preload = React.useCallback(async (url: string, timeout: number = 10000) => {
    if (!url) {
      setError('URL vazia');
      setLoading(false);
      return null;
    }

    setLoading(true);
    setError(null);
    setLoadedUrl(null);

    try {
      const result = await preloadImage(url, timeout);
      if (result.success) {
        setLoadedUrl(result.url);
        setError(null);
        return result.url;
      } else {
        setError(result.error || 'Erro ao carregar imagem');
        setLoadedUrl(null);
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
      setLoadedUrl(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { preload, loading, error, loadedUrl };
}

