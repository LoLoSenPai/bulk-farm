// =========================
// lib/bulk/ws.ts
// =========================
import type { BulkWsMessage } from "./ws-types";

const WS_URL =
  process.env.NEXT_PUBLIC_BULK_WS_URL ?? "wss://exchange-wss.bulk.trade";

type Handlers = {
  onMessage?: (msg: BulkWsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (e: Event) => void;
};

export class BulkWs {
  private ws?: WebSocket;
  private handlers: Handlers;
  private heartbeat?: number;
  private reconnectTimer?: number;
  private closedByUser = false;
  private isOpen = false;
  private sendQueue: string[] = [];

  constructor(handlers: Handlers = {}) {
    this.handlers = handlers;
  }

  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.closedByUser = false;
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.isOpen = true;

      // flush queued messages
      if (this.sendQueue.length) {
        for (const msg of this.sendQueue) {
          try {
            this.ws?.send(msg);
          } catch {}
        }
        this.sendQueue = [];
      }

      this.handlers.onOpen?.();
      // this.startHeartbeat();
    };

    this.ws.onclose = () => {
      this.isOpen = false;
      this.stopHeartbeat();
      this.handlers.onClose?.();
      if (!this.closedByUser) this.scheduleReconnect();
    };

    this.ws.onerror = (e) => this.handlers.onError?.(e);

    this.ws.onmessage = (evt) => {
      const msg = parseWs(evt.data);
      this.handlers.onMessage?.(msg);
    };
  }

  close() {
    this.isOpen = false;
    this.sendQueue = [];
    this.closedByUser = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }

  send(data: any) {
    const payload = typeof data === "string" ? data : JSON.stringify(data);

    // if not ready, queue (avoids "Still in CONNECTING state")
    if (!this.ws || !this.isOpen || this.ws.readyState !== WebSocket.OPEN) {
      this.sendQueue.push(payload);
      return;
    }

    this.ws.send(payload);
  }

  subscribeFrontendContext() {
    this.send({
      method: "subscribe",
      subscription: [{ type: "frontendContext" }],
    });
  }

  unsubscribeFrontendContext() {
    this.send({
      method: "unsubscribe",
      subscription: [{ type: "frontendContext" }],
    });
  }

  subscribeTicker(symbol: string) {
    this.send({
      method: "subscribe",
      subscription: [{ type: "ticker", symbol }],
    });
  }

  unsubscribeTicker(symbol: string) {
    this.send({
      method: "unsubscribe",
      subscription: [{ type: "ticker", symbol }],
    });
  }

  subscribeL2Delta(symbol: string) {
    this.send({
      method: "subscribe",
      subscription: [{ type: "l2Delta", symbol }],
    });
  }

  unsubscribeL2Delta(symbol: string) {
    this.send({
      method: "unsubscribe",
      subscription: [{ type: "l2Delta", symbol }],
    });
  }

  // optionnel (si un jour tu veux envoyer 1 seul message)
  subscribeMany(subs: Array<Record<string, any>>) {
    this.send({ method: "subscribe", subscription: subs });
  }

  unsubscribeAll() {
    this.unsubscribeFrontendContext();
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeat = window.setInterval(() => {
      try {
        this.send({ op: "ping", ts: Date.now() });
      } catch {}
    }, 20_000);
  }

  private stopHeartbeat() {
    if (this.heartbeat) window.clearInterval(this.heartbeat);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => this.connect(), 1500);
  }
}

function parseWs(data: any): BulkWsMessage {
  try {
    const obj = typeof data === "string" ? JSON.parse(data) : data;

    if (obj?.type === "subscriptionResponse") {
      return { type: "subscriptionResponse", topics: obj.topics ?? [] };
    }

    if (obj?.type === "error") {
      return {
        type: "error",
        message: obj.message ?? "WS error",
        code: obj.code,
      };
    }

    if (
      obj?.type === "frontendContext" ||
      obj?.topic === "frontendContext" ||
      obj?.channel === "frontendContext" ||
      (obj?.ctx && Array.isArray(obj.ctx))
    ) {
      const payload = obj?.data?.ctx
        ? obj.data
        : obj?.ctx
          ? obj
          : obj?.data
            ? obj.data
            : obj;

      return { type: "frontendContext", data: payload };
    }

    if (obj?.type === "ticker" || obj?.channel === "ticker") {
      const t = obj.data?.ticker ?? obj.ticker ?? obj.data ?? obj;
      const symbol = t?.symbol ?? t?.s ?? obj.symbol ?? obj.s;
      return { type: "ticker", symbol, data: t };
    }

    if (obj?.type === "l2Delta" || obj?.channel === "l2Delta") {
      const d = obj.data ?? obj;
      const symbol = d?.symbol ?? d?.s ?? obj.symbol ?? obj.s;
      return { type: "l2book", symbol, data: d };
    }

    if (obj?.type === "l2book" || obj?.channel === "l2book") {
      const d = obj.data ?? obj;
      const symbol = d?.symbol ?? d?.s ?? obj.symbol ?? obj.s;
      return { type: "l2book", symbol, data: d };
    }

    return { type: "raw", data: obj };
  } catch {
    return { type: "raw", data };
  }
}
