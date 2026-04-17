'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  History, RotateCcw, ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle2, Clock, TrashIcon, Loader2
} from 'lucide-react';

interface ImportLog {
  id: string;
  usuarioId: string;
  totalLinhas: number;
  criados: number;
  atualizados: number;
  pulados: number;
  erros: string | null;
  status: string;
  arquivo: string | null;
  modo: string;
  createdAt: string;
  codigosAfetados: string | null;
}

export default function ImportHistory({ onUndo }: { onUndo?: () => void }) {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Carregar histórico
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/produtos/import-logs?page=${page}&limit=${limit}`);
      const data = await res.json();
      setLogs(data.logs);
      setTotal(data.pagination.total);
    } catch (err: any) {
      toast.error('Erro ao carregar histórico');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  // Desfazer importação
  const handleUndo = async (logId: string) => {
    if (!confirm('Tem certeza que deseja desfazer esta importação?')) return;

    setUndoing(logId);
    try {
      const res = await fetch('/api/produtos/import-logs/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Erro ao desfazer');
        setUndoing(null);
        return;
      }

      toast.success(`Importação desfeita! ${data.deletados} produtos removidos.`);
      if (data.aviso) {
        toast.warning(data.aviso);
      }

      // Recarregar histórico
      await fetchLogs();
      onUndo?.();
    } catch (err: any) {
      toast.error('Erro: ' + err?.message);
    }
    setUndoing(null);
  };

  const pages = Math.ceil(total / limit);
  const statusColors: Record<string, string> = {
    'sucesso': 'bg-green-500/10 text-green-600',
    'parcial': 'bg-amber-500/10 text-amber-600',
    'erro': 'bg-red-500/10 text-red-600',
    'desfeito': 'bg-gray-500/10 text-gray-600',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <History size={20} className="text-primary" />
        <div>
          <h2 className="text-lg font-bold">Histórico de Importações</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total > 0 ? `Total: ${total} importações` : 'Nenhuma importação ainda'}
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )}

      {/* Empty state */}
      {!loading && logs.length === 0 && (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
          <History size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Nenhuma importação realizada ainda</p>
          <p className="text-xs text-muted-foreground mt-1">As importações aparecerão aqui</p>
        </div>
      )}

      {/* List */}
      {!loading && logs.length > 0 && (
        <>
          <div className="space-y-2">
            {logs.map((log) => {
              const isExpanded = expandedId === log.id;
              const erros = log.erros ? JSON.parse(log.erros) : [];
              const codigosAfetados = log.codigosAfetados ? JSON.parse(log.codigosAfetados) : [];
              const dateStr = new Date(log.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden"
                >
                  {/* Row header */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {log.status === 'desfeito' && (
                        <RotateCcw size={16} className="text-gray-500 flex-shrink-0" />
                      )}
                      {log.status !== 'desfeito' && (
                        log.status === 'sucesso' ? (
                          <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                        )
                      )}
                      <div className="text-left min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{log.arquivo}</span>
                          <span className={`px-2 py-1 rounded text-[10px] font-semibold ${statusColors[log.status] || 'bg-muted'}`}>
                            {log.status.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {log.modo === 'update' ? 'Atualizar' : 'Pular'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                          <Clock size={12} />
                          {dateStr}
                        </div>
                      </div>
                    </div>

                    {/* Stats mini */}
                    <div className="flex items-center gap-4 ml-4 text-right flex-shrink-0">
                      <div className="text-center">
                        <p className="font-bold text-sm">{log.criados}</p>
                        <p className="text-[10px] text-green-600">Criados</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm">{log.atualizados}</p>
                        <p className="text-[10px] text-blue-600">Atualiz.</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-muted-foreground" />
                      ) : (
                        <ChevronDown size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-border"
                      >
                        <div className="p-4 space-y-3">
                          {/* Stats full */}
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-muted/50 rounded-xl p-2">
                              <p className="text-lg font-bold">{log.totalLinhas}</p>
                              <p className="text-[10px] text-muted-foreground">Total</p>
                            </div>
                            <div className="bg-green-500/10 rounded-xl p-2">
                              <p className="text-lg font-bold text-green-600">{log.criados}</p>
                              <p className="text-[10px] text-muted-foreground">Criados</p>
                            </div>
                            <div className="bg-blue-500/10 rounded-xl p-2">
                              <p className="text-lg font-bold text-blue-600">{log.atualizados}</p>
                              <p className="text-[10px] text-muted-foreground">Atualiz.</p>
                            </div>
                            <div className="bg-amber-500/10 rounded-xl p-2">
                              <p className="text-lg font-bold text-amber-600">{log.pulados}</p>
                              <p className="text-[10px] text-muted-foreground">Pulados</p>
                            </div>
                          </div>

                          {/* Erros */}
                          {erros.length > 0 && (
                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                              <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                                <AlertTriangle size={13} /> {erros.length} erro(s)
                              </p>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {erros.slice(0, 10).map((e: any, i: number) => (
                                  <div key={i} className="text-[11px] flex gap-2">
                                    <span className="font-mono font-bold text-red-500 flex-shrink-0">L{e.linha}</span>
                                    <span className="text-muted-foreground">{e.motivo}</span>
                                  </div>
                                ))}
                                {erros.length > 10 && (
                                  <p className="text-[10px] text-muted-foreground">...e mais {erros.length - 10}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Códigos afetados preview */}
                          {codigosAfetados.length > 0 && (
                            <div className="bg-muted/50 rounded-xl p-3">
                              <p className="text-xs font-semibold mb-2">Códigos afetados ({codigosAfetados.length})</p>
                              <div className="flex flex-wrap gap-1">
                                {codigosAfetados.slice(0, 10).map((cod: string, i: number) => (
                                  <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-background border border-border">
                                    {cod}
                                  </span>
                                ))}
                                {codigosAfetados.length > 10 && (
                                  <span className="px-2 py-0.5 rounded text-[10px] text-muted-foreground">+{codigosAfetados.length - 10} mais</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Ações */}
                          {log.status !== 'desfeito' && (
                            <button
                              onClick={() => handleUndo(log.id)}
                              disabled={undoing === log.id}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 disabled:opacity-50 transition-all"
                            >
                              {undoing === log.id ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  Desfeito...
                                </>
                              ) : (
                                <>
                                  <RotateCcw size={14} />
                                  Desfazer importação
                                </>
                              )}
                            </button>
                          )}

                          {log.status === 'desfeito' && (
                            <div className="bg-gray-500/5 border border-gray-500/20 rounded-xl p-3 text-center">
                              <p className="text-xs font-semibold text-gray-600 flex items-center justify-center gap-1">
                                <RotateCcw size={13} />
                                Esta importação foi desfeita
                              </p>
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

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 text-xs font-medium transition-all"
              >
                Anterior
              </button>
              <span className="text-xs font-medium text-muted-foreground">
                Pág. {page} de {pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 text-xs font-medium transition-all"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
