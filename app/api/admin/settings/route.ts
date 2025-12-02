import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-init";

export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const result = await sql`select key, value from settings`;
    const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
    const settings: Record<string, string> = {};
    rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });
    return NextResponse.json({ settings });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const { key, value } = await req.json();
    if (!key) {
      return NextResponse.json({ error: "Key required" }, { status: 400 });
    }

    await sql`
      insert into settings (key, value)
      values (${String(key)}, ${value || null})
      on conflict (key) do update
      set value = excluded.value, updated_at = now()
    `;

    return NextResponse.json({ message: "Setting saved" });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

