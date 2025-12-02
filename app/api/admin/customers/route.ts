import { NextRequest, NextResponse } from "next/server";
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

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const { id, email, name } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (email != null) {
      updates.push(`email = $${idx++}`);
      values.push(String(email).toLowerCase().trim());
    }
    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(String(id));
    const setSql = updates.join(", ");
    const result = await sql(
      `update users set ${setSql} where id = $${idx} and role = 'user' returning id, email, name, created_at`,
      values
    );
    const customer = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    
    if (!customer) {
      return NextResponse.json({ error: "Customer not found or cannot be updated" }, { status: 404 });
    }
    
    return NextResponse.json({ customer });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();
    await ensureSchema();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    // Check if customer has orders
    const ordersCheck = await sql`
      select count(*)::int as count
      from orders
      where user_id = ${id}
    `;
    const orderCount = Array.isArray(ordersCheck) 
      ? ordersCheck[0]?.count || 0 
      : (ordersCheck as any).rows?.[0]?.count || 0;

    if (orderCount > 0) {
      return NextResponse.json({ 
        error: "Cannot delete customer with existing orders. Please delete orders first." 
      }, { status: 400 });
    }

    // Delete customer (only if role is 'user')
    const result = await sql`
      delete from users 
      where id = ${id} and role = 'user'
      returning id
    `;
    
    const deleted = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    
    if (!deleted) {
      return NextResponse.json({ error: "Customer not found or cannot be deleted" }, { status: 404 });
    }

    return NextResponse.json({ message: "Customer deleted successfully" });
  } catch (error: any) {
    if (error.message === "Admin access required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error?.message ?? "Server error" }, { status: 500 });
  }
}

