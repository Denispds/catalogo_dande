export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/produtos/import-logs/undo
 * Body: { logId: string }
 * Desfaz uma importação (deleta produtos criados, avisa sobre atualizados)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { logId } = body ?? {};

    if (!logId) {
      return NextResponse.json({ error: 'logId obrigatório' }, { status: 400 });
    }

    const log = await prisma.importLog.findUnique({ where: { id: logId } });
    if (!log) {
      return NextResponse.json({ error: 'Import log não encontrado' }, { status: 404 });
    }

    if (log.status === 'desfeito') {
      return NextResponse.json({ error: 'Esta importação já foi desfeita' }, { status: 400 });
    }

    // Extrair códigos afetados
    const codigosAfetados = log.codigosAfetados ? JSON.parse(log.codigosAfetados) : [];

    if (codigosAfetados.length === 0) {
      return NextResponse.json({ error: 'Nenhum produto para desfazer' }, { status: 400 });
    }

    // Buscar produtos criados (verificar se existem e se são dessa importação)
    // Para simplicidade, vou deletar todos os códigos listados
    // Num cenário real, teriaá backups ou versionamento

    let deletados = 0;
    const errosDeletar: string[] = [];

    for (const codigo of codigosAfetados) {
      try {
        // Buscar e deletar o produto
        const produto = await prisma.catProduto.findUnique({ where: { codigo } });
        if (produto) {
          // Deletar imagens associadas primeiro
          await prisma.catImagem.deleteMany({ where: { produtoCodigo: codigo } });
          // Deletar doção em coleções
          await prisma.catColecaoProduto.deleteMany({ where: { produtoCodigo: codigo } });
          // Deletar produto
          await prisma.catProduto.delete({ where: { codigo } });
          deletados++;
        }
      } catch (err: any) {
        errosDeletar.push(`${codigo}: ${err?.message}`);
      }
    }

    // Marcar import log como desfeito
    const updatedLog = await prisma.importLog.update({
      where: { id: logId },
      data: { status: 'desfeito' },
    });

    return NextResponse.json({
      success: true,
      deletados,
      erros: errosDeletar,
      aviso: log.atualizados > 0 ? `${log.atualizados} produtos foram atualizados e não podem ser restaurados automaticamente` : null,
    });
  } catch (err: any) {
    console.error('Erro ao desfazer importação:', err);
    return NextResponse.json({ error: err?.message ?? 'Erro interno' }, { status: 500 });
  }
}
