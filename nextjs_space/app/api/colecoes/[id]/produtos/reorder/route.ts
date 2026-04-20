import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params: { id } }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { items } = body; // Array of { produtoCodigo, ordem }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items invalidos' },
        { status: 400 }
      );
    }

    // Verify collection exists
    const colecao = await prisma.catColecao.findUnique({
      where: { id },
    });

    if (!colecao) {
      return NextResponse.json(
        { error: 'Colecao nao encontrada' },
        { status: 404 }
      );
    }

    // Update all products' order in batch
    const updatePromises = items.map((item: { produtoCodigo: string; ordem: number }) =>
      prisma.catColecaoProduto.update({
        where: {
          colecaoId_produtoCodigo: {
            colecaoId: id,
            produtoCodigo: item.produtoCodigo,
          },
        },
        data: {
          ordem: item.ordem,
        },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Ordem atualizada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao reordenar produtos:', error);
    return NextResponse.json(
      { error: 'Erro ao reordenar produtos' },
      { status: 500 }
    );
  }
}
