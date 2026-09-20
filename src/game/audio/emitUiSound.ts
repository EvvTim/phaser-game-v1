import { EventBus } from '../events/EventBus';
import { EVENTS } from '../events/GameEvents';
import type { UiSoundKind } from './uiSounds';

/**
 * Asks the Audio scene to play a UI sound effect. Kept apart from
 * uiSounds.ts (pure registry, unit-tested) because it pulls in the Phaser
 * event bus.
 */
export function emitUiSound(kind: UiSoundKind): void {
    EventBus.emit(EVENTS.UI_SOUND, kind);
}
