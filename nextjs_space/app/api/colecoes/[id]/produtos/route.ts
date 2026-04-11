export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { produtoCodigo } = body ?? {};
    if (!produtoCodigo) return NextResponse.json({ error: 'Código do produto obrigatório' }, { status: 400 });
    const maxOrdem = await prisma.catColecaoProduto.findFirst({
      where: { colecaoId: params?.id },
      orderBy: { ordem: 'desc' },
    });
    await prisma.catColecaoProduto.create({
      data: {
        colecaoId: params?.id,
        produtoCodigo: String(produtoCodigo),
        ordem: (maxOrdem?.ordem ?? -1) + 1,
      },
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao adicionar produto' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url);
    const produtoCodigo = url.searchParams.get('produtoCodigo');
    if (!produtoCodigo) return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 });
    await prisma.catColecaoProduto.delete({
      where: { colecaoId_produtoCodigo: { colecaoId: params?.id, produtoCodigo } },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao remover produto' }, { status: 500 });
  }
}
