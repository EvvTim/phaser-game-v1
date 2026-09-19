import { Events } from 'phaser';

/**
 * Shared event bus for decoupled communication between scenes, managers,
 * and components (e.g. a Health component notifying a UI scene).
 * Prefer this over direct cross-references between systems.
 *
 * Scenes/components that subscribe MUST unsubscribe on shutdown/destroy:
 *   this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => EventBus.off(EVENTS.SOME_EVENT, handler));
 */
export const EventBus = new Events.EventEmitter();
