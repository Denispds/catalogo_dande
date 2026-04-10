'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, FolderHeart, Briefcase, Settings } from 'lucide-react';
import { useSession } from 'next-auth/react';

const navItems = [
  { href: '/', label: 'Catálogo', icon: Search },
  { href: '/colecoes', label: 'Coleções', icon: FolderHeart },
  { href: '/central', label: 'Central', icon: Briefcase },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};

  const items = session
    ? [...navItems, { href: '/admin', label: 'Admin', icon: Settings }]
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300 min-w-[64px] ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary/10 scale-110' : ''}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={`text-[10px] font-medium transition-all duration-300 ${isActive ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
