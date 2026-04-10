export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { codigo: string } }) {
  try {
    const produto = await prisma.catProduto.findUnique({
      where: { codigo: params?.codigo },
      include: {
        departamento: true,
        categoria: true,
        subcategoria: true,
        imagens: { orderBy: { ordem: 'asc' } },
      },
    });
    if (!produto) return NextResponse.json({ error: 'Produto n\u00e3o encontrado' }, { status: 404 });
    return NextResponse.json(produto);
  } catch (error: any) {
    console.error('Produto GET error:', error);
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { codigo: string } }) {
  try {
    const body = await request.json();
    const { nome, preco, precoOriginal, departamentoId, categoriaId, subcategoriaId, badges, ativo } = body ?? {};
    const data: any = {};
    if (nome !== undefined) data.nome = nome;
    if (preco !== undefined) data.preco = parseFloat(preco);
    if (precoOriginal !== undefined) data.precoOriginal = precoOriginal ? parseFloat(precoOriginal) : null;
    if (departamentoId !== undefined) data.departamentoId = parseInt(departamentoId, 10);
    if (categoriaId !== undefined) data.categoriaId = parseInt(categoriaId, 10);
    if (subcategoriaId !== undefined) data.subcategoriaId = subcategoriaId ? parseInt(subcategoriaId, 10) : null;
    if (badges !== undefined) data.badges = badges;
    if (ativo !== undefined) data.ativo = ativo;

    const produto = await prisma.catProduto.update({
      where: { codigo: params?.codigo },
      data,
      include: { departamento: true, categoria: true },
    });
    return NextResponse.json(produto);
  } catch (error: any) {
    console.error('Produto PUT error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { codigo: string } }) {
  try {
    await prisma.catProduto.delete({ where: { codigo: params?.codigo } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Produto DELETE error:', error);
    return NextResponse.json({ error: 'Erro ao deletar produto' }, { status: 500 });
  }
}
