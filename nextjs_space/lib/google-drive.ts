import { google, drive_v3 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive'];

export function getDriveClient(): drive_v3.Drive {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

/**
 * Lista todas as imagens recursivamente numa pasta do Drive,
 * excluindo subpastas com nome "Concluidas".
 */
export async function listImagesRecursive(
  drive: drive_v3.Drive,
  folderId: string,
  excludeFolderNames: string[] = ['Concluidas']
): Promise<DriveFile[]> {
  const allFiles: DriveFile[] = [];

  // Listar tudo na pasta (arquivos + subpastas)
  let pageToken: string | undefined;
  const items: drive_v3.Schema$File[] = [];

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, parents)',
      pageSize: 1000,
      pageToken,
    });
    if (res.data.files) items.push(...res.data.files);
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  for (const item of items) {
    if (item.mimeType === 'application/vnd.google-apps.folder') {
      // Pular pasta "Concluidas"
      if (excludeFolderNames.some(n => item.name?.includes(n))) continue;
      // Recursar em subpastas
      const subFiles = await listImagesRecursive(drive, item.id!, excludeFolderNames);
      allFiles.push(...subFiles);
    } else if (item.mimeType?.startsWith('image/')) {
      allFiles.push({
        id: item.id!,
        name: item.name!,
        mimeType: item.mimeType!,
        parents: item.parents as string[] | undefined,
      });
    }
  }

  return allFiles;
}

/**
 * Baixa um arquivo do Drive como Buffer.
 */
export async function downloadFile(
  drive: drive_v3.Drive,
  fileId: string
): Promise<Buffer> {
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(res.data as ArrayBuffer);
}

/**
 * Extrai código do produto a partir do nome do arquivo.
 * Padrões suportados:
 * - "119157-1.png" → 119157
 * - "187500.Mídia.png" → 187500
 * - "180420 (1).png" → 180420
 * - "Colar - 187580.png" → 187580
 * - "179543-10-04-26.jpg" (Concluidas) → 179543
 */
export function extractProductCode(filename: string): string | null {
  // Remove extensão
  const name = filename.replace(/\.[^.]+$/, '');

  // Padrão 1: começa com 4-7 dígitos seguidos de separador
  const m1 = name.match(/^(\d{4,7})(?:[-._\s(]|$)/);
  if (m1) return m1[1];

  // Padrão 2: "Descrição - CÓDIGO" ou "Descrição CÓDIGO"
  const m2 = name.match(/[\s-]+(\d{4,7})$/);
  if (m2) return m2[1];

  // Padrão 3: código após " - " no meio
  const m3 = name.match(/\s-\s(\d{4,7})/);
  if (m3) return m3[1];

  return null;
}

/**
 * Move arquivo para a pasta "Concluidas".
 */
export async function moveToFolder(
  drive: drive_v3.Drive,
  fileId: string,
  currentParentId: string,
  targetFolderId: string
): Promise<void> {
  await drive.files.update({
    fileId,
    addParents: targetFolderId,
    removeParents: currentParentId,
  });
}

/**
 * Encontra ou cria a subpasta "Concluidas" dentro de uma pasta.
 */
export async function findOrCreateConcluidasFolder(
  drive: drive_v3.Drive,
  parentFolderId: string
): Promise<string> {
  // Procurar existente
  const res = await drive.files.list({
    q: `'${parentFolderId}' in parents and name = 'Concluidas' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  // Criar se não existir
  const folder = await drive.files.create({
    requestBody: {
      name: 'Concluidas',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
  });

  return folder.data.id!;
}
