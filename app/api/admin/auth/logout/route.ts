import { deleteAdminSession } from "@/lib/admin-auth";

export async function POST(request: Request) {
  return Response.json({ success: true }, { headers: { "Set-Cookie": await deleteAdminSession(request) } });
}
