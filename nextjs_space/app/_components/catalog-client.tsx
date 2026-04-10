'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/header';
import ProductCard from '@/components/product-card';
import FilterPanel from '@/components/filter-panel';
import ShareModal from '@/components/share-modal';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, Package, X } from 'lucide-react';

const defaultFilters = { departamento: '', categoria: '', subcategoria: '', precoMin: '', precoMax: '', descontoMin: '' };
const ordemOptions = [
  { value: 'nome_asc', label: 'A-Z' },
  { value: 'nome_desc', label: 'Z-A' },
  { value: 'preco_asc', label: 'Preço \u2191' },
  { value: 'preco_desc', label: 'Preço \u2193' },
];

export default function CatalogClient() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [filters, setFilters] = useState(defaultFilters);
  const [ordem, setOrdem] = useState('nome_asc');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [shareProduct, setShareProduct] = useState<any>(null);
  const [showPrice] = useState(true);
  const [showCode] = useState(true);
  const searchTimeoutRef = useRef<any>(null);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.set('busca', busca);
      if (filters?.departamento) params.set('departamento', filters.departamento);
      if (filters?.categoria) params.set('categoria', filters.categoria);
      if (filters?.subcategoria) params.set('subcategoria', filters.subcategoria);
      if (filters?.precoMin) params.set('precoMin', filters.precoMin);
      if (filters?.precoMax) params.set('precoMax', filters.precoMax);
      if (filters?.descontoMin) params.set('descontoMin', filters.descontoMin);
      params.set('ordem', ordem);
      params.set('page', String(page));
      params.set('limit', String(limit));
      // Mostrar apenas com imagem quando não está buscando
      if (!busca) params.set('comImagem', 'true');
      const res = await fetch(`/api/produtos?${params.toString()}`);
      const data = await res.json();
      setProdutos(data?.produtos ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 0);
    } catch (e: any) {
      console.error('Fetch error:', e);
      setProdutos([]);
    }
    setLoading(false);
  }, [busca, filters, ordem, page, limit]);

  useEffect(() => { fetchProdutos(); }, [fetchProdutos]);

  useEffect(() => {
    Promise.all([
      fetch('/api/departamentos').then((r: any) => r?.json?.()).catch(() => []),
      fetch('/api/categorias').then((r: any) => r?.json?.()).catch(() => []),
    ]).then(([deps, cats]: any) => {
      setDepartamentos(deps ?? []);
      setCategorias(cats ?? []);
    });
  }, []);

  const handleSearchInput = (e: any) => {
    const val = e?.target?.value ?? '';
    setBuscaInput(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setBusca(val);
      setPage(1);
    }, 500);
  };

  const clearSearch = () => {
    setBuscaInput('');
    setBusca('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Search bar */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={buscaInput}
            placeholder="Buscar por nome ou código..."
            onChange={handleSearchInput}
            className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-card text-sm border border-border/50 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all duration-300 shadow-sm placeholder:text-muted-foreground/60"
          />
          {buscaInput && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center transition-all hover:bg-muted-foreground/20"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2 mb-5">
          <FilterPanel
            departamentos={departamentos}
            categorias={categorias}
            filters={filters}
            onChange={(f: any) => { setFilters(f); setPage(1); }}
            onClear={() => { setFilters(defaultFilters); setPage(1); }}
          />

          {/* Sort */}
          <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-card border border-border/50 shadow-sm">
            <ArrowUpDown size={14} className="text-muted-foreground" />
            <select
              value={ordem}
              onChange={(e: any) => { setOrdem(e?.target?.value); setPage(1); }}
              className="text-xs bg-transparent outline-none appearance-none cursor-pointer font-medium"
            >
              {ordemOptions?.map?.((o: any) => (
                <option key={o?.value} value={o?.value}>{o?.label}</option>
              ))}
            </select>
          </div>

          {/* Count */}
          <span className="ml-auto text-xs text-muted-foreground font-medium">
            {loading ? '...' : `${total}`}
          </span>
        </div>

        {/* Info banner when searching */}
        {busca && (
          <div className="mb-4 px-4 py-2.5 rounded-2xl bg-primary/5 border border-primary/10">
            <p className="text-xs text-primary font-medium">
              🔍 Buscando &quot;{busca}&quot; em todos os produtos
            </p>
          </div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-pink-200 border-t-pink-500 animate-spin" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : produtos?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
              <Package size={32} className="text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">Nenhum produto encontrado</p>
            <p className="text-xs text-muted-foreground/70">Tente outro termo de busca</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {produtos?.map?.((p: any) => (
              <ProductCard
                key={p?.codigo}
                produto={p}
                onShare={(prod: any) => setShareProduct(prod)}
                showPrice={showPrice}
                showCode={showCode}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-8 mb-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="w-10 h-10 rounded-2xl bg-card flex items-center justify-center disabled:opacity-30 transition-all duration-300 active:scale-90 shadow-sm border border-border/50"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i: number) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-2xl text-sm font-semibold transition-all duration-300 active:scale-90 ${
                    page === pageNum
                      ? 'bg-primary text-white shadow-lg shadow-primary/30'
                      : 'bg-card hover:bg-muted shadow-sm border border-border/50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="w-10 h-10 rounded-2xl bg-card flex items-center justify-center disabled:opacity-30 transition-all duration-300 active:scale-90 shadow-sm border border-border/50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      <ShareModal
        produto={shareProduct}
        isOpen={!!shareProduct}
        onClose={() => setShareProduct(null)}
      />
    </div>
  );
}
