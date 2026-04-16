'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { ShoppingBag, Layers, Briefcase, Settings, Sun, Moon } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession() || {};
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const navItems = [
    { href: '/', label: 'Produtos', icon: ShoppingBag },
    { href: '/colecoes', label: 'Coleções', icon: Layers },
    { href: '/central', label: 'Central', icon: Briefcase },
    ...(session ? [{ href: '/admin', label: 'Admin', icon: Settings }] : []),
  ];

  const isDark = theme === 'dark';

  return (
    <>
      {/* Top bar with logo */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 active:scale-90"
            title={isDark ? 'Modo Claro' : 'Modo Escuro'}
          >
            {mounted ? (
              isDark ? (
                <Sun size={18} strokeWidth={1.8} className="text-gold" />
              ) : (
                <Moon size={18} strokeWidth={1.8} />
              )
            ) : (
              <div className="w-[18px] h-[18px]" />
            )}
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-9 h-9">
              <Image
                src="/logo-dande.webp"
                alt="Dande Acessórios"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight tracking-tight gold-text">Dande</span>
              <span className="text-[10px] text-muted-foreground leading-tight -mt-0.5">Acessórios</span>
            </div>
          </Link>

          <Link
            href="/admin"
            className="w-9 h-9 flex items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Painel Admin"
          >
            <Settings size={18} strokeWidth={1.8} />
          </Link>
        </div>
      </header>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50"
           style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 pt-2 pb-1">
          {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'text-primary bg-primary/10 scale-105'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
