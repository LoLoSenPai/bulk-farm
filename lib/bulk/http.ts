// =========================
// lib/bulk/http.ts
// =========================
const BASE_URL = "/api/bulk";

export class BulkHttpError extends Error {
  status: number;
  body?: any;
  constructor(status: number, message: string, body?: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function bulkFetch<T>(
  path: string,
  init: RequestInit & { json?: any; timeoutMs?: number } = {},
): Promise<T> {
  const { json, timeoutMs = 15_000, ...rest } = init;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  // Proxy Next route: /api/bulk?path=/exchangeInfo
  const url = `${BASE_URL}?path=${encodeURIComponent(path)}`;

  const res = await fetch(url, {
    ...rest,
    method: rest.method ?? (json ? "POST" : "GET"),
    headers: {
      "content-type": "application/json",
      ...(rest.headers ?? {}),
    },
    body: json ? JSON.stringify(json) : rest.body,
    signal: controller.signal,
    cache: "no-store",
  }).finally(() => clearTimeout(id));

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    throw new BulkHttpError(res.status, data?.message ?? res.statusText, data);
  }

  return (data ?? ({} as any)) as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
