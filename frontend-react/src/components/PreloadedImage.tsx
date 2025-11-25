/**
 * Componente de imagem com preload
 * Garante que a imagem seja carregada antes de ser exibida
 */

import React, { useState, useEffect, useRef } from 'react';
import { preloadImage } from '../utils/imagePreloader';
import { imageCacheManager } from '../utils/imageCache';

interface PreloadedImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (error: string) => void;
  fallbackSrc?: string;
  timeout?: number;
  showLoading?: boolean;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  headers?: Record<string, string>;
}

const PreloadedImage: React.FC<PreloadedImageProps> = ({
  src,
  alt = '',
  className,
  style,
  onLoad,
  onError,
  fallbackSrc,
  timeout = 10000,
  showLoading = true,
  loadingComponent,
  errorComponent
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    // Reset quando src mudar
    setLoading(true);
    setError(null);
    setImageSrc(null);
    setCurrentSrc(src);
  }, [src]);

  const retryCountRef = useRef(0);
  const maxRetries = 2;

  useEffect(() => {
    let cancelled = false;
    retryCountRef.current = 0;

    const loadImage = async (url: string, isRetry: boolean = false): Promise<boolean> => {
      if (!url) {
        setLoading(false);
        setError('URL vazia');
        return false;
      }

      // Verificar cache primeiro
      const cachedImg = imageCacheManager.getFromCache(url);
      if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
        if (cancelled) return false;
        setImageSrc(url);
        setError(null);
        setLoading(false);
        onLoad?.();
        return true;
      }

      try {
        // Tentar preload da imagem
        const result = await preloadImage(url, timeout);
        
        if (cancelled) return false;

        if (result.success) {
          // Adicionar ao cache
          const img = new Image();
          img.src = result.url;
          imageCacheManager.addToCache(result.url, img);
          
          setImageSrc(result.url);
          setError(null);
          setLoading(false);
          onLoad?.();
          return true;
        } else {
          // Se falhou e ainda tem tentativas, tentar novamente
          if (retryCountRef.current < maxRetries && !isRetry) {
            retryCountRef.current++;
            console.log(`[PreloadedImage] Tentativa ${retryCountRef.current} de ${maxRetries} para: ${url}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current)); // Delay progressivo
            return await loadImage(url, true);
          }
          
          // Se falhar e tiver fallback, tentar fallback
          if (fallbackSrc && url !== fallbackSrc) {
            console.log('[PreloadedImage] Tentando fallback:', fallbackSrc);
            const fallbackResult = await loadImage(fallbackSrc, false);
            if (fallbackResult) {
              return true;
            }
          }
          
          // ÚLTIMA TENTATIVA: sempre usar URL diretamente na tag img (mesmo se preload falhar)
          // Isso garante que a imagem seja exibida se o servidor conseguir servir
          console.log('[PreloadedImage] Usando URL diretamente (última tentativa):', url);
          setImageSrc(url);
          setError(null);
          setLoading(false);
          // Não chamar onLoad aqui, deixar a tag img chamar quando carregar
          return true; // Sempre retornar true para tentar exibir
        }
      } catch (err: any) {
        if (cancelled) return false;
        
        // Se falhou e ainda tem tentativas, tentar novamente
        if (retryCountRef.current < maxRetries && !isRetry) {
          retryCountRef.current++;
          console.log(`[PreloadedImage] Erro, tentativa ${retryCountRef.current} de ${maxRetries} para: ${url}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCountRef.current)); // Delay progressivo
          return await loadImage(url, true);
        }
        
        // Se falhou tudo, tentar fallback
        if (fallbackSrc && url !== fallbackSrc) {
          console.log('[PreloadedImage] Erro no preload, tentando fallback:', fallbackSrc);
          const fallbackResult = await loadImage(fallbackSrc, false);
          if (fallbackResult) {
            return true;
          }
        }
        
        // ÚLTIMA TENTATIVA: sempre usar URL diretamente
        console.log('[PreloadedImage] Erro no preload, usando URL diretamente:', url);
        setImageSrc(url);
        setError(null);
        setLoading(false);
        return true; // Sempre tentar exibir
      }
    };

    loadImage(currentSrc);

    return () => {
      cancelled = true;
    };
  }, [currentSrc, fallbackSrc, timeout, onLoad, onError]);

  // Limpar blob URLs quando o componente desmontar ou imageSrc mudar
  // IMPORTANTE: Este hook deve vir ANTES de qualquer return condicional
  React.useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  if (loading && showLoading) {
    return (
      <div 
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f3f4f6',
          minHeight: '200px',
          color: '#6b7280'
        }}
      >
        {loadingComponent || (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '0.5rem' }}>Carregando imagem...</div>
            <div style={{ fontSize: '0.875rem' }}>Aguarde...</div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    return (
      <div 
        className={className}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fee2e2',
          minHeight: '200px',
          color: '#991b1b',
          padding: '1rem',
          textAlign: 'center'
        }}
      >
        <div>
          <div style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Erro ao carregar imagem</div>
          <div style={{ fontSize: '0.875rem' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!imageSrc) {
    return null;
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      crossOrigin="anonymous"
      onLoad={() => {
        console.log('[PreloadedImage] Imagem carregada com sucesso:', imageSrc);
        onLoad?.();
      }}
      onError={(e) => {
        console.error('[PreloadedImage] Erro ao renderizar imagem:', imageSrc);
        // Tentar fallback se disponível
        if (fallbackSrc && imageSrc !== fallbackSrc) {
          console.log('[PreloadedImage] Tentando fallback:', fallbackSrc);
          setCurrentSrc(fallbackSrc);
        } else {
          // Última tentativa: usar src original diretamente (pode funcionar mesmo com erro de preload)
          if (src && imageSrc !== src) {
            console.log('[PreloadedImage] Última tentativa: usando src original');
            setCurrentSrc(src);
          } else {
            setError('Erro ao renderizar imagem');
            onError?.('Erro ao renderizar imagem');
          }
        }
      }}
    />
  );
};

export default PreloadedImage;

