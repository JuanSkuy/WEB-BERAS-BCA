type SendResult = { success: boolean; info?: any; error?: string };

async function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return { transporter: null as any, error: "SMTP credentials not configured" as const };
  }

  // Dynamic import so app still builds if nodemailer isn't installed yet
  const nodemailerModule = await import("nodemailer").catch(() => null);
  if (!nodemailerModule) {
    return { transporter: null as any, error: "nodemailer not installed" as const };
  }
  const nodemailer = (nodemailerModule as any).default || nodemailerModule;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user, pass },
  });

  return { transporter, error: null as string | null };
}

export async function sendResetEmail(to: string, resetLink: string): Promise<SendResult> {
  const from =
    process.env.EMAIL_FROM ||
    `no-reply@${
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "") || "example.com"
    }`;

  const { transporter, error } = await getTransport();
  if (!transporter) {
    return { success: false, error: error || "SMTP transport not available" };
  }

  try {
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

export async function sendContactEmail(params: {
  name: string;
  email: string;
  message: string;
}): Promise<SendResult> {
  const to = process.env.CONTACT_EMAIL || "beras.capakor@gmail.com";
  const from =
    process.env.EMAIL_FROM ||
    `no-reply@${
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, "") || "example.com"
    }`;

  const { transporter, error } = await getTransport();
  if (!transporter) {
    return { success: false, error: error || "SMTP transport not available" };
  }

  try {
    const subject = "Pesan Baru dari Form Hubungi Kami - Cap Akor";
    const text = `Anda menerima pesan baru dari halaman Hubungi Kami:\n\nNama: ${params.name}\nEmail: ${params.email}\n\nPesan:\n${params.message}\n`;
    const html = `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>Pesan Baru dari Form Hubungi Kami</h2>
        <p><strong>Nama:</strong> ${params.name}</p>
        <p><strong>Email:</strong> ${params.email}</p>
        <p><strong>Pesan:</strong></p>
        <p>${params.message.replace(/\n/g, "<br/>")}</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from,
      to,
      replyTo: params.email,
      subject,
      text,
      html,
    });

    return { success: true, info };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
