import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function loadJson(filePath: string): any[] {
  try {
    const fullPath = path.resolve(filePath);
    const data = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(data);
  } catch (e: any) {
    console.error(`Error loading ${filePath}:`, e?.message);
    return [];
  }
}

async function main() {
  const MIGRATION_DIR = '/home/ubuntu/catalogo_dande_migration';

  // 1. Seed admin user
  console.log('Seeding admin user...');
  const hashedPassword = await bcrypt.hash('johndoe123', 10);
  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: { email: 'john@doe.com', password: hashedPassword, name: 'Admin', role: 'admin' },
  });

  // 2. Seed departamentos
  console.log('Seeding departamentos...');
  const departamentos = loadJson(`${MIGRATION_DIR}/supabase_data/departamentos.json`);
  for (const d of departamentos) {
    await prisma.catDepartamento.upsert({
      where: { id: d.id },
      update: { nome: d.nome, ativo: d.ativo ?? true },
      create: { id: d.id, nome: d.nome, ativo: d.ativo ?? true },
    });
  }
  console.log(`  ${departamentos.length} departamentos`);

  // 3. Seed categorias
  console.log('Seeding categorias...');
  const categorias = loadJson(`${MIGRATION_DIR}/supabase_data/categorias.json`);
  for (const c of categorias) {
    await prisma.catCategoria.upsert({
      where: { id: c.id },
      update: { nome: c.nome, ativo: c.ativo ?? true, ordem: c.ordem ?? 0 },
      create: { id: c.id, nome: c.nome, ativo: c.ativo ?? true, ordem: c.ordem ?? 0 },
    });
  }
  console.log(`  ${categorias.length} categorias`);

  // 4. Seed subcategorias
  console.log('Seeding subcategorias...');
  const subcategorias = loadJson(`${MIGRATION_DIR}/supabase_data/subcategorias.json`);
  for (const s of subcategorias) {
    await prisma.catSubcategoria.upsert({
      where: { id: s.id },
      update: { nome: s.nome, categoriaId: s.categoria_id, ativo: s.ativo ?? true },
      create: { id: s.id, nome: s.nome, categoriaId: s.categoria_id, ativo: s.ativo ?? true },
    });
  }
  console.log(`  ${subcategorias.length} subcategorias`);

  // 5. Seed produtos (Supabase priority, then SQL-only)
  console.log('Seeding produtos from Supabase...');
  const produtosSB = loadJson(`${MIGRATION_DIR}/supabase_data/produtos.json`);
  const produtosSQL = loadJson(`${MIGRATION_DIR}/sql_data/produtos_import.json`);

  // Build set of SB codes
  const sbCodes = new Set(produtosSB.map((p: any) => String(p.codigo)));

  // Find SQL-only products
  const sqlOnly = produtosSQL.filter((p: any) => !sbCodes.has(String(p.codigo)));
  console.log(`  Supabase: ${produtosSB.length}, SQL-only: ${sqlOnly.length}`);

  // Batch upsert in chunks to avoid timeout
  const BATCH_SIZE = 15;
  const allProdutos = [
    ...produtosSB.map((p: any) => ({
      codigo: String(p.codigo),
      nome: p.nome ?? '',
      preco: p.preco ?? 0,
      precoOriginal: p.preco_original ?? null,
      departamentoId: p.departamento_id ?? 1,
      categoriaId: p.categoria_id ?? 1,
      subcategoriaId: p.subcategoria_id ?? null,
      badges: p.badges ?? [],
      ativo: p.ativo ?? true,
    })),
    ...sqlOnly.map((p: any) => ({
      codigo: String(p.codigo),
      nome: p.nome ?? '',
      preco: p.preco ?? 0,
      precoOriginal: null,
      departamentoId: p.departamento_id ?? 1,
      categoriaId: p.categoria_id ?? 1,
      subcategoriaId: null,
      badges: [],
      ativo: p.ativo ?? true,
    })),
  ];

  for (let i = 0; i < allProdutos.length; i += BATCH_SIZE) {
    const batch = allProdutos.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((p: any) =>
        prisma.catProduto.upsert({
          where: { codigo: p.codigo },
          update: { nome: p.nome, preco: p.preco, precoOriginal: p.precoOriginal, departamentoId: p.departamentoId, categoriaId: p.categoriaId, subcategoriaId: p.subcategoriaId, badges: p.badges, ativo: p.ativo },
          create: p,
        })
      )
    );
    if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= allProdutos.length) {
      console.log(`  Produtos: ${Math.min(i + BATCH_SIZE, allProdutos.length)}/${allProdutos.length}`);
    }
  }

  // 6. Seed imagens
  console.log('Seeding imagens...');
  const imagens = loadJson(`${MIGRATION_DIR}/supabase_data/imagens.json`);
  for (const img of imagens) {
    await prisma.catImagem.upsert({
      where: { id: img.id },
      update: { url: img.url, principal: img.principal ?? false, ordem: img.ordem ?? 0 },
      create: {
        id: img.id,
        produtoCodigo: String(img.produto_codigo),
        url: img.url ?? '',
        principal: img.principal ?? false,
        ordem: img.ordem ?? 0,
        isPublic: true,
      },
    });
  }
  console.log(`  ${imagens.length} imagens`);

  // 7. Seed colecoes
  console.log('Seeding colecoes...');
  const colecoes = loadJson(`${MIGRATION_DIR}/supabase_data/colecoes.json`);
  for (const col of colecoes) {
    await prisma.catColecao.upsert({
      where: { id: col.id },
      update: { nome: col.nome, descricao: col.descricao ?? '', cor: col.cor ?? '#E91E8C', ativa: col.ativa ?? true },
      create: { id: col.id, nome: col.nome, descricao: col.descricao ?? '', cor: col.cor ?? '#E91E8C', ativa: col.ativa ?? true },
    });
  }
  console.log(`  ${colecoes.length} colecoes`);

  // 8. Seed colecao_produtos
  console.log('Seeding colecao_produtos...');
  const colProdutos = loadJson(`${MIGRATION_DIR}/supabase_data/colecao_produtos.json`);
  for (const cp of colProdutos) {
    try {
      await prisma.catColecaoProduto.upsert({
        where: { colecaoId_produtoCodigo: { colecaoId: cp.colecao_id, produtoCodigo: String(cp.produto_codigo) } },
        update: { ordem: cp.ordem ?? 0 },
        create: { colecaoId: cp.colecao_id, produtoCodigo: String(cp.produto_codigo), ordem: cp.ordem ?? 0 },
      });
    } catch (e: any) {
      console.log(`  Skip colecao_produto: ${cp.colecao_id} / ${cp.produto_codigo}`);
    }
  }
  console.log(`  ${colProdutos.length} colecao_produtos`);

  // 9. Seed acoes
  console.log('Seeding acoes...');
  const acoes = loadJson(`${MIGRATION_DIR}/supabase_data/acoes.json`);
  for (const a of acoes) {
    await prisma.catAcao.upsert({
      where: { id: a.id },
      update: { titulo: a.titulo, descricao: a.descricao, dataInicio: a.data_inicio ? new Date(a.data_inicio) : null, dataFim: a.data_fim ? new Date(a.data_fim) : null, ativa: a.ativa ?? true, tipo: a.tipo ?? 'promo' },
      create: { id: a.id, titulo: a.titulo, descricao: a.descricao ?? '', dataInicio: a.data_inicio ? new Date(a.data_inicio) : null, dataFim: a.data_fim ? new Date(a.data_fim) : null, ativa: a.ativa ?? true, tipo: a.tipo ?? 'promo' },
    });
  }
  console.log(`  ${acoes.length} acoes`);

  // 10. Seed lancamentos
  console.log('Seeding lancamentos...');
  const lancamentos = loadJson(`${MIGRATION_DIR}/supabase_data/lancamentos.json`);
  for (const l of lancamentos) {
    await prisma.catLancamento.upsert({
      where: { id: l.id },
      update: { titulo: l.titulo, descricao: l.descricao, dataPrevista: l.data_prevista ? new Date(l.data_prevista) : null, status: l.status ?? 'planejado' },
      create: { id: l.id, titulo: l.titulo, descricao: l.descricao ?? '', dataPrevista: l.data_prevista ? new Date(l.data_prevista) : null, status: l.status ?? 'planejado' },
    });
  }
  console.log(`  ${lancamentos.length} lancamentos`);

  // 11. Seed links
  console.log('Seeding links...');
  const links = loadJson(`${MIGRATION_DIR}/supabase_data/links.json`);
  for (const lk of links) {
    await prisma.catLink.upsert({
      where: { id: lk.id },
      update: { titulo: lk.titulo, url: lk.url, icone: lk.icone, descricao: lk.descricao, ordem: lk.ordem ?? 0, ativo: lk.ativo ?? true },
      create: { id: lk.id, titulo: lk.titulo, url: lk.url, icone: lk.icone ?? '', descricao: lk.descricao ?? '', ordem: lk.ordem ?? 0, ativo: lk.ativo ?? true },
    });
  }
  console.log(`  ${links.length} links`);

  // 12. Seed pagamentos
  console.log('Seeding pagamentos...');
  const pagamentos = loadJson(`${MIGRATION_DIR}/supabase_data/pagamentos.json`);
  for (const pg of pagamentos) {
    await prisma.catPagamento.upsert({
      where: { id: pg.id },
      update: { metodo: pg.metodo, condicao: pg.condicao, desconto: pg.desconto, observacao: pg.observacao, ordem: pg.ordem ?? 0, ativo: pg.ativo ?? true },
      create: { id: pg.id, metodo: pg.metodo, condicao: pg.condicao ?? '', desconto: pg.desconto ?? '', observacao: pg.observacao ?? '', ordem: pg.ordem ?? 0, ativo: pg.ativo ?? true },
    });
  }
  console.log(`  ${pagamentos.length} pagamentos`);

  // 13. Seed procedimentos
  console.log('Seeding procedimentos...');
  const procedimentos = loadJson(`${MIGRATION_DIR}/supabase_data/procedimentos.json`);
  for (const pr of procedimentos) {
    await prisma.catProcedimento.upsert({
      where: { id: pr.id },
      update: { titulo: pr.titulo, conteudo: pr.conteudo, icone: pr.icone, ordem: pr.ordem ?? 0, ativo: pr.ativo ?? true },
      create: { id: pr.id, titulo: pr.titulo, conteudo: pr.conteudo ?? '', icone: pr.icone ?? '', ordem: pr.ordem ?? 0, ativo: pr.ativo ?? true },
    });
  }
  console.log(`  ${procedimentos.length} procedimentos`);

  console.log('\n✅ Seed completo!');
}

main()
  .catch((e: any) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
