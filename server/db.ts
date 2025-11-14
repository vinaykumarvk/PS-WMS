import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool: PostgresPool } = pkg;
import ws from "ws";
import * as schema from "@shared/schema";

// Configure neon to use websockets for serverless environments
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;
neonConfig.useSecureWebSocket = true;

// Exported symbols (assigned below based on env)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let pool: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let db: any;

/**
 * Construct Supabase Postgres connection string from environment variables
 */
function getSupabaseDatabaseUrl(): string | null {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  
  if (!supabaseUrl || !dbPassword) {
    return null;
  }

  // Extract project ref from Supabase URL
  // URL format: https://[project-ref].supabase.co
  const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  if (!urlMatch) {
    console.warn("[db] Could not extract project ref from SUPABASE_URL");
    return null;
  }

  const projectRef = urlMatch[1];
  
  // Use Supabase connection pooler (recommended for serverless)
  // Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  // For direct connection: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
  
  // Try to use pooler first (port 6543), fallback to direct connection (port 5432)
  // Note: Pooler URL requires region, so we'll use direct connection for simplicity
  return `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
}

// Get database connection string
let connectionString = process.env.DATABASE_URL;

// If DATABASE_URL is not set, try to construct it from Supabase credentials
if (!connectionString) {
  connectionString = getSupabaseDatabaseUrl();
  
  if (connectionString) {
    // eslint-disable-next-line no-console
    console.log("[db] Using Supabase Postgres connection string");
  } else {
    // Supabase-only mode (no direct DB access)
    // eslint-disable-next-line no-console
    console.warn("[db] DATABASE_URL not set and Supabase DB password not provided. Running in Supabase SDK-only mode.");
    pool = {
      query: () => { throw new Error("Postgres pool disabled. Use Supabase SDK endpoints."); }
    };
    db = {};
  }
}

if (connectionString) {
  // Determine if this is a Supabase connection (db.*.supabase.co) or Neon/other
  const isSupabaseConnection = connectionString.includes('supabase.co');
  
  if (isSupabaseConnection) {
    // Use standard Postgres adapter for Supabase
    // eslint-disable-next-line no-console
    console.log("[db] Using standard Postgres adapter for Supabase");
    pool = new PostgresPool({ 
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
      allowExitOnIdle: false,
    });
    pool.on('error', (err: unknown) => {
      // eslint-disable-next-line no-console
      console.error('Database pool error:', err);
    });
    db = drizzlePostgres(pool, { schema });
  } else {
    // Use Neon serverless adapter for Neon or other serverless Postgres
    // eslint-disable-next-line no-console
    console.log("[db] Using Neon serverless adapter");
    pool = new Pool({ 
      connectionString,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      max: 10,
      allowExitOnIdle: false
    });
    pool.on('error', (err: unknown) => {
      // eslint-disable-next-line no-console
      console.error('Database pool error:', err);
    });
    db = drizzleNeon(pool, { schema });
  }
}