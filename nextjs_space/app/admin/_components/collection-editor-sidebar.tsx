'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Loader2, Plus, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import { CollectionProductData } from '@/lib/types';

interface Departamento {
  id: number;
  nome: string;
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
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<CollectionProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingMore = useRef(false);

  // Fetch departamentos
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await fetch('/api/departamentos');
        const data = await res.json();
        setDepartamentos(data);
      } catch (error) {
        console.error('Erro ao buscar departamentos:', error);
      }
    };
    fetchDepts();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async (pageNum: number, append: boolean) => {
    if (loadingMore.current && append) return;
    if (!append) setLoading(true);
    loadingMore.current = true;

    try {
      const params = new URLSearchParams({
        limit: '30',
        page: String(pageNum),
        comImagem: 'true',
        ordem: 'nome_asc',
      });

      if (searchTerm.length >= 2) {
        params.set('busca', searchTerm);
      }
      if (selectedDept !== null && !searchTerm) {
        params.set('departamento', String(selectedDept));
      }

      const res = await fetch(`/api/produtos?${params}`);
      const data = await res.json();

      const available = (data.produtos || []).filter(
        (p: any) => !existingCodigos.has(p.codigo)
      );

      if (append) {
        setProducts(prev => [...prev, ...available]);
      } else {
        setProducts(available);
      }

      setTotal(data.total || 0);
      setHasMore((data.produtos || []).length >= 30);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
      loadingMore.current = false;
    }
  }, [selectedDept, searchTerm, existingCodigos]);

  // Reset and fetch when dept or search changes
  useEffect(() => {
    if (selectedDept === null && searchTerm.length < 2) {
      setProducts([]);
      setTotal(0);
      return;
    }
    setPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [selectedDept, searchTerm, fetchProducts]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasMore || loadingMore.current) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, true);
    }
  }, [hasMore, page, fetchProducts]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const getCode = (p: CollectionProductData) => (p.codigo || p.produtoCodigo) as string;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-border/50 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Buscar por nome ou codigo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-8 py-2 rounded-lg bg-background/80 text-xs border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Departamentos - chips horizontais */}
      {!searchTerm && (
        <div className="p-3 border-b border-border/50 flex-shrink-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2 tracking-wider">Departamentos</p>
          <div className="flex flex-wrap gap-1.5">
            {departamentos.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(selectedDept === dept.id ? null : dept.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all active:scale-95 ${
                  selectedDept === dept.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                {dept.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search info bar */}
      {(selectedDept !== null || searchTerm.length >= 2) && (
        <div className="px-3 py-2 bg-muted/30 border-b border-border/30 flex items-center justify-between flex-shrink-0">
          <p className="text-[10px] text-muted-foreground">
            {loading ? 'Buscando...' : `${products.length} de ${total} disponiveis`}
          </p>
          {searchTerm && (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              &quot;{searchTerm}&quot;
            </span>
          )}
        </div>
      )}

      {/* Products list with infinite scroll */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2">
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={18} className="animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-xs">
              {searchTerm
                ? 'Nenhum produto encontrado'
                : selectedDept === null
                ? 'Selecione um departamento'
                : 'Nenhum produto disponivel'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {products.map((product) => (
              <button
                key={getCode(product)}
                onClick={() => {
                  onAddProduct(product);
                  setProducts(prev => prev.filter(p => getCode(p) !== getCode(product)));
                  setTotal(prev => Math.max(0, prev - 1));
                }}
                className="w-full p-2 rounded-lg hover:bg-card border border-transparent hover:border-primary/30 transition-all flex gap-2.5 active:scale-[0.98] group/btn"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-11 h-14 bg-muted rounded-lg overflow-hidden relative">
                  {product.imagens && product.imagens.length > 0 ? (
                    <Image
                      src={product.imagens[0]?.url || ''}
                      alt={product.nome}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-base bg-muted">
                      💎
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center text-left">
                  <p className="text-[10px] font-mono text-muted-foreground/60">{getCode(product)}</p>
                  <p className="text-xs font-medium line-clamp-1 text-foreground">{product.nome}</p>
                  <p className="text-xs font-bold text-primary mt-0.5">
                    R$ {Number(product.preco).toFixed(2).replace('.', ',')}
                  </p>
                </div>

                {/* Add icon */}
                <div className="flex-shrink-0 self-center w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-opacity">
                  <Plus size={12} />
                </div>
              </button>
            ))}

            {/* Load more indicator */}
            {loadingMore.current && hasMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-primary" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
