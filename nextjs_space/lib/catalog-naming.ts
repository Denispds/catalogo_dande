/**
 * Gera o nome automático para o catálogo baseado em filtros
 * Prioridade: Coleção > Departamento + Categoria > Departamento > Categoria > Padrão
 */
export function generateCatalogName(
  colecao?: string,
  departamento?: string,
  categoria?: string
): string {
  // Se tem nome de coleção, usa ele (prioridade máxima)
  if (colecao && colecao.trim()) {
    return colecao.trim();
  }

  // Se tem departamento e categoria, combina
  if (departamento && categoria) {
    return `${departamento} - ${categoria}`;
  }

  // Se tem só departamento
  if (departamento) {
    return departamento;
  }

  // Se tem só categoria
  if (categoria) {
    return categoria;
  }

  // Padrão quando não há nenhum filtro
  return 'Catálogo Completo';
}

/**
 * Sanitiza o nome do arquivo removendo caracteres especiais
 * e adicionando timestamp
 */
export function sanitizeFilename(
  name: string,
  extension: 'html' | 'pdf' = 'pdf'
): string {
  // Remove/substitui caracteres especiais
  const sanitized = name
    .normalize('NFD') // Decomposição Unicode
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '_') // Substitui espaços por underscore
    .replace(/_+/g, '_') // Remove underscores múltiplos
    .toLowerCase()
    .slice(0, 50); // Limita a 50 caracteres

  // Adiciona data e hora
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  return `${sanitized}_${dateStr}.${extension}`;
}

/**
 * Formata o nome para exibição (sem timestamp)
 * Útil para preview no modal
 */
export function formatCatalogNameForDisplay(name: string): string {
  return name
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1 $2') // CamelCase para espaços
    .replace(/_/g, ' '); // Underscores para espaços
}
