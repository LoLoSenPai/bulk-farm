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
      this.startHeartbeat();
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
    // WS docs Bulk: method/subscribe + subscription array
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
    // NOTE: exact channel format may differ; adjust once we inspect WS docs
    this.send({ op: "subscribe", channel: "ticker", symbol });
  }

  subscribeL2Book(symbol: string) {
    this.send({ op: "subscribe", channel: "l2book", symbol });
  }

  unsubscribeAll() {
    this.send({ op: "unsubscribe", channel: "*" });
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

    // 1) Direct "type"
    if (obj?.type === "frontendContext") {
      return { type: "frontendContext", data: obj.data ?? obj };
    }

    if (obj?.type === "ticker") {
      return {
        type: "ticker",
        symbol: obj.symbol ?? obj.s,
        data: obj.data ?? obj,
      };
    }

    if (obj?.type === "l2book") {
      return {
        type: "l2book",
        symbol: obj.symbol ?? obj.s,
        data: obj.data ?? obj,
      };
    }

    if (obj?.type === "error") {
      return {
        type: "error",
        message: obj.message ?? "WS error",
        code: obj.code,
      };
    }

    // 2) Direct "channel"
    if (obj?.channel === "frontendContext") {
      return { type: "frontendContext", data: obj.data ?? obj };
    }
    if (obj?.channel === "ticker") {
      return {
        type: "ticker",
        symbol: obj.symbol ?? obj.s,
        data: obj.data ?? obj,
      };
    }
    if (obj?.channel === "l2book") {
      return {
        type: "l2book",
        symbol: obj.symbol ?? obj.s,
        data: obj.data ?? obj,
      };
    }

    // 3) Some APIs wrap pushes like: { method:"subscription", data:{...} }
    if (obj?.method === "subscription") {
      const inner = obj.data ?? obj;
      if (
        inner?.type === "frontendContext" ||
        inner?.channel === "frontendContext"
      ) {
        return { type: "frontendContext", data: inner.data ?? inner };
      }
      if (inner?.type === "ticker" || inner?.channel === "ticker") {
        return {
          type: "ticker",
          symbol: inner.symbol ?? inner.s,
          data: inner.data ?? inner,
        };
      }
      if (inner?.type === "l2book" || inner?.channel === "l2book") {
        return {
          type: "l2book",
          symbol: inner.symbol ?? inner.s,
          data: inner.data ?? inner,
        };
      }
    }

    return { type: "raw", data: obj };
  } catch {
    return { type: "raw", data };
  }
}
