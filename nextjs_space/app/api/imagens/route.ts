export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produtoCodigo, url, cloudStoragePath, isPublic, principal, tipo, thumbnailUrl } = body ?? {};
    if (!produtoCodigo) {
      return NextResponse.json({ error: 'Código do produto obrigatório' }, { status: 400 });
    }
    if (principal) {
      await prisma.catImagem.updateMany({
        where: { produtoCodigo, principal: true },
        data: { principal: false },
      });
    }
    const maxOrdem = await prisma.catImagem.findFirst({
      where: { produtoCodigo },
      orderBy: { ordem: 'desc' },
    });
    const imagem = await prisma.catImagem.create({
      data: {
        produtoCodigo,
        url: url ?? '',
        cloudStoragePath: cloudStoragePath ?? null,
        isPublic: isPublic ?? true,
        principal: principal ?? false,
        ordem: (maxOrdem?.ordem ?? -1) + 1,
        tipo: tipo ?? 'image',
        thumbnailUrl: thumbnailUrl ?? null,
      },
    });
    return NextResponse.json(imagem, { status: 201 });
  } catch (error: any) {
    console.error('Imagem POST error:', error);
    return NextResponse.json({ error: 'Erro ao salvar imagem' }, { status: 500 });
  }
}
