import { DataSource } from "typeorm";
import { BaseEntity } from "@base/db/index.js";

export interface SearchOptions {
  query: string;
  fields?: string[];
  limit?: number;
  offset?: number;
  orderBy?: "rank" | "createdAt" | "updatedAt";
}

export class SearchHelper {
  /**
   * Sanitize and prepare FTS5 MATCH query
   */
  private static prepareMatchQuery(query: string): string {
    // Escape double quotes by doubling them (FTS5 syntax)
    const sanitized = query.replace(/"/g, '""');
    // Wrap in quotes for phrase matching
    return `"${sanitized}"`;
  }

  /**
   * Get total count of matching documents
   */
  private static async getMatchCount(
    dataSource: DataSource,
    ftsTable: string,
    matchQuery: string
  ): Promise<number> {
    const [{ total }] = await dataSource.query(
      `SELECT COUNT(*) as total FROM ${ftsTable} WHERE ${ftsTable} MATCH ?`,
      [matchQuery]
    );
    return parseInt(total);
  }

  static async search<T extends BaseEntity>(
    dataSource: DataSource,
    entityClass: new () => T,
    tableName: string,
    options: SearchOptions
  ): Promise<{ results: T[]; total: number }> {
    const { query, limit = 20, offset = 0, orderBy = "rank" } = options;

    const ftsTable = `${tableName}_fts`;
    const matchQuery = this.prepareMatchQuery(query);

    // Use raw SQL for FTS5 queries (TypeORM query builder doesn't handle FTS well)
    const selectClause = orderBy === "rank" ? "SELECT entity.*, fts.rank" : "SELECT entity.*";
    const orderClause = orderBy === "rank" ? "ORDER BY fts.rank ASC" : `ORDER BY entity.${orderBy} DESC`;

    const rawResults = await dataSource.query(
      `
      ${selectClause}
      FROM ${tableName} entity
      INNER JOIN ${ftsTable} fts ON entity.id = fts.id
      WHERE ${ftsTable} MATCH ?
      ${orderClause}
      LIMIT ? OFFSET ?
      `,
      [matchQuery, limit, offset]
    );

    const total = await this.getMatchCount(dataSource, ftsTable, matchQuery);

    // Convert raw results to entity instances
    const results = rawResults.map((row: any) => {
      const entity = new entityClass();
      Object.assign(entity, row);
      return entity;
    });

    return { results, total };
  }

  static async searchWithHighlights<T extends BaseEntity>(
    dataSource: DataSource,
    entityClass: new () => T,
    tableName: string,
    options: SearchOptions
  ): Promise<{
    results: (T & { highlights?: Record<string, string> })[];
    total: number;
  }> {
    const { query, limit = 20, offset = 0 } = options;
    const ftsTable = `${tableName}_fts`;
    const matchQuery = this.prepareMatchQuery(query);

    const rawResults = await dataSource.query(
      `
      SELECT
        entity.*,
        snippet(fts, 1, '<mark>', '</mark>', '...', 32) as title_highlight,
        snippet(fts, 2, '<mark>', '</mark>', '...', 64) as content_highlight,
        rank
      FROM ${tableName} entity
      INNER JOIN ${ftsTable} fts ON entity.id = fts.id
      WHERE ${ftsTable} MATCH ?
      ORDER BY rank ASC
      LIMIT ? OFFSET ?
      `,
      [matchQuery, limit, offset]
    );

    const total = await this.getMatchCount(dataSource, ftsTable, matchQuery);

    const results = rawResults.map((row: any) => {
      const entity = new entityClass();
      Object.assign(entity, row);
      // Add highlights as a separate property, not directly on the entity
      return {
        ...entity,
        highlights: {
          title: row.title_highlight,
          content: row.content_highlight,
        }
      };
    });

    return { results, total };
  }
}