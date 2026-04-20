'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Reorder } from 'framer-motion';
import {
  GripVertical, X, ArrowUpDown, Search, SlidersHorizontal,
  Hand, ArrowDownAZ, ArrowUpAZ, TrendingUp, TrendingDown, Clock, History,
  ChevronDown
} from 'lucide-react';
import { CollectionProductData } from '@/lib/types';

type SortMode = 'manual' | 'recente' | 'antigo' | 'nome_asc' | 'nome_desc' | 'preco_asc' | 'preco_desc';

const sortOptions: { value: SortMode; label: string; icon: React.ReactNode }[] = [
  { value: 'manual', label: 'Manual (Arrastar)', icon: <Hand size={13} /> },
  { value: 'recente', label: 'Mais Recente', icon: <Clock size={13} /> },
  { value: 'antigo', label: 'Mais Antiga', icon: <History size={13} /> },
  { value: 'nome_asc', label: 'A-Z', icon: <ArrowDownAZ size={13} /> },
  { value: 'nome_desc', label: 'Z-A', icon: <ArrowUpAZ size={13} /> },
  { value: 'preco_asc', label: 'Pre\u00e7o \u2191', icon: <TrendingUp size={13} /> },
  { value: 'preco_desc', label: 'Pre\u00e7o \u2193', icon: <TrendingDown size={13} /> },
];

interface CollectionEditorGridProps {
  products: CollectionProductData[];
  onReorder: (newOrder: CollectionProductData[]) => void;
  onRemove: (codigo: string) => void;
  isSaving?: boolean;
}

export default function CollectionEditorGrid({
  products,
  onReorder,
  onRemove,
  isSaving = false,
}: CollectionEditorGridProps) {
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterPrecoMin, setFilterPrecoMin] = useState('');
  const [filterPrecoMax, setFilterPrecoMax] = useState('');

  const getCode = (p: CollectionProductData) => (p.produtoCodigo || p.codigo || '') as string;

  // Extract unique departments and categories from products
  const departments = useMemo(() => {
    const depts = new Map<string, string>();
    products.forEach(p => {
      if (p.departamento?.nome) {
        depts.set(String(p.departamento.id || p.departamento.nome), p.departamento.nome);
      }
    });
    return Array.from(depts.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [products]);

  const categories = useMemo(() => {
    const cats = new Map<string, string>();
    products.forEach(p => {
      if (p.categoria?.nome) {
        // If filtering by dept, only show categories from that dept
        if (filterDept && String(p.departamento?.id || p.departamento?.nome) !== filterDept) return;
        cats.set(String(p.categoria.id || p.categoria.nome), p.categoria.nome);
      }
    });
    return Array.from(cats.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [products, filterDept]);

  const activeFilterCount = [filterDept, filterCat, filterPrecoMin, filterPrecoMax, searchTerm].filter(Boolean).length;

  // Filtered and sorted products
  const displayProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.nome.toLowerCase().includes(term) ||
        getCode(p).toLowerCase().includes(term)
      );
    }

    // Department filter
    if (filterDept) {
      filtered = filtered.filter(p =>
        String(p.departamento?.id || p.departamento?.nome) === filterDept
      );
    }

    // Category filter
    if (filterCat) {
      filtered = filtered.filter(p =>
        String(p.categoria?.id || p.categoria?.nome) === filterCat
      );
    }

    // Price filter
    if (filterPrecoMin) {
      filtered = filtered.filter(p => Number(p.preco) >= parseFloat(filterPrecoMin));
    }
    if (filterPrecoMax) {
      filtered = filtered.filter(p => Number(p.preco) <= parseFloat(filterPrecoMax));
    }

    // Sort
    if (sortMode !== 'manual') {
      switch (sortMode) {
        case 'nome_asc':
          filtered.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
          break;
        case 'nome_desc':
          filtered.sort((a, b) => b.nome.localeCompare(a.nome, 'pt-BR'));
          break;
        case 'preco_asc':
          filtered.sort((a, b) => Number(a.preco) - Number(b.preco));
          break;
        case 'preco_desc':
          filtered.sort((a, b) => Number(b.preco) - Number(a.preco));
          break;
        case 'recente': {
          filtered.sort((a, b) => {
            const dateA = a.imagens?.[0]?.createdAt || a.createdAt || '';
            const dateB = b.imagens?.[0]?.createdAt || b.createdAt || '';
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
          break;
        }
        case 'antigo': {
          filtered.sort((a, b) => {
            const dateA = a.imagens?.[0]?.createdAt || a.createdAt || '';
            const dateB = b.imagens?.[0]?.createdAt || b.createdAt || '';
            return new Date(dateA).getTime() - new Date(dateB).getTime();
          });
          break;
        }
      }
    }

    return filtered;
  }, [products, sortMode, searchTerm, filterDept, filterCat, filterPrecoMin, filterPrecoMax]);

  const handleApplySort = () => {
    if (sortMode === 'manual') return;
    // Apply current filtered+sorted view as the new permanent order
    // Only reorder the visible ones, keep hidden ones at the end
    const visibleCodes = new Set(displayProducts.map(p => getCode(p)));
    const hidden = products.filter(p => !visibleCodes.has(getCode(p)));
    const reordered = [...displayProducts, ...hidden].map((p, idx) => ({ ...p, ordem: idx + 1 }));
    onReorder(reordered);
    setSortMode('manual');
    // Reset filters
    setSearchTerm('');
    setFilterDept('');
    setFilterCat('');
    setFilterPrecoMin('');
    setFilterPrecoMax('');
    setShowFilters(false);
  };

  const handleDragReorder = (newOrder: CollectionProductData[]) => {
    const reordered = newOrder.map((p, idx) => ({ ...p, ordem: idx + 1 }));
    onReorder(reordered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDept('');
    setFilterCat('');
    setFilterPrecoMin('');
    setFilterPrecoMax('');
  };

  const isManual = sortMode === 'manual';
  const currentSortLabel = sortOptions.find(o => o.value === sortMode)?.label || 'Manual';
  const isFiltered = activeFilterCount > 0;

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <div className="text-4xl mb-3">\ud83d\udce6</div>
        <p className="text-sm font-medium">Nenhum produto na cole\u00e7\u00e3o</p>
        <p className="text-xs mt-1 opacity-70">Use a aba &quot;Adicionar&quot; para incluir produtos</p>
      </div>
    );
  }

  const renderCard = (product: CollectionProductData, idx: number) => (
    <div className="group/card bg-card rounded-xl border border-border/50 overflow-hidden transition-all hover:shadow-md hover:border-primary/30 p-2.5 flex gap-2.5">
      {isManual && !isFiltered && (
        <div className="flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-primary transition-colors">
          <GripVertical size={16} />
        </div>
      )}

      <div className="flex-shrink-0 w-14 bg-muted rounded-lg overflow-hidden relative" style={{ height: '68px' }}>
        {product.imagens && product.imagens.length > 0 ? (
          <Image
            src={product.imagens[0]?.url || ''}
            alt={product.nome}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-muted to-muted-foreground/10">\ud83d\udc8e</div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center min-w-0">
        <p className="text-[10px] font-mono text-muted-foreground/60">
          {getCode(product)}
          {product.departamento?.nome && <span className="ml-1 text-muted-foreground/40">\u00b7 {product.departamento.nome}</span>}
        </p>
        <h4 className="text-xs font-semibold line-clamp-1 text-foreground mt-0.5">{product.nome}</h4>
        <p className="text-xs font-bold text-primary mt-0.5">
          R$ {Number(product.preco).toFixed(2).replace('.', ',')}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold self-center">
        {idx + 1}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onRemove(getCode(product)); }}
        disabled={isSaving}
        className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center opacity-60 sm:opacity-0 group-hover/card:opacity-100 transition-all hover:bg-red-500/20 active:scale-90 self-center"
      >
        <X size={12} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 mb-3 flex-shrink-0">
        {/* Row 1: Search + Sort + Filters */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Buscar na cole\u00e7\u00e3o..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-muted/50 text-xs border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary/10 text-primary font-semibold'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <SlidersHorizontal size={13} />
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-all whitespace-nowrap"
            >
              <ArrowUpDown size={13} />
              <span className="hidden sm:inline">{currentSortLabel}</span>
              <ChevronDown size={10} />
            </button>

            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 bg-popover border border-border rounded-xl shadow-xl overflow-hidden min-w-[170px]">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortMode(opt.value); setShowSortMenu(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-colors ${
                        sortMode === opt.value
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Row 2: Filter chips (when expanded) */}
        {showFilters && (
          <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-xl border border-border/30">
            {/* Department + Category */}
            <div className="flex gap-2">
              <select
                value={filterDept}
                onChange={(e) => { setFilterDept(e.target.value); setFilterCat(''); }}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-background text-xs border border-border/50 outline-none focus:border-primary"
              >
                <option value="">Todos Departamentos</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>

              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-background text-xs border border-border/50 outline-none focus:border-primary"
              >
                <option value="">Todas Categorias</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div className="flex gap-2 items-center">
              <span className="text-[10px] text-muted-foreground font-medium">Pre\u00e7o:</span>
              <input
                type="number"
                placeholder="Min"
                value={filterPrecoMin}
                onChange={(e) => setFilterPrecoMin(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-background text-xs border border-border/50 outline-none focus:border-primary w-20"
              />
              <span className="text-muted-foreground/50 text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filterPrecoMax}
                onChange={(e) => setFilterPrecoMax(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-background text-xs border border-border/50 outline-none focus:border-primary w-20"
              />
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[10px] text-red-500 hover:underline whitespace-nowrap"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info bar */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            {isFiltered ? (
              <><span className="font-semibold text-foreground">{displayProducts.length}</span> de {products.length} produtos</>
            ) : (
              <><span className="font-semibold text-foreground">{products.length}</span> produto{products.length !== 1 ? 's' : ''}</>
            )}
          </p>

          {sortMode !== 'manual' && (
            <button
              onClick={handleApplySort}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-semibold hover:bg-primary/90 active:scale-95 transition-all"
            >
              Aplicar como Ordem Final
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {displayProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search size={24} className="mb-2 opacity-40" />
            <p className="text-xs">Nenhum produto corresponde aos filtros</p>
            <button onClick={clearFilters} className="text-xs text-primary mt-2 hover:underline">Limpar filtros</button>
          </div>
        ) : isManual && !isFiltered ? (
          <Reorder.Group
            axis="y"
            values={displayProducts}
            onReorder={handleDragReorder}
            className="space-y-2"
          >
            {displayProducts.map((product, idx) => (
              <Reorder.Item key={getCode(product)} value={product} as="div">
                {renderCard(product, idx)}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="space-y-2">
            {displayProducts.map((product, idx) => (
              <div key={getCode(product)}>
                {renderCard(product, idx)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
