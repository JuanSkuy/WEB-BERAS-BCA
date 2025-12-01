import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();

    // Check if products already exist
    const existingProducts = await sql`SELECT id FROM products LIMIT 1`;
    const rows = Array.isArray(existingProducts)
      ? existingProducts
      : (existingProducts as any).rows ?? [];

    if (rows.length > 0) {
      return NextResponse.json(
        { message: "Products already exist" },
        { status: 200 }
      );
    }

    // Insert default products
    const products = [
      {
        name: "Beras Akor 1kg",
        price_cents: 1700000,
        stock: 100,
      },
      {
        name: "Beras Akor 5kg",
        price_cents: 8000000,
        stock: 50,
      },
      {
        name: "Beras Akor 10kg",
        price_cents: 16000000,
        stock: 30,
      },
    ];

    const insertedProducts = [];

    for (const product of products) {
      const result = await sql`
        INSERT INTO products (name, price_cents, stock)
        VALUES (${product.name}, ${product.price_cents}, ${product.stock})
        RETURNING id, name, price_cents, stock
      `;
      const resultRows = Array.isArray(result)
        ? result
        : (result as any).rows ?? [];
      if (resultRows.length > 0) {
        insertedProducts.push(resultRows[0]);
      }
    }

    return NextResponse.json(
      { message: "Products initialized", products: insertedProducts },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Init error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
