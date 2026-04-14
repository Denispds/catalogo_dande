'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/header';
import ProductCard from '@/components/product-card';
import FilterPanel from '@/components/filter-panel';
import ShareModal from '@/components/share-modal';
import ImageLightbox from '@/components/image-lightbox';
import { Search, ArrowUpDown, Loader2, Package, X, LayoutGrid, List, Square, CheckSquare, XCircle, FileText, Share2, CheckCheck, EyeOff, Eye } from 'lucide-react';

const defaultFilters = { departamento: '', categoria: '', subcategoria: '', precoMin: '', precoMax: '', descontoMin: '' };
const ordemOptions = [
  { value: 'recente', label: 'Mais Recente' },
  { value: 'antigo', label: 'Mais Antiga' },
  { value: 'nome_asc', label: 'A-Z' },
  { value: 'nome_desc', label: 'Z-A' },
  { value: 'preco_asc', label: 'Preço ↑' },
  { value: 'preco_desc', label: 'Preço ↓' },
];

export default function CatalogClient() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [filters, setFilters] = useState(defaultFilters);
  const [ordem, setOrdem] = useState('recente');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [shareProduct, setShareProduct] = useState<any>(null);
  const [showPrice] = useState(true);
  const [showCode] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const searchTimeoutRef = useRef<any>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Layout & selection state
  const [layout, setLayout] = useState<'grid' | 'single' | 'list'>('grid');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [hideInfoOnExport, setHideInfoOnExport] = useState(false);
  const [exportColumns, setExportColumns] = useState<1 | 2>(2);

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

  const fetchProdutos = useCallback(async (pageNum?: number, isLoadingMore: boolean = false) => {
    const pageToFetch = pageNum ?? page;
    if (isLoadingMore) setLoadingMore(true);
    else setLoading(true);
    
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
      params.set('page', String(pageToFetch));
      params.set('limit', String(limit));
      // Sempre usar comImagem=true para garantir apenas produtos com imagens
      params.set('comImagem', 'true');
      
      const res = await fetch(`/api/produtos?${params.toString()}`);
      const data = await res.json();
      
      if (isLoadingMore) {
        // Concatenar produtos ao carregar mais
        setProdutos(prev => [...prev, ...(data?.produtos ?? [])]);
      } else {
        // Reset na primeira carga
        setProdutos(data?.produtos ?? []);
      }
      
      setTotal(data?.total ?? 0);
      const totalPages = data?.totalPages ?? 0;
      setHasMore(pageToFetch < totalPages);
    } catch (e: any) {
      console.error('Fetch error:', e);
      if (!isLoadingMore) setProdutos([]);
    }
    
    if (isLoadingMore) setLoadingMore(false);
    else setLoading(false);
  }, [busca, filters, ordem, limit]);

  // Fetch inicial
  useEffect(() => { 
    if (page === 1) fetchProdutos(1, false); 
  }, [fetchProdutos]);

  // Reset quando filtros/busca/ordem mudam
  useEffect(() => {
    setPage(1);
    setProdutos([]);
    setHasMore(true);
  }, [busca, filters, ordem]);

  // Carregar departamentos e categorias
  useEffect(() => {
    Promise.all([
      fetch('/api/departamentos').then((r: any) => r?.json?.()).catch(() => []),
      fetch('/api/categorias').then((r: any) => r?.json?.()).catch(() => []),
    ]).then(([deps, cats]: any) => {
      setDepartamentos(deps ?? []);
      setCategorias(cats ?? []);
    });
  }, []);

  // Intersection Observer para scroll infinito
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProdutos(nextPage, true);
        }
      },
      { rootMargin: '100px' }
    );
    
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [page, loadingMore, hasMore, fetchProdutos]);

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

  const selectAllOnPage = () => {
    const codes = new Set(selectedCodes);
    produtos.forEach((p: any) => { if (p?.codigo) codes.add(p.codigo); });
    setSelectedCodes(codes);
  };

  const allPageSelected = produtos.length > 0 && produtos.every((p: any) => selectedCodes.has(p?.codigo));

  const buildCardHtml = (p: any, showInfo: boolean, cols: number) => {
    const imagens = p?.imagens ?? [];
    const nome = (p?.nome ?? '').trim().split(/\s+/).slice(0, 2).join(' ');
    const preco = `R$ ${(p?.preco ?? 0).toFixed(2).replace('.', ',')}`;
    const aspectRatio = cols === 1 ? '3/4' : '4/5';
    const imgStyle = `width:100%;aspect-ratio:${aspectRatio};object-fit:cover;background:#f5f5f5;display:block;`;

    // Filter only images (exclude videos that can't render as <img>)
    const onlyImages = imagens.filter((img: any) => {
      const isVideo = img?.tipo === 'video' || img?.url?.match?.(/\.(mp4|webm|mov|avi)$/i);
      if (isVideo && img?.thumbnailUrl) return true; // use thumbnail
      return !isVideo;
    });

    const imgsHtml = onlyImages.length > 0
      ? onlyImages.map((img: any) => {
          const isVideo = img?.tipo === 'video' || img?.url?.match?.(/\.(mp4|webm|mov|avi)$/i);
          const src = isVideo ? img.thumbnailUrl : img.url;
          const singleRound = !showInfo && onlyImages.length === 1 ? 'border-radius:12px;' : '';
          return `<img src="${src}" alt="${nome}" style="${imgStyle}${singleRound}">`;
        }).join('\n')
      : `<div style="aspect-ratio:${aspectRatio};background:#f0e0f0;display:flex;align-items:center;justify-content:center;font-size:32px">💎</div>`;

    const infoHtml = showInfo
      ? `<div class="info"><div class="name">${nome}</div><div class="code">${p?.codigo ?? ''}</div><div class="price">${preco}</div></div>`
      : '';

    return `<div class="card">${imgsHtml}${infoHtml}</div>`;
  };

  const buildCatalogHtml = (selected: any[], showInfo: boolean, cols: number) => {
    const maxWidth = cols === 1 ? '400px' : '500px';
    return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Catálogo Dande Acessórios</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#333;padding:20px}
  h1{text-align:center;color:#E91E8C;margin-bottom:8px;font-size:22px}
  .subtitle{text-align:center;color:#888;font-size:12px;margin-bottom:24px}
  .grid{display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px;max-width:${maxWidth};margin:0 auto}
  .card{border-radius:12px;overflow:hidden;break-inside:avoid;${showInfo ? 'border:1px solid #eee;' : ''}}
  .card img{display:block}
  .info{padding:8px 10px}
  .name{font-size:${cols === 1 ? '13px' : '11px'};font-weight:600;margin-bottom:2px}
  .code{font-size:${cols === 1 ? '10px' : '9px'};color:#999;font-family:monospace}
  .price{font-size:${cols === 1 ? '15px' : '13px'};font-weight:700;color:#E91E8C;margin-top:4px}
  @media print{body{padding:10px}.grid{gap:8px}}
</style></head><body>
<h1>💎 Dande Acessórios</h1>
<p class="subtitle">${selected.length} produto(s)</p>
<div class="grid">
${selected.map((p: any) => buildCardHtml(p, showInfo, cols)).join('\n')}
</div>
</body></html>`;
  };

  const exportSelected = () => {
    const selected = produtos.filter((p: any) => selectedCodes.has(p?.codigo));
    if (selected.length === 0) return;
    const showInfo = !hideInfoOnExport;
    const html = buildCatalogHtml(selected, showInfo, exportColumns);

    // Use data URI approach - works in iframes and all browsers
    const dataUri = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = `catalogo-dande-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const printSelected = () => {
    const selected = produtos.filter((p: any) => selectedCodes.has(p?.codigo));
    if (selected.length === 0) return;
    const showInfo = !hideInfoOnExport;
    const html = buildCatalogHtml(selected, showInfo, exportColumns);

    // Open in new tab with the HTML content for printing
    const printHtml = html.replace('</body>', '<script>window.onload=()=>{setTimeout(()=>window.print(),500)}<\/script></body>');
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(printHtml);
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

          {/* Layout toggle: grid (2/row), single (1/row), list */}
          <div className="flex items-center rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
            <button
              onClick={() => setLayout('grid')}
              title="2 por linha"
              className={`p-2 transition-all duration-200 ${layout === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setLayout('single')}
              title="1 por linha"
              className={`p-2 transition-all duration-200 ${layout === 'single' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              <Square size={14} />
            </button>
            <button
              onClick={() => setLayout('list')}
              title="Lista"
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
        {selectionMode && (
          <div className="mb-4 px-3 py-2.5 rounded-2xl bg-primary/5 border border-primary/15 space-y-2">
            {/* Row 1: count + select all + actions */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary">
                {selectedCodes.size} selecionado(s)
              </span>

              {/* Select all on page */}
              <button
                onClick={selectAllOnPage}
                disabled={allPageSelected}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95 ${
                  allPageSelected
                    ? 'bg-muted text-muted-foreground opacity-50'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                <CheckCheck size={12} /> Todos da página
              </button>

              <div className="ml-auto flex items-center gap-1.5">
                {selectedCodes.size > 0 && (
                  <>
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
                  </>
                )}
                <button
                  onClick={clearSelection}
                  className="w-7 h-7 rounded-xl bg-card border border-border flex items-center justify-center transition-all active:scale-95"
                >
                  <XCircle size={13} className="text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Row 2: export options */}
            {selectedCodes.size > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setHideInfoOnExport(!hideInfoOnExport)}
                  className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {hideInfoOnExport ? <EyeOff size={12} className="text-primary" /> : <Eye size={12} />}
                  {hideInfoOnExport ? 'Só imagens' : 'Ocultar info'}
                </button>

                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-[10px] text-muted-foreground">Colunas:</span>
                  <button
                    onClick={() => setExportColumns(1)}
                    className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all active:scale-90 ${
                      exportColumns === 1
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    1
                  </button>
                  <button
                    onClick={() => setExportColumns(2)}
                    className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all active:scale-90 ${
                      exportColumns === 2
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    2
                  </button>
                </div>
              </div>
            )}
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
        ) : (
          <div className={
            layout === 'list' ? 'flex flex-col gap-2' :
            layout === 'single' ? 'flex flex-col gap-3' :
            'grid grid-cols-2 gap-2.5'
          }>
            {produtos?.map?.((p: any) => (
              <ProductCard
                key={p?.codigo}
                produto={p}
                layout={layout}
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

        {/* Infinite scroll loader */}
        {hasMore && (
          <div 
            ref={loadMoreRef} 
            className="flex items-center justify-center py-8"
          >
            {loadingMore && <Loader2 size={24} className="animate-spin text-primary" />}
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
