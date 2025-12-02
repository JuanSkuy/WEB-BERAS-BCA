import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { email, old_password, new_password } = await req.json();

    if (!email || !old_password || !new_password) {
      return NextResponse.json(
        { error: "Email, kata sandi lama, dan kata sandi baru wajib diisi." },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const result =
      await sql`select id, email, password_hash from users where lower(trim(email)) = ${normalizedEmail} limit 1`;
    const user = (result as any)[0];

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 },
      );
    }

    const supplied = String(old_password);
    let storedHash = String(user.password_hash || "").trim();
    if (storedHash.startsWith("$2y$")) {
      storedHash = storedHash.replace("$2y$", "$2b$");
    }

    let ok = await bcrypt.compare(supplied, storedHash);
    if (!ok) {
      const trimmed = supplied.trim();
      if (trimmed !== supplied) {
        ok = await bcrypt.compare(trimmed, storedHash);
      }
    }

    if (!ok) {
      return NextResponse.json(
        { error: "Kata sandi lama salah." },
        { status: 401 },
      );
    }

    if (String(new_password).length < 6) {
      return NextResponse.json(
        { error: "Kata sandi baru minimal 6 karakter." },
        { status: 400 },
      );
    }

    const newHash = await bcrypt.hash(String(new_password), 10);
    await sql`
      UPDATE users
      SET password_hash = ${newHash}
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ ok: true, message: "Kata sandi berhasil diubah." });
  } catch (err: any) {
    console.error("Error changing password:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 },
    );
  }
}


