import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/lib/schema-init";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const { token, new_password } = await req.json();

    if (!token || !new_password) {
      return NextResponse.json(
        { error: "Token dan password baru harus diisi" },
        { status: 400 }
      );
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token
    const userResult = await sql`
      SELECT id, email FROM users 
      WHERE password_reset_token = ${tokenHash} 
        AND password_reset_expires > now()
      LIMIT 1
    `;
    const users = Array.isArray(userResult) ? userResult : [];
    const user = users[0];

    if (!user) {
      return NextResponse.json(
        { error: "Token tidak valid atau sudah kadaluarsa" },
        { status: 401 }
      );
    }

    // Validate password
    if (new_password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Hash new password
    const hash = await bcrypt.hash(String(new_password), 10);

    // Update password and clear reset token
    const updateRes = await sql`
      UPDATE users 
      SET password_hash = ${hash}, 
          password_reset_token = NULL, 
          password_reset_expires = NULL
      WHERE id = ${user.id}
      RETURNING id, email
    `;

    const updated = Array.isArray(updateRes) ? updateRes[0] : updateRes;

    return NextResponse.json({
      ok: true,
      message: "Password berhasil direset",
      user: { id: updated.id, email: updated.email },
    });
  } catch (err: any) {
    console.error("Error resetting password:", err);
    return NextResponse.json(
      { error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}


