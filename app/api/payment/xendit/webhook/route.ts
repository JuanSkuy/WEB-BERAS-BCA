import { NextRequest, NextResponse } from "next/server";
import { verifyXenditWebhook, XenditWebhookPayload } from "@/lib/xendit";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-init";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();

    const callbackToken = process.env.XENDIT_CALLBACK_TOKEN;
    const webhookToken = req.headers.get('x-callback-token');

    // Log for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Xendit webhook received');
      console.log('Headers:', {
        'x-callback-token': webhookToken ? 'present' : 'missing',
      });
    }

    // Verify webhook token if configured
    if (callbackToken && webhookToken) {
      const isValid = verifyXenditWebhook(webhookToken, callbackToken);
      if (!isValid) {
        console.error("Invalid Xendit webhook token");
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'development') {
      // In development, log if token verification is skipped
      console.log('Webhook token verification skipped (not configured)');
    }

    // Get webhook payload
    const payload: XenditWebhookPayload = await req.json();

    // Process webhook
    const invoiceId = payload.id; // Xendit invoice ID
    const externalId = payload.external_id;
    const paymentStatus = payload.status;
    const amount = payload.amount;
    const paidAmount = payload.paid_amount || 0;

    // Find order by external_id (payment_invoice_number) or invoice ID
    const orderResult = await sql`
      SELECT id, total_cents, status
      FROM orders
      WHERE payment_invoice_number = ${externalId}
         OR payment_channel = ${invoiceId}
    `;
    const orderRows = Array.isArray(orderResult) ? orderResult : (orderResult as any).rows ?? [];
    const order = orderRows[0];

    if (!order) {
      console.error(`Order not found for invoice_id: ${invoiceId}, external_id: ${externalId}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status based on payment status
    let newStatus = order.status;
    if (paymentStatus === 'PAID') {
      newStatus = 'processing';
    } else if (paymentStatus === 'EXPIRED') {
      newStatus = 'cancelled';
    }
    // PENDING status doesn't change order status

    // Update order
    await sql`
      UPDATE orders
      SET 
        status = ${newStatus},
        payment_status = ${paymentStatus},
        payment_status_date = ${payload.paid_at || payload.updated}::timestamptz,
        updated_at = now()
      WHERE id = ${order.id}
    `;

    // Log webhook
    console.log(`Xendit webhook processed: ${externalId} - ${paymentStatus}`);

    return NextResponse.json({ status: 'success' });
  } catch (err: any) {
    console.error("Xendit webhook error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

