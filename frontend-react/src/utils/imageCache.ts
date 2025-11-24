/**
 * Gerenciador de cache de imagens
 * Limpa cache quando necessário para evitar consumo excessivo de memória
 */

class ImageCacheManager {
  private cache: Map<string, HTMLImageElement> = new Map();
  private maxCacheSize: number = 50; // Máximo de imagens em cache

  /**
   * Adiciona imagem ao cache
   */
  addToCache(url: string, img: HTMLImageElement): void {
    // Se cache está cheio, remover a mais antiga
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(url, img);
  }

  /**
   * Obtém imagem do cache
   */
  getFromCache(url: string): HTMLImageElement | null {
    return this.cache.get(url) || null;
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    this.cache.forEach((img) => {
      // Limpar referência da imagem
      img.src = '';
      img.onload = null;
      img.onerror = null;
    });
    this.cache.clear();
    console.log('[ImageCache] Cache limpo');
  }

  /**
   * Limpa cache de URLs específicas
   */
  clearCacheForUrls(urls: string[]): void {
    urls.forEach(url => {
      const img = this.cache.get(url);
      if (img) {
        img.src = '';
        img.onload = null;
        img.onerror = null;
      }
      this.cache.delete(url);
    });
  }

  /**
   * Obtém tamanho do cache
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Instância singleton
export const imageCacheManager = new ImageCacheManager();

