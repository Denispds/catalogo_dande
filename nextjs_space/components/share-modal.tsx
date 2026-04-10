'use client';

import React, { useState } from 'react';
import { X, MessageCircle, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareModalProps {
  produto: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ produto, isOpen, onClose }: ShareModalProps) {
  const [includePrice, setIncludePrice] = useState(true);
  const [includeCode, setIncludeCode] = useState(true);
  const [includeBrand, setIncludeBrand] = useState(true);
  const [copied, setCopied] = useState(false);

  const buildMessage = () => {
    const parts: string[] = [];
    parts.push(`\u2728 *${produto?.nome ?? 'Produto'}*`);
    if (includeCode) parts.push(`\uD83D\uDD16 C\u00f3d: ${produto?.codigo ?? ''}`);
    if (includeBrand) parts.push(`\uD83C\uDFE2 ${produto?.departamento?.nome ?? ''} > ${produto?.categoria?.nome ?? ''}`);
    if (includePrice) {
      const hasDiscount = produto?.precoOriginal && produto.precoOriginal > produto?.preco;
      if (hasDiscount) {
        parts.push(`\uD83D\uDCB0 ~R$ ${(produto?.precoOriginal ?? 0)?.toFixed?.(2)}~ por *R$ ${(produto?.preco ?? 0)?.toFixed?.(2)}*`);
      } else {
        parts.push(`\uD83D\uDCB0 *R$ ${(produto?.preco ?? 0)?.toFixed?.(2)}*`);
      }
    }
    parts.push('\n\uD83D\uDECD Dande Acess\u00f3rios');
    return parts.join('\n');
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopy = async () => {
    try {
      await navigator?.clipboard?.writeText?.(buildMessage());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e: any) {
      console.error('Copy error:', e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={(e: any) => e?.stopPropagation?.()}
            className="bg-card rounded-2xl w-full max-w-md p-5 space-y-4"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Compartilhar</h3>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X size={20} /></button>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 text-sm whitespace-pre-line font-mono text-xs">
              {buildMessage()}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={includePrice} onChange={() => setIncludePrice(!includePrice)} className="accent-primary w-4 h-4" />
                Incluir preço
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={includeCode} onChange={() => setIncludeCode(!includeCode)} className="accent-primary w-4 h-4" />
                Incluir código
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={includeBrand} onChange={() => setIncludeBrand(!includeBrand)} className="accent-primary w-4 h-4" />
                Incluir departamento/categoria
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-medium text-sm hover:bg-[#1fb855] transition-colors"
              >
                <MessageCircle size={18} /> WhatsApp
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-sm font-medium transition-colors"
              >
                {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
