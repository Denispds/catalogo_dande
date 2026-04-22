import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = headers();
  const host = headersList.get('x-forwarded-host') ?? 'localhost:3000';
  const protocol = host?.includes?.('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const colecoes = await prisma.catColecao.findMany({
    where: { ativa: true, slug: { not: null } },
    select: { slug: true, updatedAt: true },
  });

  const staticRoutes = [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/central`, lastModified: new Date() },
    { url: `${baseUrl}/colecoes`, lastModified: new Date() },
  ];

  const collectionRoutes = colecoes.map((c: any) => ({
    url: `${baseUrl}/colecoes/${c?.slug}`,
    lastModified: c?.updatedAt ?? new Date(),
  }));

  return [...staticRoutes, ...collectionRoutes];
}
