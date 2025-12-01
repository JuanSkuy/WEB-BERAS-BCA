type SendResult = { success: boolean; info?: any; error?: string };

export async function sendResetEmail(to: string, resetLink: string): Promise<SendResult> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || `no-reply@${process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "") || "example.com"}`;

  if (!host || !port || !user || !pass) {
    return { success: false, error: "SMTP credentials not configured" };
  }

  // Dynamic import so app still builds if nodemailer isn't installed yet
  const nodemailerModule = await import("nodemailer").catch(() => null);
  if (!nodemailerModule) {
    return { success: false, error: "nodemailer not installed" };
  }
  const nodemailer = (nodemailerModule as any).default || nodemailerModule;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass },
    });

    const subject = "Reset Password - Cap Akor";
    const text = `Kami menerima permintaan reset password. Gunakan link berikut untuk mengubah password Anda:\n\n${resetLink}\n\nJika Anda tidak meminta reset, abaikan pesan ini.`;
    const html = `
      <div style="font-family: sans-serif; line-height: 1.5;">
        <p>Halo,</p>
        <p>Kami menerima permintaan untuk mengatur ulang password Anda. Klik tombol di bawah untuk mengatur password baru.</p>
        <p style="text-align:center; margin: 20px 0;">
          <a href="${resetLink}" style="background:#111827;color:white;padding:10px 18px;border-radius:6px;text-decoration:none;">Reset Password</a>
        </p>
        <p>Atau salin link ini ke browser Anda:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>Jika Anda tidak meminta reset password, abaikan pesan ini.</p>
        <p>Salam,<br/>Cap Akor</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    return { success: true, info };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
