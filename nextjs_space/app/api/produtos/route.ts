export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const busca = url.searchParams.get('busca') ?? '';
    const departamento = url.searchParams.get('departamento') ?? '';
    const categoria = url.searchParams.get('categoria') ?? '';
    const subcategoria = url.searchParams.get('subcategoria') ?? '';
    const precoMin = url.searchParams.get('precoMin') ?? '';
    const precoMax = url.searchParams.get('precoMax') ?? '';
    const descontoMin = url.searchParams.get('descontoMin') ?? '';
    const ordem = url.searchParams.get('ordem') ?? 'nome_asc';
    const page = parseInt(url.searchParams.get('page') ?? '1', 10);
    const limit = parseInt(url.searchParams.get('limit') ?? '12', 10);
    const ativo = url.searchParams.get('ativo');
    const comImagem = url.searchParams.get('comImagem') ?? '';

    const where: any = {};
    if (ativo !== 'all') where.ativo = true;

    if (comImagem === 'true') {
      where.imagens = { some: {} };
    }

    if (busca) {
      where.OR = [
        { nome: { contains: busca, mode: 'insensitive' } },
        { codigo: { contains: busca, mode: 'insensitive' } },
      ];
    }
    if (departamento) where.departamentoId = parseInt(departamento, 10);
    if (categoria) where.categoriaId = parseInt(categoria, 10);
    if (subcategoria) where.subcategoriaId = parseInt(subcategoria, 10);
    if (precoMin) where.preco = { ...(where.preco ?? {}), gte: parseFloat(precoMin) };
    if (precoMax) where.preco = { ...(where.preco ?? {}), lte: parseFloat(precoMax) };

    const hasDiscountFilter = !!descontoMin;
    const sortByImageDate = ordem === 'recente' || ordem === 'antigo';

    // If we have special filters that require post-processing, use a hybrid approach
    if (hasDiscountFilter || sortByImageDate) {
      // For discount filter: fetch all matching, filter in memory, paginate
      // For image-date sort: fetch all, sort by image date, paginate
      // To avoid huge payloads, we fetch only the fields needed for sorting/filtering first
      const candidates = await prisma.catProduto.findMany({
        where,
        select: {
          codigo: true,
          nome: true,
          preco: true,
          precoOriginal: true,
          createdAt: true,
          imagens: sortByImageDate
            ? { select: { createdAt: true, principal: true, ordem: true }, orderBy: [{ principal: 'desc' }, { ordem: 'asc' }], take: 1 }
            : false,
        },
      });

      // Apply discount filter in-memory
      let filteredIds: string[] = candidates.map((p: any) => p.codigo);
      if (hasDiscountFilter) {
        const minDisc = parseFloat(descontoMin);
        filteredIds = candidates
          .filter((p: any) => {
            if (!p?.precoOriginal || p.precoOriginal <= 0) return false;
            const disc = ((p.precoOriginal - p.preco) / p.precoOriginal) * 100;
            return disc >= minDisc;
          })
          .map((p: any) => p.codigo);
      }

      // Filter candidates to only those that pass discount filter
      const filtered = candidates.filter((p: any) => filteredIds.includes(p.codigo));

      // Sort
      let sorted = filtered;
      if (sortByImageDate) {
        sorted = filtered.sort((a: any, b: any) => {
          const aDate = a.imagens?.[0]?.createdAt
            ? new Date(a.imagens[0].createdAt).getTime()
            : new Date(a.createdAt).getTime();
          const bDate = b.imagens?.[0]?.createdAt
            ? new Date(b.imagens[0].createdAt).getTime()
            : new Date(b.createdAt).getTime();
          return ordem === 'recente' ? bDate - aDate : aDate - bDate;
        });
      } else {
        if (ordem === 'nome_asc') sorted = filtered.sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
        else if (ordem === 'nome_desc') sorted = filtered.sort((a: any, b: any) => b.nome.localeCompare(a.nome, 'pt-BR'));
        else if (ordem === 'preco_asc') sorted = filtered.sort((a: any, b: any) => a.preco - b.preco);
        else if (ordem === 'preco_desc') sorted = filtered.sort((a: any, b: any) => b.preco - a.preco);
      }

      const total = sorted.length;
      const paginatedCodes = sorted.slice((page - 1) * limit, page * limit).map((p: any) => p.codigo);

      // Fetch full data only for the paginated codes
      const produtos = await prisma.catProduto.findMany({
        where: { codigo: { in: paginatedCodes } },
        include: {
          departamento: true,
          categoria: true,
          imagens: { orderBy: [{ principal: 'desc' }, { ordem: 'asc' }] },
        },
      });

      // Preserve order from paginatedCodes
      const byCode = new Map(produtos.map((p: any) => [p.codigo, p]));
      const ordered = paginatedCodes.map((c: string) => byCode.get(c)).filter(Boolean);

      return NextResponse.json({
        produtos: ordered,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // FAST PATH: no special filters — use DB-level pagination (SQL OFFSET/LIMIT)
    let orderBy: any = { nome: 'asc' };
    if (ordem === 'nome_desc') orderBy = { nome: 'desc' };
    else if (ordem === 'preco_asc') orderBy = { preco: 'asc' };
    else if (ordem === 'preco_desc') orderBy = { preco: 'desc' };

    const [total, produtos] = await Promise.all([
      prisma.catProduto.count({ where }),
      prisma.catProduto.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          departamento: true,
          categoria: true,
          imagens: { orderBy: [{ principal: 'desc' }, { ordem: 'asc' }] },
        },
      }),
    ]);

    return NextResponse.json({
      produtos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Produtos GET error:', error);
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codigo, nome, preco, precoOriginal, departamentoId, categoriaId, subcategoriaId, badges } = body ?? {};
    if (!codigo || !nome || preco === undefined || !departamentoId || !categoriaId) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
    }
    const produto = await prisma.catProduto.create({
      data: {
        codigo: String(codigo),
        nome,
        preco: parseFloat(preco),
        precoOriginal: precoOriginal ? parseFloat(precoOriginal) : null,
        departamentoId: parseInt(departamentoId, 10),
        categoriaId: parseInt(categoriaId, 10),
        subcategoriaId: subcategoriaId ? parseInt(subcategoriaId, 10) : null,
        badges: badges ?? [],
        ativo: true,
      },
      include: { departamento: true, categoria: true },
    });
    return NextResponse.json(produto, { status: 201 });
  } catch (error: any) {
    console.error('Produto POST error:', error);
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
}
