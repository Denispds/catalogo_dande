export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/produtos/import
 * Importa produtos em massa a partir de um array JSON (parsed no client via xlsx).
 * Body: { rows: Array<{ codigo, nome, preco, preco_original?, departamento, categoria, subcategoria?, badges? }>, mode: 'skip' | 'update' }
 * mode: 'skip' = pula produtos com código já existente, 'update' = atualiza
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'N\u00e3o autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { rows, mode = 'update' } = body ?? {};

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Nenhuma linha para importar' }, { status: 400 });
    }

    if (rows.length > 5000) {
      return NextResponse.json({ error: 'M\u00e1ximo de 5.000 linhas por importa\u00e7\u00e3o' }, { status: 400 });
    }

    // --- Cache de departamentos, categorias e subcategorias ---
    const depCache = new Map<string, number>();
    const catCache = new Map<string, number>();
    const subCache = new Map<string, number>();

    // Carregar existentes
    const existingDeps = await prisma.catDepartamento.findMany();
    existingDeps.forEach((d: { nome: string; id: number }) => depCache.set(d.nome.toLowerCase().trim(), d.id));

    const existingCats = await prisma.catCategoria.findMany();
    existingCats.forEach((c: { nome: string; id: number }) => catCache.set(c.nome.toLowerCase().trim(), c.id));

    const existingSubs = await prisma.catSubcategoria.findMany();
    existingSubs.forEach((s: { categoriaId: number; nome: string; id: number }) => subCache.set(`${s.categoriaId}_${s.nome.toLowerCase().trim()}`, s.id));

    // --- Helper: buscar ou criar departamento ---
    async function getOrCreateDepartamento(nome: string): Promise<number> {
      const key = nome.toLowerCase().trim();
      if (depCache.has(key)) return depCache.get(key)!;
      const created = await prisma.catDepartamento.create({ data: { nome: nome.trim(), ativo: true } });
      depCache.set(key, created.id);
      return created.id;
    }

    // --- Helper: buscar ou criar categoria ---
    async function getOrCreateCategoria(nome: string): Promise<number> {
      const key = nome.toLowerCase().trim();
      if (catCache.has(key)) return catCache.get(key)!;
      const maxOrdem = await prisma.catCategoria.aggregate({ _max: { ordem: true } });
      const created = await prisma.catCategoria.create({
        data: { nome: nome.trim(), ativo: true, ordem: (maxOrdem._max.ordem ?? 0) + 1 },
      });
      catCache.set(key, created.id);
      return created.id;
    }

    // --- Helper: buscar ou criar subcategoria ---
    async function getOrCreateSubcategoria(nome: string, categoriaId: number): Promise<number> {
      const key = `${categoriaId}_${nome.toLowerCase().trim()}`;
      if (subCache.has(key)) return subCache.get(key)!;
      const created = await prisma.catSubcategoria.create({
        data: { nome: nome.trim(), categoriaId, ativo: true },
      });
      subCache.set(key, created.id);
      return created.id;
    }

    // --- Processar linhas ---
    const results = {
      criados: 0,
      atualizados: 0,
      pulados: 0,
      erros: [] as { linha: number; motivo: string }[],
      codigosAfetados: [] as string[], // Para histórico (rollback)
    };

    // Buscar códigos existentes
    const allCodigos = rows.map((r: any) => String(r.codigo ?? '').trim()).filter(Boolean);
    const existingProducts = await prisma.catProduto.findMany({
      where: { codigo: { in: allCodigos } },
      select: { codigo: true },
    });
    const existingSet = new Set(existingProducts.map((p: { codigo: string }) => p.codigo));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const linhaNum = i + 2; // +2 porque linha 1 é cabeçalho e array começa em 0

      try {
        // --- Validação ---
        const codigo = String(row.codigo ?? '').trim();
        const nome = String(row.nome ?? '').trim();
        const departamento = String(row.departamento ?? '').trim();
        const categoria = String(row.categoria ?? '').trim();

        if (!codigo) {
          results.erros.push({ linha: linhaNum, motivo: 'C\u00f3digo vazio' });
          continue;
        }
        if (!nome) {
          results.erros.push({ linha: linhaNum, motivo: 'Nome vazio' });
          continue;
        }
        if (!departamento) {
          results.erros.push({ linha: linhaNum, motivo: 'Departamento vazio' });
          continue;
        }
        if (!categoria) {
          results.erros.push({ linha: linhaNum, motivo: 'Categoria vazia' });
          continue;
        }

        // Parse preco
        let preco = 0;
        const precoRaw = String(row.preco ?? '0').replace(',', '.').replace(/[^\d.\-]/g, '');
        preco = parseFloat(precoRaw);
        if (isNaN(preco) || preco < 0) {
          results.erros.push({ linha: linhaNum, motivo: `Pre\u00e7o inv\u00e1lido: "${row.preco}"` });
          continue;
        }

        // Parse preco_original (opcional)
        let precoOriginal: number | null = null;
        if (row.preco_original !== undefined && row.preco_original !== null && String(row.preco_original).trim() !== '') {
          const poRaw = String(row.preco_original).replace(',', '.').replace(/[^\d.\-]/g, '');
          precoOriginal = parseFloat(poRaw);
          if (isNaN(precoOriginal)) precoOriginal = null;
        }

        // Buscar/criar departamento + categoria + subcategoria
        const departamentoId = await getOrCreateDepartamento(departamento);
        const categoriaId = await getOrCreateCategoria(categoria);

        let subcategoriaId: number | null = null;
        const subcategoria = String(row.subcategoria ?? '').trim();
        if (subcategoria) {
          subcategoriaId = await getOrCreateSubcategoria(subcategoria, categoriaId);
        }

        // Parse badges (opcional)
        let badges: string[] = [];
        if (row.badges) {
          badges = String(row.badges).split(',').map((b: string) => b.trim()).filter(Boolean);
        }

        // --- Inserir ou atualizar ---
        const exists = existingSet.has(codigo);

        if (exists && mode === 'skip') {
          results.pulados++;
          continue;
        }

        const data = {
          nome,
          preco,
          precoOriginal,
          departamentoId,
          categoriaId,
          subcategoriaId,
          badges,
          ativo: true,
        };

        if (exists) {
          await prisma.catProduto.update({
            where: { codigo },
            data,
          });
          results.atualizados++;
          results.codigosAfetados.push(codigo);
        } else {
          await prisma.catProduto.create({
            data: { codigo, ...data },
          });
          existingSet.add(codigo);
          results.criados++;
          results.codigosAfetados.push(codigo);
        }
      } catch (err: any) {
        console.error(`Erro na linha ${linhaNum}:`, err?.message);
        results.erros.push({ linha: linhaNum, motivo: err?.message ?? 'Erro desconhecido' });
      }
    }

    // --- Registrar no histórico ---
    const importLog = await prisma.importLog.create({
      data: {
        usuarioId: (session.user as any)?.id || 'unknown',
        totalLinhas: rows.length,
        criados: results.criados,
        atualizados: results.atualizados,
        pulados: results.pulados,
        erros: results.erros.length > 0 ? JSON.stringify(results.erros) : null,
        codigosAfetados: results.codigosAfetados.length > 0 ? JSON.stringify(results.codigosAfetados) : null,
        status: results.erros.length > 0 ? 'parcial' : 'sucesso',
        arquivo: `import-${new Date().toISOString().split('T')[0]}`,
        modo: mode,
      },
    });

    return NextResponse.json({
      success: true,
      total: rows.length,
      importLogId: importLog.id,
      ...results,
    });
  } catch (err: any) {
    console.error('Erro na importa\u00e7\u00e3o:', err);
    return NextResponse.json({ error: err?.message ?? 'Erro interno' }, { status: 500 });
  }
}
