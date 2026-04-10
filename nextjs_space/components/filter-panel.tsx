'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterPanelProps {
  departamentos: any[];
  categorias: any[];
  filters: { departamento: string; categoria: string; subcategoria: string; precoMin: string; precoMax: string; descontoMin: string };
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
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-95 ${
          activeCount > 0 ? 'bg-primary text-white' : 'bg-card shadow-sm'
        }`}
      >
        <SlidersHorizontal size={16} />
        Filtros
        {activeCount > 0 && (
          <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold ${
            activeCount > 0 ? 'bg-white/25 text-white' : 'bg-primary text-white'
          }`}>{activeCount}</span>
        )}
      </button>

      {/* Bottom Sheet Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e: any) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[85vh] overflow-y-auto safe-bottom"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
              </div>

              <div className="px-5 pb-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold">Filtros</h3>
                  <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Departamento */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Departamento</label>
                    <div className="relative">
                      <select
                        value={filters?.departamento ?? ''}
                        onChange={(e: any) => updateFilter('departamento', e?.target?.value)}
                        className="w-full px-4 py-3 rounded-xl bg-muted/50 text-sm appearance-none focus:ring-2 focus:ring-primary outline-none transition-all"
                      >
                        <option value="">Todos os departamentos</option>
                        {departamentos?.map?.((d: any) => <option key={d?.id} value={String(d?.id)}>{d?.nome}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Categoria */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Categoria</label>
                    <div className="relative">
                      <select
                        value={filters?.categoria ?? ''}
                        onChange={(e: any) => updateFilter('categoria', e?.target?.value)}
                        className="w-full px-4 py-3 rounded-xl bg-muted/50 text-sm appearance-none focus:ring-2 focus:ring-primary outline-none transition-all"
                      >
                        <option value="">Todas as categorias</option>
                        {categorias?.map?.((c: any) => <option key={c?.id} value={String(c?.id)}>{c?.nome}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Subcategoria */}
                  {subcategorias?.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Subcategoria</label>
                      <div className="relative">
                        <select
                          value={filters?.subcategoria ?? ''}
                          onChange={(e: any) => updateFilter('subcategoria', e?.target?.value)}
                          className="w-full px-4 py-3 rounded-xl bg-muted/50 text-sm appearance-none focus:ring-2 focus:ring-primary outline-none transition-all"
                        >
                          <option value="">Todas</option>
                          {subcategorias?.map?.((s: any) => <option key={s?.id} value={String(s?.id)}>{s?.nome}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {/* Faixa de preço */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Faixa de preço</label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={filters?.precoMin ?? ''}
                        onChange={(e: any) => updateFilter('precoMin', e?.target?.value)}
                        placeholder="Mínimo"
                        className="flex-1 px-4 py-3 rounded-xl bg-muted/50 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                      <input
                        type="number"
                        value={filters?.precoMax ?? ''}
                        onChange={(e: any) => updateFilter('precoMax', e?.target?.value)}
                        placeholder="Máximo"
                        className="flex-1 px-4 py-3 rounded-xl bg-muted/50 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Desconto mínimo */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">Desconto mínimo</label>
                    <input
                      type="number"
                      value={filters?.descontoMin ?? ''}
                      onChange={(e: any) => updateFilter('descontoMin', e?.target?.value)}
                      placeholder="Ex: 10%"
                      className="w-full px-4 py-3 rounded-xl bg-muted/50 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  {activeCount > 0 && (
                    <button
                      onClick={() => { onClear(); setOpen(false); }}
                      className="flex-1 py-3 rounded-2xl bg-muted text-sm font-semibold active:scale-[0.98] transition-all duration-200"
                    >
                      Limpar
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-semibold active:scale-[0.98] transition-all duration-200"
                  >
                    Aplicar filtros
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
