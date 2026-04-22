import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import CollectionCatalogClient from './_components/collection-catalog-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const colecao = await prisma.catColecao.findFirst({
    where: { slug: params.slug, ativa: true },
    include: { produtos: true },
  });
  if (!colecao) return { title: 'Coleção não encontrada' };
  
  const prodCount = colecao.produtos?.length ?? 0;
  const ogImage = colecao.imagemCapa || undefined;
  
  return {
    title: `${colecao.nome} - Dande Acessórios`,
    description: colecao.descricao || `Confira nossa coleção ${colecao.nome} com ${prodCount} produtos exclusivos. Atacado de acessórios femininos.`,
    openGraph: {
      title: `Coleção: ${colecao.nome}`,
      description: colecao.descricao || `Coleção exclusiva Dande Acessórios - ${prodCount} produtos`,
      images: ogImage ? [{ url: ogImage, alt: colecao.nome }] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Coleção: ${colecao.nome}`,
      description: colecao.descricao || `Coleção exclusiva Dande Acessórios`,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const colecao = await prisma.catColecao.findFirst({
    where: { slug: params.slug, ativa: true },
    select: { id: true, nome: true, slug: true, descricao: true, cor: true, imagemCapa: true },
  });

  if (!colecao) {
    notFound();
  }

  return <CollectionCatalogClient colecao={colecao} />;
}
