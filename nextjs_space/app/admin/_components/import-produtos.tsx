'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  FileSpreadsheet, Upload, CheckCircle2, XCircle, AlertTriangle,
  Download, Loader2, ArrowLeft, ArrowRight, Info, X, Eye, RefreshCw,
  ChevronDown, ChevronUp
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ParsedRow {
  codigo: string;
  nome: string;
  preco: string | number;
  preco_original?: string | number;
  departamento: string;
  categoria: string;
  subcategoria?: string;
  badges?: string;
}

interface ValidationResult {
  row: ParsedRow;
  lineNum: number;
  valid: boolean;
  errors: string[];
}

interface ImportResult {
  success: boolean;
  total: number;
  criados: number;
  atualizados: number;
  pulados: number;
  erros: { linha: number; motivo: string }[];
}

type Step = 'upload' | 'preview' | 'result';
type ImportMode = 'update' | 'skip';

const REQUIRED_COLUMNS = ['codigo', 'nome', 'preco', 'departamento', 'categoria'];
const ALL_COLUMNS = ['codigo', 'nome', 'preco', 'preco_original', 'departamento', 'categoria', 'subcategoria', 'badges'];

const COLUMN_INFO: Record<string, { label: string; required: boolean; desc: string; example: string }> = {
  codigo: { label: 'C\u00f3digo', required: true, desc: 'C\u00f3digo \u00fanico do produto', example: '186124' },
  nome: { label: 'Nome', required: true, desc: 'Nome completo do produto', example: 'Bico de Pato Floral' },
  preco: { label: 'Pre\u00e7o', required: true, desc: 'Pre\u00e7o de venda (aceita v\u00edrgula)', example: '11,00' },
  preco_original: { label: 'Pre\u00e7o Original', required: false, desc: 'Pre\u00e7o antes do desconto', example: '15,90' },
  departamento: { label: 'Departamento', required: true, desc: 'Nome do departamento', example: 'Bijouterias' },
  categoria: { label: 'Categoria', required: true, desc: 'Nome da categoria', example: 'Brincos' },
  subcategoria: { label: 'Subcategoria', required: false, desc: 'Nome da subcategoria', example: 'Argolas' },
  badges: { label: 'Badges', required: false, desc: 'Tags separadas por v\u00edrgula', example: 'novo,destaque' },
};

function normalizeHeader(h: string): string {
  return h
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function mapHeader(raw: string): string | null {
  const n = normalizeHeader(raw);
  const mapping: Record<string, string> = {
    codigo: 'codigo', cod: 'codigo', code: 'codigo', sku: 'codigo', referencia: 'codigo', ref: 'codigo',
    nome: 'nome', name: 'nome', descricao_produto: 'nome', produto: 'nome', product: 'nome',
    preco: 'preco', price: 'preco', valor: 'preco', preco_venda: 'preco', preco_de_venda: 'preco',
    preco_original: 'preco_original', preco_de: 'preco_original', price_original: 'preco_original', preco_antigo: 'preco_original',
    departamento: 'departamento', department: 'departamento', dept: 'departamento',
    categoria: 'categoria', category: 'categoria', cat: 'categoria',
    subcategoria: 'subcategoria', subcategory: 'subcategoria', sub: 'subcategoria', sub_categoria: 'subcategoria',
    badges: 'badges', tags: 'badges', etiquetas: 'badges', labels: 'badges',
  };
  return mapping[n] ?? null;
}

function validateRow(row: ParsedRow, lineNum: number): ValidationResult {
  const errors: string[] = [];
  if (!String(row.codigo ?? '').trim()) errors.push('C\u00f3digo vazio');
  if (!String(row.nome ?? '').trim()) errors.push('Nome vazio');
  if (!String(row.departamento ?? '').trim()) errors.push('Departamento vazio');
  if (!String(row.categoria ?? '').trim()) errors.push('Categoria vazio');
  const precoStr = String(row.preco ?? '').replace(',', '.').replace(/[^\d.\-]/g, '');
  const preco = parseFloat(precoStr);
  if (isNaN(preco) || preco < 0) errors.push('Pre\u00e7o inv\u00e1lido');
  return { row, lineNum, valid: errors.length === 0, errors };
}

export default function ImportProdutos({ onImportDone }: { onImportDone?: () => void }) {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>('update');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Parse file ----
  const parseFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (jsonRows.length === 0) {
          toast.error('Planilha vazia');
          return;
        }

        // Map headers
        const rawHeaders = Object.keys(jsonRows[0]);
        const headerMap: Record<string, string> = {};
        const mappedCols = new Set<string>();
        for (const rh of rawHeaders) {
          const mapped = mapHeader(rh);
          if (mapped && !mappedCols.has(mapped)) {
            headerMap[rh] = mapped;
            mappedCols.add(mapped);
          }
        }

        // Check required columns
        const missing = REQUIRED_COLUMNS.filter(c => !mappedCols.has(c));
        if (missing.length > 0) {
          toast.error(`Colunas obrigat\u00f3rias n\u00e3o encontradas: ${missing.join(', ')}`);
          return;
        }

        // Map rows
        const mapped: ParsedRow[] = jsonRows.map((jr: any) => {
          const row: any = {};
          for (const [rawKey, mappedKey] of Object.entries(headerMap)) {
            row[mappedKey] = jr[rawKey];
          }
          return row as ParsedRow;
        });

        // Validate
        const vals = mapped.map((row, i) => validateRow(row, i + 2));

        setParsedRows(mapped);
        setValidations(vals);
        setStep('preview');
        toast.success(`${mapped.length} linhas carregadas`);
      } catch (err: any) {
        console.error('Parse error:', err);
        toast.error('Erro ao ler arquivo: ' + (err?.message ?? ''));
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  // ---- Import ----
  const handleImport = async () => {
    const validRows = validations.filter(v => v.valid).map(v => v.row);
    if (validRows.length === 0) {
      toast.error('Nenhuma linha v\u00e1lida para importar');
      return;
    }

    setImporting(true);
    try {
      const res = await fetch('/api/produtos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows, mode: importMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Erro na importa\u00e7\u00e3o');
        setImporting(false);
        return;
      }
      setResult(data);
      setStep('result');
      toast.success(`Importa\u00e7\u00e3o conclu\u00edda! ${data.criados} criados, ${data.atualizados} atualizados`);
      onImportDone?.();
    } catch (err: any) {
      toast.error('Erro: ' + (err?.message ?? ''));
    }
    setImporting(false);
  };

  // ---- Reset ----
  const reset = () => {
    setStep('upload');
    setFileName('');
    setParsedRows([]);
    setValidations([]);
    setResult(null);
    setShowErrors(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---- Download modelo ----
  const downloadModelo = () => {
    const wsData = [
      ALL_COLUMNS,
      ['186124', 'Brinco Argola Dourada', '11,00', '15,90', 'Bijouterias', 'Brincos', 'Argolas', 'novo'],
      ['186125', 'Colar Corrente Fina', '22,50', '', 'Folheados', 'Colares', 'Correntes', ''],
      ['186126', 'Pulseira Couro Trancado', '8,90', '12,00', 'Bijouterias', 'Pulseiras', '', 'destaque'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Column widths
    ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');

    // Instructions sheet
    const instrData = [
      ['GUIA DE IMPORTA\u00c7\u00c3O - DANDE ACESS\u00d3RIOS'],
      [''],
      ['Coluna', 'Obrigat\u00f3ria', 'Tipo', 'Descri\u00e7\u00e3o', 'Exemplo'],
      ['codigo', 'SIM', 'Texto', 'C\u00f3digo \u00fanico do produto', '186124'],
      ['nome', 'SIM', 'Texto', 'Nome completo do produto', 'Brinco Argola Dourada'],
      ['preco', 'SIM', 'N\u00famero', 'Pre\u00e7o de venda (aceita v\u00edrgula)', '11,00'],
      ['preco_original', 'N\u00c3O', 'N\u00famero', 'Pre\u00e7o antes do desconto', '15,90'],
      ['departamento', 'SIM', 'Texto', 'Nome do departamento (cria automaticamente se n\u00e3o existir)', 'Bijouterias'],
      ['categoria', 'SIM', 'Texto', 'Nome da categoria (cria automaticamente se n\u00e3o existir)', 'Brincos'],
      ['subcategoria', 'N\u00c3O', 'Texto', 'Nome da subcategoria', 'Argolas'],
      ['badges', 'N\u00c3O', 'Texto', 'Tags separadas por v\u00edrgula', 'novo,destaque'],
      [''],
      ['DICAS IMPORTANTES:'],
      ['1. A primeira linha DEVE conter os nomes das colunas'],
      ['2. O c\u00f3digo \u00e9 a chave \u00fanica - se j\u00e1 existir, o produto ser\u00e1 atualizado'],
      ['3. Departamentos e categorias s\u00e3o criados automaticamente'],
      ['4. Pre\u00e7os aceitam formato brasileiro (v\u00edrgula) ou internacional (ponto)'],
      ['5. M\u00e1ximo de 5.000 linhas por importa\u00e7\u00e3o'],
      ['6. Imagens N\u00c3O s\u00e3o importadas pela planilha'],
    ];
    const wsInstr = XLSX.utils.aoa_to_sheet(instrData);
    wsInstr['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 50 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsInstr, 'Instru\u00e7\u00f5es');

    XLSX.writeFile(wb, 'modelo-importacao-dande.xlsx');
    toast.success('Modelo baixado!');
  };

  const validCount = validations.filter(v => v.valid).length;
  const invalidCount = validations.filter(v => !v.valid).length;

  // ---- RENDER ----
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-primary" />
            Importar Produtos
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cadastre produtos em massa via Excel ou CSV
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-muted hover:bg-muted/80 transition-all active:scale-95"
          >
            <Info size={14} />
            Guia
          </button>
          <button
            onClick={downloadModelo}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all active:scale-95"
          >
            <Download size={14} />
            Modelo
          </button>
        </div>
      </div>

      {/* Guide panel */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Guia de Colunas</h3>
                <button onClick={() => setShowGuide(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {ALL_COLUMNS.map(col => {
                  const info = COLUMN_INFO[col];
                  return (
                    <div key={col} className="flex items-start gap-3 text-xs">
                      <div className="flex-shrink-0 w-24">
                        <span className="font-mono font-bold text-foreground">{col}</span>
                        {info.required && <span className="text-red-500 ml-0.5">*</span>}
                      </div>
                      <div className="flex-1">
                        <span className="text-muted-foreground">{info.desc}</span>
                        <span className="ml-2 text-primary font-medium">ex: {info.example}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                <p className="text-xs font-semibold flex items-center gap-1"><AlertTriangle size={12} className="text-amber-500" /> Dicas Importantes</p>
                <ul className="text-[11px] text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li>A 1\u00aa linha deve conter os nomes das colunas</li>
                  <li>C\u00f3digo \u00e9 chave \u00fanica \u2014 se j\u00e1 existir, atualiza o produto</li>
                  <li>Departamentos e categorias s\u00e3o criados automaticamente</li>
                  <li>Pre\u00e7os aceitam formato BR (v\u00edrgula) ou internacional (ponto)</li>
                  <li>M\u00e1ximo de 5.000 linhas por importa\u00e7\u00e3o</li>
                  <li>Imagens n\u00e3o s\u00e3o importadas pela planilha</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs">
        {(['upload', 'preview', 'result'] as Step[]).map((s, i) => {
          const labels = ['Upload', 'Preview', 'Resultado'];
          const icons = [Upload, Eye, CheckCircle2];
          const Icon = icons[i];
          const isActive = step === s;
          const isDone = (['upload', 'preview', 'result'] as Step[]).indexOf(step) > i;
          return (
            <React.Fragment key={s}>
              {i > 0 && <div className={`flex-1 h-0.5 rounded ${isDone || isActive ? 'bg-primary' : 'bg-border'}`} />}
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all ${
                isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon size={13} />
                {labels[i]}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ===== STEP: UPLOAD ===== */}
      {step === 'upload' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all active:scale-[0.98] ${
              dragOver
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                dragOver ? 'bg-primary/20' : 'bg-muted'
              }`}>
                <FileSpreadsheet size={28} className={dragOver ? 'text-primary' : 'text-muted-foreground'} />
              </div>
              <div>
                <p className="text-sm font-semibold">Arraste seu arquivo aqui</p>
                <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar</p>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="px-2 py-0.5 rounded-full bg-muted">.xlsx</span>
                <span className="px-2 py-0.5 rounded-full bg-muted">.xls</span>
                <span className="px-2 py-0.5 rounded-full bg-muted">.csv</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== STEP: PREVIEW ===== */}
      {step === 'preview' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* File info + stats */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-primary" />
                <span className="text-sm font-semibold truncate max-w-[200px]">{fileName}</span>
              </div>
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                <X size={12} /> Trocar
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/50 rounded-xl p-2">
                <p className="text-lg font-bold">{parsedRows.length}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
              <div className="bg-green-500/10 rounded-xl p-2">
                <p className="text-lg font-bold text-green-600">{validCount}</p>
                <p className="text-[10px] text-muted-foreground">V\u00e1lidas</p>
              </div>
              <div className={`rounded-xl p-2 ${invalidCount > 0 ? 'bg-red-500/10' : 'bg-muted/50'}`}>
                <p className={`text-lg font-bold ${invalidCount > 0 ? 'text-red-500' : ''}`}>{invalidCount}</p>
                <p className="text-[10px] text-muted-foreground">Erros</p>
              </div>
            </div>
          </div>

          {/* Error details */}
          {invalidCount > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-red-600"
              >
                <span className="flex items-center gap-1.5">
                  <XCircle size={14} />
                  {invalidCount} linha(s) com erro
                </span>
                {showErrors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <AnimatePresence>
                {showErrors && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 space-y-1.5 max-h-40 overflow-y-auto">
                      {validations.filter(v => !v.valid).slice(0, 20).map((v, i) => (
                        <div key={i} className="text-[11px] flex gap-2">
                          <span className="font-mono font-bold text-red-500 flex-shrink-0">L{v.lineNum}</span>
                          <span className="text-muted-foreground">{v.errors.join(', ')}</span>
                        </div>
                      ))}
                      {invalidCount > 20 && (
                        <p className="text-[10px] text-muted-foreground">...e mais {invalidCount - 20} erros</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Preview table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border">
              <p className="text-xs font-semibold">Preview (primeiras 10 linhas)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-8">#</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">St</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">C\u00f3digo</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Nome</th>
                    <th className="px-2 py-2 text-right font-semibold text-muted-foreground">Pre\u00e7o</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Dept</th>
                    <th className="px-2 py-2 text-left font-semibold text-muted-foreground">Cat</th>
                  </tr>
                </thead>
                <tbody>
                  {validations.slice(0, 10).map((v, i) => (
                    <tr key={i} className={`border-t border-border/50 ${!v.valid ? 'bg-red-500/5' : ''}`}>
                      <td className="px-2 py-1.5 text-muted-foreground">{v.lineNum}</td>
                      <td className="px-2 py-1.5">
                        {v.valid
                          ? <CheckCircle2 size={13} className="text-green-500" />
                          : <XCircle size={13} className="text-red-500" />
                        }
                      </td>
                      <td className="px-2 py-1.5 font-mono">{String(v.row.codigo ?? '').slice(0, 12)}</td>
                      <td className="px-2 py-1.5 max-w-[120px] truncate">{String(v.row.nome ?? '')}</td>
                      <td className="px-2 py-1.5 text-right font-medium">{String(v.row.preco ?? '')}</td>
                      <td className="px-2 py-1.5 truncate max-w-[80px]">{String(v.row.departamento ?? '')}</td>
                      <td className="px-2 py-1.5 truncate max-w-[80px]">{String(v.row.categoria ?? '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 10 && (
              <div className="px-4 py-2 border-t border-border text-[10px] text-muted-foreground text-center">
                ...e mais {parsedRows.length - 10} linhas
              </div>
            )}
          </div>

          {/* Import mode */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold">Modo de importa\u00e7\u00e3o</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setImportMode('update')}
                className={`p-3 rounded-xl text-xs text-center transition-all border ${
                  importMode === 'update'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <RefreshCw size={16} className="mx-auto mb-1" />
                Atualizar existentes
                <p className="text-[10px] text-muted-foreground mt-0.5 font-normal">Sobrescreve dados</p>
              </button>
              <button
                onClick={() => setImportMode('skip')}
                className={`p-3 rounded-xl text-xs text-center transition-all border ${
                  importMode === 'skip'
                    ? 'border-primary bg-primary/10 text-primary font-bold'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <ArrowRight size={16} className="mx-auto mb-1" />
                Pular existentes
                <p className="text-[10px] text-muted-foreground mt-0.5 font-normal">S\u00f3 cria novos</p>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold border border-border bg-background hover:bg-muted transition-all active:scale-[0.97]"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-[0.97]"
            >
              {importing
                ? <><Loader2 size={16} className="animate-spin" /> Importando...</>
                : <><Upload size={16} /> Importar {validCount} produtos</>
              }
            </button>
          </div>
        </motion.div>
      )}

      {/* ===== STEP: RESULT ===== */}
      {step === 'result' && result && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Importa\u00e7\u00e3o Conclu\u00edda!</h3>
              <p className="text-xs text-muted-foreground mt-1">{result.total} linhas processadas</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-500/10 rounded-xl p-3">
                <p className="text-2xl font-bold text-green-600">{result.criados}</p>
                <p className="text-[10px] text-muted-foreground">Criados</p>
              </div>
              <div className="bg-blue-500/10 rounded-xl p-3">
                <p className="text-2xl font-bold text-blue-600">{result.atualizados}</p>
                <p className="text-[10px] text-muted-foreground">Atualizados</p>
              </div>
              <div className={`rounded-xl p-3 ${result.pulados > 0 ? 'bg-amber-500/10' : 'bg-muted/50'}`}>
                <p className={`text-2xl font-bold ${result.pulados > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{result.pulados}</p>
                <p className="text-[10px] text-muted-foreground">Pulados</p>
              </div>
            </div>

            {result.erros.length > 0 && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-left">
                <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                  <AlertTriangle size={13} /> {result.erros.length} erro(s) no servidor
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {result.erros.slice(0, 15).map((e, i) => (
                    <div key={i} className="text-[11px] flex gap-2">
                      <span className="font-mono font-bold text-red-500 flex-shrink-0">L{e.linha}</span>
                      <span className="text-muted-foreground">{e.motivo}</span>
                    </div>
                  ))}
                  {result.erros.length > 15 && (
                    <p className="text-[10px] text-muted-foreground">...e mais {result.erros.length - 15}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.97]"
          >
            <RefreshCw size={16} /> Nova Importa\u00e7\u00e3o
          </button>
        </motion.div>
      )}
    </div>
  );
}
