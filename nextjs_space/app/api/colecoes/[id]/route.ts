export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const colecao = await prisma.catColecao.findUnique({
      where: { id: params?.id },
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
    console.error('GET colecao error:', error);
    return NextResponse.json({ error: 'Erro ao buscar coleção' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { nome, descricao, cor, ativa } = body ?? {};
    const data: any = {};
    if (nome !== undefined) data.nome = nome;
    if (descricao !== undefined) data.descricao = descricao;
    if (cor !== undefined) data.cor = cor;
    if (ativa !== undefined) data.ativa = ativa;
    const colecao = await prisma.catColecao.update({ where: { id: params?.id }, data });
    return NextResponse.json(colecao);
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.catColecao.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
