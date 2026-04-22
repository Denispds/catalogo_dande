export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Novo cadastro de usuários está desativado.' },
    { status: 403 }
  );
}
