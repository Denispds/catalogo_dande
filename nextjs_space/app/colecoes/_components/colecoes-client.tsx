'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/header';
import ProductCard from '@/components/product-card';
import ShareModal from '@/components/share-modal';
import WhatsAppCollectionShare from '@/components/whatsapp-collection-share';
import ImageLightbox from '@/components/image-lightbox';
import Image from 'next/image';
import {
  Loader2, FolderOpen, MessageCircle, Download, Plus, Pencil, Trash2, X,
  Search, ChevronDown, ArrowUpDown, Check, Package, Image as ImageIcon, CheckSquare, Square,
  List, Grid3x3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { generateCatalogName } from '@/lib/catalog-naming';

const defaultFilters = { departamento: '', categoria: '', subcategoria: '', precoMin: '', precoMax: '', descontoMin: '' };
const ordemOptions = [
  { value: 'recente', label: 'Mais Recente' },
  { value: 'antigo', label: 'Mais Antiga' },
  { value: 'nome_asc', label: 'A-Z' },
  { value: 'nome_desc', label: 'Z-A' },
  { value: 'preco_asc', label: 'Preço ↑' },
  { value: 'preco_desc', label: 'Preço ↓' },
];

// ===== UTILITY FUNCTIONS =====
function formatDate(dateString: any) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

// ===== BUILD HTML EXPORT (same logic as catalog-client) =====
function buildCardHtml(p: any, showInfo: boolean, cols: number) {
  const imagens = p?.imagens ?? [];
  const nome = (p?.nome ?? '').trim().split(/\s+/).slice(0, 2).join(' ');
  const preco = `R$ ${(p?.preco ?? 0).toFixed(2).replace('.', ',')}`;
  const aspectRatio = cols === 1 ? '3/4' : '4/5';
  const imgStyle = `width:100%;aspect-ratio:${aspectRatio};object-fit:cover;background:#f5f5f5;display:block;`;
  const onlyImages = imagens.filter((img: any) => {
    const isVideo = img?.tipo === 'video' || img?.url?.match?.(/\.(mp4|webm|mov|avi)$/i);
    if (isVideo && img?.thumbnailUrl) return true;
    return !isVideo;
  });
  const imgsHtml = onlyImages.length > 0
    ? onlyImages.map((img: any) => {
        const isVid = img?.tipo === 'video' || img?.url?.match?.(/\.(mp4|webm|mov|avi)$/i);
        const src = isVid ? img.thumbnailUrl : img.url;
        const singleRound = !showInfo && onlyImages.length === 1 ? 'border-radius:12px;' : '';
        return `<img src="${src}" alt="${nome}" style="${imgStyle}${singleRound}">`;
      }).join('\n')
    : `<div style="aspect-ratio:${aspectRatio};background:#f0e0f0;display:flex;align-items:center;justify-content:center;font-size:32px">💎</div>`;
  const infoHtml = showInfo
    ? `<div class="info"><div class="name">${nome}</div><div class="code">${p?.codigo ?? ''}</div><div class="price">${preco}</div></div>`
    : '';
  return `<div class="card">${imgsHtml}${infoHtml}</div>`;
}

function buildCatalogHtml(colNome: string, selected: any[], showInfo: boolean, cols: number) {
  const maxWidth = cols === 1 ? '400px' : '500px';
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${colNome} - Dande Acessórios</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#333;padding:20px}
  h1{text-align:center;color:#E91E8C;margin-bottom:4px;font-size:22px}
  .col-name{text-align:center;font-size:14px;font-weight:600;color:#555;margin-bottom:4px}
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
<p class="col-name">${colNome}</p>
<p class="subtitle">${selected.length} produto(s)</p>
<div class="grid">
${selected.map((p: any) => buildCardHtml(p, showInfo, cols)).join('\n')}
</div>
</body></html>`;
}

export default function ColecoesClient() {
  const { data: session } = useSession() || {};
  const isAdmin = !!(session as any)?.user;

  // ===== STATE =====
  const [colecoes, setColecoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shareProduct, setShareProduct] = useState<any>(null);
  const [shareColecao, setShareColecao] = useState<any>(null);

  // Lightbox
  const [lightboxImages, setLightboxImages] = useState<{ url: string }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxProduto, setLightboxProduto] = useState<any>(null);

  // CRUD modal
  const [crudModal, setCrudModal] = useState<'create' | 'edit' | null>(null);
  const [editingCol, setEditingCol] = useState<any>(null);
  const [crudForm, setCrudForm] = useState({ nome: '', descricao: '', cor: '#E91E8C' });
  const [crudLoading, setCrudLoading] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Add products modal
  const [addProductsColId, setAddProductsColId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchBusca, setSearchBusca] = useState('');
  const [searchFilters, setSearchFilters] = useState(defaultFilters);
  const [searchOrdem, setSearchOrdem] = useState('recente');
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(true);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [addingProducts, setAddingProducts] = useState(false);
  const [searchViewMode, setSearchViewMode] = useState<'grid' | 'list'>('grid');

  // ===== SAVE COLLECTION MODAL STATE =====
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveFormData, setSaveFormData] = useState({
    colecaoId: '',
    colecaoNome: '',
    colecaoDescricao: '',
    catalogName: '',
  });

  // ===== CATALOG OPTIONS MODAL STATE =====
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogOptions, setCatalogOptions] = useState({
    columns: 2,
    format: 'html',
    showInfo: true,
  });

  const searchTimeoutRef = useRef<any>(null);
  const searchLoadMoreRef = useRef<HTMLDivElement>(null);

  // ===== LOAD COLLECTIONS =====
  const fetchColecoes = useCallback(async () => {
    try {
      const res = await fetch('/api/colecoes');
      const data = await res.json();
      setColecoes(data ?? []);
    } catch { setColecoes([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchColecoes(); }, [fetchColecoes]);

  // ===== LOAD DEPARTMENTS & CATEGORIES (for add products modal) =====
  useEffect(() => {
    if (!addProductsColId) return;
    Promise.all([
      fetch('/api/departamentos').then(r => r.json()).catch(() => []),
      fetch('/api/categorias').then(r => r.json()).catch(() => []),
    ]).then(([deps, cats]) => {
      setDepartamentos(deps ?? []);
      setCategorias(cats ?? []);
    });
  }, [addProductsColId]);

  // ===== SEARCH PRODUCTS FOR ADD MODAL =====
  const fetchSearchProducts = useCallback(async (pageNum: number, append = false) => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', '30');
      params.set('ordem', searchOrdem);
      params.set('comImagem', 'true');
      if (searchBusca) params.set('busca', searchBusca);
      if (searchFilters.departamento) params.set('departamento', searchFilters.departamento);
      if (searchFilters.categoria) params.set('categoria', searchFilters.categoria);
      if (searchFilters.subcategoria) params.set('subcategoria', searchFilters.subcategoria);
      if (searchFilters.precoMin) params.set('precoMin', searchFilters.precoMin);
      if (searchFilters.precoMax) params.set('precoMax', searchFilters.precoMax);
      const res = await fetch(`/api/produtos?${params.toString()}`);
      const data = await res.json();
      const prods = data?.produtos ?? [];
      setSearchTotal(data?.total ?? 0);
      setSearchHasMore(prods.length === 30);
      if (append) {
        setSearchResults(prev => [...prev, ...prods]);
      } else {
        setSearchResults(prods);
      }
    } catch { setSearchResults([]); }
    setSearchLoading(false);
  }, [searchBusca, searchFilters, searchOrdem]);

  useEffect(() => {
    if (!addProductsColId) return;
    setSearchPage(1);
    fetchSearchProducts(1, false);
  }, [addProductsColId, searchBusca, searchFilters, searchOrdem, fetchSearchProducts]);

  // Infinite scroll for search modal
  useEffect(() => {
    if (!addProductsColId || !searchLoadMoreRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && searchHasMore && !searchLoading) {
        const next = searchPage + 1;
        setSearchPage(next);
        fetchSearchProducts(next, true);
      }
    }, { threshold: 0.1 });
    observer.observe(searchLoadMoreRef.current);
    return () => observer.disconnect();
  }, [addProductsColId, searchHasMore, searchLoading, searchPage, fetchSearchProducts]);

  // ===== CRUD HANDLERS =====
  const handleCreateCollection = async () => {
    if (!crudForm.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setCrudLoading(true);
    try {
      const res = await fetch('/api/colecoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crudForm),
      });
      if (res.ok) {
        toast.success('Coleção criada!');
        setCrudModal(null);
        setCrudForm({ nome: '', descricao: '', cor: '#E91E8C' });
        await fetchColecoes();
      } else {
        toast.error('Erro ao criar coleção');
      }
    } catch { toast.error('Erro ao criar coleção'); }
    setCrudLoading(false);
  };

  const handleEditCollection = async () => {
    if (!editingCol?.id || !crudForm.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    setCrudLoading(true);
    try {
      const res = await fetch(`/api/colecoes/${editingCol.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crudForm),
      });
      if (res.ok) {
        toast.success('Coleção atualizada!');
        setCrudModal(null);
        setEditingCol(null);
        await fetchColecoes();
      } else {
        toast.error('Erro ao atualizar');
      }
    } catch { toast.error('Erro ao atualizar'); }
    setCrudLoading(false);
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      const res = await fetch(`/api/colecoes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Coleção excluída');
        setDeleteConfirm(null);
        if (expandedId === id) setExpandedId(null);
        await fetchColecoes();
      } else {
        toast.error('Erro ao excluir');
      }
    } catch { toast.error('Erro ao excluir'); }
  };

  const handleRemoveProduct = async (colId: string, prodCodigo: string) => {
    try {
      const res = await fetch(`/api/colecoes/${colId}/produtos?produtoCodigo=${prodCodigo}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Produto removido da coleção');
        await fetchColecoes();
      } else {
        toast.error('Erro ao remover produto');
      }
    } catch { toast.error('Erro ao remover'); }
  };

  const handleAddProducts = async (keepState = false) => {
    if (!addProductsColId || selectedToAdd.size === 0) return;
    setAddingProducts(true);
    let added = 0;
    for (const codigo of selectedToAdd) {
      try {
        const res = await fetch(`/api/colecoes/${addProductsColId}/produtos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ produtoCodigo: codigo }),
        });
        if (res.ok) added++;
      } catch {}
    }
    toast.success(`${added} produto(s) adicionado(s)!`);
    // Only clear state if not keeping it for catalog generation
    if (!keepState) {
      setAddProductsColId(null);
      setSelectedToAdd(new Set());
      setSearchBusca('');
      setSearchFilters(defaultFilters);
      setSearchOrdem('recente');
    }
    await fetchColecoes();
    setAddingProducts(false);
  };

  const resetAllState = () => {
    setAddProductsColId(null);
    setSelectedToAdd(new Set());
    setSearchBusca('');
    setSearchFilters(defaultFilters);
    setSearchOrdem('recente');
    setSaveFormData({ colecaoId: '', colecaoNome: '', colecaoDescricao: '', catalogName: '' });
  };

  // ===== SELECT ALL / DESELECT ALL =====
  const selectAllFiltered = () => {
    const existingCodes = getExistingCodes();
    const toSelect = new Set(selectedToAdd);
    searchResults.forEach((p: any) => {
      if (!existingCodes.has(p?.codigo)) {
        toSelect.add(p?.codigo);
      }
    });
    setSelectedToAdd(toSelect);
    toast.success(`${toSelect.size - selectedToAdd.size} produtos selecionados!`);
  };

  const deselectAllFiltered = () => {
    setSelectedToAdd(new Set());
    toast.info('Seleção limpa');
  };

  // ===== DOWNLOAD 1 CLICK =====
  const downloadCollection = (col: any) => {
    const prods = (col?.produtos ?? []).map((cp: any) => cp?.produto).filter(Boolean);
    if (prods.length === 0) { toast.error('Coleção vazia'); return; }
    const html = buildCatalogHtml(col?.nome ?? 'Coleção', prods, true, 2);
    const dataUri = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    const a = document.createElement('a');
    a.href = dataUri;
    a.download = `colecao-${(col?.nome ?? 'dande').replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Download iniciado!');
  };

  // ===== GENERATE CATALOG (from modal options) =====
  const handleGenerateCatalog = async (options: any, customName?: string) => {
    const selected = searchResults.filter(p => selectedToAdd.has(p?.codigo));
    if (selected.length === 0) {
      toast.error('Nenhum produto selecionado');
      return;
    }

    // Use custom name from modal or fallback to collection name
    const displayName = customName || saveFormData.catalogName || 'Catálogo';
    
    // Sanitize filename
    const safeFileName = displayName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (options.format === 'html') {
      const html = buildCatalogHtml(displayName, selected, options.showInfo, options.columns);
      const dataUri = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `${safeFileName}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`Catálogo "${displayName}" gerado!`);
    } else if (options.format === 'pdf') {
      toast.info('PDF em breve');
    }

    // Now clean up everything
    resetAllState();
  };

  // ===== LIGHTBOX =====
  const openLightbox = (produto: any, imageIndex: number) => {
    const imgs = (produto?.imagens ?? []).filter((img: any) => {
      const isVid = img?.tipo === 'video' || img?.url?.match?.(/\.(mp4|webm|mov|avi)$/i);
      return !isVid;
    }).map((img: any) => ({ url: img?.url }));
    if (imgs.length > 0) {
      setLightboxImages(imgs);
      setLightboxIndex(Math.min(imageIndex, imgs.length - 1));
      setLightboxProduto(produto);
      setLightboxOpen(true);
    }
  };

  // ===== MINI THUMBS =====
  const MiniThumbs = ({ prods, max = 5 }: { prods: any[]; max?: number }) => {
    const visible = prods.slice(0, max);
    const extra = prods.length - max;
    return (
      <div className="flex items-center gap-1">
        {visible.map((cp: any, i: number) => {
          const img = cp?.produto?.imagens?.[0];
          const url = img?.url;
          return (
            <div key={i} className="w-9 h-9 rounded-lg overflow-hidden bg-pink-50 dark:bg-neutral-900 flex-shrink-0 relative">
              {url ? (
                <Image src={url} alt="" fill className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs">💎</div>
              )}
            </div>
          );
        })}
        {extra > 0 && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-primary">+{extra}</span>
          </div>
        )}
      </div>
    );
  };

  // ===== EXISTING CODES IN COLLECTION (for add products modal) =====
  const getExistingCodes = () => {
    const col = colecoes.find((c: any) => c?.id === addProductsColId);
    return new Set((col?.produtos ?? []).map((cp: any) => cp?.produtoCodigo));
  };

  // ===== SUB-CATEGORIES FOR FILTER =====
  const selectedCat = categorias.find((c: any) => String(c?.id) === searchFilters.categoria);
  const subcategorias = selectedCat?.subcategorias ?? [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Title + Create button */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <FolderOpen size={20} className="text-primary" />
              Coleções <span className="text-primary">Dande</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{colecoes.length} coleção(ões)</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setCrudForm({ nome: '', descricao: '', cor: '#E91E8C' }); setCrudModal('create'); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-primary text-white text-sm font-semibold shadow-lg shadow-primary/30 active:scale-95 transition-all"
            >
              <Plus size={16} /> Nova
            </button>
          )}
        </motion.div>

        {/* Empty state */}
        {colecoes.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FolderOpen size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma coleção disponível</p>
          </div>
        ) : (
          <div className="space-y-3">
            {colecoes.map((col: any) => {
              const isExpanded = expandedId === col?.id;
              const prods = col?.produtos ?? [];
              return (
                <motion.div key={col?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-card overflow-hidden shadow-sm border border-border/30">
                  {/* CARD HEADER */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : col?.id)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                  >
                    {/* Color accent */}
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: col?.cor ?? '#E91E8C' }} />

                    {/* Mini thumbs */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm truncate">{col?.nome ?? ''}</p>
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                          {prods.length} itens
                        </span>
                      </div>
                      {col?.descricao && <p className="text-[11px] text-muted-foreground truncate mb-1">{col.descricao}</p>}
                      {col?.updatedAt && (
                        <p className="text-[10px] text-muted-foreground/60 mb-2">
                          🕐 Atualizado: {formatDate(col?.updatedAt)}
                        </p>
                      )}
                      <MiniThumbs prods={prods} />
                    </div>

                    {/* Actions (right side) */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => downloadCollection(col)}
                        className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center active:scale-90 transition-all"
                        title="Download catálogo"
                      >
                        <Download size={14} className="text-primary" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingCol(col);
                              setCrudForm({ nome: col?.nome ?? '', descricao: col?.descricao ?? '', cor: col?.cor ?? '#E91E8C' });
                              setCrudModal('edit');
                            }}
                            className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center active:scale-90 transition-all"
                          >
                            <Pencil size={13} className="text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(col?.id)}
                            className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center active:scale-90 transition-all"
                          >
                            <Trash2 size={13} className="text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* EXPANDED PRODUCTS */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 border-t border-border/20 pt-3">
                          {/* Action bar */}
                          <div className="flex items-center justify-between mb-3 gap-2">
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setAddProductsColId(col?.id);
                                  setSelectedToAdd(new Set());
                                  setSearchBusca('');
                                  setSearchFilters(defaultFilters);
                                  setSearchOrdem('recente');
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold active:scale-95 transition-all"
                              >
                                <Plus size={14} /> Adicionar Produtos
                              </button>
                            )}
                            <button
                              onClick={() => setShareColecao(col)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#25D366] text-white text-xs font-medium hover:bg-[#1fb855] active:scale-95 transition-all"
                            >
                              <MessageCircle size={14} /> WhatsApp
                            </button>
                          </div>

                          {/* Products grid */}
                          {prods.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              <Package size={32} className="mx-auto mb-2 opacity-40" />
                              <p>Nenhum produto nesta coleção</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {prods.map((cp: any) => (
                                <div key={cp?.produto?.codigo ?? cp?.produtoCodigo} className="relative group/item">
                                  <ProductCard
                                    produto={cp?.produto}
                                    onShare={(p: any) => setShareProduct(p)}
                                    onImageTap={(p: any, idx: number) => openLightbox(p, idx)}
                                  />
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleRemoveProduct(col?.id, cp?.produtoCodigo)}
                                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover/item:opacity-100 active:scale-90 transition-all z-20"
                                      title="Remover da coleção"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* ===== CREATE / EDIT MODAL ===== */}
      <AnimatePresence>
        {crudModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => { setCrudModal(null); setEditingCol(null); }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{crudModal === 'create' ? 'Nova Coleção' : 'Editar Coleção'}</h3>
                <button onClick={() => { setCrudModal(null); setEditingCol(null); }} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nome</label>
                  <input
                    value={crudForm.nome}
                    onChange={(e) => setCrudForm(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Lançamentos Verão"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/50 text-sm focus:ring-2 focus:ring-primary/30 border-0 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Descrição</label>
                  <input
                    value={crudForm.descricao}
                    onChange={(e) => setCrudForm(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descrição opcional"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/50 text-sm focus:ring-2 focus:ring-primary/30 border-0 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Cor</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={crudForm.cor}
                      onChange={(e) => setCrudForm(prev => ({ ...prev, cor: e.target.value }))}
                      className="w-12 h-12 rounded-xl border-0 cursor-pointer"
                    />
                    <div className="flex gap-2">
                      {['#E91E8C', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#A29BFE'].map(c => (
                        <button key={c} onClick={() => setCrudForm(prev => ({ ...prev, cor: c }))}
                          className={`w-8 h-8 rounded-full transition-all ${crudForm.cor === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={crudModal === 'create' ? handleCreateCollection : handleEditCollection}
                disabled={crudLoading}
                className="w-full py-3.5 rounded-2xl bg-primary text-white font-semibold text-sm shadow-lg shadow-primary/30 active:scale-[0.97] transition-all disabled:opacity-50"
              >
                {crudLoading ? <Loader2 size={18} className="animate-spin mx-auto" /> : crudModal === 'create' ? 'Criar Coleção' : 'Salvar Alterações'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== DELETE CONFIRM MODAL ===== */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-3xl p-6 max-w-sm w-full text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold">Excluir coleção?</h3>
              <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita. Todos os vínculos com produtos serão removidos.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-2xl border border-border text-sm font-semibold active:scale-[0.97] transition-all">
                  Cancelar
                </button>
                <button onClick={() => handleDeleteCollection(deleteConfirm)} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold active:scale-[0.97] transition-all">
                  Excluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ===== CATALOG OPTIONS MODAL ===== */}
      <AnimatePresence>
        {showCatalogModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setShowCatalogModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-background rounded-t-3xl sm:rounded-3xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Gerar Catálogo</h3>
                <button onClick={() => setShowCatalogModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>

              {/* COLUNAS */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Colunas</label>
                <div className="flex gap-3">
                  {[1, 2].map(col => (
                    <button
                      key={col}
                      onClick={() => setCatalogOptions(prev => ({ ...prev, columns: col }))}
                      className={`flex-1 py-2.5 rounded-lg border-2 transition-all font-semibold text-sm ${
                        catalogOptions.columns === col
                          ? 'bg-primary text-white border-primary'
                          : 'bg-card border-border text-muted-foreground'
                      }`}
                    >
                      {col} coluna{col > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>

                {/* PREVIEW DO LAYOUT */}
                <div className="bg-card/50 rounded-lg p-3 border border-border/20">
                  <div className={`grid gap-2 ${catalogOptions.columns === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {searchResults.slice(0, catalogOptions.columns === 1 ? 2 : 4).map((p: any) => (
                      <div key={p?.codigo} className="bg-muted/50 rounded-lg overflow-hidden aspect-video">
                        {p?.imagens?.[0]?.url ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={p.imagens[0].url}
                              alt={p?.nome}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Package size={20} className="text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">Prévia do layout</p>
                </div>
              </div>

              {/* FORMATO */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Formato</label>
                <div className="flex gap-3">
                  {[
                    { value: 'html', label: '📄 HTML', desc: 'Visualizar no navegador' },
                    { value: 'pdf', label: '📕 PDF', desc: 'Imprimir ou salvar' },
                  ].map(fmt => (
                    <button
                      key={fmt.value}
                      onClick={() => setCatalogOptions(prev => ({ ...prev, format: fmt.value }))}
                      className={`flex-1 py-3 rounded-lg border-2 transition-all text-left ${
                        catalogOptions.format === fmt.value
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card border-border'
                      }`}
                    >
                      <div className="font-semibold text-sm">{fmt.label}</div>
                      <div className="text-[10px] text-muted-foreground">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* MOSTRAR INFORMAÇÕES */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catalogOptions.showInfo}
                    onChange={(e) => setCatalogOptions(prev => ({ ...prev, showInfo: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">Mostrar preço e código</span>
                </label>
              </div>

              {/* BOTÕES */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCatalogModal(false)}
                  className="flex-1 py-3 rounded-lg border border-border text-sm font-semibold active:scale-[0.97] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowCatalogModal(false);
                    handleGenerateCatalog(catalogOptions, saveFormData.catalogName);
                  }}
                  className="flex-1 py-3 rounded-lg bg-primary text-white text-sm font-semibold active:scale-[0.97] transition-all"
                >
                  Gerar Catálogo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ===== ADD PRODUCTS MODAL (FULL SCREEN) ===== */}
      <AnimatePresence>
        {addProductsColId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-background flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card">
              <div className="flex items-center gap-2">
                <button onClick={() => { setAddProductsColId(null); setSelectedToAdd(new Set()); }} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X size={16} />
                </button>
                <h3 className="text-sm font-bold">Adicionar Produtos</h3>
              </div>
              <button
                onClick={() => {
                  if (selectedToAdd.size === 0) {
                    toast.error('Selecione ao menos 1 produto');
                    return;
                  }
                  // Abre o modal de salvar coleção com catálogo
                  const col = colecoes.find((c: any) => c?.id === addProductsColId);
                  setSaveFormData(prev => ({
                    ...prev,
                    colecaoId: addProductsColId || '',
                    colecaoNome: col?.nome || '',
                    colecaoDescricao: col?.descricao || '',
                    catalogName: generateCatalogName(col?.nome || ''),
                  }));
                  setShowSaveModal(true);
                }}
                disabled={selectedToAdd.size === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-primary text-white text-xs font-semibold disabled:opacity-40 active:scale-95 transition-all"
              >
                <Check size={14} />
                Salvar Produtos ({selectedToAdd.size})
              </button>
            </div>

            {/* Search + Filters */}
            <div className="px-4 py-3 space-y-2 bg-card/50 border-b border-border/20">
              {/* Search bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchBusca}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSearchBusca(v);
                  }}
                  placeholder="Buscar produto..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-muted/50 text-sm border-0 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Filter row */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {/* Departamento */}
                <div className="relative flex-shrink-0">
                  <select
                    value={searchFilters.departamento}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, departamento: e.target.value }))}
                    className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-muted/50 text-xs border-0 outline-none"
                  >
                    <option value="">Departamento</option>
                    {departamentos.map((d: any) => <option key={d?.id} value={String(d?.id)}>{d?.nome}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>

                {/* Categoria */}
                <div className="relative flex-shrink-0">
                  <select
                    value={searchFilters.categoria}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, categoria: e.target.value, subcategoria: '' }))}
                    className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-muted/50 text-xs border-0 outline-none"
                  >
                    <option value="">Categoria</option>
                    {categorias.map((c: any) => <option key={c?.id} value={String(c?.id)}>{c?.nome}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>

                {/* Subcategoria */}
                {subcategorias.length > 0 && (
                  <div className="relative flex-shrink-0">
                    <select
                      value={searchFilters.subcategoria}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, subcategoria: e.target.value }))}
                      className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-muted/50 text-xs border-0 outline-none"
                    >
                      <option value="">Subcategoria</option>
                      {subcategorias.map((s: any) => <option key={s?.id} value={String(s?.id)}>{s?.nome}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                )}

                {/* Preço Min */}
                <input
                  type="number"
                  value={searchFilters.precoMin}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, precoMin: e.target.value }))}
                  placeholder="Mín R$"
                  className="w-20 flex-shrink-0 px-3 py-2 rounded-xl bg-muted/50 text-xs border-0 outline-none"
                />
                {/* Preço Max */}
                <input
                  type="number"
                  value={searchFilters.precoMax}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, precoMax: e.target.value }))}
                  placeholder="Máx R$"
                  className="w-20 flex-shrink-0 px-3 py-2 rounded-xl bg-muted/50 text-xs border-0 outline-none"
                />

                {/* Ordem */}
                <div className="relative flex-shrink-0">
                  <select
                    value={searchOrdem}
                    onChange={(e) => setSearchOrdem(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-2 rounded-xl bg-muted/50 text-xs border-0 outline-none"
                  >
                    {ordemOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ArrowUpDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground">{searchTotal} produtos encontrados</p>
            </div>

            {/* Selection bar */}
            {searchResults.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-primary/10">
                <button
                  onClick={selectAllFiltered}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-white text-xs font-semibold active:scale-95 transition-all"
                >
                  <CheckSquare size={14} /> Selecionar Todos
                </button>
                {selectedToAdd.size > 0 && (
                  <button
                    onClick={deselectAllFiltered}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-muted text-xs font-semibold active:scale-95 transition-all"
                  >
                    <Square size={14} /> Desselecionar
                  </button>
                )}
                <div className="ml-auto text-xs font-semibold text-muted-foreground">
                  {selectedToAdd.size} de {searchTotal}
                </div>
              </div>
            )}

            {/* Toggle Lista/Grid */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-border/20 bg-card/50">
              <button
                onClick={() => setSearchViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  searchViewMode === 'grid'
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
                title="Visualizar em Grid"
              >
                <Grid3x3 size={16} />
              </button>
              <button
                onClick={() => setSearchViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  searchViewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
                title="Visualizar em Lista"
              >
                <List size={16} />
              </button>
            </div>

            {/* Products grid/list */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {searchLoading && searchResults.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground text-sm">
                  <Package size={32} className="mx-auto mb-2 opacity-40" />
                  <p>Nenhum produto encontrado</p>
                </div>
              ) : (
                <>
                  {searchViewMode === 'grid' ? (
                    // ===== GRID VIEW =====
                    <div className="grid grid-cols-3 gap-2">
                      {searchResults.map((p: any) => {
                        const existingCodes = getExistingCodes();
                        const alreadyInCol = existingCodes.has(p?.codigo);
                        const isSelected = selectedToAdd.has(p?.codigo);
                        return (
                          <div
                            key={p?.codigo}
                            onClick={() => {
                              if (alreadyInCol) return;
                              setSelectedToAdd(prev => {
                                const next = new Set(prev);
                                if (next.has(p?.codigo)) next.delete(p?.codigo);
                                else next.add(p?.codigo);
                                return next;
                              });
                            }}
                            className={`relative rounded-2xl overflow-hidden transition-all cursor-pointer active:scale-[0.97] ${
                              alreadyInCol ? 'opacity-40 pointer-events-none' : isSelected ? 'ring-2 ring-primary shadow-md' : 'bg-card'
                            }`}
                          >
                            {/* Selection indicator */}
                            {(isSelected || alreadyInCol) && (
                              <div className={`absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center ${
                                alreadyInCol ? 'bg-gray-400 text-white' : 'bg-primary text-white'
                              }`}>
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                            <div className="relative aspect-square bg-pink-50 dark:bg-neutral-900">
                              {p?.imagens?.[0]?.url ? (
                                <Image src={p.imagens[0].url} alt={p?.nome ?? ''} fill className="object-cover" unoptimized />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">💎</div>
                              )}
                            </div>
                            <div className="px-2 py-1.5">
                              <p className="text-[10px] font-medium truncate">{(p?.nome ?? '').split(/\s+/).slice(0, 2).join(' ')}</p>
                              <p className="text-[10px] font-bold text-primary">R$ {(p?.preco ?? 0).toFixed(2).replace('.', ',')}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // ===== LIST VIEW =====
                    <div className="space-y-1">
                      {searchResults.map((p: any) => {
                        const existingCodes = getExistingCodes();
                        const alreadyInCol = existingCodes.has(p?.codigo);
                        const isSelected = selectedToAdd.has(p?.codigo);
                        return (
                          <div
                            key={p?.codigo}
                            onClick={() => {
                              if (alreadyInCol) return;
                              setSelectedToAdd(prev => {
                                const next = new Set(prev);
                                if (next.has(p?.codigo)) next.delete(p?.codigo);
                                else next.add(p?.codigo);
                                return next;
                              });
                            }}
                            className={`flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer ${
                              alreadyInCol
                                ? 'opacity-40 pointer-events-none'
                                : isSelected
                                  ? 'bg-primary/10 ring-2 ring-primary'
                                  : 'bg-muted/50 hover:bg-muted/70'
                            }`}
                          >
                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                              isSelected || alreadyInCol
                                ? alreadyInCol ? 'bg-gray-400' : 'bg-primary'
                                : 'bg-muted border border-muted-foreground/30'
                            }`}>
                              {(isSelected || alreadyInCol) && (
                                <Check size={12} className="text-white" strokeWidth={3} />
                              )}
                            </div>

                            {/* Image */}
                            <div className="relative w-12 h-12 rounded flex-shrink-0 bg-pink-50 dark:bg-neutral-900">
                              {p?.imagens?.[0]?.url ? (
                                <Image src={p.imagens[0].url} alt={p?.nome ?? ''} fill className="object-cover rounded" unoptimized />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm">💎</div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{p?.nome}</p>
                              <p className="text-[11px] text-muted-foreground">{p?.codigo}</p>
                            </div>

                            {/* Price */}
                            <p className="text-xs font-bold text-primary flex-shrink-0">R$ {(p?.preco ?? 0).toFixed(2).replace('.', ',')}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Infinite scroll trigger */}
                  <div ref={searchLoadMoreRef} className="py-4 flex justify-center">
                    {searchLoading && <Loader2 size={20} className="animate-spin text-primary" />}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== SAVE COLLECTION MODAL ===== */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-end"
          >
            <motion.div
              initial={{ y: 500 }} animate={{ y: 0 }} exit={{ y: 500 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full bg-card rounded-t-3xl p-4 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/20">
                <h3 className="text-lg font-bold">Salvar Produtos</h3>
                <button onClick={() => setShowSaveModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>

              {/* Catalog Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Nome do Catálogo</label>
                <input
                  type="text"
                  value={saveFormData.catalogName}
                  onChange={(e) => setSaveFormData(prev => ({ ...prev, catalogName: e.target.value }))}
                  placeholder="Ex: Prata 925 - Anéis"
                  className="w-full px-3 py-2.5 rounded-xl bg-muted/50 text-sm border border-border/20 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                <p className="text-[10px] text-muted-foreground">Este nome aparecerá no arquivo gerado</p>
              </div>

              {/* Catalog Format */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Formato do Catálogo</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCatalogOptions(prev => ({ ...prev, format: 'html' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      catalogOptions.format === 'html'
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    HTML
                  </button>
                  <button
                    onClick={() => setCatalogOptions(prev => ({ ...prev, format: 'pdf' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      catalogOptions.format === 'pdf'
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    PDF
                  </button>
                </div>
              </div>

              {/* Layout */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Layout</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCatalogOptions(prev => ({ ...prev, columns: 1 }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      catalogOptions.columns === 1
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    1 Coluna
                  </button>
                  <button
                    onClick={() => setCatalogOptions(prev => ({ ...prev, columns: 2 }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      catalogOptions.columns === 2
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    2 Colunas
                  </button>
                </div>
              </div>

              {/* Show Info */}
              <label className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-all">
                <input
                  type="checkbox"
                  checked={catalogOptions.showInfo}
                  onChange={(e) => setCatalogOptions(prev => ({ ...prev, showInfo: e.target.checked }))}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-xs font-medium">Mostrar nome, código e preço</span>
              </label>

              {/* Product Count */}
              <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs font-semibold text-primary">{selectedToAdd.size} produto(s) selecionado(s)</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-muted text-muted-foreground font-medium text-sm transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    // Save products first but KEEP state for catalog generation
                    await handleAddProducts(true);
                    setShowSaveModal(false);
                    setShowCatalogModal(true);
                  }}
                  disabled={addingProducts}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-medium text-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {addingProducts ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Salvando...
                    </span>
                  ) : (
                    'Salvar e Gerar'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MODALS ===== */}
      <ShareModal produto={shareProduct} isOpen={!!shareProduct} onClose={() => setShareProduct(null)} />
      <WhatsAppCollectionShare colecao={shareColecao} isOpen={!!shareColecao} onClose={() => setShareColecao(null)} />
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