export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [acoes, lancamentos, links, pagamentos, procedimentos] = await Promise.all([
      prisma.catAcao.findMany({ where: { ativa: true }, orderBy: { createdAt: 'desc' } }),
      prisma.catLancamento.findMany({ orderBy: { dataPrevista: 'asc' } }),
      prisma.catLink.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } }),
      prisma.catPagamento.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } }),
      prisma.catProcedimento.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } }),
    ]);
    return NextResponse.json({ acoes, lancamentos, links, pagamentos, procedimentos });
  } catch (error: any) {
    console.error('Central error:', error);
    return NextResponse.json({ acoes: [], lancamentos: [], links: [], pagamentos: [], procedimentos: [] }, { status: 500 });
  }
}
