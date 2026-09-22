import { env } from "cloudflare:workers";

export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  if (!env.BUCKET) return new Response("Not found", { status: 404 });
  const key = decodeURIComponent((await context.params).key);
  if (!key.startsWith("products/")) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  return new Response(object.body, { headers });
}
