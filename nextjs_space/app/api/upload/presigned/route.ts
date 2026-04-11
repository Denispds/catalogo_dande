export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUploadUrl, getFileUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, contentType, isPublic } = body ?? {};
    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName e contentType obrigatórios' }, { status: 400 });
    }
    const isPublicFlag = isPublic ?? true;
    const result = await generatePresignedUploadUrl(fileName, contentType, isPublicFlag);
    const publicUrl = await getFileUrl(result.cloud_storage_path, isPublicFlag);
    return NextResponse.json({ ...result, publicUrl });
  } catch (error: any) {
    console.error('Upload presigned error:', error);
    return NextResponse.json({ error: 'Erro ao gerar URL' }, { status: 500 });
  }
}
