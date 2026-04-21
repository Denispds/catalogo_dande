'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/header';
import ProductCard from '@/components/product-card';
import ShareModal from '@/components/share-modal';
import ImageLightbox from '@/components/image-lightbox';
import WhatsAppCollectionShare from '@/components/whatsapp-collection-share';
import {
  Search, ArrowUpDown, Loader2, Package, X, LayoutGrid, List, Square,
  CheckSquare, XCircle, FileText, Share2, CheckCheck, EyeOff, Eye,
  ChevronLeft, MessageCircle, Link as LinkIcon, Check, Copy
} from 'lucide-react';
import Link from 'next/link';

const ordemOptions = [
  { value: 'ordem', label: 'Ordem' },
  { value: 'nome_asc', label: 'A→Z' },
  { value: 'nome_desc', label: 'Z→A' },
  { value: 'preco_asc', label: 'Preço ↑' },
  { value: 'preco_desc', label: 'Preço ↓' },
];

interface ColecaoInfo {
  id: string;
  nome: string;
  slug: string | null;
  descricao: string | null;
  cor: string;
}

interface Props {
  colecao: ColecaoInfo;
}

export default function CollectionCatalogClient({ colecao }: Props) {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [allProdutos, setAllProdutos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaInput, setBuscaInput] = useState('');
  const [ordem, setOrdem] = useState('ordem');
  const searchTimeoutRef = useRef<any>(null);

  // Layout & selection state
  const [layout, setLayout] = useState<'grid' | 'single' | 'list'>('grid');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [hideInfoOnExport, setHideInfoOnExport] = useState(false);
  const [exportColumns, setExportColumns] = useState(2);

  // Share & lightbox state
  const [shareProduct, setShareProduct] = useState<any>(null);
  const [showCollectionShare, setShowCollectionShare] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxProduto, setLightboxProduto] = useState<any>(null);
  const [showPrice] = useState(true);
  const [showCode] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleImageTap = (produto: any) => {
    const imgs = produto?.imagens ?? [];
    if (imgs.length === 0) return;
    setLightboxImages(imgs);
    setLightboxIndex(0);
    setLightboxProduto(produto);
    setLightboxOpen(true);
  };

  // Fetch collection products
  useEffect(() => {
    setLoading(true);
    fetch(`/api/colecoes/${colecao.id}`)
      .then(r => r.json())
      .then(data => {
        if (data?.id) {
          const mapped = (data?.produtos ?? []).map((cp: any) => ({ ...cp?.produto, _ordem: cp?.ordem ?? 0 }));
          setAllProdutos(mapped);
          setProdutos(mapped);
        }
        setLoading(false);
      })
      .catch(e => { console.error(e); setLoading(false); });
  }, [colecao.id]);

  // Filter & sort when busca/ordem change
  useEffect(() => {
    let filtered = [...allProdutos];
    if (busca) {
      const term = busca.toLowerCase();
      filtered = filtered.filter((p: any) =>
        (p?.nome ?? '').toLowerCase().includes(term) ||
        (p?.codigo ?? '').toLowerCase().includes(term)
      );
    }
    // Sort
    filtered.sort((a: any, b: any) => {
      switch (ordem) {
        case 'nome_asc': return (a?.nome ?? '').localeCompare(b?.nome ?? '');
        case 'nome_desc': return (b?.nome ?? '').localeCompare(a?.nome ?? '');
        case 'preco_asc': return (a?.preco ?? 0) - (b?.preco ?? 0);
        case 'preco_desc': return (b?.preco ?? 0) - (a?.preco ?? 0);
        default: return (a?._ordem ?? 0) - (b?._ordem ?? 0); // ordem original
      }
    });
    setProdutos(filtered);
  }, [busca, ordem, allProdutos]);

  const handleSearchInput = (e: any) => {
    const val = e?.target?.value ?? '';
    setBuscaInput(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setBusca(val), 300);
  };

  const clearSearch = () => {
    setBuscaInput('');
    setBusca('');
  };

  // Selection logic
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedCodes(new Set());
  };

  const toggleSelect = (codigo: string) => {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      return next;
    });
  };

  const selectAllOnPage = () => {
    const codes = new Set(selectedCodes);
    produtos?.forEach?.((p: any) => { if (p?.codigo) codes.add(p.codigo); });
    setSelectedCodes(codes);
  };

  const clearSelection = () => setSelectedCodes(new Set());
  const allPageSelected = produtos?.every?.((p: any) => selectedCodes.has(p?.codigo));

  // Export functions
  const generateExportHtml = useCallback(() => {
    const selected = produtos?.filter?.((p: any) => selectedCodes.has(p?.codigo)) ?? [];
    if (selected.length === 0) return '';
    const cols = exportColumns;
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Coleção ${colecao.nome}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,sans-serif;padding:16px;background:#fff}.grid{display:grid;grid-template-columns:repeat(${cols},1fr);gap:12px}.card{border:1px solid #e5e5e5;border-radius:12px;overflow:hidden}.card img{width:100%;aspect-ratio:1;object-fit:cover}.info{padding:8px}.info h3{font-size:13px;font-weight:600;margin-bottom:2px}.info span{font-size:11px;color:#666}h1{text-align:center;margin-bottom:16px;font-size:18px;color:#333}</style></head><body>`;
    html += `<h1>${colecao.nome}</h1>`;
    html += `<div class="grid">`;
    selected.forEach((p: any) => {
      const img = p?.imagens?.[0]?.url ?? '';
      html += `<div class="card">`;
      if (img) html += `<img src="${img}" alt="${p?.nome ?? ''}" />`;
      if (!hideInfoOnExport) {
        html += `<div class="info"><h3>${p?.nome ?? ''}</h3><span>${p?.codigo ?? ''} - R$ ${(p?.preco ?? 0).toFixed(2)}</span></div>`;
      }
      html += `</div>`;
    });
    html += `</div></body></html>`;
    return html;
  }, [produtos, selectedCodes, hideInfoOnExport, exportColumns, colecao.nome]);

  const exportSelected = useCallback(() => {
    const html = generateExportHtml();
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `colecao-${colecao.slug ?? colecao.id}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generateExportHtml, colecao.slug, colecao.id]);

  const printSelected = useCallback(() => {
    const html = generateExportHtml();
    if (!html) return;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  }, [generateExportHtml]);

  // Copy collection link
  const copyCollectionLink = async () => {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/colecoes/${colecao.slug}` : '';
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); } catch (_) {}
      document.body.removeChild(textarea);
    }
  };

  // Build WhatsApp collection share data
  const collectionShareData = {
    id: colecao.id,
    nome: colecao.nome,
    slug: colecao.slug,
    descricao: colecao.descricao,
    produtos: allProdutos.map((p: any) => ({ produto: p })),
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* Collection header */}
        <div className="mb-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">Catálogo</Link>
            <span>/</span>
            <Link href="/colecoes" className="hover:text-foreground transition-colors">Coleções</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">{colecao.nome}</span>
          </div>

          {/* Collection info card */}
          <div
            className="p-4 rounded-2xl border border-border/50 shadow-sm"
            style={{ background: `linear-gradient(135deg, ${colecao.cor}08, ${colecao.cor}15)`, borderColor: `${colecao.cor}30` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colecao.cor }} />
                  <h1 className="text-lg font-bold truncate">{colecao.nome}</h1>
                </div>
                {colecao.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{colecao.descricao}</p>
                )}
                <span className="text-xs text-muted-foreground">
                  {loading ? '...' : `${produtos.length} produto${produtos.length !== 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={copyCollectionLink}
                  className="p-2 rounded-xl bg-card border border-border/50 shadow-sm hover:bg-muted/50 transition-all active:scale-95"
                  title="Copiar link"
                >
                  {copiedLink ? <Check size={16} className="text-green-600" /> : <LinkIcon size={16} className="text-muted-foreground" />}
                </button>
                <button
                  onClick={() => setShowCollectionShare(true)}
                  className="p-2 rounded-xl bg-[#25D366] text-white shadow-sm hover:bg-[#1fb855] transition-all active:scale-95"
                  title="Compartilhar via WhatsApp"
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={buscaInput}
            placeholder="Buscar nesta coleção..."
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
          {/* Sort */}
          <div className="flex items-center gap-1 px-2.5 py-2 rounded-2xl bg-card border border-border/50 shadow-sm">
            <ArrowUpDown size={13} className="text-muted-foreground" />
            <select
              value={ordem}
              onChange={(e: any) => setOrdem(e?.target?.value)}
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
            {loading ? '...' : produtos.length}
          </span>
        </div>

        {/* Selection toolbar */}
        {selectionMode && (
          <div className="mb-4 px-3 py-2.5 rounded-2xl bg-primary/5 border border-primary/15 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-primary">
                {selectedCodes.size} selecionado(s)
              </span>
              <button
                onClick={selectAllOnPage}
                disabled={allPageSelected}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all active:scale-95 ${
                  allPageSelected
                    ? 'bg-muted text-muted-foreground opacity-50'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                <CheckCheck size={12} /> Todos
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
                  {[1, 2].map(n => (
                    <button
                      key={n}
                      onClick={() => setExportColumns(n)}
                      className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all active:scale-90 ${
                        exportColumns === n
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-pink-200 dark:border-gold/30 border-t-pink-500 dark:border-t-gold animate-spin" />
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        ) : produtos?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
              <Package size={32} className="text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">Nenhum produto encontrado</p>
            {busca && <p className="text-xs text-muted-foreground/70">Tente outro termo de busca</p>}
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
      </main>

      <ShareModal
        produto={shareProduct}
        isOpen={!!shareProduct}
        onClose={() => setShareProduct(null)}
      />

      <WhatsAppCollectionShare
        colecao={collectionShareData}
        isOpen={showCollectionShare}
        onClose={() => setShowCollectionShare(false)}
      />

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => { setLightboxOpen(false); setLightboxProduto(null); }}
        produto={lightboxProduto}
      />
    </div>
  );
}
