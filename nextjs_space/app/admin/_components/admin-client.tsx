'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/header';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Edit3, Trash2, Save, X, Loader2, Package, LayoutDashboard,
  FolderOpen, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, BookOpen, ChevronDown,
  ToggleLeft, ToggleRight, Eye, EyeOff
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
  const [showGuide, setShowGuide] = useState(false);

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
      fetch('/api/colecoes?all=true').then((r: any) => r?.json?.()).catch(() => []),
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
    fetchProductMedia(p?.codigo);
  };

  const [productMedia, setProductMedia] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const fetchProductMedia = async (codigo: string) => {
    setLoadingMedia(true);
    try {
      const res = await fetch(`/api/produtos/${codigo}`);
      const data = await res?.json?.();
      setProductMedia(data?.imagens ?? []);
    } catch { setProductMedia([]); }
    setLoadingMedia(false);
  };

  const validateVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject(new Error('Erro ao ler v\u00eddeo'));
      video.src = URL.createObjectURL(file);
    });
  };

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      const canvas = document.createElement('canvas');
      video.onloadeddata = () => {
        video.currentTime = 0.5;
      };
      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(video.src);
        resolve(dataUrl);
      };
      video.onerror = () => reject(new Error('Erro ao gerar thumbnail'));
      video.src = URL.createObjectURL(file);
    });
  };

  const uploadSingleFile = async (file: File): Promise<{ url: string; cloudStoragePath: string }> => {
    const presignedRes = await fetch('/api/upload/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: true }),
    });
    const { uploadUrl, cloud_storage_path } = await presignedRes?.json?.() ?? {};
    if (!uploadUrl) throw new Error('Erro ao gerar URL');

    const signedHeaders = new URL(uploadUrl).searchParams.get('X-Amz-SignedHeaders') ?? '';
    const hdrs: any = { 'Content-Type': file.type };
    if (signedHeaders?.includes?.('content-disposition')) hdrs['Content-Disposition'] = 'attachment';

    await fetch(uploadUrl, { method: 'PUT', headers: hdrs, body: file });

    const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME ?? '';
    const region = process.env.NEXT_PUBLIC_AWS_REGION ?? 'us-east-1';
    const url = `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
    return { url, cloudStoragePath: cloud_storage_path };
  };

  const uploadThumbnailBlob = async (dataUrl: string): Promise<{ url: string; cloudStoragePath: string }> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `thumb-${Date.now()}.jpg`, { type: 'image/jpeg' });
    return uploadSingleFile(file);
  };

  const handleMediaUpload = async (codigo: string, files: FileList) => {
    setUploadingImage(true);
    let success = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const isVideo = file.type.startsWith('video/');
        if (isVideo) {
          const duration = await validateVideoDuration(file);
          if (duration > 10) {
            toast.error(`${file.name}: v\u00eddeo excede 10 segundos (${Math.round(duration)}s)`);
            continue;
          }
        }

        const { url, cloudStoragePath } = await uploadSingleFile(file);

        let thumbnailUrl: string | null = null;
        if (isVideo) {
          try {
            const thumbDataUrl = await generateVideoThumbnail(file);
            const thumbResult = await uploadThumbnailBlob(thumbDataUrl);
            thumbnailUrl = thumbResult.url;
          } catch { /* thumbnail optional */ }
        }

        const existingCount = productMedia.length + success;
        await fetch('/api/imagens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produtoCodigo: codigo,
            url,
            cloudStoragePath: cloudStoragePath,
            isPublic: true,
            principal: existingCount === 0,
            tipo: isVideo ? 'video' : 'image',
            thumbnailUrl,
          }),
        });
        success++;
      } catch (e: any) {
        toast.error(`Erro em ${file.name}`);
        console.error(e);
      }
    }
    if (success > 0) {
      toast.success(`${success} arquivo(s) enviado(s)!`);
      fetchProductMedia(codigo);
      fetchProdutos();
    }
    setUploadingImage(false);
  };

  const handleDeleteMedia = async (id: string, codigo: string) => {
    try {
      await fetch(`/api/imagens/${id}`, { method: 'DELETE' });
      toast.success('M\u00eddia removida');
      fetchProductMedia(codigo);
      fetchProdutos();
    } catch { toast.error('Erro ao remover'); }
  };

  const handleSetPrincipal = async (id: string, codigo: string) => {
    try {
      await fetch(`/api/imagens/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principal: true }),
      });
      fetchProductMedia(codigo);
      fetchProdutos();
      toast.success('Imagem principal definida');
    } catch { toast.error('Erro'); }
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
        const cols = await fetch('/api/colecoes?all=true').then((r: any) => r?.json?.()).catch(() => []);
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

  const handleToggleAtivo = async (codigo: string, currentAtivo: boolean) => {
    try {
      const res = await fetch(`/api/produtos/${codigo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !currentAtivo }),
      });
      if (res?.ok) {
        toast.success(!currentAtivo ? 'Produto ativado' : 'Produto inativado');
        setProdutos(prev => prev?.map?.((p: any) => p?.codigo === codigo ? { ...p, ativo: !currentAtivo } : p) ?? []);
      }
    } catch (e: any) { toast.error('Erro ao alterar status'); }
  };

  const [editColecao, setEditColecao] = useState<any>(null);

  const handleEditColecao = async () => {
    if (!editColecao?.id || !colForm?.nome) { toast.error('Nome obrigat\u00f3rio'); return; }
    try {
      const res = await fetch(`/api/colecoes/${editColecao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: colForm.nome, descricao: colForm.descricao, cor: colForm.cor }),
      });
      if (res?.ok) {
        toast.success('Cole\u00e7\u00e3o atualizada!');
        setShowColForm(false);
        setEditColecao(null);
        setColForm({ nome: '', descricao: '', cor: '#E91E8C' });
        const cols = await fetch('/api/colecoes?all=true').then((r: any) => r?.json?.()).catch(() => []);
        setColecoes(cols ?? []);
      }
    } catch (e: any) { toast.error('Erro ao atualizar'); }
  };

  const handleToggleColecao = async (id: string, currentAtiva: boolean) => {
    try {
      const res = await fetch(`/api/colecoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa: !currentAtiva }),
      });
      if (res?.ok) {
        toast.success(!currentAtiva ? 'Cole\u00e7\u00e3o ativada' : 'Cole\u00e7\u00e3o inativada');
        setColecoes(prev => prev?.map?.((c: any) => c?.id === id ? { ...c, ativa: !currentAtiva } : c) ?? []);
      }
    } catch (e: any) { toast.error('Erro ao alterar status'); }
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
                        <div className="space-y-3">
                          <label className="text-xs text-muted-foreground block">M&#237;dias do Produto ({productMedia.length})</label>

                          {/* Galeria de mídias existentes */}
                          {loadingMedia ? (
                            <div className="flex items-center justify-center py-4"><Loader2 size={20} className="animate-spin text-primary" /></div>
                          ) : productMedia.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                              {productMedia.map((m: any, idx: number) => (
                                <div key={m.id} className={`relative group rounded-lg overflow-hidden border-2 ${m.principal ? 'border-primary' : 'border-transparent'}`}>
                                  <div className="relative aspect-square bg-muted">
                                    {m.tipo === 'video' ? (
                                      <video src={m.url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                                    ) : (
                                      <img src={m.url} alt={`M\u00eddia ${idx + 1}`} className="w-full h-full object-cover" />
                                    )}
                                    {m.tipo === 'video' && (
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                                          <span className="text-white text-xs ml-0.5">&#9654;</span>
                                        </div>
                                      </div>
                                    )}
                                    {m.principal && (
                                      <div className="absolute top-1 left-1 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded font-bold">PRINCIPAL</div>
                                    )}
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                    {!m.principal && m.tipo !== 'video' && (
                                      <button
                                        onClick={() => handleSetPrincipal(m.id, editProduct.codigo)}
                                        className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-primary hover:bg-white"
                                        title="Definir como principal"
                                      >
                                        <ImageIcon size={12} />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteMedia(m.id, editProduct.codigo)}
                                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-destructive hover:bg-white"
                                      title="Excluir"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Nenhuma m&#237;dia cadastrada</p>
                          )}

                          {/* Upload múltiplo */}
                          <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted cursor-pointer hover:bg-muted/80 text-sm border border-dashed border-border">
                            <Upload size={14} className="text-primary" />
                            {uploadingImage ? (
                              <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Enviando...</span>
                            ) : (
                              <span>Adicionar imagens ou v&#237;deos (m&#225;x 10s)</span>
                            )}
                            <input
                              type="file"
                              accept="image/*,video/mp4,video/webm,video/quicktime"
                              multiple
                              className="hidden"
                              disabled={uploadingImage}
                              onChange={(e: any) => {
                                const files = e?.target?.files;
                                if (files?.length > 0) handleMediaUpload(editProduct?.codigo, files);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <p className="text-[10px] text-muted-foreground">Formatos: PNG, JPG, WEBP, GIF, MP4, WEBM. V&#237;deos at&#233; 10 segundos.</p>
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
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">C&#243;digo</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Nome</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground hidden md:table-cell">Dept</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">Pre&#231;o</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">A&#231;&#245;es</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtos?.map?.((p: any) => (
                        <tr key={p?.codigo} className={`border-t border-border hover:bg-muted/30 ${p?.ativo === false ? 'opacity-50' : ''}`}>
                          <td className="px-3 py-2 font-mono text-xs">{p?.codigo}</td>
                          <td className="px-3 py-2 truncate max-w-[200px]">{p?.nome ?? ''}</td>
                          <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{p?.departamento?.nome ?? ''}</td>
                          <td className="px-3 py-2 text-right font-medium text-primary">R$ {(p?.preco ?? 0)?.toFixed?.(2)}</td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => handleToggleAtivo(p?.codigo, p?.ativo !== false)}
                              className={`p-1.5 rounded-lg transition-colors ${p?.ativo !== false ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-muted-foreground hover:bg-muted'}`}
                              title={p?.ativo !== false ? 'Ativo — clique para inativar' : 'Inativo — clique para ativar'}
                            >
                              {p?.ativo !== false ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                          </td>
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
              <h2 className="font-bold">Cole&#231;&#245;es ({colecoes?.length ?? 0})</h2>
              <button onClick={() => { setShowColForm(true); setEditColecao(null); setColForm({ nome: '', descricao: '', cor: '#E91E8C' }); }} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90">
                <Plus size={16} /> Nova Cole&#231;&#227;o
              </button>
            </div>

            <AnimatePresence>
              {showColForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                  <div className="p-4 rounded-xl bg-card space-y-3" style={{ boxShadow: 'var(--shadow-sm)' }}>
                    <h3 className="font-bold text-sm">{editColecao ? 'Editar Cole\u00e7\u00e3o' : 'Nova Cole\u00e7\u00e3o'}</h3>
                    <input type="text" value={colForm?.nome ?? ''} onChange={(e: any) => setColForm({ ...colForm, nome: e?.target?.value })} placeholder="Nome da cole\u00e7\u00e3o" className="w-full px-3 py-2 rounded-lg bg-muted text-sm" />
                    <input type="text" value={colForm?.descricao ?? ''} onChange={(e: any) => setColForm({ ...colForm, descricao: e?.target?.value })} placeholder="Descri\u00e7\u00e3o" className="w-full px-3 py-2 rounded-lg bg-muted text-sm" />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Cor:</label>
                      <input type="color" value={colForm?.cor ?? '#E91E8C'} onChange={(e: any) => setColForm({ ...colForm, cor: e?.target?.value })} className="w-8 h-8 rounded cursor-pointer" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowColForm(false); setEditColecao(null); }} className="px-4 py-2 rounded-xl bg-muted text-sm">Cancelar</button>
                      <button onClick={editColecao ? handleEditColecao : handleCreateColecao} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">
                        {editColecao ? 'Salvar' : 'Criar'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              {colecoes?.map?.((col: any) => (
                <motion.div key={col?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl bg-card ${col?.ativa === false ? 'opacity-50' : ''}`} style={{ boxShadow: 'var(--shadow-sm)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: col?.cor ?? '#E91E8C' }} />
                      <h3 className="font-bold text-sm truncate">{col?.nome ?? ''}</h3>
                      <span className="text-xs text-muted-foreground shrink-0">({col?.produtos?.length ?? 0} produtos)</span>
                      {col?.ativa === false && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">inativa</span>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => handleToggleColecao(col?.id, col?.ativa !== false)}
                        className={`p-1.5 rounded-lg transition-colors ${col?.ativa !== false ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-muted-foreground hover:bg-muted'}`}
                        title={col?.ativa !== false ? 'Ativa \u2014 clique para inativar' : 'Inativa \u2014 clique para ativar'}
                      >
                        {col?.ativa !== false ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => { setEditColecao(col); setColForm({ nome: col?.nome ?? '', descricao: col?.descricao ?? '', cor: col?.cor ?? '#E91E8C' }); setShowColForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"
                        title="Editar cole\u00e7\u00e3o"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDeleteColecao(col?.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive" title="Excluir cole\u00e7\u00e3o">
                        <Trash2 size={14} />
                      </button>
                    </div>
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

            {/* Guia de Uso */}
            <div className="rounded-xl bg-card overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <span className="font-bold text-sm">📖 Guia: Como Inserir Imagens no Drive</span>
                </div>
                <ChevronDown size={16} className={`text-muted-foreground transition-transform ${showGuide ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showGuide && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 text-sm text-foreground/90">

                      {/* Seção 1 - Pasta */}
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <h4 className="font-bold text-primary mb-1.5 flex items-center gap-1.5">📁 Onde Colocar as Imagens?</h4>
                        <p className="text-xs leading-relaxed mb-2">
                          Coloque as imagens dentro da <strong>pasta compartilhada do Google Drive</strong> ou em qualquer <strong>subpasta</strong> dentro dela.
                        </p>
                        <div className="text-xs bg-card rounded-lg p-2.5 font-mono space-y-0.5">
                          <div>📂 <strong>Pasta Principal do Drive</strong></div>
                          <div className="ml-4">├── 📷 119157-1.png ✅</div>
                          <div className="ml-4">├── 📷 187500.png ✅</div>
                          <div className="ml-4">├── 📂 Abril 2026/</div>
                          <div className="ml-8">│&nbsp;&nbsp; ├── 📷 180420.jpg ✅</div>
                          <div className="ml-8">│&nbsp;&nbsp; └── 📷 119858-2.png ✅</div>
                          <div className="ml-4">└── 📂 <span className="text-yellow-600">Concluidas/</span> ⛔ (não mexer)</div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          ⚠️ <strong>Não coloque imagens na pasta &quot;Concluidas&quot;</strong> — ela é usada automaticamente para guardar os arquivos já processados.
                        </p>
                      </div>

                      {/* Seção 2 - Nomenclatura */}
                      <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                        <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-1.5 flex items-center gap-1.5">✏️ Como Nomear os Arquivos</h4>
                        <p className="text-xs leading-relaxed mb-2">
                          O nome do arquivo <strong>deve começar com o código do produto</strong> (4 a 7 dígitos). O sistema extrai automaticamente o código.
                        </p>
                        <div className="space-y-1.5">
                          <div className="text-xs font-medium text-muted-foreground">✅ Formatos aceitos:</div>
                          <div className="grid gap-1">
                            {[
                              { ex: '119157-1.png', desc: 'Código + hífen + número da foto' },
                              { ex: '119157.png', desc: 'Só o código' },
                              { ex: '187500.Mídia.152908.png', desc: 'Código + descrição extra' },
                              { ex: '180420 (1).png', desc: 'Código + espaço + variação' },
                              { ex: 'Colar - 187580.png', desc: 'Descrição - Código' },
                            ].map((item, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs bg-card rounded-lg px-2.5 py-1.5">
                                <code className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-mono text-[11px] shrink-0">{item.ex}</code>
                                <span className="text-muted-foreground">{item.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 space-y-1.5">
                          <div className="text-xs font-medium text-muted-foreground">❌ Formatos que NÃO funcionam:</div>
                          <div className="grid gap-1">
                            {[
                              { ex: 'IMG-20260409-WA0006.jpg', desc: 'Nome automático do WhatsApp' },
                              { ex: 'IMG_7662.JPG', desc: 'Nome automático da câmera' },
                              { ex: 'Colar nossa senhora.png', desc: 'Só descrição, sem código' },
                              { ex: 'foto produto.heic', desc: 'Formato HEIC do iPhone' },
                            ].map((item, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs bg-card rounded-lg px-2.5 py-1.5">
                                <code className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-mono text-[11px] shrink-0">{item.ex}</code>
                                <span className="text-muted-foreground">{item.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Seção 3 - Múltiplas fotos */}
                      <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                        <h4 className="font-bold text-purple-700 dark:text-purple-400 mb-1.5 flex items-center gap-1.5">📸 Várias Fotos por Produto</h4>
                        <p className="text-xs leading-relaxed mb-1.5">
                          Você pode adicionar <strong>múltiplas fotos</strong> para o mesmo produto. Basta usar o mesmo código no início do nome:
                        </p>
                        <div className="text-xs bg-card rounded-lg p-2.5 font-mono space-y-0.5">
                          <div>📷 <strong>119157</strong>-1.png → foto 1 (será a principal)</div>
                          <div>📷 <strong>119157</strong>-2.png → foto 2</div>
                          <div>📷 <strong>119157</strong>-3.png → foto 3</div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          💡 A <strong>primeira imagem importada</strong> de cada produto é automaticamente marcada como <strong>foto principal</strong> do catálogo.
                        </p>
                      </div>

                      {/* Seção 4 - Formatos */}
                      <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                        <h4 className="font-bold text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">🖼️ Formatos de Imagem</h4>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-card"><span className="text-green-500">✅</span> .PNG</div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-card"><span className="text-green-500">✅</span> .JPG / .JPEG</div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-card"><span className="text-green-500">✅</span> .WEBP</div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-card"><span className="text-green-500">✅</span> .GIF</div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-card"><span className="text-red-500">❌</span> .HEIC / .HEIF</div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-card"><span className="text-red-500">❌</span> .PDF / .MP4</div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          📱 <strong>Fotos do iPhone</strong> costumam ser salvas em .HEIC. Antes de enviar, converta para .JPG ou .PNG.
                        </p>
                      </div>

                      {/* Seção 5 - Passo a Passo */}
                      <div className="p-3 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30">
                        <h4 className="font-bold text-green-700 dark:text-green-400 mb-1.5 flex items-center gap-1.5">🚀 Passo a Passo Resumido</h4>
                        <ol className="text-xs space-y-2 list-none">
                          {[
                            { n: '1', text: 'Renomeie o arquivo com o código do produto no início (ex: 119157-1.png)' },
                            { n: '2', text: 'Faça upload na pasta compartilhada do Google Drive (ou subpasta)' },
                            { n: '3', text: 'Acesse o painel Admin → aba Drive Sync' },
                            { n: '4', text: 'Clique em "Iniciar Sincronização"' },
                            { n: '5', text: 'Confira o relatório — imagens importadas aparecem em verde ✅' },
                          ].map(step => (
                            <li key={step.n} className="flex items-start gap-2">
                              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[11px] font-bold shrink-0">{step.n}</span>
                              <span>{step.text}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Seção 6 - Observações */}
                      <div className="p-3 rounded-lg bg-muted/50 border border-border">
                        <h4 className="font-bold mb-1.5 flex items-center gap-1.5">⚠️ Observações Importantes</h4>
                        <ul className="text-xs space-y-1.5 list-none">
                          <li className="flex items-start gap-1.5"><span>•</span> O código do produto <strong>precisa existir no sistema</strong>. Imagens com código não cadastrado serão puladas.</li>
                          <li className="flex items-start gap-1.5"><span>•</span> Imagens já importadas <strong>não serão duplicadas</strong> (o sistema reconhece pelo ID do arquivo no Drive).</li>
                          <li className="flex items-start gap-1.5"><span>•</span> Após a sincronização, os arquivos processados são <strong>movidos automaticamente</strong> para a pasta &quot;Concluidas&quot;.</li>
                          <li className="flex items-start gap-1.5"><span>•</span> Se uma imagem aparecer como &quot;pulada&quot;, verifique se o nome do arquivo contém o código correto.</li>
                          <li className="flex items-start gap-1.5"><span>•</span> Para <strong>substituir</strong> uma imagem, exclua a antiga no painel de produto e faça upload de uma nova no Drive.</li>
                        </ul>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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