import type { GameEventMap } from "./GameEvents.ts";

type Handler<T> = (payload: T) => void;

class EventBus<EventMap extends Record<string, unknown>> {
  private listeners = new Map<string, Set<Handler<unknown>>>();

  on<K extends keyof EventMap & string>(
    type: K,
    handler: Handler<EventMap[K]>,
  ): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(handler as Handler<unknown>);
    return () => this.off(type, handler);
  }

  off<K extends keyof EventMap & string>(
    type: K,
    handler: Handler<EventMap[K]>,
  ): void {
    this.listeners.get(type)?.delete(handler as Handler<unknown>);
  }

  emit<K extends keyof EventMap & string>(type: K, payload: EventMap[K]): void {
    this.listeners.get(type)?.forEach((h) => h(payload));
  }
}

export const gameEventBus = new EventBus<GameEventMap>();
