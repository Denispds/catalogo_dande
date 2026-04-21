export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Slug obrigatório' }, { status: 400 });
    }
    const colecao = await prisma.catColecao.findFirst({
      where: { slug, ativa: true },
      include: {
        produtos: {
          orderBy: { ordem: 'asc' },
          include: {
            produto: {
              include: {
                departamento: true,
                categoria: true,
                imagens: { orderBy: [{ principal: 'desc' }, { ordem: 'asc' }] },
              },
            },
          },
        },
      },
    });
    if (!colecao) {
      return NextResponse.json({ error: 'Coleção não encontrada' }, { status: 404 });
    }
    return NextResponse.json(colecao);
  } catch (error: any) {
    console.error('GET colecao by slug error:', error);
    return NextResponse.json({ error: 'Erro ao buscar coleção' }, { status: 500 });
  }
}
