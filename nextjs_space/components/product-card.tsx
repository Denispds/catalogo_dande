'use client';

import React, { useState, useRef } from 'react';
import { Share2, Check, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface MediaItem {
  url: string;
  tipo?: string;
  thumbnailUrl?: string;
}

interface ProductCardProps {
  produto: any;
  onShare?: (produto: any) => void;
  showPrice?: boolean;
  showCode?: boolean;
  layout?: 'grid' | 'single' | 'list';
  selected?: boolean;
  onSelect?: (produto: any) => void;
  selectionMode?: boolean;
  onImageTap?: (produto: any, imageIndex: number) => void;
}

function shortName(nome: string | undefined | null): string {
  if (!nome) return '';
  const words = nome.trim().split(/\s+/);
  return words.slice(0, 2).join(' ');
}

export default function ProductCard({
  produto,
  onShare,
  showPrice = true,
  showCode = true,
  layout = 'grid',
  selected = false,
  onSelect,
  selectionMode = false,
  onImageTap,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const media: MediaItem[] = produto?.imagens ?? [];
  const hasMultipleMedia = media.length > 1;
  const current = media[activeImgIdx];
  const isVideo = current?.tipo === 'video';
  const displayUrl = isVideo ? (current?.thumbnailUrl || current?.url) : current?.url;

  const fmt = (v: number) => `R$ ${v?.toFixed(2)?.replace('.', ',')}`;

  const goNext = () => setActiveImgIdx((prev) => (prev + 1) % media.length);
  const goPrev = () => setActiveImgIdx((prev) => (prev - 1 + media.length) % media.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !hasMultipleMedia) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStartRef.current = null;
  };

  const handleTap = () => {
    if (selectionMode && onSelect) {
      onSelect(produto);
    }
  };

  const handleImageTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectionMode && onSelect) {
      onSelect(produto);
      return;
    }
    if (onImageTap && media.length > 0) {
      onImageTap(produto, activeImgIdx);
    }
  };

  const handleDotClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    setActiveImgIdx(idx);
  };

  // Indicators
  const MediaIndicators = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
    if (!hasMultipleMedia) return null;
    const dotActive = size === 'md' ? 'w-5 h-2' : 'w-4 h-1.5';
    const dotInactive = size === 'md' ? 'w-2 h-2' : 'w-1.5 h-1.5';
    return (
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
        {media.map((_: MediaItem, i: number) => {
          const isVid = _?.tipo === 'video';
          const isActive = i === activeImgIdx;
          return (
            <button
              key={i}
              onClick={(e) => handleDotClick(e, i)}
              className={`rounded-full transition-all duration-300 flex items-center justify-center ${
                isActive ? `${dotActive} bg-white shadow-sm` : `${dotInactive} bg-white/50 hover:bg-white/70`
              }`}
            >
              {isVid && isActive && <Play size={6} fill="currentColor" className="text-primary ml-px" />}
            </button>
          );
        })}
      </div>
    );
  };

  const MediaCount = () => {
    if (!hasMultipleMedia) return null;
    return (
      <div className="absolute top-2 left-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium z-10 flex items-center gap-0.5">
        {activeImgIdx + 1}/{media.length}
      </div>
    );
  };

  const NavArrows = () => {
    if (!hasMultipleMedia) return null;
    return (
      <>
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/60 active:scale-90 z-10"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/60 active:scale-90 z-10"
        >
          <ChevronRight size={14} />
        </button>
      </>
    );
  };

  const MediaRenderer = ({ aspectClass, objectFit = 'object-cover' }: { aspectClass: string; objectFit?: string }) => {
    if (isVideo) {
      return (
        <div
          className={`relative ${aspectClass} bg-gradient-to-br from-pink-50 to-gray-50 dark:from-neutral-900 dark:to-neutral-950 overflow-hidden cursor-pointer`}
          onClick={handleImageTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <video
            ref={videoRef}
            src={current?.url}
            className={`w-full h-full ${objectFit}`}
            autoPlay
            muted
            playsInline
            loop={!hasMultipleMedia}
          />
          <MediaCount />
          <NavArrows />
          <MediaIndicators />
          {onShare && !selectionMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onShare?.(produto); }}
              className="absolute top-2 right-2 w-7 h-7 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white dark:hover:bg-black/70 hover:scale-110 active:scale-95 shadow-md z-10"
            >
              <Share2 size={13} className="text-gray-700 dark:text-gold" />
            </button>
          )}
        </div>
      );
    }

    return (
      <div
        className={`relative ${aspectClass} bg-gradient-to-br from-pink-50 to-gray-50 dark:from-neutral-900 dark:to-neutral-950 overflow-hidden cursor-pointer`}
        onClick={handleImageTap}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {displayUrl && !imgError ? (
          <>
            <Image
              src={displayUrl}
              alt={produto?.nome ?? 'Produto Dande'}
              fill
              className={`${objectFit} transition-all duration-500 ease-out group-hover:scale-105 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              unoptimized
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full border-2 border-pink-200 dark:border-gold/30 border-t-pink-500 dark:border-t-gold animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-gold/10 flex items-center justify-center">
              <span className="text-lg">💎</span>
            </div>
          </div>
        )}
        <MediaCount />
        <NavArrows />
        <MediaIndicators />
        {onShare && !selectionMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onShare?.(produto); }}
            className="absolute top-2 right-2 w-7 h-7 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white dark:hover:bg-black/70 hover:scale-110 active:scale-95 shadow-md z-10"
          >
            <Share2 size={13} className="text-gray-700 dark:text-gold" />
          </button>
        )}
      </div>
    );
  };

  // ---- LIST LAYOUT ----
  if (layout === 'list') {
    return (
      <div
        onClick={handleTap}
        className={`group relative flex items-center gap-3 bg-card rounded-2xl overflow-hidden transition-all duration-300 active:scale-[0.99] gold-glow gold-border ${
          selected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'shadow-sm dark:border dark:border-gold/10'
        }`}
      >
        {selectionMode && (
          <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
            selected ? 'bg-primary text-white dark:text-black scale-100' : 'bg-black/30 backdrop-blur-sm scale-90'
          }`}>
            {selected && <Check size={14} strokeWidth={3} />}
          </div>
        )}

        <div
          className="relative w-24 h-24 flex-shrink-0 bg-gradient-to-br from-pink-50 to-gray-50 dark:from-neutral-900 dark:to-neutral-950 cursor-pointer overflow-hidden"
          onClick={handleImageTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isVideo ? (
            <video src={current?.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
          ) : displayUrl && !imgError ? (
            <Image src={displayUrl} alt={produto?.nome ?? 'Produto'} fill className="object-cover" onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)} unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><span className="text-lg">💎</span></div>
          )}
          {hasMultipleMedia && (
            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded-full font-medium">
              {activeImgIdx + 1}/{media.length}
            </div>
          )}
        </div>

        <div className="flex-1 py-2 pr-3 min-w-0">
          <h3 className="text-xs font-semibold leading-tight line-clamp-1 text-foreground gold-text mb-1">{shortName(produto?.nome)}</h3>
          <div className="flex items-center justify-between gap-2">
            {showCode && <span className="text-[10px] font-mono text-muted-foreground gold-text-solid">{produto?.codigo}</span>}
            {showPrice && <span className="text-sm font-bold text-primary gold-text">{fmt(produto?.preco ?? 0)}</span>}
          </div>
        </div>

        {onShare && !selectionMode && (
          <button onClick={(e) => { e.stopPropagation(); onShare?.(produto); }} className="mr-3 w-8 h-8 bg-muted/60 rounded-full flex items-center justify-center transition-all hover:bg-muted active:scale-90">
            <Share2 size={14} className="text-muted-foreground" />
          </button>
        )}
      </div>
    );
  }

  // ---- SINGLE LAYOUT ----
  if (layout === 'single') {
    return (
      <div
        onClick={handleTap}
        className={`group relative bg-card rounded-2xl overflow-hidden transition-all duration-500 ease-out hover:shadow-xl active:scale-[0.99] gold-glow ${
          selected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'shadow-md dark:border dark:border-gold/10'
        }`}
      >
        {selectionMode && (
          <div className={`absolute top-3 left-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
            selected ? 'bg-primary text-white dark:text-black scale-100' : 'bg-black/30 backdrop-blur-sm scale-90'
          }`}>
            {selected && <Check size={16} strokeWidth={3} />}
          </div>
        )}

        <MediaRenderer aspectClass="aspect-[4/5]" objectFit="object-cover" />

        {(showPrice || showCode) && (
          <div className="px-4 py-3">
            <h3 className="text-sm font-semibold leading-tight line-clamp-2 text-foreground gold-text mb-1">{produto?.nome}</h3>
            <div className="flex items-center justify-between">
              {showCode && (
                <span className="text-xs font-mono text-muted-foreground gold-text-solid">
                  {produto?.departamento?.nome ? `${produto.departamento.nome} · ` : ''}{produto?.codigo}
                </span>
              )}
              {showPrice && (
                <div className="flex items-center gap-2">
                  {produto?.precoOriginal && produto.precoOriginal > produto.preco && (
                    <span className="text-xs text-muted-foreground line-through">
                      R${Number(produto.precoOriginal).toFixed(2).replace('.', ',')}
                    </span>
                  )}
                  <span className="text-base font-bold text-primary gold-text">{fmt(produto?.preco ?? 0)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- GRID LAYOUT (default) ----
  return (
    <div
      onClick={handleTap}
      className={`group relative bg-card rounded-2xl overflow-hidden transition-all duration-500 ease-out hover:shadow-xl active:scale-[0.98] gold-glow ${
        selected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'dark:border dark:border-gold/10'
      }`}
    >
      {selectionMode && (
        <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
          selected ? 'bg-primary text-white dark:text-black scale-100' : 'bg-black/30 backdrop-blur-sm scale-90'
        }`}>
          {selected && <Check size={14} strokeWidth={3} />}
        </div>
      )}

      <MediaRenderer aspectClass="aspect-[4/5]" />

      <div className="px-2.5 py-1.5">
        <h3 className="text-[11px] font-medium leading-tight line-clamp-1 text-muted-foreground gold-text mb-0.5">{shortName(produto?.nome)}</h3>
        <div className="flex items-center justify-between">
          {showCode && <span className="text-[10px] font-mono text-muted-foreground/70 gold-text-solid">{produto?.codigo}</span>}
          {showPrice && <span className="text-xs font-bold text-primary gold-text">{fmt(produto?.preco ?? 0)}</span>}
        </div>
      </div>
    </div>
  );
}
