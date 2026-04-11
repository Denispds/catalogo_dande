'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/header';
import CompanyInfo from '@/components/company-info';
import InstagramFeed from '@/components/instagram-feed';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Rocket, LinkIcon, CreditCard, BookOpen, ChevronDown, ChevronUp, ExternalLink, Clock, Calendar, Loader2 } from 'lucide-react';

export default function CentralClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openProcedimento, setOpenProcedimento] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/central').then((r: any) => r?.json?.()).catch(() => ({})).then((d: any) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const getDaysRemaining = (dataFim: string | null) => {
    if (!dataFim) return null;
    try {
      const end = new Date(dataFim);
      const now = new Date();
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff;
    } catch { return null; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
      </div>
    );
  }

  const acoes = data?.acoes ?? [];
  const lancamentos = data?.lancamentos ?? [];
  const links = data?.links ?? [];
  const pagamentos = data?.pagamentos ?? [];
  const procedimentos = data?.procedimentos ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6 space-y-8 pb-24">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Central do <span className="text-primary">Vendedor</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Informações e ferramentas essenciais</p>
        </motion.div>

        {/* Ações ativas */}
        {acoes?.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold mb-3"><Flame size={20} className="text-primary" /> Ações Ativas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {acoes?.map?.((acao: any) => {
                const days = getDaysRemaining(acao?.dataFim);
                return (
                  <motion.div key={acao?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-card" style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm">{acao?.titulo ?? ''}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{acao?.descricao ?? ''}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{acao?.tipo ?? ''}</span>
                    </div>
                    {days !== null && (
                      <div className="flex items-center gap-1 mt-2 text-xs">
                        <Clock size={12} className={days > 0 ? 'text-green-600' : 'text-destructive'} />
                        <span className={days > 0 ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                          {days > 0 ? `${days} dia(s) restante(s)` : 'Encerrada'}
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Lançamentos */}
        {lancamentos?.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold mb-3"><Rocket size={20} className="text-primary" /> Lançamentos</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {lancamentos?.map?.((l: any) => (
                <motion.div key={l?.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-shrink-0 w-64 p-4 rounded-xl bg-card" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <h3 className="font-bold text-sm">{l?.titulo ?? ''}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{l?.descricao ?? ''}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    {l?.dataPrevista ? new Date(l.dataPrevista).toLocaleDateString('pt-BR') : 'A definir'}
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      l?.status === 'confirmado' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                    }`}>{l?.status ?? ''}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Links úteis */}
        {links?.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold mb-3"><LinkIcon size={20} className="text-primary" /> Links Úteis</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {links?.map?.((link: any) => (
                <a key={link?.id} href={link?.url ?? '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-card hover:bg-primary/5 transition-colors" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <span className="text-2xl">{link?.icone ?? '🔗'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{link?.titulo ?? ''}</p>
                    <p className="text-xs text-muted-foreground truncate">{link?.descricao ?? ''}</p>
                  </div>
                  <ExternalLink size={14} className="text-muted-foreground flex-shrink-0" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Pagamentos */}
        {pagamentos?.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold mb-3"><CreditCard size={20} className="text-primary" /> Formas de Pagamento</h2>
            <div className="rounded-xl overflow-hidden bg-card" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Método</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Condição</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Desconto</th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">Obs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagamentos?.map?.((pg: any) => (
                      <tr key={pg?.id} className="border-t border-border">
                        <td className="px-4 py-2.5 font-medium">{pg?.metodo ?? ''}</td>
                        <td className="px-4 py-2.5">{pg?.condicao ?? ''}</td>
                        <td className="px-4 py-2.5">{pg?.desconto ?? ''}</td>
                        <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{pg?.observacao ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Procedimentos */}
        {procedimentos?.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold mb-3"><BookOpen size={20} className="text-primary" /> Procedimentos</h2>
            <div className="space-y-2">
              {procedimentos?.map?.((proc: any) => (
                <div key={proc?.id} className="rounded-xl bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <button
                    onClick={() => setOpenProcedimento(openProcedimento === proc?.id ? null : proc?.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-xl">{proc?.icone ?? '📋'}</span>
                    <span className="text-sm font-medium flex-1 text-left">{proc?.titulo ?? ''}</span>
                    {openProcedimento === proc?.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <AnimatePresence>
                    {openProcedimento === proc?.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 text-sm whitespace-pre-line text-muted-foreground">
                          {proc?.conteudo ?? ''}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Instagram Feed */}
        <InstagramFeed />

        {/* Company Info & Social */}
        <CompanyInfo />

        {/* Spacer for bottom nav */}
        <div className="h-16" />
      </main>
    </div>
  );
}
