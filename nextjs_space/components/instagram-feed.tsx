'use client';

import React, { useEffect, useRef } from 'react';

const RECENT_POSTS = [
  { url: 'https://www.instagram.com/reel/DW9vqhvh6BN/', id: 'DW9vqhvh6BN' },
  { url: 'https://www.instagram.com/reel/DW7Llfpggjp/', id: 'DW7Llfpggjp' },
  { url: 'https://www.instagram.com/reel/DW4kHUWghYB/', id: 'DW4kHUWghYB' },
  { url: 'https://www.instagram.com/reel/DW2HEIzApB2/', id: 'DW2HEIzApB2' },
  { url: 'https://www.instagram.com/reel/DWzcfRzh5NU/', id: 'DWzcfRzh5NU' },
  { url: 'https://www.instagram.com/p/DWwwILblopU/', id: 'DWwwILblopU' },
];

export default function InstagramFeed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (scriptLoaded.current) {
      // Re-process embeds if already loaded
      if ((window as any).instgrm?.Embeds?.process) {
        (window as any).instgrm.Embeds.process();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
      if ((window as any).instgrm?.Embeds?.process) {
        (window as any).instgrm.Embeds.process();
      }
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on cleanup to avoid re-loading
    };
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-card flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-sm font-bold">@dandeacessorios</h2>
            <p className="text-[10px] text-muted-foreground">Últimas postagens</p>
          </div>
        </div>
        <a
          href="https://instagram.com/dandeacessorios"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white text-[11px] font-semibold transition-all active:scale-95"
        >
          Seguir
        </a>
      </div>

      {/* Horizontally scrollable Instagram embeds */}
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory"
      >
        {RECENT_POSTS.map((post) => (
          <div key={post.id} className="snap-start flex-shrink-0 w-[280px]">
            <blockquote
              className="instagram-media"
              data-instgrm-captioned={false}
              data-instgrm-permalink={post.url}
              data-instgrm-version="14"
              style={{
                background: '#FFF',
                border: 0,
                borderRadius: '12px',
                boxShadow: 'none',
                margin: 0,
                maxWidth: '280px',
                minWidth: '280px',
                padding: 0,
                width: '280px',
              }}
            />
          </div>
        ))}
      </div>

      {/* Fallback: direct links if embeds don't load */}
      <noscript>
        <div className="grid grid-cols-3 gap-2">
          {RECENT_POSTS.map((post) => (
            <a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-xs text-primary font-medium"
            >
              Ver post
            </a>
          ))}
        </div>
      </noscript>
    </section>
  );
}
