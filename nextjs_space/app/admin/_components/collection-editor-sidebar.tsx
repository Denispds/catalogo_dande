'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Search, Loader2, Plus, X, SlidersHorizontal, ArrowUpDown, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { CollectionProductData } from '@/lib/types';

interface Departamento {
  id: number;
  nome: string;
}

interface Categoria {
  id: number;
  nome: string;
}

interface CollectionEditorSidebarProps {
  colecaoId: string;
  existingCodigos: Set<string>;
  onAddProduct: (produto: CollectionProductData) => void;
}

const sortOptions = [
  { value: 'nome_asc', label: 'A-Z' },
  { value: 'nome_desc', label: 'Z-A' },
  { value: 'preco_asc', label: 'Preço ↑ (mais barato)' },
  { value: 'preco_desc', label: 'Preço ↓ (mais caro)' },
  { value: 'recente', label: 'Mais Recente' },
  { value: 'antigo', label: 'Mais Antiga' },
];

export default function CollectionEditorSidebar({
  colecaoId,
  existingCodigos,
  onAddProduct,
}: CollectionEditorSidebarProps) {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [sortBy, setSortBy] = useState('nome_asc');
  const [products, setProducts] = useState<CollectionProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
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

  // Fetch categorias quando departamento muda
  useEffect(() => {
    const fetchCategories = async () => {
      if (!selectedDept) {
        setCategorias([]);
        setSelectedCat(null);
        return;
      }
      try {
        const res = await fetch(`/api/categorias?departamento=${selectedDept}`);
        const data = await res.json();
        setCategorias(data);
        setSelectedCat(null); // reset categoria quando dept muda
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
      }
    };
    fetchCategories();
  }, [selectedDept]);

  // Count active filters
  const activeFilterCount = [selectedDept, selectedCat, precoMin, precoMax, searchTerm].filter(Boolean).length;

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
        ordem: sortBy,
      });

      if (searchTerm.length >= 2) {
        params.set('busca', searchTerm);
      }
      if (selectedDept !== null && !searchTerm) {
        params.set('departamento', String(selectedDept));
      }
      if (selectedCat !== null && !searchTerm) {
        params.set('categoria', String(selectedCat));
      }
      if (precoMin) {
        params.set('precoMin', precoMin);
      }
      if (precoMax) {
        params.set('precoMax', precoMax);
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
  }, [selectedDept, selectedCat, searchTerm, precoMin, precoMax, sortBy, existingCodigos]);

  // Reset and fetch when filters change
  useEffect(() => {
    if (selectedDept === null && selectedCat === null && searchTerm.length < 2 && !precoMin && !precoMax) {
      setProducts([]);
      setTotal(0);
      return;
    }
    setPage(1);
    setHasMore(true);
    fetchProducts(1, false);
  }, [selectedDept, selectedCat, searchTerm, precoMin, precoMax, sortBy, fetchProducts]);

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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDept(null);
    setSelectedCat(null);
    setPrecoMin('');
    setPrecoMax('');
    setSortBy('nome_asc');
  };

  const currentSortLabel = sortOptions.find(o => o.value === sortBy)?.label || 'A-Z';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-border/50 flex-shrink-0 space-y-2">
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

        {/* Mobile: Filters + Sort toggle */}
        <div className="flex gap-2 sm:hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary/10 text-primary'
                : 'bg-muted/60 text-muted-foreground'
            }`}
          >
            <SlidersHorizontal size={12} />
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[8px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative flex-1">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg bg-muted/60 text-muted-foreground text-[10px] font-semibold hover:bg-muted transition-all"
            >
              <ArrowUpDown size={12} />
              <ChevronDown size={10} />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[180px]">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                      className={`w-full px-3 py-2 text-[10px] text-left transition-colors ${
                        sortBy === opt.value
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Sort bar */}
      <div className="hidden sm:flex items-center justify-between px-3 py-2 border-b border-border/50 flex-shrink-0">
        <p className="text-[10px] text-muted-foreground font-medium">Ordenar:</p>
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/60 text-muted-foreground text-[10px] hover:bg-muted transition-all"
          >
            <ArrowUpDown size={12} />
            {currentSortLabel}
          </button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-40 bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[160px]">
                {sortOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                    className={`w-full px-3 py-2 text-[10px] text-left transition-colors ${
                      sortBy === opt.value
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter Panel (Desktop always visible, Mobile collapsible) */}
      {(showFilters || typeof window === 'undefined' || window.innerWidth >= 640) && (
        <div className="px-3 py-2.5 border-b border-border/50 flex-shrink-0 bg-muted/20 space-y-2">
          {/* Department + Category */}
          <div className="flex gap-2">
            <select
              value={selectedDept || ''}
              onChange={(e) => setSelectedDept(e.target.value ? Number(e.target.value) : null)}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-background text-[10px] border border-border/50 outline-none focus:border-primary transition-all"
            >
              <option value="">Todos Deps.</option>
              {departamentos.map(d => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>

            <select
              value={selectedCat || ''}
              onChange={(e) => setSelectedCat(e.target.value ? Number(e.target.value) : null)}
              disabled={!selectedDept}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-background text-[10px] border border-border/50 outline-none focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todas Cats.</option>
              {categorias.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="flex gap-2 items-center">
            <span className="text-[10px] text-muted-foreground font-semibold whitespace-nowrap">Preço:</span>
            <input
              type="number"
              placeholder="Min"
              value={precoMin}
              onChange={(e) => setPrecoMin(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg bg-background text-[10px] border border-border/50 outline-none focus:border-primary transition-all"
            />
            <span className="text-muted-foreground/50 text-[10px]">–</span>
            <input
              type="number"
              placeholder="Max"
              value={precoMax}
              onChange={(e) => setPrecoMax(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg bg-background text-[10px] border border-border/50 outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Clear button */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="w-full px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-semibold hover:bg-red-500/20 transition-all"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      {/* Info bar */}
      {(selectedDept !== null || selectedCat !== null || searchTerm.length >= 2 || precoMin || precoMax) && (
        <div className="px-3 py-2 bg-muted/30 border-b border-border/30 flex items-center justify-between flex-shrink-0">
          <p className="text-[10px] text-muted-foreground">
            {loading ? '🔍 Buscando...' : `${products.length} de ${total} disponiveis`}
          </p>
          {searchTerm && (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full max-w-[120px] truncate">
              "{searchTerm}"
            </span>
          )}
        </div>
      )}

      {/* Products list with infinite scroll */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2">
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={16} className="animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-xs">
              {searchTerm
                ? 'Nenhum produto encontrado'
                : selectedDept === null && selectedCat === null && !precoMin && !precoMax
                ? 'Selecione filtros para começar'
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
                    <div className="w-full h-full flex items-center justify-center text-base bg-muted">💎</div>
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
                <Loader2 size={14} className="animate-spin text-primary" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
