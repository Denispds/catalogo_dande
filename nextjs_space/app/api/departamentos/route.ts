export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const departamentos = await prisma.catDepartamento.findMany({
      where: { ativo: true },
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(departamentos);
  } catch (error: any) {
    console.error('Departamentos error:', error);
    return NextResponse.json([], { status: 500 });
  }
}
