export type ProductImageUrl = { url: string; error: string | null };

export function normalizeGoogleDriveImageUrl(value: string): ProductImageUrl {
  const source = value.trim();
  if (!source) return { url: "", error: null };
  try {
    const input = new URL(source);
    if (input.protocol !== "https:" || !["drive.google.com", "www.drive.google.com"].includes(input.hostname)) return { url: "", error: "Gunakan link Google Drive yang valid." };
    const fromFilePath = input.pathname.match(/^\/file\/d\/([^/]+)\/?/i)?.[1];
    const supportedPath = ["/open", "/uc", "/thumbnail"].includes(input.pathname);
    const fileId = fromFilePath ?? (supportedPath ? input.searchParams.get("id") : null);
    if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) return { url: "", error: "Link Drive tidak memiliki FILE_ID yang valid." };
    return { url: `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1000`, error: null };
  } catch {
    return { url: "", error: "Link gambar harus berupa URL Google Drive yang lengkap." };
  }
}

export function normalizeProductImageUrl(value?: string | null): ProductImageUrl {
  const source = value?.trim() ?? "";
  if (!source) return { url: "", error: null };
  if (source.startsWith("/api/assets/")) return { url: source, error: null };
  try {
    const input = new URL(source);
    return ["drive.google.com", "www.drive.google.com"].includes(input.hostname)
      ? normalizeGoogleDriveImageUrl(source)
      : { url: source, error: null };
  } catch {
    return { url: "", error: "URL gambar tidak valid." };
  }
}
