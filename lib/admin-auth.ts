import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { admins, adminSessions } from "@/db/schema";

const SESSION_COOKIE = "miztel_admin_session";
const ITERATIONS = 100_000;

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return bytesToBase64(value).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, key, 256);
  return `pbkdf2_sha256$${ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, iterationText, saltText, expectedText] = stored.split("$");
  if (algorithm !== "pbkdf2_sha256" || !iterationText || !saltText || !expectedText) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: base64ToBytes(saltText), iterations: Number(iterationText) }, key, 256);
  const actual = new Uint8Array(bits);
  const expected = base64ToBytes(expectedText);
  if (actual.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
  return difference === 0;
}

function readCookie(request: Request, name: string) {
  const raw = request.headers.get("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return null;
}

export async function createAdminSession(request: Request, adminId: number) {
  const token = randomToken();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  await getDb().insert(adminSessions).values({ adminId, tokenHash: await sha256(token), expiresAt: expires.toISOString() });
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`;
}

export async function getAuthenticatedAdmin(request: Request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const [row] = await getDb().select({ id: admins.id, name: admins.name, email: admins.email })
    .from(adminSessions)
    .innerJoin(admins, eq(adminSessions.adminId, admins.id))
    .where(and(eq(adminSessions.tokenHash, await sha256(token)), gt(adminSessions.expiresAt, new Date().toISOString())))
    .limit(1);
  return row ?? null;
}

export async function verifyAdminPassword(adminId: number, password: string) {
  if (!password) return false;
  const [admin] = await getDb().select({ passwordHash: admins.passwordHash }).from(admins).where(eq(admins.id, adminId)).limit(1);
  return Boolean(admin && await verifyPassword(password, admin.passwordHash));
}

export async function deleteAdminSession(request: Request) {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await getDb().delete(adminSessions).where(eq(adminSessions.tokenHash, await sha256(token)));
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function makeResetCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const value = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  return String(value % 1_000_000).padStart(6, "0");
}

export function makeSalt() { return randomToken(16); }

export async function hashResetCode(code: string, salt: string) { return sha256(`${salt}:${code}`); }
