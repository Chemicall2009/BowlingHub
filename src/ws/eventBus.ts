/**
 * @file src/ws/eventBus.ts
 * @description Легковесный брокер событий (EventBus) для WebSocket с изоляцией слушателей.
 */

import type { ServerEvent, ServerEventType } from "./protocol";

type Listener = (event: ServerEvent) => void;

export class EventBus {
  private listeners: Set<Listener> = new Set();
  private typedListeners: Map<ServerEventType, Set<Listener>> = new Map();

  /**
   * Подписка на конкретный тип события.
   */
  public subscribe<T extends ServerEventType>(
    type: T,
    cb: (event: Extract<ServerEvent, { type: T }>) => void
  ): () => void {
    if (!this.typedListeners.has(type)) {
      this.typedListeners.set(type, new Set());
    }
    const set = this.typedListeners.get(type)!;
    set.add(cb as Listener);

    return () => {
      set.delete(cb as Listener);
    };
  }

  /**
   * Подписка на все события шины.
   */
  public subscribeAll(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /**
   * Отправка события всем подписчикам с защитой от падения в слушателях.
   */
  public emit(event: ServerEvent): void {
    // Уведомляем универсальных подписчиков
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("[EventBus] Error in generic listener:", err);
        }
      }
    }

    // Уведомляем подписчиков по конкретному типу
    const typeSet = this.typedListeners.get(event.type);
    if (typeSet) {
      for (const listener of typeSet) {
        try {
          listener(event);
        } catch (err) {
          if (import.meta.env.DEV) {
            console.error(`[EventBus] Error in listener for type '${event.type}':`, err);
          }
        }
      }
    }
  }
}

export const eventBus = new EventBus();
