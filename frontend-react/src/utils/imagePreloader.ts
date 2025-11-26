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
 * Suporta autenticação via token JWT
 */
export function preloadImage(url: string, timeout: number = 10000): Promise<ImagePreloadResult> {
  return new Promise((resolve) => {
    if (!url) {
      resolve({ success: false, url, error: 'URL vazia' });
      return;
    }

    // Normalizar URL (remover barras duplas)
    const normalizedUrl = url.replace(/([^:]\/)\/+/g, '$1');

    // Se a URL é da nossa API, precisamos usar fetch com autenticação
    const isApiUrl = normalizedUrl.includes('/api/fotos/') || normalizedUrl.includes('/uploads/');
    
    if (isApiUrl) {
      // Usar IIFE para executar async/await dentro do Promise executor
      (async () => {
        try {
          const token = localStorage.getItem('token');
          const headers: HeadersInit = {
            'Accept': 'image/*'
          };
          
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch(normalizedUrl, {
            method: 'GET',
            headers,
            signal: controller.signal,
            credentials: 'include',
            mode: 'cors',
            redirect: 'follow' // Seguir redirects automaticamente
          });

          clearTimeout(timeoutId);

          // Verificar se é um redirect (302, 301, etc)
          if (response.status >= 300 && response.status < 400) {
            // Se for redirect, tentar usar a URL final
            const finalUrl = response.url || normalizedUrl;
            console.log(`[preloadImage] Redirect detectado: ${normalizedUrl} -> ${finalUrl}`);
            // Tentar carregar a URL final diretamente (pode ser S3 presigned URL)
            const img = new Image();
            let resolved = false;
            const timeoutId = setTimeout(() => {
              if (!resolved) {
                resolved = true;
                // Se timeout, retornar URL original para tentar diretamente
                resolve({ success: true, url: normalizedUrl });
              }
            }, 5000);
            
            img.onload = () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeoutId);
                resolve({ success: true, url: finalUrl });
              }
            };
            img.onerror = () => {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeoutId);
                console.warn(`[preloadImage] Erro ao carregar URL após redirect, tentando original: ${finalUrl}`);
                // Retornar URL original para tentar diretamente
                resolve({ success: true, url: normalizedUrl });
              }
            };
            img.src = finalUrl;
            return;
          }

          if (!response.ok) {
            console.error(`[preloadImage] Erro HTTP ${response.status} ao carregar: ${normalizedUrl}`);
            // Se falhar, tentar usar a URL diretamente na tag img (pode funcionar mesmo com erro HTTP)
            const img = new Image();
            img.onload = () => {
              resolve({ success: true, url });
            };
            img.onerror = () => {
              resolve({ success: false, url, error: `Erro HTTP ${response.status}` });
            };
            img.src = normalizedUrl;
            return;
          }

          const blob = await response.blob();
          
          // Verificar se é uma imagem válida
          if (!blob.type.startsWith('image/')) {
            console.warn(`[preloadImage] Resposta não tem tipo image/, mas tentando mesmo assim: ${blob.type}`);
            // Mesmo sem tipo correto, tentar usar blob URL
          }

          const blobUrl = URL.createObjectURL(blob);

          // Verificar se a imagem é válida carregando ela
          const img = new Image();
          img.onload = () => {
            resolve({ success: true, url: blobUrl });
          };
          img.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            console.warn(`[preloadImage] Erro ao validar blob, tentando URL original: ${normalizedUrl}`);
            // Se blob falhar, tentar URL original diretamente
            const img2 = new Image();
            img2.onload = () => {
              resolve({ success: true, url: normalizedUrl });
            };
            img2.onerror = () => {
              resolve({ success: false, url: normalizedUrl, error: 'Erro ao validar imagem' });
            };
            img2.src = normalizedUrl;
          };
          img.src = blobUrl;
        } catch (error: any) {
          if (error.name === 'AbortError') {
            resolve({ success: false, url, error: 'Timeout ao carregar imagem' });
          } else {
            console.error(`[preloadImage] Erro ao carregar: ${url}`, error);
            resolve({ success: false, url, error: error.message || 'Erro ao carregar imagem' });
          }
        }
      })();
    } else {
      // Para URLs externas, usar método tradicional
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
    }
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

