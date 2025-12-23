/**
 * Database Query Optimization Utilities
 * Best practices for efficient database queries
 */

/**
 * Query optimization strategies
 */
export const dbOptimization = {
  /**
   * Pagination helper - prevents large result sets
   */
  paginate: (page: number = 1, limit: number = 20) => {
    const offset = (page - 1) * limit;
    return {
      limit: Math.min(limit, 100), // Max 100 items per page
      offset,
      page,
    };
  },

  /**
   * Select only needed fields - reduces data transfer
   */
  selectFields: (fields: string[]) => {
    return fields.join(',');
  },

  /**
   * Build efficient WHERE clause
   */
  buildWhere: (conditions: Record<string, any>) => {
    return Object.entries(conditions)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key} = '${value}'`)
      .join(' AND ');
  },

  /**
   * Add indexes hint (for SQL databases)
   */
  useIndex: (indexName: string) => {
    return `USE INDEX (${indexName})`;
  },

  /**
   * Batch operations helper
   */
  batch: <T>(items: T[], batchSize: number = 100): T[][] => {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  },
};

/**
 * Recommended database indexes for common queries
 */
export const recommendedIndexes = {
  products: [
    'CREATE INDEX idx_products_category ON products(category_id)',
    'CREATE INDEX idx_products_store ON products(store_id)',
    'CREATE INDEX idx_products_status ON products(status)',
    'CREATE INDEX idx_products_created ON products(created_at)',
    'CREATE INDEX idx_products_price ON products(price)',
  ],
  orders: [
    'CREATE INDEX idx_orders_user ON orders(user_id)',
    'CREATE INDEX idx_orders_status ON orders(status)',
    'CREATE INDEX idx_orders_date ON orders(created_at)',
    'CREATE INDEX idx_orders_store ON orders(store_id)',
  ],
  users: [
    'CREATE INDEX idx_users_email ON users(email)',
    'CREATE INDEX idx_users_status ON users(status)',
  ],
  stores: [
    'CREATE INDEX idx_stores_status ON stores(status)',
    'CREATE INDEX idx_stores_location ON stores(latitude, longitude)',
  ],
};

/**
 * Query performance monitoring
 */
export class QueryPerformanceMonitor {
  private static queries: Map<string, number[]> = new Map();

  static start(queryId: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      const timings = this.queries.get(queryId) || [];
      timings.push(duration);
      this.queries.set(queryId, timings);
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`⚠️ Slow query detected: ${queryId} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  static getStats(queryId: string) {
    const timings = this.queries.get(queryId) || [];
    if (timings.length === 0) return null;

    const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
    const min = Math.min(...timings);
    const max = Math.max(...timings);

    return {
      count: timings.length,
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
    };
  }

  static getAllStats() {
    const stats: Record<string, any> = {};
    for (const [queryId] of this.queries) {
      stats[queryId] = this.getStats(queryId);
    }
    return stats;
  }
}

