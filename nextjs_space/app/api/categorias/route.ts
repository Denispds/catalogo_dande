export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departamentoId = searchParams.get('departamento');

    const where: any = { ativo: true };
    if (departamentoId) {
      where.departamentoId = Number(departamentoId);
    }

    const categorias = await prisma.catCategoria.findMany({
      where,
      orderBy: { ordem: 'asc' },
      include: { subcategorias: { where: { ativo: true } } },
    });
    return NextResponse.json(categorias);
  } catch (error: any) {
    console.error('Categorias error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
