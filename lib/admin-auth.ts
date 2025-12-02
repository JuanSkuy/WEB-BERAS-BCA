import { getSession } from "./auth";
import { sql } from "./db";

export async function isAdmin(): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session) return false;
    
    const result = await sql`
      select role from users where id = ${session.userId} limit 1
    `;
    const user = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    return user?.role === "admin";
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  const admin = await isAdmin();
  if (!admin) {
    throw new Error("Admin access required");
  }
}

