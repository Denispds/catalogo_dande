export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import {
  getDriveClient,
  listImagesRecursive,
  downloadFile,
  extractProductCode,
  moveToFolder,
  findOrCreateConcluidasFolder,
  DriveFile,
} from '@/lib/google-drive';
import { uploadBuffer } from '@/lib/s3';

interface SyncResult {
  total: number;
  added: number;
  skipped: number;
  errors: number;
  details: { file: string; status: string; code?: string; error?: string }[];
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      return NextResponse.json({ error: 'GOOGLE_DRIVE_FOLDER_ID não configurado' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const shouldMove = body.moveToConclued !== false; // default true

    const drive = getDriveClient();

    // 1. Listar todas as imagens (excluindo "Concluidas")
    console.log('[sync-drive] Listando imagens do Drive...');
    const files = await listImagesRecursive(drive, folderId);
    console.log(`[sync-drive] ${files.length} imagens encontradas`);

    // 2. Buscar todos os driveFileIds já importados
    const existingImports = await prisma.catImagem.findMany({
      where: { driveFileId: { not: null } },
      select: { driveFileId: true },
    });
    const importedIds = new Set(existingImports.map(i => i.driveFileId));

    // 3. Buscar todos os códigos de produtos existentes
    const allProducts = await prisma.catProduto.findMany({
      select: { codigo: true },
    });
    const productCodes = new Set(allProducts.map(p => p.codigo));

    // 4. Encontrar/criar pasta Concluidas
    let concluidasFolderId: string | null = null;
    if (shouldMove) {
      concluidasFolderId = await findOrCreateConcluidasFolder(drive, folderId);
    }

    const result: SyncResult = { total: files.length, added: 0, skipped: 0, errors: 0, details: [] };

    // 5. Processar cada arquivo
    for (const file of files) {
      try {
        // Já importado?
        if (importedIds.has(file.id)) {
          result.skipped++;
          result.details.push({ file: file.name, status: 'já importado', code: extractProductCode(file.name) ?? undefined });
          continue;
        }

        // Extrair código
        const code = extractProductCode(file.name);
        if (!code) {
          result.skipped++;
          result.details.push({ file: file.name, status: 'código não encontrado' });
          continue;
        }

        // Produto existe?
        if (!productCodes.has(code)) {
          result.skipped++;
          result.details.push({ file: file.name, status: 'produto não encontrado', code });
          continue;
        }

        // Pular HEIF (browsers não suportam)
        if (file.mimeType === 'image/heif' || file.mimeType === 'image/heic') {
          result.skipped++;
          result.details.push({ file: file.name, status: 'formato HEIF não suportado', code });
          continue;
        }

        // Baixar do Drive
        console.log(`[sync-drive] Baixando: ${file.name}`);
        const buffer = await downloadFile(drive, file.id);

        // Upload para S3
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const s3FileName = `drive-${code}-${file.id}.${ext}`;
        const { url, cloud_storage_path } = await uploadBuffer(buffer, s3FileName, file.mimeType, true);

        // Verificar se produto já tem imagens (para definir principal)
        const existingCount = await prisma.catImagem.count({
          where: { produtoCodigo: code },
        });

        // Criar registro no banco
        await prisma.catImagem.create({
          data: {
            produtoCodigo: code,
            url,
            cloudStoragePath: cloud_storage_path,
            isPublic: true,
            principal: existingCount === 0, // primeira imagem = principal
            ordem: existingCount,
            driveFileId: file.id,
          },
        });

        // Mover para Concluidas
        if (shouldMove && concluidasFolderId && file.parents?.[0]) {
          try {
            await moveToFolder(drive, file.id, file.parents[0], concluidasFolderId);
          } catch (moveErr) {
            console.warn(`[sync-drive] Erro ao mover ${file.name}:`, moveErr);
          }
        }

        result.added++;
        result.details.push({ file: file.name, status: 'importado', code });
        importedIds.add(file.id); // evitar duplicata no mesmo batch

      } catch (fileErr: any) {
        result.errors++;
        result.details.push({ file: file.name, status: 'erro', error: fileErr.message });
        console.error(`[sync-drive] Erro processando ${file.name}:`, fileErr);
      }
    }

    console.log(`[sync-drive] Concluído: ${result.added} adicionadas, ${result.skipped} puladas, ${result.errors} erros`);
    return NextResponse.json(result);

  } catch (err: any) {
    console.error('[sync-drive] Erro geral:', err);
    return NextResponse.json({ error: err.message || 'Erro ao sincronizar' }, { status: 500 });
  }
}
