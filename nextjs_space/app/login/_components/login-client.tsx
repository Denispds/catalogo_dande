'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function LoginClient() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: any) => {
    e?.preventDefault?.();
    if (!email || !password) { toast.error('Preencha todos os campos'); return; }
    setLoading(true);
    try {
      if (isLogin) {
        const result = await signIn('credentials', { email, password, redirect: false });
        if (result?.error) {
          toast.error('Credenciais inválidas');
        } else {
          router.replace('/admin');
        }
      } else {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res?.json?.();
        if (!res?.ok) {
          toast.error(data?.error ?? 'Erro ao cadastrar');
        } else {
          const result = await signIn('credentials', { email, password, redirect: false });
          if (result?.error) toast.error('Erro ao entrar');
          else router.replace('/admin');
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro inesperado');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold"><span className="text-primary">✦</span> Dande</h1>
          <p className="text-sm text-muted-foreground mt-1">Painel Administrativo</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 space-y-4" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h2 className="text-lg font-bold text-center">{isLogin ? 'Entrar' : 'Criar Conta'}</h2>
          {!isLogin && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
              <input type="text" value={name} onChange={(e: any) => setName(e?.target?.value ?? '')} placeholder="Seu nome" className="w-full px-4 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none" />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Email</label>
            <input type="email" value={email} onChange={(e: any) => setEmail(e?.target?.value ?? '')} placeholder="email@exemplo.com" className="w-full px-4 py-2.5 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Senha</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e: any) => setPassword(e?.target?.value ?? '')} placeholder="••••••" className="w-full px-4 py-2.5 pr-10 rounded-xl bg-muted text-sm focus:ring-2 focus:ring-primary outline-none" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors">
            {loading ? <Loader2 size={18} className="animate-spin" /> : isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
            {isLogin ? 'Entrar' : 'Cadastrar'}
          </button>
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-xs text-primary hover:underline text-center">
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
