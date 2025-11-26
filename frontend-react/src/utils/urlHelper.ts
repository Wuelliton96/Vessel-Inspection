/**
 * Utilitário para normalizar URLs
 * Remove barras duplas e garante formato correto
 */

/**
 * Normaliza uma URL removendo barras duplas e garantindo formato correto
 */
export function normalizeUrl(baseUrl: string, path: string): string {
  if (!baseUrl) return path;
  if (!path) return baseUrl;
  
  // Remover barra final do baseUrl se existir
  const cleanBase = baseUrl.replace(/\/+$/, '');
  
  // Remover barra inicial do path se existir
  const cleanPath = path.replace(/^\/+/, '');
  
  // Combinar e remover barras duplas
  const combined = `${cleanBase}/${cleanPath}`;
  // Usar replace com regex global ao invés de replaceAll (compatibilidade)
  return combined.replace(/([^:]\/)\/+/g, '$1');
}

/**
 * Constrói URL completa para API de imagens
 */
export function buildImageUrl(baseUrl: string, fotoId: number | string): string {
  return normalizeUrl(baseUrl, `/api/fotos/${fotoId}/imagem`);
}

/**
 * Constrói URL completa para API de imagem-url
 */
export function buildImageUrlEndpoint(baseUrl: string, fotoId: number | string): string {
  return normalizeUrl(baseUrl, `/api/fotos/${fotoId}/imagem-url`);
}

