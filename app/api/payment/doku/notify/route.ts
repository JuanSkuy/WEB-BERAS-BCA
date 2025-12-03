import { NextRequest, NextResponse } from "next/server";
import { verifyDokuSignature, DokuNotification } from "@/lib/doku";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/schema-init";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();

    const clientId = process.env.DOKU_CLIENT_ID;
    const secretKey = process.env.DOKU_SECRET_KEY;

    if (!clientId || !secretKey) {
      console.error("Doku credentials not configured");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // Get headers
    const requestId = req.headers.get('Request-Id') || '';
    const requestTimestamp = req.headers.get('Request-Timestamp') || '';
    const signature = req.headers.get('Signature') || '';

    if (!requestId || !requestTimestamp || !signature) {
      return NextResponse.json({ error: "Missing required headers" }, { status: 400 });
    }

    // Get request body
    const requestBody = await req.text();
    const notification: DokuNotification = JSON.parse(requestBody);

    // Extract signature from header (format: HMACSHA256=signature)
    const signatureValue = signature.replace('HMACSHA256=', '');

    // Verify signature
    const requestTarget = req.nextUrl.pathname;
    const isValid = verifyDokuSignature(
      signatureValue,
      clientId,
      requestId,
      requestTarget,
      requestTimestamp,
      requestBody,
      secretKey
    );

    if (!isValid) {
      console.error("Invalid Doku signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Process notification
    const invoiceNumber = notification.order.invoice_number;
    const paymentStatus = notification.payment.payment_status;
    const amount = notification.order.amount;

    // Find order by invoice number
    const orderResult = await sql`
      SELECT id, total_cents, status
      FROM orders
      WHERE payment_invoice_number = ${invoiceNumber}
    `;
    const orderRows = Array.isArray(orderResult) ? orderResult : (orderResult as any).rows ?? [];
    const order = orderRows[0];

    if (!order) {
      console.error(`Order not found for invoice: ${invoiceNumber}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status based on payment status
    let newStatus = order.status;
    if (paymentStatus === 'SUCCESS') {
      newStatus = 'processing';
    } else if (paymentStatus === 'FAILED') {
      newStatus = 'cancelled';
    }
    // PENDING status doesn't change order status

    // Update order
    await sql`
      UPDATE orders
      SET 
        status = ${newStatus},
        payment_status = ${paymentStatus},
        payment_channel = ${notification.payment.payment_channel || null},
        payment_code = ${notification.payment.payment_code || null},
        payment_status_date = ${notification.payment.payment_status_date || null}::timestamptz,
        updated_at = now()
      WHERE id = ${order.id}
    `;

    // Log notification
    console.log(`Doku notification processed: ${invoiceNumber} - ${paymentStatus}`);

    return NextResponse.json({
      response: {
        result: "SUCCESS",
      },
      status: {
        code: "2000000",
        message: "Success",
      },
    });
  } catch (err: any) {
    console.error("Doku notification error:", err);
    return NextResponse.json(
      {
        response: {
          result: "FAILED",
        },
        status: {
          code: "5000000",
          message: err?.message ?? "Server error",
        },
      },
      { status: 500 }
    );
  }
}

