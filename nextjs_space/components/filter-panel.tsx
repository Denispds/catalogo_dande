'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';

interface FilterPanelProps {
  departamentos: any[];
  categorias: any[];
  filters: {
    departamento: string;
    categoria: string;
    subcategoria: string;
    precoMin: string;
    precoMax: string;
    descontoMin: string;
  };
  onChange: (filters: any) => void;
  onClear: () => void;
}

export default function FilterPanel({ departamentos, categorias, filters, onChange, onClear }: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(filters ?? {}).filter((v: any) => v !== '').length;

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...(filters ?? {}), [key]: value };
    if (key === 'categoria') newFilters.subcategoria = '';
    onChange(newFilters);
  };

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card text-sm font-medium transition-all duration-300 active:scale-95 shadow-sm border border-border/50"
      >
        <SlidersHorizontal size={16} className="text-primary" />
        <span>Filtros</span>
        {activeCount > 0 && (
          <span className="bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Bottom sheet overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed left-0 right-0 bottom-0 z-[70] bg-background rounded-t-[2rem] transition-transform duration-500 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '75vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-6 pb-8 overflow-y-auto" style={{ maxHeight: 'calc(75vh - 40px)' }}>
          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Filtros</h3>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-5">
            {/* Departamento */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Departamento</label>
              <div className="relative">
                <select
                  value={filters?.departamento ?? ''}
                  onChange={(e: any) => updateFilter('departamento', e?.target?.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/50 text-sm appearance-none focus:ring-2 focus:ring-primary/30 border-0 outline-none transition-all"
                >
                  <option value="">Todos</option>
                  {departamentos?.map?.((d: any) => (
                    <option key={d?.id} value={String(d?.id)}>{d?.nome}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Categoria</label>
              <div className="relative">
                <select
                  value={filters?.categoria ?? ''}
                  onChange={(e: any) => updateFilter('categoria', e?.target?.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-muted/50 text-sm appearance-none focus:ring-2 focus:ring-primary/30 border-0 outline-none transition-all"
                >
                  <option value="">Todas</option>
                  {categorias?.map?.((c: any) => (
                    <option key={c?.id} value={String(c?.id)}>{c?.nome}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {/* Preço */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Faixa de Preço</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={filters?.precoMin ?? ''}
                  onChange={(e: any) => updateFilter('precoMin', e?.target?.value)}
                  placeholder="Mín"
                  className="flex-1 px-4 py-3 rounded-2xl bg-muted/50 text-sm focus:ring-2 focus:ring-primary/30 border-0 outline-none transition-all"
                />
                <input
                  type="number"
                  value={filters?.precoMax ?? ''}
                  onChange={(e: any) => updateFilter('precoMax', e?.target?.value)}
                  placeholder="Máx"
                  className="flex-1 px-4 py-3 rounded-2xl bg-muted/50 text-sm focus:ring-2 focus:ring-primary/30 border-0 outline-none transition-all"
                />
              </div>
            </div>

            {/* Desconto */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Desconto Mínimo</label>
              <input
                type="number"
                value={filters?.descontoMin ?? ''}
                onChange={(e: any) => updateFilter('descontoMin', e?.target?.value)}
                placeholder="Ex: 10%"
                className="w-full px-4 py-3 rounded-2xl bg-muted/50 text-sm focus:ring-2 focus:ring-primary/30 border-0 outline-none transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            {activeCount > 0 && (
              <button
                onClick={() => { onClear(); setOpen(false); }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border border-border bg-background hover:bg-muted transition-all active:scale-[0.97]"
              >
                Limpar
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="flex-1 py-3.5 rounded-2xl text-sm font-semibold bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-[0.97]"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
