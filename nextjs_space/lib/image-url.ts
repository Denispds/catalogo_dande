// Helper para construir URLs de imagens otimizadas
// Uso: getOptimizedImageUrl('https://i.ytimg.com/vi/Hs7bn5ICX2g/maxresdefault.jpg', 400, 80) =>
//   '/api/image?url=https%3A%2F%2Fs3%2F...&w=400&q=80'

export function getOptimizedImageUrl(
  originalUrl: string | null | undefined,
  width: number = 640,
  quality: number = 78,
): string {
  if (!originalUrl) return '';

  // Só otimiza URLs HTTPS. Para data URLs, blob URLs, etc., retorna sem modificar.
  if (!originalUrl.startsWith('http')) return originalUrl;

  const w = Math.max(32, Math.min(2048, Math.round(width)));
  const q = Math.max(10, Math.min(100, Math.round(quality)));
  return `/api/image?url=${encodeURIComponent(originalUrl)}&w=${w}&q=${q}`;
}

// Gera srcset string para uso em <img srcSet={...}>
export function getOptimizedSrcSet(
  originalUrl: string | null | undefined,
  widths: number[] = [320, 480, 640, 960],
  quality: number = 78,
): string {
  if (!originalUrl) return '';
  if (!originalUrl.startsWith('http')) return '';
  return widths
    .map((w) => `${getOptimizedImageUrl(originalUrl, w, quality)} ${w}w`)
    .join(', ');
}
