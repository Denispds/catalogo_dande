'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CollectionProductData } from '@/lib/types';
import CollectionEditorGrid from './collection-editor-grid';
import CollectionEditorSidebar from './collection-editor-sidebar';

interface CollectionEditorProps {
  colecaoId: string;
  initialProducts: CollectionProductData[];
  onClose: () => void;
  onSave: () => Promise<void>;
}

export default function CollectionEditor({
  colecaoId,
  initialProducts,
  onClose,
  onSave,
}: CollectionEditorProps) {
  const [products, setProducts] = useState<CollectionProductData[]>(initialProducts);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  
  const existingCodigos = new Set(
    products.map(p => (p.produtoCodigo || p.codigo) as string).filter(Boolean)
  );

  // Debounced save
  const debouncedSave = useCallback(async (updatedProducts: CollectionProductData[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const items = updatedProducts.map((p, idx) => ({
          produtoCodigo: (p.produtoCodigo || p.codigo) as string,
          ordem: idx + 1,
        }));

        const res = await fetch(`/api/colecoes/${colecaoId}/produtos/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Erro ao salvar ordem');
        }

        toast.success('Ordem salva automaticamente!');
      } catch (error) {
        console.error('Erro ao salvar:', error);
        toast.error('Erro ao salvar ordem dos produtos');
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Debounce de 1 segundo
  }, [colecaoId]);

  const handleReorder = useCallback((newOrder: CollectionProductData[]) => {
    setProducts(newOrder);
    debouncedSave(newOrder);
  }, [debouncedSave]);

  const handleRemove = useCallback(async (codigo: string) => {
    try {
      const res = await fetch(`/api/colecoes/${colecaoId}/produtos?produtoCodigo=${codigo}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erro ao remover produto');
      }

      const newProducts = products.filter(p => (p.produtoCodigo || p.codigo) !== codigo);
      setProducts(newProducts);
      toast.success('Produto removido!');
    } catch (error) {
      console.error('Erro ao remover:', error);
      toast.error('Erro ao remover produto');
    }
  }, [colecaoId, products]);

  const handleAddProduct = useCallback((produto: CollectionProductData) => {
    const newProduct: CollectionProductData = {
      ...produto,
      produtoCodigo: produto.produtoCodigo || produto.codigo,
      ordem: products.length + 1,
    };
    
    const newProducts = [...products, newProduct];
    setProducts(newProducts);
    debouncedSave(newProducts);
  }, [products, debouncedSave]);

  const handleClose = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    onClose();
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={handleClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full h-[90vh] sm:h-auto sm:max-w-5xl sm:max-h-[80vh] bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">Editor de Colecao</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {products.length} produto{products.length !== 1 ? 's' : ''} · Arraste para reordenar
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors active:scale-90"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row gap-0">
          {/* Sidebar */}
          <CollectionEditorSidebar
            colecaoId={colecaoId}
            existingCodigos={existingCodigos}
            onAddProduct={handleAddProduct}
          />

          {/* Main Grid */}
          <div className="flex-1 overflow-y-auto p-6 bg-background/50">
            <CollectionEditorGrid
              products={products}
              onReorder={handleReorder}
              onRemove={handleRemove}
              isSaving={isSaving}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save size={14} className="text-green-500" />
                <span>Salvo automaticamente</span>
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all"
          >
            Fechar Editor
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
