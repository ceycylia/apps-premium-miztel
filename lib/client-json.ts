export async function parseJson<T>(response: Response): Promise<T & { error?: string }> {
  return response.json() as Promise<T & { error?: string }>;
}
