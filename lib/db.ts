import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Ensure required environment variables are present
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL env var for Neon Postgres");
}

// Create a Neon HTTP client and Drizzle instance
const neonClient: NeonQueryFunction<boolean, boolean> = neon(databaseUrl);
export const db = drizzle(neonClient);

// Helper to run raw SQL when needed (schema/init)
export const sql = neonClient;


