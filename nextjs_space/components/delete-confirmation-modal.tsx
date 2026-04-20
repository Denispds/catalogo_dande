'use client';

import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  isDangerous?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
  isDangerous = true,
}: DeleteConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e: any) => e?.stopPropagation?.()}
            className="bg-card rounded-2xl w-full max-w-sm p-6 space-y-4"
            style={{ boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-lg ${ isDangerous ? 'bg-destructive/10' : 'bg-yellow-500/10'}`}>
                <AlertTriangle
                  size={20}
                  className={isDangerous ? 'text-destructive' : 'text-yellow-600 dark:text-yellow-500'}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{message}</p>
              </div>
              <button
                onClick={onCancel}
                disabled={loading}
                className="p-1 rounded-lg hover:bg-muted disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-white text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deletando...
                  </>
                ) : (
                  'Deletar'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
