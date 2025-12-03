import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getXenditInvoice } from "@/lib/xendit";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-init";

export const runtime = "nodejs";

/**
 * Check payment status manually (useful for development without webhook)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Get order details
    const orderResult = await sql`
      SELECT id, payment_invoice_number, payment_status, status
      FROM orders
      WHERE id = ${order_id} AND user_id = ${session.userId}
    `;
    const orderRows = Array.isArray(orderResult) ? orderResult : (orderResult as any).rows ?? [];
    const order = orderRows[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.payment_invoice_number) {
      return NextResponse.json({ error: "No payment invoice found" }, { status: 400 });
    }

    // Get invoice from Xendit
    // Extract invoice ID from external_id or use payment_invoice_number
    // Note: We need to store Xendit invoice ID, for now we'll try to get by external_id
    // This is a limitation - ideally we should store Xendit invoice ID in database
    
    // For now, we'll update based on external_id pattern
    // In production, you should store Xendit invoice ID when creating invoice
    
    return NextResponse.json({
      order_id: order.id,
      payment_status: order.payment_status,
      order_status: order.status,
      message: "Use Xendit dashboard to check invoice status, or setup webhook for automatic updates",
    });
  } catch (err: any) {
    console.error("Check payment status error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

