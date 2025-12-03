import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";


export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    console.log("GET /api/addresses - Session:", session);
    
    if (!session?.userId) {
      console.log("GET /api/addresses - No session or userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("GET /api/addresses - Fetching addresses for userId:", session.userId);
    await ensureSchema();

    try {
      const addresses = await sql`
        SELECT 
          id,
          user_id,
          label,
          recipient_name,
          phone,
          address,
          city,
          postal_code,
          is_default,
          created_at,
          updated_at
        FROM addresses
        WHERE user_id = ${session.userId}
        ORDER BY is_default DESC, created_at DESC
      `;

      const rows = Array.isArray(addresses) ? addresses : (addresses as any).rows ?? [];
      console.log("GET /api/addresses - Found addresses:", rows.length);
      console.log("GET /api/addresses - Addresses data:", JSON.stringify(rows, null, 2));
      
      
      return NextResponse.json({ 
        addresses: rows,
        count: rows.length 
      });
    } catch (dbError: any) {
      console.error("Database error fetching addresses:", dbError);
      
      if (dbError?.message?.includes("does not exist") || dbError?.code === "42P01") {
        console.log("GET /api/addresses - Table doesn't exist, returning empty array");
        return NextResponse.json({ addresses: [] });
      }
      throw dbError;
    }
  } catch (err: any) {
    console.error("Error fetching addresses:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

    const body = await req.json();
    const { label, recipient_name, phone, address, city, postal_code, is_default } = body;

    
    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    
    if (is_default) {
      await sql`
        UPDATE addresses
        SET is_default = false, updated_at = now()
        WHERE user_id = ${session.userId} AND is_default = true
      `;
    }

    
    const result = await sql`
      INSERT INTO addresses (
        user_id,
        label,
        recipient_name,
        phone,
        address,
        city,
        postal_code,
        is_default,
        created_at,
        updated_at
      )
      VALUES (
        ${session.userId},
        ${label || null},
        ${recipient_name || null},
        ${phone || null},
        ${address},
        ${city || null},
        ${postal_code || null},
        ${is_default || false},
        now(),
        now()
      )
      RETURNING 
        id,
        user_id,
        label,
        recipient_name,
        phone,
        address,
        city,
        postal_code,
        is_default,
        created_at,
        updated_at
    `;

    const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
    const newAddress = rows[0];

    if (!newAddress) {
      return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
    }

    
    if (!is_default) {
      const countResult = await sql`
        SELECT COUNT(*) as count
        FROM addresses
        WHERE user_id = ${session.userId}
      `;
      const countRows = Array.isArray(countResult) ? countResult : (countResult as any).rows ?? [];
      const count = Number(countRows[0]?.count ?? 0);
      
      if (count === 1) {
        await sql`
          UPDATE addresses
          SET is_default = true, updated_at = now()
          WHERE id = ${newAddress.id}
        `;
        newAddress.is_default = true;
      }
    }

    return NextResponse.json({ address: newAddress }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating address:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

