'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShoppingBag, Layers, Briefcase, Settings } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession() || {};
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Catálogo', icon: ShoppingBag },
    { href: '/colecoes', label: 'Coleções', icon: Layers },
    { href: '/central', label: 'Central', icon: Briefcase },
    ...(session ? [{ href: '/admin', label: 'Admin', icon: Settings }] : []),
  ];

  return (
    <>
      {/* Top bar - minimal */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight tracking-tight">Dande</span>
              <span className="text-[10px] text-muted-foreground leading-tight -mt-0.5">Acessórios</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Bottom navigation - mobile app style */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
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
