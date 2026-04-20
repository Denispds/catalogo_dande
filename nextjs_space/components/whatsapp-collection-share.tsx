'use client';

import React, { useState, useMemo } from 'react';
import { X, MessageCircle, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  colecao: any;
  isOpen: boolean;
  onClose: () => void;
  showPrice?: boolean;
  showCode?: boolean;
}

export default function WhatsAppCollectionShare({ colecao, isOpen, onClose, showPrice = true, showCode = true }: Props) {
  const [copied, setCopied] = useState(false);

  const collectionLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/catalogo?colecao=${colecao?.id}`;
  }, [colecao?.id]);

  const buildMessage = () => {
    const parts: string[] = [];
    parts.push(`📦 *Coleção: ${colecao?.nome ?? ''}*`);
    if (colecao?.descricao) parts.push(colecao.descricao);
    parts.push('');
    const prods = colecao?.produtos ?? [];
    prods?.forEach?.((cp: any, i: number) => {
      const p = cp?.produto ?? cp;
      let line = `${i + 1}. ${p?.nome ?? ''}`;
      if (showCode) line += ` (${p?.codigo ?? ''})`;
      if (showPrice) line += ` - R$ ${(p?.preco ?? 0)?.toFixed?.(2)}`;
      parts.push(line);
    });
    parts.push('');
    parts.push(`🔗 ${collectionLink}`);
    parts.push('\n🛍 Dande Acessórios');
    return parts.join('\n');
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(buildMessage())}`, '_blank');
  };

  const handleCopy = async () => {
    try {
      await navigator?.clipboard?.writeText?.(buildMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e: any) { console.error(e); }
  };

  const handleCopyLink = async () => {
    try {
      await navigator?.clipboard?.writeText?.(collectionLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e: any) { console.error(e); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} onClick={(e: any) => e?.stopPropagation?.()} className="bg-card rounded-2xl w-full max-w-md p-5 space-y-4" style={{ boxShadow: 'var(--shadow-lg)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Enviar Coleção</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X size={20} /></button>
            </div>
            <div className="p-3 rounded-xl bg-muted/50 text-xs font-mono whitespace-pre-line max-h-60 overflow-auto">
              {buildMessage()}
            </div>
            <div className="flex gap-2">
              <button onClick={handleWhatsApp} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-medium text-sm hover:bg-[#1fb855] transition-colors">
                <MessageCircle size={18} /> WhatsApp
              </button>
              <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-sm font-medium transition-colors">
                {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
              <button
                onClick={handleCopyLink}
                className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-sm font-medium transition-colors flex items-center justify-center"
                title="Copiar link da coleção"
              >
                <LinkIcon size={18} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
