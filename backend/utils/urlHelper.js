/**
 * Utilitário para normalizar URLs
 * Remove barras duplas e garante formato correto
 */

/**
 * Normaliza uma URL removendo barras duplas e garantindo formato correto
 */
function normalizeUrl(baseUrl, path) {
  if (!baseUrl) return path;
  if (!path) return baseUrl;
  
  // Remover barra final do baseUrl se existir
  const cleanBase = baseUrl.replace(/\/+$/, '');
  
  // Remover barra inicial do path se existir
  const cleanPath = path.replace(/^\/+/, '');
  
  // Combinar e remover barras duplas
  const combined = `${cleanBase}/${cleanPath}`;
  return combined.replace(/([^:]\/)\/+/g, '$1');
}

/**
 * Constrói URL completa para API de imagens
 */
function buildImageUrl(baseUrl, fotoId) {
  return normalizeUrl(baseUrl, `/api/fotos/${fotoId}/imagem`);
}

/**
 * Constrói URL completa para API de imagem-url
 */
function buildImageUrlEndpoint(baseUrl, fotoId) {
  return normalizeUrl(baseUrl, `/api/fotos/${fotoId}/imagem-url`);
}

module.exports = {
  normalizeUrl,
  buildImageUrl,
  buildImageUrlEndpoint
};

