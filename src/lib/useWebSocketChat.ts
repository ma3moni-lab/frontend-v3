import { useEffect, useRef, useCallback } from "react";
import { wsUrl } from "./api";

export type WsIncomingMessage =
  | { type: "message"; message: ApiMessage }
  | { type: "read"; message_id: string; read_at: string }
  | { type: "typing"; is_typing: boolean }
  | { type: "pong" };

export interface ApiMessage {
  id: string;
  sender: { id: string | number; full_name?: string };
  content: string | null;
  message_type: string;
  image_url: string | null;
  sent_at: string;
  read_at: string | null;
}

interface UseWebSocketChatOptions {
  conversationId: string | null;
  onMessage: (msg: ApiMessage) => void;
  onRead: (messageId: string, readAt: string) => void;
  onTyping: (isTyping: boolean) => void;
  enabled?: boolean;
}

const BASE_DELAY = 1_000;
const MAX_DELAY  = 30_000;
const PING_INTERVAL = 25_000; // keep-alive under typical 30s proxy timeouts

export function useWebSocketChat({
  conversationId,
  onMessage,
  onRead,
  onTyping,
  enabled = true,
}: UseWebSocketChatOptions) {
  const wsRef       = useRef<WebSocket | null>(null);
  const retryDelay  = useRef(BASE_DELAY);
  const retryTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer   = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmounted   = useRef(false);
  const connectedId = useRef<string | null>(null);

  // Stable callbacks via refs so reconnect loop doesn't capture stale closures
  const onMessageRef = useRef(onMessage);
  const onReadRef    = useRef(onRead);
  const onTypingRef  = useRef(onTyping);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onReadRef.current = onRead; }, [onRead]);
  useEffect(() => { onTypingRef.current = onTyping; }, [onTyping]);

  const cleanup = useCallback(() => {
    if (pingTimer.current) { clearInterval(pingTimer.current); pingTimer.current = null; }
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback((convId: string) => {
    if (unmounted.current) return;
    cleanup();

    const url = wsUrl(convId);
    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch {
      // WebSocket not available (e.g. server-side render) — skip
      return;
    }
    wsRef.current = ws;
    connectedId.current = convId;

    ws.onopen = () => {
      if (unmounted.current) { ws.close(); return; }
      retryDelay.current = BASE_DELAY;
      // Keep-alive ping
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as WsIncomingMessage;
        if (data.type === "message")  onMessageRef.current(data.message);
        if (data.type === "read")     onReadRef.current(data.message_id, data.read_at);
        if (data.type === "typing")   onTypingRef.current(data.is_typing);
      } catch { /* malformed frame — ignore */ }
    };

    ws.onerror = () => { /* onclose will fire next */ };

    ws.onclose = (event) => {
      if (pingTimer.current) { clearInterval(pingTimer.current); pingTimer.current = null; }
      wsRef.current = null;
      // 4003 = unauthenticated, 4004 = not a participant — don't retry
      if (unmounted.current || event.code === 4003 || event.code === 4004) return;
      // Exponential back-off with jitter
      const delay = retryDelay.current + Math.random() * 500;
      retryDelay.current = Math.min(retryDelay.current * 2, MAX_DELAY);
      retryTimer.current = setTimeout(() => {
        if (!unmounted.current && connectedId.current === convId) connect(convId);
      }, delay);
    };
  }, [cleanup]);

  useEffect(() => {
    unmounted.current = false;
    if (enabled && conversationId) {
      connect(conversationId);
    }
    return () => {
      unmounted.current = true;
      cleanup();
      connectedId.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, enabled]);

  /** Send a mark_read event for a specific message. */
  const markRead = useCallback((messageId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "mark_read", message_id: messageId }));
    }
  }, []);

  /** Broadcast typing indicator to partner. */
  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", is_typing: isTyping }));
    }
  }, []);

  /** True when the socket is currently open. */
  const isConnected = useCallback(() =>
    wsRef.current?.readyState === WebSocket.OPEN,
  []);

  return { markRead, sendTyping, isConnected };
}
