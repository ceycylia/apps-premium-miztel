import { env } from "cloudflare:workers";

export async function sendResetCodeEmail(args: { to: string; name: string; code: string }) {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const token = env.CLOUDFLARE_EMAIL_TOKEN;
  const from = env.RESET_FROM_EMAIL;
  if (!accountId || !token || !from) {
    if (env.RESET_EMAIL_DEV_MODE === "true") return { delivered: false, previewCode: args.code };
    throw new Error("Layanan email reset belum dikonfigurasi");
  }
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to: args.to,
      from: { address: from, name: "Miztel Digital" },
      subject: "Kode reset password Miztel Digital",
      text: `Halo ${args.name}, kode reset password Anda adalah ${args.code}. Kode berlaku 10 menit dan hanya dapat digunakan satu kali.`,
      html: `<div style="font-family:Arial,sans-serif;color:#2A1620"><h2>Miztel Digital</h2><p>Halo ${escapeHtml(args.name)},</p><p>Kode reset password Anda:</p><p style="font-size:28px;font-weight:800;letter-spacing:8px">${args.code}</p><p>Kode berlaku 10 menit dan hanya dapat digunakan satu kali.</p></div>`,
    }),
  });
  if (!response.ok) throw new Error("Email kode reset gagal dikirim");
  return { delivered: true };
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
