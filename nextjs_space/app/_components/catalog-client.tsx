'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/header';
import ProductCard from '@/components/product-card';
import FilterPanel from '@/components/filter-panel';
import ShareModal from '@/components/share-modal';
import { Search, LayoutGrid, List, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, Package, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const defaultFilters = { departamento: '', categoria: '', subcategoria: '', precoMin: '', precoMax: '', descontoMin: '' };
const limitOptions = [8, 12, 16, 24];
const ordemOptions = [
  { value: 'nome_asc', label: 'Nome A-Z' },
  { value: 'nome_desc', label: 'Nome Z-A' },
  { value: 'preco_asc', label: 'Pre\u00e7o \u2191' },
  { value: 'preco_desc', label: 'Pre\u00e7o \u2193' },
  { value: 'recente', label: 'Recentes' },
];

export default function CatalogClient() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filters, setFilters] = useState(defaultFilters);
  const [ordem, setOrdem] = useState('nome_asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [shareProduct, setShareProduct] = useState<any>(null);
  const [showPrice, setShowPrice] = useState(true);
  const [showCode, setShowCode] = useState(true);
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

  const handleSearch = (value: string) => {
    setBusca(value);
    setPage(1);
  };

  const handleSearchInput = (e: any) => {
    const val = e?.target?.value ?? '';
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => handleSearch(val), 400);
  };

  const toggleSelect = (codigo: string) => {
    setSelectedProducts((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo); else next.add(codigo);
      return next;
    });
  };

  const handleExportHTML = () => {
    const selected = produtos?.filter?.((p: any) => selectedProducts?.has?.(p?.codigo)) ?? [];
    if (selected?.length === 0) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Dande - Sele\u00e7\u00e3o</title><style>body{font-family:sans-serif;padding:20px}h1{color:#E91E8C}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}.card{border:1px solid #eee;border-radius:8px;padding:12px}img{max-width:100%;border-radius:4px}.price{color:#E91E8C;font-weight:bold;font-size:1.2em}</style></head><body><h1>\u2726 Dande Acess\u00f3rios</h1><div class="grid">${selected?.map?.((p: any) => `<div class="card"><h3>${p?.nome ?? ''}</h3>${showCode ? `<p>#${p?.codigo ?? ''}</p>` : ''}${showPrice ? `<p class="price">R$ ${(p?.preco ?? 0)?.toFixed?.(2)}</p>` : ''}</div>`)?.join?.('')}</div></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dande-selecao.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window?.print?.();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[1200px] mx-auto px-4 py-4">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            <span className="text-primary">\u2726</span> Cat\u00e1logo <span className="text-primary">Dande</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Encontre as melhores pe\u00e7as e acess\u00f3rios</p>
        </motion.div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome ou c\u00f3digo..."
            onChange={handleSearchInput}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card text-sm border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          />
        </div>

        {/* Filters + Controls */}
        <div className="flex flex-wrap items-start gap-2 mb-4">
          <FilterPanel
            departamentos={departamentos}
            categorias={categorias}
            filters={filters}
            onChange={(f: any) => { setFilters(f); setPage(1); }}
            onClear={() => { setFilters(defaultFilters); setPage(1); }}
          />

          <div className="flex items-center gap-2 ml-auto">
            {/* Settings toggles */}
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={showPrice} onChange={() => setShowPrice(!showPrice)} className="accent-primary w-3.5 h-3.5" />
                Pre\u00e7o
              </label>
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={showCode} onChange={() => setShowCode(!showCode)} className="accent-primary w-3.5 h-3.5" />
                C\u00f3digo
              </label>
            </div>

            {/* Order */}
            <div className="flex items-center gap-1">
              <ArrowUpDown size={14} className="text-muted-foreground" />
              <select
                value={ordem}
                onChange={(e: any) => { setOrdem(e?.target?.value); setPage(1); }}
                className="text-xs px-2 py-1.5 rounded-lg bg-card border border-border focus:ring-1 focus:ring-primary"
              >
                {ordemOptions?.map?.((o: any) => (
                  <option key={o?.value} value={o?.value}>{o?.label}</option>
                ))}
              </select>
            </div>

            {/* Limit */}
            <select
              value={limit}
              onChange={(e: any) => { setLimit(parseInt(e?.target?.value, 10)); setPage(1); }}
              className="text-xs px-2 py-1.5 rounded-lg bg-card border border-border focus:ring-1 focus:ring-primary"
            >
              {limitOptions?.map?.((l: number) => (
                <option key={l} value={l}>{l}/pg</option>
              ))}
            </select>

            {/* Layout toggle */}
            <div className="flex rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => setLayout('grid')}
                className={`p-1.5 ${layout === 'grid' ? 'bg-primary text-white' : 'bg-card hover:bg-muted'}`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setLayout('list')}
                className={`p-1.5 ${layout === 'list' ? 'bg-primary text-white' : 'bg-card hover:bg-muted'}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Selection actions */}
        {selectedProducts?.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-4 p-2 rounded-xl bg-primary/10">
            <Sparkles size={14} className="text-primary" />
            <span className="text-sm font-medium">{selectedProducts.size} selecionado(s)</span>
            <button onClick={handleExportHTML} className="ml-auto text-xs px-3 py-1 rounded-lg bg-primary text-white hover:bg-primary/90">Exportar HTML</button>
            <button onClick={handlePrint} className="text-xs px-3 py-1 rounded-lg bg-muted hover:bg-muted/80">Imprimir</button>
            <button onClick={() => setSelectedProducts(new Set())} className="text-xs px-3 py-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">Limpar</button>
          </motion.div>
        )}

        {/* Results info */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">
            {loading ? 'Carregando...' : `${total} produto(s) encontrado(s)`}
          </p>
        </div>

        {/* Products grid/list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : produtos?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Package size={48} />
            <p className="mt-2 text-sm">Nenhum produto encontrado</p>
          </div>
        ) : layout === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {produtos?.map?.((p: any) => (
              <ProductCard
                key={p?.codigo}
                produto={p}
                layout="grid"
                selected={selectedProducts?.has?.(p?.codigo)}
                onToggleSelect={toggleSelect}
                onShare={(prod: any) => setShareProduct(prod)}
                showPrice={showPrice}
                showCode={showCode}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {produtos?.map?.((p: any) => (
              <ProductCard
                key={p?.codigo}
                produto={p}
                layout="list"
                selected={selectedProducts?.has?.(p?.codigo)}
                onToggleSelect={toggleSelect}
                onShare={(prod: any) => setShareProduct(prod)}
                showPrice={showPrice}
                showCode={showCode}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 mb-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-card hover:bg-muted disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i: number) => {
              let pageNum: number;
              if (totalPages <= 7) pageNum = i + 1;
              else if (page <= 4) pageNum = i + 1;
              else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
              else pageNum = page - 3 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum ? 'bg-primary text-white' : 'bg-card hover:bg-muted'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-card hover:bg-muted disabled:opacity-30 transition-colors"
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
