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

    // Se comImagem=true, mostrar APENAS produtos com imagem (independente de busca)
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

    // Determine if we need to sort by image date
    const sortByImageDate = ordem === 'recente' || ordem === 'antigo';

    let orderBy: any = { nome: 'asc' };
    if (!sortByImageDate) {
      if (ordem === 'nome_desc') orderBy = { nome: 'desc' };
      else if (ordem === 'preco_asc') orderBy = { preco: 'asc' };
      else if (ordem === 'preco_desc') orderBy = { preco: 'desc' };
    }

    const total = await prisma.catProduto.count({ where });
    
    // Fetch all matching products with their images for proper sorting
    const allProdutos = await prisma.catProduto.findMany({
      where,
      include: {
        departamento: true,
        categoria: true,
        imagens: { orderBy: [{ principal: 'desc' }, { ordem: 'asc' }] },
      },
    });

    // Sort by image date if needed
    let sorted = allProdutos;
    if (sortByImageDate) {
      sorted = allProdutos.sort((a: any, b: any) => {
        // Get the most recent image date for each product
        const aImageDate = a.imagens && a.imagens.length > 0 
          ? new Date(a.imagens[0].createdAt).getTime()
          : new Date(a.createdAt).getTime();
        const bImageDate = b.imagens && b.imagens.length > 0
          ? new Date(b.imagens[0].createdAt).getTime()
          : new Date(b.createdAt).getTime();
        
        return ordem === 'recente' 
          ? bImageDate - aImageDate  // Most recent first
          : aImageDate - bImageDate;  // Oldest first
      });
    } else {
      // Apply other sorting options
      if (ordem === 'nome_asc') {
        sorted = sorted.sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR'));
      } else if (ordem === 'nome_desc') {
        sorted = sorted.sort((a: any, b: any) => b.nome.localeCompare(a.nome, 'pt-BR'));
      } else if (ordem === 'preco_asc') {
        sorted = sorted.sort((a: any, b: any) => a.preco - b.preco);
      } else if (ordem === 'preco_desc') {
        sorted = sorted.sort((a: any, b: any) => b.preco - a.preco);
      }
    }

    // Apply pagination
    const produtos = sorted.slice((page - 1) * limit, page * limit);

    // Apply discount filter in-memory (complex calc)
    let filtered = produtos;
    if (descontoMin) {
      const minDisc = parseFloat(descontoMin);
      filtered = produtos.filter((p: any) => {
        if (!p?.precoOriginal || p.precoOriginal <= 0) return false;
        const disc = ((p.precoOriginal - p.preco) / p.precoOriginal) * 100;
        return disc >= minDisc;
      });
    }

    return NextResponse.json({
      produtos: filtered,
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
