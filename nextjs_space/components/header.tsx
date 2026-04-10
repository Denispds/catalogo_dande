'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Menu, X, ShoppingBag, Settings, LayoutDashboard, Briefcase, Sun, Moon, LogOut, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { data: session } = useSession() || {};
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Catálogo', icon: ShoppingBag },
    { href: '/colecoes', label: 'Coleções', icon: Settings },
    { href: '/central', label: 'Central', icon: Briefcase },
  ];

  const adminItems = session ? [
    { href: '/admin', label: 'Admin', icon: LayoutDashboard },
  ] : [];

  const allItems = [...navItems, ...adminItems];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-primary">✦</span>
          <span className="tracking-tight">Dande</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">Acessórios</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {allItems?.map((item: any) => (
            <Link
              key={item?.href}
              href={item?.href}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <item.icon size={16} />
              {item?.label}
            </Link>
          ))}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {session ? (
            <button
              onClick={() => signOut?.()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <LogOut size={16} /> Sair
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <LogIn size={16} /> Entrar
            </Link>
          )}
        </nav>

        {/* Mobile menu btn */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-muted"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-muted">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t bg-background overflow-hidden"
          >
            <div className="px-4 py-2 space-y-1">
              {allItems?.map((item: any) => (
                <Link
                  key={item?.href}
                  href={item?.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <item.icon size={16} />
                  {item?.label}
                </Link>
              ))}
              {session ? (
                <button
                  onClick={() => { signOut?.(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
                >
                  <LogOut size={16} /> Sair
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm bg-primary text-primary-foreground"
                >
                  <LogIn size={16} /> Entrar
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
