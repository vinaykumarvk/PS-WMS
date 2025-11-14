import { config } from "dotenv";
import { resolve } from "path";

// Load .env file from root directory
config({ path: resolve(process.cwd(), ".env") });

// Verify database connection is configured
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const hasSupabaseCredentials = !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && !!process.env.SUPABASE_DB_PASSWORD;

if (!hasDatabaseUrl && !hasSupabaseCredentials) {
  console.warn("⚠️  Database connection not configured");
  console.warn("Please set either:");
  console.warn("  - DATABASE_URL (direct Postgres connection string), or");
  console.warn("  - SUPABASE_URL + SUPABASE_DB_PASSWORD (Supabase credentials)");
  console.warn("Current working directory:", process.cwd());
  console.warn("Looking for .env at:", resolve(process.cwd(), ".env"));
}
