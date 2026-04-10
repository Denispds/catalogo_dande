export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categorias = await prisma.catCategoria.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
      include: { subcategorias: { where: { ativo: true } } },
    });
    return NextResponse.json(categorias);
  } catch (error: any) {
    console.error('Categorias error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
