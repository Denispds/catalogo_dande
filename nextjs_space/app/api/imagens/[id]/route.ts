export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/s3';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const imagem = await prisma.catImagem.findUnique({ where: { id: params?.id } });
    if (!imagem) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
    if (imagem?.cloudStoragePath) {
      try { await deleteFile(imagem.cloudStoragePath); } catch (e: any) { console.error('S3 delete error:', e); }
    }
    await prisma.catImagem.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao deletar imagem' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { principal } = body ?? {};
    if (principal === true) {
      const imagem = await prisma.catImagem.findUnique({ where: { id: params?.id } });
      if (!imagem) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
      await prisma.catImagem.updateMany({
        where: { produtoCodigo: imagem.produtoCodigo, principal: true },
        data: { principal: false },
      });
      await prisma.catImagem.update({ where: { id: params.id }, data: { principal: true } });
    } else if (principal === false) {
      await prisma.catImagem.update({ where: { id: params.id }, data: { principal: false } });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Imagem PATCH error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}
