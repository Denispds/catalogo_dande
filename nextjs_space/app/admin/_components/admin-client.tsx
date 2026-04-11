'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit3, Trash2, Save, X, Loader2, Package, LayoutDashboard,
  FolderOpen, ChevronLeft, ChevronRight, Upload, Image as ImageIcon
} from 'lucide-react';

const BADGES_OPTIONS = ['garantia', 'novo', 'pronta entrega'];

export default function AdminClient() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'produtos' | 'colecoes' | 'drive'>('produtos');
  const [produtos, setProdutos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<any>({ codigo: '', nome: '', preco: '', precoOriginal: '', departamentoId: '', categoriaId: '', subcategoriaId: '', badges: [] });
  const [saving, setSaving] = useState(false);
  const [colecoes, setColecoes] = useState<any[]>([]);
  const [colForm, setColForm] = useState<any>({ nome: '', descricao: '', cor: '#E91E8C' });
  const [showColForm, setShowColForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  const fetchProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', ativo: 'all' });
      if (busca) params.set('busca', busca);
      const res = await fetch(`/api/produtos?${params.toString()}`);
      const data = await res?.json?.();
      setProdutos(data?.produtos ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 0);
    } catch (e: any) { console.error(e); }
    setLoading(false);
  }, [page, busca]);

  useEffect(() => { if (status === 'authenticated') fetchProdutos(); }, [fetchProdutos, status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    Promise.all([
      fetch('/api/departamentos').then((r: any) => r?.json?.()).catch(() => []),
      fetch('/api/categorias').then((r: any) => r?.json?.()).catch(() => []),
      fetch('/api/colecoes').then((r: any) => r?.json?.()).catch(() => []),
      fetch('/api/stats').then((r: any) => r?.json?.()).catch(() => ({})),
    ]).then(([deps, cats, cols, st]: any) => {
      setDepartamentos(deps ?? []);
      setCategorias(cats ?? []);
      setColecoes(cols ?? []);
      setStats(st ?? {});
    });
  }, [status]);

  const handleSaveProduct = async () => {
    if (!formData?.codigo || !formData?.nome || !formData?.preco || !formData?.departamentoId || !formData?.categoriaId) {
      toast.error('Preencha os campos obrigat\u00f3rios'); return;
    }
    setSaving(true);
    try {
      const isEdit = !!editProduct;
      const url = isEdit ? `/api/produtos/${editProduct?.codigo}` : '/api/produtos';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res?.ok) {
        toast.success(isEdit ? 'Produto atualizado!' : 'Produto criado!');
        setShowForm(false);
        setEditProduct(null);
        setFormData({ codigo: '', nome: '', preco: '', precoOriginal: '', departamentoId: '', categoriaId: '', subcategoriaId: '', badges: [] });
        fetchProdutos();
      } else {
        const data = await res?.json?.();
        toast.error(data?.error ?? 'Erro ao salvar');
      }
    } catch (e: any) { toast.error('Erro ao salvar'); console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (codigo: string) => {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;
    try {
      await fetch(`/api/produtos/${codigo}`, { method: 'DELETE' });
      toast.success('Produto deletado');
      fetchProdutos();
    } catch (e: any) { toast.error('Erro ao deletar'); }
  };

  const handleEdit = (p: any) => {
    setEditProduct(p);
    setFormData({
      codigo: p?.codigo ?? '',
      nome: p?.nome ?? '',
      preco: String(p?.preco ?? ''),
      precoOriginal: p?.precoOriginal ? String(p.precoOriginal) : '',
      departamentoId: String(p?.departamentoId ?? ''),
      categoriaId: String(p?.categoriaId ?? ''),
      subcategoriaId: p?.subcategoriaId ? String(p.subcategoriaId) : '',
      badges: p?.badges ?? [],
    });
    setShowForm(true);
  };

  const handleImageUpload = async (codigo: string, file: File) => {
    setUploadingImage(true);
    try {
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: true }),
      });
      const { uploadUrl, cloud_storage_path } = await presignedRes?.json?.() ?? {};
      if (!uploadUrl) { toast.error('Erro ao gerar URL de upload'); setUploadingImage(false); return; }

      const signedHeaders = new URL(uploadUrl).searchParams.get('X-Amz-SignedHeaders') ?? '';
      const headers: any = { 'Content-Type': file.type };
      if (signedHeaders?.includes?.('content-disposition')) headers['Content-Disposition'] = 'attachment';

      await fetch(uploadUrl, { method: 'PUT', headers, body: file });

      const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME ?? '';
      const region = process.env.NEXT_PUBLIC_AWS_REGION ?? 'us-east-1';
      const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;

      await fetch('/api/imagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produtoCodigo: codigo, url: publicUrl, cloudStoragePath: cloud_storage_path, isPublic: true, principal: true }),
      });

      toast.success('Imagem enviada!');
      fetchProdutos();
    } catch (e: any) { toast.error('Erro no upload'); console.error(e); }
    setUploadingImage(false);
  };

  const handleCreateColecao = async () => {
    if (!colForm?.nome) { toast.error('Nome obrigat\u00f3rio'); return; }
    try {
      const res = await fetch('/api/colecoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colForm),
      });
      if (res?.ok) {
        toast.success('Cole\u00e7\u00e3o criada!');
        setShowColForm(false);
        setColForm({ nome: '', descricao: '', cor: '#E91E8C' });
        const cols = await fetch('/api/colecoes').then((r: any) => r?.json?.()).catch(() => []);
        setColecoes(cols ?? []);
      }
    } catch (e: any) { toast.error('Erro ao criar cole\u00e7\u00e3o'); }
  };

  const handleDeleteColecao = async (id: string) => {
    if (!confirm('Deletar cole\u00e7\u00e3o?')) return;
    try {
      await fetch(`/api/colecoes/${id}`, { method: 'DELETE' });
      toast.success('Cole\u00e7\u00e3o removida');
      setColecoes(colecoes?.filter?.((c: any) => c?.id !== id) ?? []);
    } catch (e: any) { toast.error('Erro'); }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><LayoutDashboard size={24} className="text-primary" /> Painel Admin</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Produtos', value: stats?.totalProdutos ?? 0, icon: Package },
              { label: 'Departamentos', value: stats?.totalDepts ?? 0, icon: FolderOpen },
              { label: 'Categorias', value: stats?.totalCats ?? 0, icon: FolderOpen },
              { label: 'Cole\u00e7\u00f5es', value: stats?.totalColecoes ?? 0, icon: FolderOpen },
            ]?.map?.((s: any, i: number) => (
              <div key={i} className="p-3 rounded-xl bg-card flex items-center gap-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <s.icon size={20} className="text-primary" />
                <div>
                  <p className="text-xl font-bold">{s?.value}</p>
                  <p className="text-xs text-muted-foreground">{s?.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('produtos')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'produtos' ? 'bg-primary text-white' : 'bg-card hover:bg-muted'}`}>
            <Package size={14} className="inline mr-1" /> Produtos
          </button>
          <button onClick={() => setActiveTab('colecoes')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'colecoes' ? 'bg-primary text-white' : 'bg-card hover:bg-muted'}`}>
            <FolderOpen size={14} className="inline mr-1" /> Cole\u00e7\u00f5es
          </button>
          <button onClick={() => setActiveTab('drive')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'drive' ? 'bg-primary text-white' : 'bg-card hover:bg-muted'}`}>
            <Upload size={14} className="inline mr-1" /> Drive Sync
          </button>
        </div>

        {activeTab === 'produtos' && (
          <div>
            {/* Search + Add */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={busca}
                  onChange={(e: any) => { setBusca(e?.target?.value ?? ''); setPage(1); }}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-card text-sm border border-border focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <button
                onClick={() => { setShowForm(true); setEditProduct(null); setFormData({ codigo: '', nome: '', preco: '', precoOriginal: '', departamentoId: '', categoriaId: '', subcategoriaId: '', badges: [] }); }}
                className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
              >
                <Plus size={16} /> Novo
              </button>
            </div>

            {/* Product Form Modal */}
            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                  <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} onClick={(e: any) => e?.stopPropagation?.()} className="bg-card rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" style={{ boxShadow: 'var(--shadow-lg)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">{editProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                      <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted"><X size={20} /></button>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">C\u00f3digo *</label>
                          <input type="text" value={formData?.codigo ?? ''} onChange={(e: any) => setFormData({ ...formData, codigo: e?.target?.value })} disabled={!!editProduct} className="w-full px-3 py-2 rounded-lg bg-muted text-sm disabled:opacity-50" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Pre\u00e7o *</label>
                          <input type="number" step="0.01" value={formData?.preco ?? ''} onChange={(e: any) => setFormData({ ...formData, preco: e?.target?.value })} className="w-full px-3 py-2 rounded-lg bg-muted text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Nome *</label>
                        <input type="text" value={formData?.nome ?? ''} onChange={(e: any) => setFormData({ ...formData, nome: e?.target?.value })} className="w-full px-3 py-2 rounded-lg bg-muted text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Pre\u00e7o Original</label>
                        <input type="number" step="0.01" value={formData?.precoOriginal ?? ''} onChange={(e: any) => setFormData({ ...formData, precoOriginal: e?.target?.value })} className="w-full px-3 py-2 rounded-lg bg-muted text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Departamento *</label>
                          <select value={formData?.departamentoId ?? ''} onChange={(e: any) => setFormData({ ...formData, departamentoId: e?.target?.value })} className="w-full px-3 py-2 rounded-lg bg-muted text-sm">
                            <option value="">Selecione</option>
                            {departamentos?.map?.((d: any) => <option key={d?.id} value={String(d?.id)}>{d?.nome}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Categoria *</label>
                          <select value={formData?.categoriaId ?? ''} onChange={(e: any) => setFormData({ ...formData, categoriaId: e?.target?.value })} className="w-full px-3 py-2 rounded-lg bg-muted text-sm">
                            <option value="">Selecione</option>
                            {categorias?.map?.((c: any) => <option key={c?.id} value={String(c?.id)}>{c?.nome}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Badges</label>
                        <div className="flex gap-2 flex-wrap">
                          {BADGES_OPTIONS?.map?.((b: string) => (
                            <label key={b} className="flex items-center gap-1 text-xs cursor-pointer">
                              <input type="checkbox" checked={formData?.badges?.includes?.(b)} onChange={() => {
                                const badges = formData?.badges ?? [];
                                setFormData({ ...formData, badges: badges?.includes?.(b) ? badges?.filter?.((x: string) => x !== b) : [...badges, b] });
                              }} className="accent-primary w-3.5 h-3.5" />
                              {b}
                            </label>
                          ))}
                        </div>
                      </div>
                      {editProduct && (
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Upload de Foto</label>
                          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 text-sm">
                            <Upload size={14} />
                            {uploadingImage ? 'Enviando...' : 'Escolher arquivo'}
                            <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={(e: any) => {
                              const file = e?.target?.files?.[0];
                              if (file) handleImageUpload(editProduct?.codigo, file);
                            }} />
                          </label>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-5">
                      <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80">Cancelar</button>
                      <button onClick={handleSaveProduct} disabled={saving} className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Products table */}
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-primary" /></div>
            ) : (
              <div className="rounded-xl overflow-hidden bg-card" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">C\u00f3digo</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nome</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground hidden md:table-cell">Dept</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Pre\u00e7o</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">A\u00e7\u00f5es</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtos?.map?.((p: any) => (
                        <tr key={p?.codigo} className="border-t border-border hover:bg-muted/30">
                          <td className="px-3 py-2 font-mono text-xs">{p?.codigo}</td>
                          <td className="px-3 py-2 truncate max-w-[200px]">{p?.nome ?? ''}</td>
                          <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{p?.departamento?.nome ?? ''}</td>
                          <td className="px-3 py-2 text-right font-medium text-primary">R$ {(p?.preco ?? 0)?.toFixed?.(2)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"><Edit3 size={14} /></button>
                              <button onClick={() => handleDelete(p?.codigo)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="p-2 rounded-lg bg-card hover:bg-muted disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="text-sm">P\u00e1gina {page} de {totalPages}</span>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="p-2 rounded-lg bg-card hover:bg-muted disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'colecoes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">Cole\u00e7\u00f5es ({colecoes?.length ?? 0})</h2>
              <button onClick={() => setShowColForm(!showColForm)} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90">
                <Plus size={16} /> Nova Cole\u00e7\u00e3o
              </button>
            </div>

            <AnimatePresence>
              {showColForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                  <div className="p-4 rounded-xl bg-card space-y-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <input type="text" value={colForm?.nome ?? ''} onChange={(e: any) => setColForm({ ...colForm, nome: e?.target?.value })} placeholder="Nome da cole\u00e7\u00e3o" className="w-full px-3 py-2 rounded-lg bg-muted text-sm" />
                    <input type="text" value={colForm?.descricao ?? ''} onChange={(e: any) => setColForm({ ...colForm, descricao: e?.target?.value })} placeholder="Descri\u00e7\u00e3o" className="w-full px-3 py-2 rounded-lg bg-muted text-sm" />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Cor:</label>
                      <input type="color" value={colForm?.cor ?? '#E91E8C'} onChange={(e: any) => setColForm({ ...colForm, cor: e?.target?.value })} className="w-8 h-8 rounded cursor-pointer" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowColForm(false)} className="px-4 py-2 rounded-xl bg-muted text-sm">Cancelar</button>
                      <button onClick={handleCreateColecao} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">Criar</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {colecoes?.map?.((col: any) => (
                <motion.div key={col?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-card" style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: col?.cor ?? '#E91E8C' }} />
                      <h3 className="font-bold text-sm">{col?.nome ?? ''}</h3>
                      <span className="text-xs text-muted-foreground">({col?.produtos?.length ?? 0} produtos)</span>
                    </div>
                    <button onClick={() => handleDeleteColecao(col?.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
                  </div>
                  {col?.descricao && <p className="text-xs text-muted-foreground mt-1">{col.descricao}</p>}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'drive' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <h2 className="font-bold mb-2">Sincronizar Imagens do Google Drive</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Busca imagens na pasta do Drive, extrai o código do produto pelo nome do arquivo,
                faz upload para o S3 e vincula ao produto. Arquivos processados são movidos para a pasta &quot;Concluidas&quot;.
              </p>
              <button
                onClick={async () => {
                  if (syncLoading) return;
                  setSyncLoading(true);
                  setSyncResult(null);
                  try {
                    const res = await fetch('/api/sync-drive', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moveToConclued: true }) });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data?.error || 'Erro');
                    setSyncResult(data);
                    toast.success(`Sincronização concluída: ${data.added} importadas`);
                    fetchProdutos();
                  } catch (err: any) {
                    toast.error(err.message || 'Erro na sincronização');
                    setSyncResult({ error: err.message });
                  } finally {
                    setSyncLoading(false);
                  }
                }}
                disabled={syncLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {syncLoading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {syncLoading ? 'Sincronizando...' : 'Iniciar Sincronização'}
              </button>
            </div>

            {syncResult && !syncResult.error && (
              <div className="p-4 rounded-xl bg-card space-y-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <h3 className="font-bold text-sm">Resultado</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-lg font-bold">{syncResult.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="text-lg font-bold text-green-600">{syncResult.added}</div>
                    <div className="text-xs text-muted-foreground">Importadas</div>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="text-lg font-bold text-yellow-600">{syncResult.skipped}</div>
                    <div className="text-xs text-muted-foreground">Puladas</div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <div className="text-lg font-bold text-red-600">{syncResult.errors}</div>
                    <div className="text-xs text-muted-foreground">Erros</div>
                  </div>
                </div>

                {syncResult.details?.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Detalhes ({syncResult.details.length} arquivos)</h4>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {syncResult.details.map((d: any, i: number) => (
                        <div key={i} className={`text-xs px-2 py-1.5 rounded-lg flex items-center justify-between ${
                          d.status === 'importado' ? 'bg-green-50 dark:bg-green-900/10' :
                          d.status === 'erro' ? 'bg-red-50 dark:bg-red-900/10' :
                          'bg-muted'
                        }`}>
                          <span className="truncate mr-2 flex-1">{d.file}</span>
                          <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-medium ${
                            d.status === 'importado' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200' :
                            d.status === 'erro' ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {d.status}{d.code ? ` (${d.code})` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {syncResult?.error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                <strong>Erro:</strong> {syncResult.error}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}