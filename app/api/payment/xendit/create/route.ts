import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createXenditInvoice, XenditInvoiceRequest } from "@/lib/xendit";
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
    const { order_id, customer_info, items } = body;

    if (!order_id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    
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

    
    const amount = Math.round(order.total_cents / 100);
    
    
    if (amount < 10000) {
      return NextResponse.json(
        { error: "Minimum payment amount is Rp 10,000" },
        { status: 400 }
      );
    }

    
    const externalId = `ORDER-${order.id.substring(0, 8).toUpperCase()}-${Date.now()}`.substring(0, 64);

    
    
    
    let baseUrl = process.env.BASE_URL || 
                  process.env.NEXT_PUBLIC_BASE_URL ||
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    
    
    if (!baseUrl) {
      const host = req.headers.get('host');
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      if (host) {
        baseUrl = `${protocol}://${host}`;
      } else {
        
        baseUrl = 'http://localhost:3000';
      }
    }
    
    
    baseUrl = baseUrl.replace(/\/$/, '');
    
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Xendit create invoice request:', {
        baseUrl,
        amount,
        externalId,
        customer_email: customer_info?.email || session.email,
        env_BASE_URL: process.env.BASE_URL,
        env_NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        env_VERCEL_URL: process.env.VERCEL_URL,
      });
    }

    
    const customerName = customer_info?.name || 'Customer';
    const nameParts = customerName.trim().split(' ');
    const givenNames = nameParts[0] || 'Customer';
    const surname = nameParts.slice(1).join(' ') || '';

    
    const customerEmail = customer_info?.email || session.email;
    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      );
    }

    
    
    let itemsTotal = 0;
    const invoiceItems = items?.filter((item: any) => {
      const itemPrice = Math.round(Number(item.price) || 0);
      const itemQuantity = Math.round(Number(item.quantity) || 0);
      return item.name && itemQuantity > 0 && itemPrice > 0;
    }).map((item: any) => {
      const itemPrice = Math.round(Number(item.price) || 0);
      const itemQuantity = Math.round(Number(item.quantity) || 1);
      itemsTotal += itemPrice * itemQuantity;
      return {
        name: String(item.name || 'Product').substring(0, 255), 
        quantity: itemQuantity, 
        price: itemPrice, 
      };
    }) || [];

    
    if (invoiceItems.length > 0) {
      const itemsTotalRounded = Math.round(itemsTotal);
      const amountDiff = Math.abs(amount - itemsTotalRounded);
      if (amountDiff > 100) { 
        console.warn(`Items total (${itemsTotalRounded}) doesn't match order amount (${amount})`);
      }
    }

    
    
    const customerAddress = customer_info?.address && customer_info.address.trim() ? {
      street_line1: String(customer_info.address).trim().substring(0, 200),
      ...(customer_info.city ? { city: String(customer_info.city).trim().substring(0, 100) } : {}),
      ...(customer_info.postal ? { postal_code: String(customer_info.postal).trim().substring(0, 20) } : {}),
      country: 'ID',
    } : undefined;

    
    
    const invoiceRequest: any = {
      external_id: externalId,
      amount: amount,
      currency: 'IDR', 
      payer_email: customerEmail,
      description: `Pembayaran untuk Order #${order.id.substring(0, 8).toUpperCase()}`.substring(0, 255),
      invoice_duration: 86400, 
      customer: {
        given_names: givenNames.substring(0, 255),
        email: customerEmail,
      },
      success_redirect_url: `${baseUrl}/checkout/success?order_id=${order.id}`,
      failure_redirect_url: `${baseUrl}/checkout?error=payment_failed`,
    };

    
    if (surname) {
      invoiceRequest.customer.surname = surname.substring(0, 255);
    }
    if (customer_info?.phone) {
      const phone = String(customer_info.phone).replace(/\D/g, ''); 
      if (phone.length >= 10) {
        invoiceRequest.customer.mobile_number = phone.substring(0, 20);
      }
    }
    if (customerAddress) {
      invoiceRequest.customer.addresses = [customerAddress];
    }

    
    if (invoiceItems.length > 0) {
      invoiceRequest.items = invoiceItems;
    }

    
    const cleanRequest = JSON.parse(JSON.stringify(invoiceRequest, (key, value) => {
      
      if (value === undefined || value === null) {
        return undefined; 
      }
      
      if (Array.isArray(value) && value.length === 0) {
        return undefined;
      }
      return value;
    }));

    
    if (process.env.NODE_ENV === 'development') {
      console.log('Xendit invoice request payload:', JSON.stringify(cleanRequest, null, 2));
    }

    
    const xenditResponse = await createXenditInvoice(cleanRequest);

    
    
    await sql`
      UPDATE orders
      SET 
        payment_method = 'xendit',
        payment_invoice_number = ${externalId},
        payment_url = ${xenditResponse.invoice_url},
        payment_status = ${xenditResponse.status},
        payment_channel = ${xenditResponse.id}, -- Store Xendit invoice ID in payment_channel field
        payment_expired_at = ${xenditResponse.expiry_date}::timestamptz,
        updated_at = now()
      WHERE id = ${order.id}
    `;

    return NextResponse.json({
      success: true,
      payment_url: xenditResponse.invoice_url,
      invoice_id: xenditResponse.id,
      external_id: externalId,
      status: xenditResponse.status,
      expiry_date: xenditResponse.expiry_date,
    });
  } catch (err: any) {
    console.error("Xendit payment creation error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

