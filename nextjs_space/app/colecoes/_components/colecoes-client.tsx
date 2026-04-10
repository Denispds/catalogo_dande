'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/header';
import ProductCard from '@/components/product-card';
import ShareModal from '@/components/share-modal';
import WhatsAppCollectionShare from '@/components/whatsapp-collection-share';
import { Loader2, FolderOpen, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ColecoesClient() {
  const [colecoes, setColecoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shareProduct, setShareProduct] = useState<any>(null);
  const [shareColecao, setShareColecao] = useState<any>(null);

  useEffect(() => {
    fetch('/api/colecoes').then((r: any) => r?.json?.()).catch(() => []).then((d: any) => {
      setColecoes(d ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            <FolderOpen size={24} className="inline text-primary mr-2" />
            Cole\u00e7\u00f5es <span className="text-primary">Dande</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Sele\u00e7\u00f5es especiais de produtos</p>
        </motion.div>

        {colecoes?.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FolderOpen size={48} className="mx-auto mb-2" />
            <p>Nenhuma cole\u00e7\u00e3o dispon\u00edvel</p>
          </div>
        ) : (
          <div className="space-y-4">
            {colecoes?.map?.((col: any) => {
              const isExpanded = expandedId === col?.id;
              const prods = col?.produtos ?? [];
              return (
                <motion.div key={col?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : col?.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: col?.cor ?? '#E91E8C' }} />
                    <div className="text-left flex-1">
                      <p className="font-bold text-sm">{col?.nome ?? ''}</p>
                      {col?.descricao && <p className="text-xs text-muted-foreground">{col.descricao}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground">{prods?.length ?? 0} produto(s)</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4">
                          <div className="flex items-center justify-end mb-3">
                            <button onClick={() => setShareColecao(col)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:bg-[#1fb855]">
                              <MessageCircle size={14} /> Enviar via WhatsApp
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {prods?.map?.((cp: any) => (
                              <ProductCard
                                key={cp?.produto?.codigo ?? cp?.produtoCodigo}
                                produto={cp?.produto}
                                onShare={(p: any) => setShareProduct(p)}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <ShareModal produto={shareProduct} isOpen={!!shareProduct} onClose={() => setShareProduct(null)} />
      <WhatsAppCollectionShare colecao={shareColecao} isOpen={!!shareColecao} onClose={() => setShareColecao(null)} />
    </div>
  );
}
