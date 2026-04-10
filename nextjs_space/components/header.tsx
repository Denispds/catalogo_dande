'use client';

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 h-14">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-tight tracking-tight">Dande</span>
            <span className="text-[10px] text-muted-foreground leading-none">Acessórios</span>
          </div>
        </Link>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted active:scale-95 transition-all duration-200"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
