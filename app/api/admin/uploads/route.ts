import { env } from "cloudflare:workers";
import { getAuthenticatedAdmin, verifyAdminPassword } from "@/lib/admin-auth";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const qrisTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: Request) {
  try {
    const admin = await getAuthenticatedAdmin(request);
    if (!admin) return Response.json({ error: "Sesi admin berakhir" }, { status: 401 });
    if (!env.BUCKET) return Response.json({ error: "Penyimpanan gambar belum tersedia" }, { status: 503 });
    const form = await request.formData();
    const file = form.get("file");
    const purpose = form.get("purpose") === "qris" ? "qris" : "products";
    if (purpose === "qris" && !(await verifyAdminPassword(admin.id, String(form.get("adminPassword") ?? "")))) {
      return Response.json({ error: "Password admin salah" }, { status: 403 });
    }
    const validTypes = purpose === "qris" ? qrisTypes : allowedTypes;
    if (!(file instanceof File) || !validTypes.has(file.type) || file.size > 2 * 1024 * 1024) {
      return Response.json({ error: purpose === "qris" ? "Gunakan PNG, JPG, atau WEBP maksimal 2 MB" : "Gunakan PNG, JPG, WEBP, atau SVG maksimal 2 MB" }, { status: 400 });
    }
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
    const key = `${purpose}/${crypto.randomUUID()}.${extension}`;
    await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" } });
    return Response.json({ key, url: `/api/assets/${encodeURIComponent(key)}` }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload gagal" }, { status: 500 });
  }
}
