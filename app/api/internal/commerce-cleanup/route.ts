import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  const expectedToken = env.COMMERCE_CLEANUP_TOKEN;
  const providedToken = request.headers.get("x-cleanup-token");

  if (!expectedToken || !providedToken || providedToken !== expectedToken) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (!env.DB) {
    return Response.json({ error: "Database unavailable" }, { status: 503 });
  }

  await env.DB.batch([
    env.DB.prepare("DELETE FROM payments"),
    env.DB.prepare("DELETE FROM order_items"),
    env.DB.prepare("DELETE FROM orders"),
    env.DB.prepare("DELETE FROM product_variants"),
    env.DB.prepare("DELETE FROM products"),
    env.DB.prepare("DELETE FROM other_shop_items"),
  ]);

  return Response.json({ success: true });
}
