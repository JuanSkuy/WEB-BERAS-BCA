import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

// GET - Get a specific address by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

    const resolvedParams = await Promise.resolve(params);
    const addressId = resolvedParams.id;

    const result = await sql`
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
      WHERE id = ${addressId} AND user_id = ${session.userId}
    `;

    const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
    const address = rows[0];

    if (!address) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ address });
  } catch (err: any) {
    console.error("Error fetching address:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// PUT - Update an address
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

    const resolvedParams = await Promise.resolve(params);
    const addressId = resolvedParams.id;
    const body = await req.json();
    const { label, recipient_name, phone, address, city, postal_code, is_default } = body;

    // Check if address exists and belongs to user
    const checkResult = await sql`
      SELECT id, is_default
      FROM addresses
      WHERE id = ${addressId} AND user_id = ${session.userId}
    `;
    const checkRows = Array.isArray(checkResult) ? checkResult : (checkResult as any).rows ?? [];
    
    if (checkRows.length === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // If setting as default, unset other default addresses first
    if (is_default && !checkRows[0].is_default) {
      await sql`
        UPDATE addresses
        SET is_default = false, updated_at = now()
        WHERE user_id = ${session.userId} AND is_default = true AND id != ${addressId}
      `;
    }

    // Update address
    const result = await sql`
      UPDATE addresses
      SET 
        label = ${label !== undefined ? label : sql`label`},
        recipient_name = ${recipient_name !== undefined ? recipient_name : sql`recipient_name`},
        phone = ${phone !== undefined ? phone : sql`phone`},
        address = ${address !== undefined ? address : sql`address`},
        city = ${city !== undefined ? city : sql`city`},
        postal_code = ${postal_code !== undefined ? postal_code : sql`postal_code`},
        is_default = ${is_default !== undefined ? is_default : sql`is_default`},
        updated_at = now()
      WHERE id = ${addressId} AND user_id = ${session.userId}
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
    const updatedAddress = rows[0];

    if (!updatedAddress) {
      return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
    }

    return NextResponse.json({ address: updatedAddress });
  } catch (err: any) {
    console.error("Error updating address:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// DELETE - Delete an address
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

    const resolvedParams = await Promise.resolve(params);
    const addressId = resolvedParams.id;

    // Check if address exists and belongs to user
    const checkResult = await sql`
      SELECT id, is_default
      FROM addresses
      WHERE id = ${addressId} AND user_id = ${session.userId}
    `;
    const checkRows = Array.isArray(checkResult) ? checkResult : (checkResult as any).rows ?? [];
    
    if (checkRows.length === 0) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const wasDefault = checkRows[0].is_default;

    // Delete address
    await sql`
      DELETE FROM addresses
      WHERE id = ${addressId} AND user_id = ${session.userId}
    `;

    // If deleted address was default, set another address as default (if any)
    if (wasDefault) {
      const otherResult = await sql`
        SELECT id
        FROM addresses
        WHERE user_id = ${session.userId}
        ORDER BY created_at ASC
        LIMIT 1
      `;
      const otherRows = Array.isArray(otherResult) ? otherResult : (otherResult as any).rows ?? [];
      
      if (otherRows.length > 0) {
        await sql`
          UPDATE addresses
          SET is_default = true, updated_at = now()
          WHERE id = ${otherRows[0].id}
        `;
      }
    }

    return NextResponse.json({ success: true, message: "Address deleted successfully" });
  } catch (err: any) {
    console.error("Error deleting address:", err);
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

