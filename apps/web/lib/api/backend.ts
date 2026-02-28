function backendBaseUrl(): string {
  const raw = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || '';
  return raw.trim().replace(/\/+$/, '');
}

export function isBackendMode(): boolean {
  return backendBaseUrl().length > 0;
}

export function backendUrl(path: string): string {
  const base = backendBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function convertKeys(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(convertKeys);
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
        toCamelCase(k),
        convertKeys(v),
      ])
    );
  }
  return obj;
}

export async function fetchBackend<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(backendUrl(path), {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Backend error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}
