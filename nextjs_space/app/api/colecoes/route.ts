export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';
    const colecoes = await prisma.catColecao.findMany({
      where: all ? {} : { ativa: true },
      orderBy: { createdAt: 'desc' },
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
    return NextResponse.json(colecoes);
  } catch (error: any) {
    console.error('Colecoes error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, descricao, cor } = body ?? {};
    if (!nome) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    const colecao = await prisma.catColecao.create({
      data: { nome, descricao: descricao ?? '', cor: cor ?? '#E91E8C', ativa: true },
    });
    return NextResponse.json(colecao, { status: 201 });
  } catch (error: any) {
    console.error('Colecao POST error:', error);
    return NextResponse.json({ error: 'Erro ao criar coleção' }, { status: 500 });
  }
}
