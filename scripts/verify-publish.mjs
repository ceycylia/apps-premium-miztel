import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const required = [
  ".openai/hosting.json",
  "dist/server/wrangler.json",
  "dist/server/index.js",
  "dist/client",
  "dist/.openai/hosting.json",
  "dist/.openai/drizzle/0000_calm_sugar_man.sql",
  "drizzle/0000_calm_sugar_man.sql",
  "drizzle/seed.sql",
  ".env.example",
];

const errors = [];

for (const file of required) {
  try {
    await access(resolve(root, file));
  } catch {
    errors.push(`Missing: ${file}`);
  }
}

try {
  const hosting = JSON.parse(await readFile(resolve(root, ".openai/hosting.json"), "utf8"));
  if (!hosting.project_id) errors.push("`.openai/hosting.json` belum memiliki project_id");
  if (hosting.d1 !== "DB") errors.push("Binding D1 harus bernama `DB`");
} catch (error) {
  errors.push(`Gagal membaca hosting.json: ${error instanceof Error ? error.message : error}`);
}

if (errors.length) {
  console.error("Verifikasi publikasi gagal:\n");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log("Siap dipublikasikan.");
console.log(`  Project ID : ${JSON.parse(await readFile(resolve(root, ".openai/hosting.json"), "utf8")).project_id}`);
console.log("  Artifact   : dist/ (Worker + client + drizzle migrations)");
console.log("  Langkah    : Sites > Save version > Deploy > akses Only those invited");
