// electron/core/events/event-bus.ts

import { EventEmitter } from 'events';
import { AppEventName, AppEventPayload } from './event-types';
import { logger } from '../../lib/logger';

class TypedEventBus {
  private static instance: TypedEventBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
  }

  public static getInstance(): TypedEventBus {
    if (!TypedEventBus.instance) {
      TypedEventBus.instance = new TypedEventBus();
    }
    return TypedEventBus.instance;
  }

  emit<T extends AppEventName>(eventName: T, payload: AppEventPayload<T>): void {
    logger.debug(`[EventBus] Emit: ${eventName}`, payload);
    try {
      this.emitter.emit(eventName, payload);
    } catch (error) {
      logger.error(`[EventBus] Critical Error in listener for event: ${eventName}`, error);
    }
  }

  on<T extends AppEventName>(eventName: T, listener: (payload: AppEventPayload<T>) => void): void {
    this.emitter.on(eventName, listener);
  }

  once<T extends AppEventName>(
    eventName: T,
    listener: (payload: AppEventPayload<T>) => void
  ): void {
    this.emitter.once(eventName, listener);
  }

  off<T extends AppEventName>(eventName: T, listener: (payload: AppEventPayload<T>) => void): void {
    this.emitter.off(eventName, listener);
  }

  removeAllListeners(eventName?: AppEventName): void {
    if (eventName) {
      this.emitter.removeAllListeners(eventName);
    } else {
      this.emitter.removeAllListeners();
    }
  }

  listenerCount(eventName: AppEventName): number {
    return this.emitter.listenerCount(eventName);
  }
}

export const eventBus = TypedEventBus.getInstance();
