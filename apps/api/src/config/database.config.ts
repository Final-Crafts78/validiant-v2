/**
 * Database Configuration
 * 
 * PostgreSQL database connection using pg (node-postgres) with connection pooling.
 * Provides connection management, transaction helpers, and health checks.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env, isProduction } from './env.config';
import { logger } from '../utils/logger';

/**
 * Database connection pool
 */
let pool: Pool | null = null;

/**
 * Initialize database connection pool
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      min: env.DATABASE_POOL_MIN,
      max: env.DATABASE_POOL_MAX,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: isProduction ? { rejectUnauthorized: false } : undefined,
    });

    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    logger.info('✅ Database connection established', {
      timestamp: result.rows[0].now,
      poolSize: `${env.DATABASE_POOL_MIN}-${env.DATABASE_POOL_MAX}`,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('❌ Unexpected database pool error', { error: err.message });
    });

    // Handle pool connection events
    pool.on('connect', () => {
      logger.debug('New database client connected to pool');
    });

    pool.on('remove', () => {
      logger.debug('Database client removed from pool');
    });
  } catch (error) {
    logger.error('❌ Failed to initialize database', { error });
    throw error;
  }
};

/**
 * Get database pool instance
 */
export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase() first.');
  }
  return pool;
};

/**
 * Execute a query
 */
export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const result = await getPool().query<T>(text, params);
    const duration = Date.now() - start;

    logger.debug('Database query executed', {
      text: text.substring(0, 100),
      duration: `${duration}ms`,
      rows: result.rowCount,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database query failed', {
      text: text.substring(0, 100),
      duration: `${duration}ms`,
      error,
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
export const getClient = async (): Promise<PoolClient> => {
  return await getPool().connect();
};

/**
 * Transaction helper
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 */
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Check database health
 */
export const checkDatabaseHealth = async (): Promise<{
  status: 'up' | 'down';
  latency?: number;
  error?: string;
}> => {
  const start = Date.now();
  try {
    await query('SELECT 1');
    const latency = Date.now() - start;
    return { status: 'up', latency };
  } catch (error) {
    return {
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Close database connection pool
 */
export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
};

/**
 * Database query builder helpers
 */
export const db = {
  /**
   * Execute raw SQL query
   */
  raw: query,

  /**
   * Execute query and return first row
   */
  one: async <T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<T | null> => {
    const result = await query<T>(text, params);
    return result.rows[0] || null;
  },

  /**
   * Execute query and return all rows
   */
  many: async <T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<T[]> => {
    const result = await query<T>(text, params);
    return result.rows;
  },

  /**
   * Check if record exists
   */
  exists: async (text: string, params?: any[]): Promise<boolean> => {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(${text})`,
      params
    );
    return result.rows[0]?.exists || false;
  },

  /**
   * Get count of records
   */
  count: async (text: string, params?: any[]): Promise<number> => {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM (${text}) as subquery`,
      params
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  },

  /**
   * Insert and return inserted row
   */
  insert: async <T extends QueryResultRow = any>(
    table: string,
    data: Record<string, any>
  ): Promise<T> => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');

    const text = `
      INSERT INTO ${table} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await query<T>(text, values);
    return result.rows[0];
  },

  /**
   * Update and return updated row
   */
  update: async <T extends QueryResultRow = any>(
    table: string,
    id: string,
    data: Record<string, any>
  ): Promise<T | null> => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    const text = `
      UPDATE ${table}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;

    const result = await query<T>(text, [...values, id]);
    return result.rows[0] || null;
  },

  /**
   * Delete record
   */
  delete: async (table: string, id: string): Promise<boolean> => {
    const text = `DELETE FROM ${table} WHERE id = $1`;
    const result = await query(text, [id]);
    return (result.rowCount || 0) > 0;
  },

  /**
   * Soft delete (set deleted_at timestamp)
   */
  softDelete: async (table: string, id: string): Promise<boolean> => {
    const text = `
      UPDATE ${table}
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await query(text, [id]);
    return (result.rowCount || 0) > 0;
  },
};

/**
 * Graceful shutdown handler
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database connections...');
  await closeDatabase();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing database connections...');
  await closeDatabase();
});
