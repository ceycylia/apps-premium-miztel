import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { admins } from "@/db/schema";
import { createAdminSession, verifyPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const [admin] = await getDb().select().from(admins).where(eq(admins.email, body.email?.trim().toLowerCase() ?? "")).limit(1);
    if (!admin || !body.password || !(await verifyPassword(body.password, admin.passwordHash))) return Response.json({ error: "Email atau password salah" }, { status: 401 });
    return Response.json({ admin: { id: admin.id, name: admin.name, email: admin.email } }, { headers: { "Set-Cookie": await createAdminSession(request, admin.id) } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Login gagal" }, { status: 500 });
  }
}
