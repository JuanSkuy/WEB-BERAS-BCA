import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-init";

export async function GET() {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const result = await sql`
      select 
        u.id, u.email, u.name, u.created_at,
        count(distinct o.id)::int as total_orders,
        coalesce(sum(case when o.status != 'cancelled' then o.total_cents else 0 end), 0)::bigint as total_spent
      from users u
      left join orders o on u.id = o.user_id
      where u.role = 'user'
      group by u.id, u.email, u.name, u.created_at
      order by u.created_at desc
    `;
    const customers = Array.isArray(result) ? result : (result as any).rows ?? [];
    return NextResponse.json({ customers });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

