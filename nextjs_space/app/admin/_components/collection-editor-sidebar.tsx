'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Plus, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { CollectionProductData } from '@/lib/types';

interface Category {
  id: string;
  nome: string;
  subcategorias?: { id: string; nome: string }[];
}

interface CollectionEditorSidebarProps {
  colecaoId: string;
  existingCodigos: Set<string>;
  onAddProduct: (produto: CollectionProductData) => void;
}

export default function CollectionEditorSidebar({
  colecaoId,
  existingCodigos,
  onAddProduct,
}: CollectionEditorSidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<CollectionProductData[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categorias');
        const data = await res.json();
        setCategories(data);
        // Set first category as default
        if (data.length > 0) {
          setSelectedDept(data[0].id);
          setExpandedCategories(new Set([data[0].id]));
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        toast.error('Erro ao carregar categorias');
      }
    };
    fetchCategories();
  }, []);

  // Fetch products when department changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedDept && searchTerm.length < 2) {
        setProducts([]);
        return;
      }

      setLoadingProducts(true);
      try {
        const params = new URLSearchParams({
          limit: '50',
          departamento: selectedDept,
          comImagem: 'true',
        });

        if (searchTerm.length >= 2) {
          params.set('busca', searchTerm);
        }

        const res = await fetch(`/api/produtos?${params}`);
        const data = await res.json();
        
        // Filter out products already in collection
        const available = (data.produtos || []).filter(
          (p: CollectionProductData) => {
            const codigo = (p.codigo || p.produtoCodigo) as string;
            return !existingCodigos.has(codigo);
          }
        );
        
        setProducts(available);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        toast.error('Erro ao carregar produtos');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [selectedDept, searchTerm, existingCodigos]);

  const toggleCategory = (catId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(catId)) {
      newExpanded.delete(catId);
    } else {
      newExpanded.add(catId);
    }
    setExpandedCategories(newExpanded);
  };

  const getProductCodigo = (product: CollectionProductData): string => {
    return (product.codigo || product.produtoCodigo) as string;
  };

  return (
    <div className="w-full sm:w-80 bg-muted/30 border-t sm:border-t-0 sm:border-r border-border/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex-shrink-0">
        <h3 className="text-sm font-semibold text-foreground mb-3">Adicionar Produtos</h3>
        
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-background/80 text-xs border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchTerm && (
        <div className="p-4 flex-shrink-0 border-b border-border/50">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Categorias</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id}>
                <button
                  onClick={() => {
                    setSelectedDept(cat.id);
                    toggleCategory(cat.id);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all ${
                    selectedDept === cat.id
                      ? 'bg-primary text-white font-semibold'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <ChevronDown
                    size={12}
                    className={`transition-transform flex-shrink-0 ${
                      expandedCategories.has(cat.id) ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                  <span className="truncate">{cat.nome}</span>
                </button>

                {/* Subcategories */}
                {expandedCategories.has(cat.id) && cat.subcategorias && (
                  <div className="ml-4 space-y-0.5">
                    {cat.subcategorias.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {}}
                        className="w-full text-left px-2 py-1 rounded text-xs text-muted-foreground/70 hover:bg-muted/30 transition-colors truncate"
                      >
                        {sub.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loadingProducts ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              {searchTerm ? 'Nenhum produto encontrado' : 'Selecione uma categoria'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">
              {products.length} produto{products.length !== 1 ? 's' : ''} disponivel{products.length !== 1 ? 's' : ''}
            </p>
            <AnimatePresence mode="popLayout">
              {products.map((product) => (
                <motion.div
                  key={getProductCodigo(product)}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="group/item"
                >
                  <button
                    onClick={() => {
                      onAddProduct(product);
                      setProducts(products.filter(p => getProductCodigo(p) !== getProductCodigo(product)));
                      toast.success(`${product.nome} adicionado!`);
                    }}
                    className="w-full p-2 rounded-lg bg-muted/50 hover:bg-card border border-border/30 hover:border-primary/50 transition-all flex gap-2 group/btn active:scale-95"
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-12 h-16 bg-muted rounded overflow-hidden relative">
                      {product.imagens && product.imagens.length > 0 ? (
                        <Image
                          src={product.imagens[0]?.url || ''}
                          alt={product.nome}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">
                          💎
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="text-left">
                        <p className="text-xs font-mono text-muted-foreground/60">
                          {getProductCodigo(product)}
                        </p>
                        <p className="text-xs font-semibold line-clamp-1 text-foreground">
                          {product.nome}
                        </p>
                      </div>
                      <p className="text-xs font-bold text-primary">
                        R$ {Number(product.preco).toFixed(2).replace('.', ',')}
                      </p>
                    </div>

                    {/* Add Button */}
                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary opacity-0 group-hover/btn:opacity-100 transition-opacity">
                      <Plus size={12} />
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
