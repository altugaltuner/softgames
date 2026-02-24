import type { Listener, MagicWordsEventMap } from "./type";

class MagicWordsEventBus {
  private readonly listeners: {
    [K in keyof MagicWordsEventMap]?: Set<Listener<MagicWordsEventMap[K]>>;
  } = {};

  on<K extends keyof MagicWordsEventMap>(
    eventName: K,
    listener: Listener<MagicWordsEventMap[K]>,
  ): () => void {
    const listenersForEvent =
      this.listeners[eventName] ?? new Set<Listener<MagicWordsEventMap[K]>>();
    listenersForEvent.add(listener);
    this.listeners[eventName] = listenersForEvent;
    return () => this.off(eventName, listener);
  }

  off<K extends keyof MagicWordsEventMap>(
    eventName: K,
    listener: Listener<MagicWordsEventMap[K]>,
  ): void {
    this.listeners[eventName]?.delete(listener);
  }

  emit<K extends keyof MagicWordsEventMap>(
    eventName: K,
    payload: MagicWordsEventMap[K],
  ): void {
    this.listeners[eventName]?.forEach((listener) => {
      listener(payload);
    });
  }
}

export const magicWordsEvents = new MagicWordsEventBus();
