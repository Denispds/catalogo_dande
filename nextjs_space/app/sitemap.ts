import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default function sitemap(): MetadataRoute.Sitemap {
  const headersList = headers();
  const host = headersList.get('x-forwarded-host') ?? 'localhost:3000';
  const protocol = host?.includes?.('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/central`, lastModified: new Date() },
    { url: `${baseUrl}/colecoes`, lastModified: new Date() },
  ];
}
