import fs from 'fs';
import path from 'path';
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

class DatabaseConnection {
  private mode: 'sqlite' | 'postgres';
  private sqliteDb: SqlJsDatabase | null = null;
  private sqlitePath: string;
  private pgPool: pg.Pool | null = null;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.mode = (process.env.DATABASE_MODE as 'sqlite' | 'postgres') || 'sqlite';
    this.sqlitePath = process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), 'data', 'synora.db');
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      if (this.mode === 'postgres' && process.env.DATABASE_URL) {
        try {
          this.pgPool = new pg.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
          });
          // Test connection
          const client = await this.pgPool.connect();
          client.release();
          console.log('[DB] Connected to PostgreSQL / Supabase successfully');
          this.initialized = true;
          return;
        } catch (err) {
          console.warn('[DB] PostgreSQL connection failed, falling back to local SQLite:', (err as Error).message);
          this.mode = 'sqlite';
        }
      }

      // SQLite fallback via sql.js (WebAssembly)
      const dataDir = path.dirname(this.sqlitePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const SQL = await initSqlJs();
      if (fs.existsSync(this.sqlitePath)) {
        const fileBuffer = fs.readFileSync(this.sqlitePath);
        this.sqliteDb = new SQL.Database(fileBuffer);
        console.log(`[DB] Loaded persistent SQLite database from: ${this.sqlitePath}`);
      } else {
        this.sqliteDb = new SQL.Database();
        console.log(`[DB] Created new SQLite database file at: ${this.sqlitePath}`);
        this.save();
      }

      // Enable foreign keys
      this.sqliteDb.run('PRAGMA foreign_keys = ON;');
      this.initialized = true;
    })();

    return this.initPromise;
  }

  public save(): void {
    if (this.sqliteDb && this.mode === 'sqlite') {
      try {
        const data = this.sqliteDb.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(this.sqlitePath, buffer);
      } catch (err) {
        console.error('[DB] Failed to save SQLite database to disk:', err);
      }
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    await this.initialize();

    if (this.mode === 'postgres' && this.pgPool) {
      // Normalize parameter markers to $1, $2 if ? was used
      let paramIndex = 1;
      const normalizedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      const res = await this.pgPool.query(normalizedSql, params);
      return res.rows as T[];
    }

    if (!this.sqliteDb) {
      throw new Error('SQLite database not initialized');
    }

    // SQLite mode: Convert $1, $2 to ? if needed
    const normalizedSql = sql.replace(/\$\d+/g, '?');

    // Prepare statement and execute
    try {
      const stmt = this.sqliteDb.prepare(normalizedSql);
      if (params.length > 0) {
        stmt.bind(params);
      }

      const rows: T[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as T;
        rows.push(row);
      }
      stmt.free();
      return rows;
    } catch (err) {
      console.error(`[DB Query Error] SQL: ${normalizedSql} | Params:`, params, err);
      throw err;
    }
  }

  public async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  public async execute(sql: string, params: any[] = []): Promise<{ changes: number }> {
    await this.initialize();

    if (this.mode === 'postgres' && this.pgPool) {
      let paramIndex = 1;
      const normalizedSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
      const res = await this.pgPool.query(normalizedSql, params);
      return { changes: res.rowCount || 0 };
    }

    if (!this.sqliteDb) {
      throw new Error('SQLite database not initialized');
    }

    const normalizedSql = sql.replace(/\$\d+/g, '?');
    try {
      this.sqliteDb.run(normalizedSql, params);
      const changesRes = this.sqliteDb.exec('SELECT changes() as c;');
      const changes = changesRes[0]?.values[0]?.[0] as number || 0;
      this.save();
      return { changes };
    } catch (err) {
      console.error(`[DB Execute Error] SQL: ${normalizedSql} | Params:`, params, err);
      throw err;
    }
  }

  public async transaction<T>(callback: () => Promise<T>): Promise<T> {
    await this.initialize();
    if (this.mode === 'postgres' && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback();
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }

    if (this.sqliteDb) {
      this.sqliteDb.run('BEGIN TRANSACTION;');
      try {
        const result = await callback();
        this.sqliteDb.run('COMMIT;');
        this.save();
        return result;
      } catch (err) {
        this.sqliteDb.run('ROLLBACK;');
        throw err;
      }
    }

    return callback();
  }

  public getMode(): 'sqlite' | 'postgres' {
    return this.mode;
  }
}

export const db = new DatabaseConnection();
