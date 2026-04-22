export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Simple in-memory LRU cache (scoped per Node process)
// In production with multiple instances this acts as a per-instance buffer;
// the Cache-Control header below plus CDN/browser caching handle global reuse.
const CACHE_MAX_ITEMS = 200;
const imageCache = new Map<string, { buffer: Buffer; contentType: string; ts: number }>();

function getFromCache(key: string) {
  const entry = imageCache.get(key);
  if (!entry) return null;
  // LRU bump
  imageCache.delete(key);
  imageCache.set(key, entry);
  return entry;
}

function putInCache(key: string, buffer: Buffer, contentType: string) {
  if (imageCache.size >= CACHE_MAX_ITEMS) {
    const oldestKey = imageCache.keys().next().value;
    if (oldestKey) imageCache.delete(oldestKey);
  }
  imageCache.set(key, { buffer, contentType, ts: Date.now() });
}

// Allowed hosts for security
const ALLOWED_HOSTS = [
  '.s3.us-west-2.amazonaws.com',
  '.s3.amazonaws.com',
  '.amazonaws.com',
  '.supabase.co',
  '.supabase.in',
  'images.unsplash.com',
  '.googleusercontent.com',
  '.cloudfront.net',
  '.cdn.digitaloceanspaces.com',
  '.abacusai.app',
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_HOSTS.some((host) => {
      if (host.startsWith('.')) return parsed.hostname.endsWith(host);
      return parsed.hostname === host;
    });
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const widthParam = request.nextUrl.searchParams.get('w');
  const qualityParam = request.nextUrl.searchParams.get('q');
  const format = (request.nextUrl.searchParams.get('f') ?? 'webp').toLowerCase();

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  if (!isAllowedUrl(url)) {
    // Graceful fallback: redirect to original for unknown hosts
    // (useful for legacy/imported URLs from various sources)
    return NextResponse.redirect(url, { status: 302 });
  }

  const width = widthParam ? Math.max(32, Math.min(2048, parseInt(widthParam, 10))) : 640;
  const quality = qualityParam ? Math.max(10, Math.min(100, parseInt(qualityParam, 10))) : 78;

  const cacheKey = `${url}|w=${width}|q=${quality}|f=${format}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached.buffer), {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Cache': 'HIT',
      },
    });
  }

  try {
    const originRes = await fetch(url, { cache: 'no-store' });
    if (!originRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch origin' }, { status: 502 });
    }
    const originBuf = Buffer.from(await originRes.arrayBuffer());

    let pipeline = sharp(originBuf, { failOn: 'none' })
      .rotate() // respect EXIF orientation
      .resize({ width, withoutEnlargement: true, fit: 'inside' });

    let outContentType = 'image/webp';
    if (format === 'avif') {
      pipeline = pipeline.avif({ quality, effort: 4 });
      outContentType = 'image/avif';
    } else if (format === 'jpeg' || format === 'jpg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      outContentType = 'image/jpeg';
    } else {
      pipeline = pipeline.webp({ quality, effort: 4 });
      outContentType = 'image/webp';
    }

    const outBuf = await pipeline.toBuffer();
    putInCache(cacheKey, outBuf, outContentType);

    return new NextResponse(new Uint8Array(outBuf), {
      headers: {
        'Content-Type': outContentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Cache': 'MISS',
        'X-Original-Size': String(originBuf.length),
        'X-Optimized-Size': String(outBuf.length),
      },
    });
  } catch (err: any) {
    console.error('Image optimization error:', err?.message);
    // Fallback: redirect to original
    return NextResponse.redirect(url, { status: 302 });
  }
}
