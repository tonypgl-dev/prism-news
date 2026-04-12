import type { Article, ClusterRow } from "@/types";

/** Sursa „Prisma News” pentru editoriale — articolele cu acest source_id nu intră în feed-ul de știri (evită dublarea cu rândurile editoriale). */
export const PRISMA_EDITORIAL_SOURCE_ID = "00000000-0000-0000-0001-000000000001";

export function excludePrismaEditorialFromNewsArticles(articles: Article[]): Article[] {
  return articles.filter((a) => a.source_id !== PRISMA_EDITORIAL_SOURCE_ID);
}

/** Rând care conține articol editorial Prisma (sursă dedicată), în orice coloană. */
export function isPrismaEditorialRow(row: ClusterRow): boolean {
  return [row.left, row.center, row.right].some(
    (a) => a?.source_id === PRISMA_EDITORIAL_SOURCE_ID
  );
}
