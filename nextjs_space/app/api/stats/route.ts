export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [totalProdutos, totalDepts, totalCats, totalColecoes] = await Promise.all([
      prisma.catProduto.count({ where: { ativo: true } }),
      prisma.catDepartamento.count({ where: { ativo: true } }),
      prisma.catCategoria.count({ where: { ativo: true } }),
      prisma.catColecao.count({ where: { ativa: true } }),
    ]);
    return NextResponse.json({ totalProdutos, totalDepts, totalCats, totalColecoes });
  } catch (error: any) {
    return NextResponse.json({ totalProdutos: 0, totalDepts: 0, totalCats: 0, totalColecoes: 0 });
  }
}
