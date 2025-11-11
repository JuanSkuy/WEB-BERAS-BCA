import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const res = await sql`select id, email, password_hash from users where lower(trim(email)) = ${normalizedEmail} limit 1`;
  const user = (res as any)[0];
  if (!user) {
    return NextResponse.json({ normalizedEmail, userFound: false });
  }
  let storedHash = String(user.password_hash || "").trim();
  if (storedHash.startsWith("$2y$")) storedHash = storedHash.replace("$2y$", "$2b$");
  const supplied = String(password || "");
  const compare = await bcrypt.compare(supplied, storedHash);
  const compareTrimmed = await bcrypt.compare(supplied.trim(), storedHash);
  return NextResponse.json({ normalizedEmail, userFound: true, compare, compareTrimmed });
}

export async function GET() {
  const res = await sql`select count(*)::int as count from users`;
  const count = (res as any)[0]?.count ?? 0;
  return NextResponse.json({ users: count });
}


