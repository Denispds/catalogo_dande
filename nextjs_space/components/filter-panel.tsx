'use client';

import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const selectedCat = categorias?.find?.((c: any) => String(c?.id) === filters?.categoria);
  const subcategorias = selectedCat?.subcategorias ?? [];

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...(filters ?? {}), [key]: value };
    if (key === 'categoria') newFilters.subcategoria = '';
    onChange(newFilters);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-primary/5 transition-colors text-sm font-medium"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <Filter size={16} className="text-primary" />
        Filtros
        {activeCount > 0 && (
          <span className="bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-card space-y-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Departamento</label>
                  <select
                    value={filters?.departamento ?? ''}
                    onChange={(e: any) => updateFilter('departamento', e?.target?.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted text-sm border-0 focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todos</option>
                    {departamentos?.map?.((d: any) => (
                      <option key={d?.id} value={String(d?.id)}>{d?.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                  <select
                    value={filters?.categoria ?? ''}
                    onChange={(e: any) => updateFilter('categoria', e?.target?.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted text-sm border-0 focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todas</option>
                    {categorias?.map?.((c: any) => (
                      <option key={c?.id} value={String(c?.id)}>{c?.nome}</option>
                    ))}
                  </select>
                </div>
                {subcategorias?.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Subcategoria</label>
                    <select
                      value={filters?.subcategoria ?? ''}
                      onChange={(e: any) => updateFilter('subcategoria', e?.target?.value)}
                      className="w-full px-3 py-2 rounded-lg bg-muted text-sm border-0 focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Todas</option>
                      {subcategorias?.map?.((s: any) => (
                        <option key={s?.id} value={String(s?.id)}>{s?.nome}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Preço mín</label>
                  <input
                    type="number"
                    value={filters?.precoMin ?? ''}
                    onChange={(e: any) => updateFilter('precoMin', e?.target?.value)}
                    placeholder="R$ 0"
                    className="w-full px-3 py-2 rounded-lg bg-muted text-sm border-0 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Preço máx</label>
                  <input
                    type="number"
                    value={filters?.precoMax ?? ''}
                    onChange={(e: any) => updateFilter('precoMax', e?.target?.value)}
                    placeholder="R$ 999"
                    className="w-full px-3 py-2 rounded-lg bg-muted text-sm border-0 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Desconto mín %</label>
                  <input
                    type="number"
                    value={filters?.descontoMin ?? ''}
                    onChange={(e: any) => updateFilter('descontoMin', e?.target?.value)}
                    placeholder="0%"
                    className="w-full px-3 py-2 rounded-lg bg-muted text-sm border-0 focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              {activeCount > 0 && (
                <button
                  onClick={onClear}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <X size={12} /> Limpar filtros
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
