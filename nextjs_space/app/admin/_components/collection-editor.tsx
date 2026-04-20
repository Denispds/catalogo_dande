'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, Package, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { CollectionProductData } from '@/lib/types';
import CollectionEditorGrid from './collection-editor-grid';
import CollectionEditorSidebar from './collection-editor-sidebar';

interface CollectionEditorProps {
  colecaoId: string;
  colecaoNome?: string;
  initialProducts: CollectionProductData[];
  onClose: () => void;
  onSave: () => Promise<void>;
}

export default function CollectionEditor({
  colecaoId,
  colecaoNome,
  initialProducts,
  onClose,
  onSave,
}: CollectionEditorProps) {
  const [products, setProducts] = useState<CollectionProductData[]>(initialProducts);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'produtos' | 'adicionar'>('produtos');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const hasChanges = useRef(false);

  const existingCodigos = new Set(
    products.map(p => (p.produtoCodigo || p.codigo) as string).filter(Boolean)
  );

  // Debounced save for reorder
  const debouncedSaveOrder = useCallback(async (updatedProducts: CollectionProductData[]) => {
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

        if (!res.ok) throw new Error('Erro ao salvar ordem');
        hasChanges.current = true;
      } catch (error) {
        console.error('Erro ao salvar:', error);
        toast.error('Erro ao salvar ordem');
      } finally {
        setIsSaving(false);
      }
    }, 800);
  }, [colecaoId]);

  const handleReorder = useCallback((newOrder: CollectionProductData[]) => {
    setProducts(newOrder);
    debouncedSaveOrder(newOrder);
  }, [debouncedSaveOrder]);

  const handleRemove = useCallback(async (codigo: string) => {
    // Optimistic update
    const prev = products;
    setProducts(p => p.filter(item => (item.produtoCodigo || item.codigo) !== codigo));

    try {
      const res = await fetch(`/api/colecoes/${colecaoId}/produtos?produtoCodigo=${codigo}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro');
      hasChanges.current = true;
      toast.success('Produto removido');
    } catch {
      setProducts(prev); // rollback
      toast.error('Erro ao remover produto');
    }
  }, [colecaoId, products]);

  const handleAddProduct = useCallback(async (produto: CollectionProductData) => {
    const codigo = (produto.produtoCodigo || produto.codigo) as string;
    
    // Optimistic update
    const newProduct: CollectionProductData = {
      ...produto,
      produtoCodigo: codigo,
      ordem: products.length + 1,
    };
    setProducts(prev => [...prev, newProduct]);

    try {
      const res = await fetch(`/api/colecoes/${colecaoId}/produtos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoCodigo: codigo }),
      });
      if (!res.ok) throw new Error('Erro');
      hasChanges.current = true;
      toast.success(`${produto.nome} adicionado!`);
    } catch {
      setProducts(prev => prev.filter(p => (p.produtoCodigo || p.codigo) !== codigo));
      toast.error('Erro ao adicionar produto');
    }
  }, [colecaoId, products.length]);

  const handleClose = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (hasChanges.current) {
      await onSave();
    }
    onClose();
  }, [onClose, onSave]);

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
        className="w-full h-[92vh] sm:h-[85vh] sm:max-w-5xl bg-background rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/50 flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold truncate">
              {colecaoNome ? `Editar: ${colecaoNome}` : 'Editor de Colecao'}
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {products.length} produto{products.length !== 1 ? 's' : ''}
              {isSaving ? ' · Salvando...' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <Loader2 size={14} className="animate-spin text-primary" />}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors active:scale-90"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="sm:hidden flex border-b border-border/50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('produtos')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'produtos'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
          >
            <Package size={14} />
            Produtos ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('adicionar')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'adicionar'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            }`}
          >
            <Plus size={14} />
            Adicionar
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
          {/* Sidebar - hidden on mobile when viewing products */}
          <div className={`${
            activeTab === 'adicionar' ? 'flex' : 'hidden'
          } sm:flex w-full sm:w-80 border-r-0 sm:border-r border-border/50 flex-col overflow-hidden bg-muted/20`}>
            <CollectionEditorSidebar
              colecaoId={colecaoId}
              existingCodigos={existingCodigos}
              onAddProduct={(p) => {
                handleAddProduct(p);
                // On mobile, stay on 'adicionar' tab so user can keep adding
              }}
            />
          </div>

          {/* Main Grid - hidden on mobile when viewing sidebar */}
          <div className={`${
            activeTab === 'produtos' ? 'flex' : 'hidden'
          } sm:flex flex-1 flex-col overflow-hidden`}>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <CollectionEditorGrid
                products={products}
                onReorder={handleReorder}
                onRemove={handleRemove}
                isSaving={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0 bg-muted/20">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {isSaving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save size={12} className="text-green-500" />
                <span>Salvo automaticamente</span>
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all"
          >
            Concluir
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
