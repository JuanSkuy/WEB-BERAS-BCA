import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/mail";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const name = body?.name?.toString().trim();
    const email = body?.email?.toString().trim();
    const message = body?.message?.toString().trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Nama, email, dan pesan wajib diisi." },
        { status: 400 },
      );
    }

    const result = await sendContactEmail({
      name,
      email,
      message,
    });

    if (!result.success) {
      console.error("Failed to send contact email:", result.error);
      return NextResponse.json(
        {
          ok: false,
          error:
            result.error ||
            "Gagal mengirim pesan. Silakan coba lagi atau hubungi kami lewat email langsung.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error in /api/contact:", error);
    return NextResponse.json(
      { ok: false, error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 },
    );
  }
}


