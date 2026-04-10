'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/header';
import ProductCard from '@/components/product-card';
import FilterPanel from '@/components/filter-panel';
import ShareModal from '@/components/share-modal';
import ImageLightbox from '@/components/image-lightbox';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, Package, X, LayoutGrid, List, CheckSquare, XCircle, FileText, Share2 } from 'lucide-react';

const defaultFilters = { departamento: '', categoria: '', subcategoria: '', precoMin: '', precoMax: '', descontoMin: '' };
const ordemOptions = [
  { value: 'nome_asc', label: 'A-Z' },
  { value: 'nome_desc', label: 'Z-A' },
  { value: 'preco_asc', label: 'Preço ↑' },
  { value: 'preco_desc', label: 'Preço ↓' },
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

  // Layout & selection state
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  // Lightbox state
  const [lightboxImages, setLightboxImages] = useState<{ url: string }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleImageTap = (produto: any, imageIndex: number) => {
    const imgs = produto?.imagens ?? [];
    if (imgs.length === 0) return;
    setLightboxImages(imgs);
    setLightboxIndex(imageIndex);
    setLightboxOpen(true);
  };

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

  const toggleSelect = (produto: any) => {
    const code = produto?.codigo;
    if (!code) return;
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedCodes(new Set());
    setSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      clearSelection();
    } else {
      setSelectionMode(true);
    }
  };

  const exportSelected = () => {
    const selected = produtos.filter((p: any) => selectedCodes.has(p?.codigo));
    if (selected.length === 0) return;

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Catálogo Dande Acessórios</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#333;padding:20px}
  h1{text-align:center;color:#E91E8C;margin-bottom:8px;font-size:22px}
  .subtitle{text-align:center;color:#888;font-size:12px;margin-bottom:24px}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;max-width:500px;margin:0 auto}
  .card{border:1px solid #eee;border-radius:12px;overflow:hidden}
  .card img{width:100%;aspect-ratio:1;object-fit:cover;background:#f5f5f5}
  .card .info{padding:8px 10px}
  .card .name{font-size:11px;font-weight:600;margin-bottom:2px}
  .card .code{font-size:9px;color:#999;font-family:monospace}
  .card .price{font-size:13px;font-weight:700;color:#E91E8C;margin-top:4px}
  @media print{body{padding:10px}.grid{gap:8px}}
</style></head><body>
<h1>💎 Dande Acessórios</h1>
<p class="subtitle">${selected.length} produto(s) selecionado(s)</p>
<div class="grid">
${selected.map((p: any) => {
  const img = p?.imagens?.[0]?.url;
  const nome = (p?.nome ?? '').trim().split(/\s+/).slice(0, 2).join(' ');
  const preco = `R$ ${(p?.preco ?? 0).toFixed(2).replace('.', ',')}`;
  return `<div class="card">${img ? `<img src="${img}" alt="${nome}">` : '<div style="aspect-ratio:1;background:#f0e0f0;display:flex;align-items:center;justify-content:center;font-size:32px">💎</div>'}<div class="info"><div class="name">${nome}</div><div class="code">${p?.codigo ?? ''}</div><div class="price">${preco}</div></div></div>`;
}).join('\n')}
</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogo-dande-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printSelected = () => {
    const selected = produtos.filter((p: any) => selectedCodes.has(p?.codigo));
    if (selected.length === 0) return;

    const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Catálogo Dande</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:10mm}
  h1{text-align:center;color:#E91E8C;font-size:18px;margin-bottom:4mm}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}
  .card{border:1px solid #ddd;border-radius:4mm;overflow:hidden;break-inside:avoid}
  .card img{width:100%;aspect-ratio:1;object-fit:cover}
  .info{padding:2mm 3mm}
  .name{font-size:9px;font-weight:600}
  .code{font-size:8px;color:#999;font-family:monospace}
  .price{font-size:11px;font-weight:700;color:#E91E8C;margin-top:1mm}
</style></head><body>
<h1>Dande Acessórios</h1>
<div class="grid">
${selected.map((p: any) => {
  const img = p?.imagens?.[0]?.url;
  const nome = (p?.nome ?? '').trim().split(/\s+/).slice(0, 2).join(' ');
  const preco = `R$ ${(p?.preco ?? 0).toFixed(2).replace('.', ',')}`;
  return `<div class="card">${img ? `<img src="${img}">` : ''}<div class="info"><div class="name">${nome}</div><div class="code">${p?.codigo ?? ''}</div><div class="price">${preco}</div></div></div>`;
}).join('')}
</div>
<script>window.onload=()=>{window.print()}<\/script>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Search bar */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={buscaInput}
            placeholder="Buscar por nome ou código..."
            onChange={handleSearchInput}
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-card text-sm border border-border/50 focus:ring-2 focus:ring-primary/30 focus:border-primary/50 outline-none transition-all duration-300 shadow-sm placeholder:text-muted-foreground/60"
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
        <div className="flex items-center gap-1.5 mb-4">
          <FilterPanel
            departamentos={departamentos}
            categorias={categorias}
            filters={filters}
            onChange={(f: any) => { setFilters(f); setPage(1); }}
            onClear={() => { setFilters(defaultFilters); setPage(1); }}
          />

          {/* Sort */}
          <div className="flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-card border border-border/50 shadow-sm">
            <ArrowUpDown size={13} className="text-muted-foreground" />
            <select
              value={ordem}
              onChange={(e: any) => { setOrdem(e?.target?.value); setPage(1); }}
              className="text-[11px] bg-transparent outline-none appearance-none cursor-pointer font-medium"
            >
              {ordemOptions?.map?.((o: any) => (
                <option key={o?.value} value={o?.value}>{o?.label}</option>
              ))}
            </select>
          </div>

          {/* Layout toggle */}
          <div className="flex items-center rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
            <button
              onClick={() => setLayout('grid')}
              className={`p-2 transition-all duration-200 ${layout === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setLayout('list')}
              className={`p-2 transition-all duration-200 ${layout === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <List size={14} />
            </button>
          </div>

          {/* Selection toggle */}
          <button
            onClick={toggleSelectionMode}
            className={`p-2 rounded-2xl border shadow-sm transition-all duration-200 ${
              selectionMode
                ? 'bg-primary text-white border-primary'
                : 'bg-card text-muted-foreground border-border/50 hover:bg-muted/50'
            }`}
          >
            <CheckSquare size={14} />
          </button>

          {/* Count */}
          <span className="ml-auto text-[11px] text-muted-foreground font-medium tabular-nums">
            {loading ? '...' : total}
          </span>
        </div>

        {/* Selection toolbar */}
        {selectionMode && selectedCodes.size > 0 && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-2xl bg-primary/5 border border-primary/15">
            <span className="text-xs font-semibold text-primary">
              {selectedCodes.size} selecionado(s)
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={printSelected}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary text-white text-[10px] font-semibold transition-all active:scale-95"
              >
                <FileText size={12} /> PDF
              </button>
              <button
                onClick={exportSelected}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-card border border-border text-[10px] font-semibold transition-all active:scale-95"
              >
                <Share2 size={12} /> HTML
              </button>
              <button
                onClick={clearSelection}
                className="w-7 h-7 rounded-xl bg-card border border-border flex items-center justify-center transition-all active:scale-95"
              >
                <XCircle size={13} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Info banner when searching */}
        {busca && (
          <div className="mb-3 px-3 py-2 rounded-2xl bg-primary/5 border border-primary/10">
            <p className="text-[11px] text-primary font-medium">
              🔍 Buscando &quot;{busca}&quot; em todos os produtos
            </p>
          </div>
        )}

        {/* Products */}
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
        ) : layout === 'list' ? (
          <div className="flex flex-col gap-2">
            {produtos?.map?.((p: any) => (
              <ProductCard
                key={p?.codigo}
                produto={p}
                layout="list"
                onShare={(prod: any) => setShareProduct(prod)}
                showPrice={showPrice}
                showCode={showCode}
                selectionMode={selectionMode}
                selected={selectedCodes.has(p?.codigo)}
                onSelect={toggleSelect}
                onImageTap={handleImageTap}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {produtos?.map?.((p: any) => (
              <ProductCard
                key={p?.codigo}
                produto={p}
                layout="grid"
                onShare={(prod: any) => setShareProduct(prod)}
                showPrice={showPrice}
                showCode={showCode}
                selectionMode={selectionMode}
                selected={selectedCodes.has(p?.codigo)}
                onSelect={toggleSelect}
                onImageTap={handleImageTap}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-6 mb-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="w-9 h-9 rounded-2xl bg-card flex items-center justify-center disabled:opacity-30 transition-all duration-300 active:scale-90 shadow-sm border border-border/50"
            >
              <ChevronLeft size={15} />
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
                  className={`w-9 h-9 rounded-2xl text-xs font-semibold transition-all duration-300 active:scale-90 ${
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
              className="w-9 h-9 rounded-2xl bg-card flex items-center justify-center disabled:opacity-30 transition-all duration-300 active:scale-90 shadow-sm border border-border/50"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </main>

      <ShareModal
        produto={shareProduct}
        isOpen={!!shareProduct}
        onClose={() => setShareProduct(null)}
      />

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
