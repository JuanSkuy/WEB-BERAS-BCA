import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, sql } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch orders with their items
    const orders = await sql`
      SELECT 
        o.id,
        o.user_id,
        o.total_cents,
        o.shipping_cost_cents,
        o.status,
        o.created_at,
        o.updated_at,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'quantity', oi.quantity,
            'price_cents', oi.price_cents
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ${session.userId}
      GROUP BY o.id, o.user_id, o.total_cents, o.shipping_cost_cents, o.status, o.created_at, o.updated_at
      ORDER BY o.created_at DESC
    `;

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing orderId or status" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify order belongs to user
    const orderResult = await sql`
      SELECT id FROM orders WHERE id = ${orderId} AND user_id = ${session.userId}
    `;

    const orders = Array.isArray(orderResult) ? orderResult : [];
    if (orders.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status
    await sql`
      UPDATE orders 
      SET status = ${status}, updated_at = now()
      WHERE id = ${orderId}
    `;

    return NextResponse.json(
      { message: "Order status updated" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
