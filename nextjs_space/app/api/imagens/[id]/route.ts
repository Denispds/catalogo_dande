export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/s3';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const imagem = await prisma.catImagem.findUnique({ where: { id: params?.id } });
    if (!imagem) return NextResponse.json({ error: 'N\u00e3o encontrada' }, { status: 404 });
    if (imagem?.cloudStoragePath) {
      try { await deleteFile(imagem.cloudStoragePath); } catch (e: any) { console.error('S3 delete error:', e); }
    }
    await prisma.catImagem.delete({ where: { id: params?.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro ao deletar imagem' }, { status: 500 });
  }
}
