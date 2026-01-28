// app/api/bulk/route.ts
import { NextResponse } from "next/server";

const UPSTREAM = "https://exchange-api2.bulk.trade/api/v1";

type CacheEntry = {
  expiresAt: number;
  status: number;
  headers: Record<string, string>;
  body: string;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();

function ttlForPath(path: string) {
  // Ajuste selon ton besoin
  if (path.startsWith("/exchangeInfo")) return 60_000; // 60s
  if (path.startsWith("/ticker/")) return 3_000; // 3s
  if (path.startsWith("/l2book")) return 500; // 0.5s
  if (path.startsWith("/klines")) {
    const u = new URL("http://x" + path);
    const interval = u.searchParams.get("interval");
    if (interval === "10s") return 2_000;
    if (interval === "1m") return 5_000;
    if (interval === "5m") return 10_000;
    if (interval === "15m") return 15_000;
    return 20_000; // 1h/4h/1d
  }
  if (path.startsWith("/account")) return 2_000; // 2s
  return 2_000; // défaut
}

function normalizeHeaders(res: Response) {
  const contentType = res.headers.get("content-type") ?? "application/json";
  return { "content-type": contentType };
}

function getUpstreamUrl(req: Request) {
  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";

  if (!path.startsWith("/")) return null;
  if (path.includes("://") || path.includes("\\") || path.includes(".."))
    return null;

  return { path, url: `${UPSTREAM}${path}` };
}

function cacheKey(method: string, path: string, body?: string) {
  // body uniquement pour POST etc
  return `${method}:${path}:${body ?? ""}`;
}

async function fetchUpstream(
  method: string,
  upstreamUrl: string,
  req: Request,
  body?: string,
): Promise<CacheEntry> {
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const res = await fetch(upstreamUrl, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : body,
    cache: "no-store",
  });

  const text = await res.text();

  return {
    expiresAt: Date.now(), // set by caller
    status: res.status,
    headers: normalizeHeaders(res),
    body: text,
  };
}

async function forward(req: Request) {
  const meta = getUpstreamUrl(req);
  if (!meta)
    return NextResponse.json({ message: "Invalid path" }, { status: 400 });

  const method = req.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await req.text();

  const key = cacheKey(method, meta.path, body);
  const now = Date.now();

  // 1) serve cache if fresh
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    const ttlLeft = cached.expiresAt - now;

    return new NextResponse(cached.body, {
      status: cached.status,
      headers: {
        ...cached.headers,
        "x-cache": "HIT",
        "x-cache-ttl": String(Math.max(0, ttlLeft)),
        "x-cache-exp": String(cached.expiresAt),
      },
    });
  }

  // 2) dedupe inflight
  const inflightReq = inflight.get(key);
  if (inflightReq) {
    const entry = await inflightReq;
    return new NextResponse(entry.body, {
      status: entry.status,
      headers: {
        ...entry.headers,
        "x-cache": "DEDUPED",
        "x-cache-exp": String(entry.expiresAt),
      },
    });
  }

  const ttl = ttlForPath(meta.path);

  const p = (async () => {
    const entry = await fetchUpstream(method, meta.url, req, body);
    entry.expiresAt = now + ttl;
    cache.set(key, entry);
    return entry;
  })();

  inflight.set(key, p);

  try {
    const entry = await p;
    return new NextResponse(entry.body, {
      status: entry.status,
      headers: {
        ...entry.headers,
        "x-cache": "MISS",
        "x-cache-exp": String(entry.expiresAt),
      },
    });
  } finally {
    inflight.delete(key);
  }
}

export async function GET(req: Request) {
  return forward(req);
}
export async function POST(req: Request) {
  return forward(req);
}
