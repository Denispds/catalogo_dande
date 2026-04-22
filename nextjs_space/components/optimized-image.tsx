'use client';

import React, { useState } from 'react';
import { getOptimizedImageUrl, getOptimizedSrcSet } from '@/lib/image-url';

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  srcSetWidths?: number[];
  onLoad?: () => void;
  onError?: () => void;
  draggable?: boolean;
  decoding?: 'async' | 'sync' | 'auto';
  style?: React.CSSProperties;
}

/**
 * Imagem otimizada que usa o proxy /api/image.
 * - Converte para WebP
 * - Redimensiona para o tamanho ideal
 * - Usa srcset para carregar tamanhos diferentes em cada dispositivo
 * - Lazy-loaded por padrão (desativa com priority={true})
 * - Gerencia estados de loading/error
 */
export default function OptimizedImage({
  src,
  alt,
  className = '',
  width = 640,
  sizes = '(max-width: 640px) 50vw, 33vw',
  priority = false,
  quality = 78,
  srcSetWidths = [240, 360, 480, 640, 800],
  onLoad,
  onError,
  draggable = false,
  decoding = 'async',
  style,
}: OptimizedImageProps) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${className}`}
        style={style}
      >
        <span className="text-2xl">💎</span>
      </div>
    );
  }

  const optimizedSrc = getOptimizedImageUrl(src, width, quality);
  const srcSet = getOptimizedSrcSet(src, srcSetWidths, quality);

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={optimizedSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={decoding}
      fetchPriority={priority ? 'high' : 'auto'}
      draggable={draggable}
      onLoad={onLoad}
      onError={() => {
        setErrored(true);
        onError?.();
      }}
      style={style}
    />
  );
}
