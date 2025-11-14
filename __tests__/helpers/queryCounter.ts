import { DataSource } from 'typeorm';

/**
 * Query counter for detecting N+1 query problems in tests
 * Wraps TypeORM's query method to count and log SQL queries
 */
export class QueryCounter {
  private originalQuery: any;
  private queryCount = 0;
  private queries: string[] = [];
  private enabled = false;

  constructor(private dataSource: DataSource) { }

  /**
   * Start counting queries
   */
  start(): void {
    if (this.enabled) {
      throw new Error('QueryCounter is already started');
    }

    if (!this.dataSource) {
      throw new Error('QueryCounter: dataSource is undefined');
    }

    if (!this.dataSource.driver) {
      throw new Error(`QueryCounter: dataSource.driver is undefined. DataSource initialized: ${this.dataSource.isInitialized}`);
    }

    this.reset();
    this.enabled = true;

    // Store original query method - use manager.query as it's more stable
    const queryMethod = this.dataSource.manager.query.bind(this.dataSource.manager);
    this.originalQuery = queryMethod;

    // Replace with our spy
    this.dataSource.manager.query = async (...args: any[]) => {
      if (this.enabled) {
        this.queryCount++;
        if (args[0]) {
          this.queries.push(args[0]);
        }
      }
      return this.originalQuery(...args);
    };
  }

  /**
   * Stop counting queries and restore original method
   */
  stop(): void {
    if (!this.enabled) {
      return;
    }

    this.enabled = false;

    if (this.originalQuery) {
      // Restore the original query method
      this.dataSource.manager.query = this.originalQuery;
    }
  }

  /**
   * Reset counter without stopping
   */
  reset(): void {
    this.queryCount = 0;
    this.queries = [];
  }

  /**
   * Get current query count
   */
  getCount(): number {
    return this.queryCount;
  }

  /**
   * Get all executed queries
   */
  getQueries(): string[] {
    return [...this.queries];
  }

  /**
   * Print all queries to console (useful for debugging)
   */
  printQueries(): void {
    this.queries.forEach((query, index) => {
      console.log(`\n${index + 1}. ${query}`);
    });
  }

  /**
   * Assert query count is within expected range
   */
  assertCount(expected: number, message?: string): void {
    const actual = this.getCount();
    if (actual !== expected) {
      this.printQueries();
      throw new Error(
        message ||
        `Expected ${expected} queries but executed ${actual} queries. ` +
        `This might indicate an N+1 query problem!`
      );
    }
  }

  /**
   * Assert query count is less than or equal to maximum
   */
  assertMaxCount(max: number, message?: string): void {
    const actual = this.getCount();
    if (actual > max) {
      this.printQueries();
      throw new Error(
        message ||
        `Expected at most ${max} queries but executed ${actual} queries. ` +
        `This might indicate an N+1 query problem!`
      );
    }
  }

  /**
   * Assert no queries were executed
   */
  assertNoQueries(message?: string): void {
    this.assertCount(0, message || 'Expected no queries to be executed');
  }
}

/**
 * Create a query counter for testing
 */
export function createQueryCounter(dataSource: DataSource): QueryCounter {
  return new QueryCounter(dataSource);
}

/**
 * Execute a function while counting queries
 * Returns both the result and query count
 */
export async function withQueryCounter<T>(
  dataSource: DataSource,
  fn: () => Promise<T>
): Promise<{ result: T; queryCount: number; queries: string[] }> {
  const counter = createQueryCounter(dataSource);

  counter.start();

  try {
    const result = await fn();
    return {
      result,
      queryCount: counter.getCount(),
      queries: counter.getQueries(),
    };
  } finally {
    counter.stop();
  }
}
