// =========================
// lib/bulk/ws-types.ts
// =========================
export type BulkWsMessage =
  | { type: "subscriptionResponse"; topics: string[] }
  | { type: "frontendContext"; data: { ctx: any[] } }
  | { type: "ticker"; symbol: string; data: any }
  | { type: "l2book"; symbol: string; data: any }
  | { type: "error"; message: string; code?: string }
  | { type: "raw"; data: any };
