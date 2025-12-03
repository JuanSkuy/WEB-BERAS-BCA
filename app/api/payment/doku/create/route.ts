import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createDokuPayment, DokuPaymentRequest } from "@/lib/doku";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-init";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

    const body = await req.json();
    const { order_id, customer_info } = body;

    if (!order_id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Get order details
    const orderResult = await sql`
      SELECT id, total_cents, shipping_cost_cents, status, created_at
      FROM orders
      WHERE id = ${order_id} AND user_id = ${session.userId}
    `;
    const orderRows = Array.isArray(orderResult) ? orderResult : (orderResult as any).rows ?? [];
    const order = orderRows[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: "Order is not pending" }, { status: 400 });
    }

    // Calculate amount in IDR (convert from cents)
    const amount = Math.round(order.total_cents / 100);

    // Generate invoice number from order ID
    const invoiceNumber = `INV-${order.id.substring(0, 8).toUpperCase()}-${Date.now()}`;

    // Get base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'http://localhost:3000';

    // Prepare Doku payment request
    const paymentRequest: DokuPaymentRequest = {
      order: {
        invoice_number: invoiceNumber,
        amount: amount,
        currency: 'IDR',
      },
      customer: {
        id: session.userId,
        name: customer_info?.name || 'Customer',
        email: customer_info?.email || session.email,
        phone: customer_info?.phone || '',
        address: customer_info?.address,
        city: customer_info?.city,
        postal_code: customer_info?.postal,
      },
      payment: {
        payment_due_date: 60, // 60 minutes
      },
      url: {
        notify_url: `${baseUrl}/api/payment/doku/notify`,
        redirect_url: `${baseUrl}/checkout/success?order_id=${order.id}`,
        callback_url: `${baseUrl}/checkout/callback?order_id=${order.id}`,
      },
    };

    // Create payment with Doku
    const dokuResponse = await createDokuPayment(paymentRequest);

    if (dokuResponse.status.code !== 'SUCCESS') {
      return NextResponse.json(
        { error: dokuResponse.status.message || 'Failed to create payment' },
        { status: 400 }
      );
    }

    // Save payment info to database
    const paymentUrl = dokuResponse.response.result.payment_url;
    const expiredDate = dokuResponse.response.result.expired_date;

    // Update order with payment info
    await sql`
      UPDATE orders
      SET 
        payment_method = 'doku',
        payment_invoice_number = ${invoiceNumber},
        payment_url = ${paymentUrl},
        payment_expired_at = ${expiredDate}::timestamptz,
        updated_at = now()
      WHERE id = ${order.id}
    `;

    return NextResponse.json({
      success: true,
      payment_url: paymentUrl,
      invoice_number: invoiceNumber,
      expired_date: expiredDate,
    });
  } catch (err: any) {
    console.error("Doku payment creation error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

