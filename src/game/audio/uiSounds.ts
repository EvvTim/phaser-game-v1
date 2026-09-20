import type { Loader } from 'phaser';
import { z } from 'zod';

/**
 * UI sound effects (Kenney Interface Sounds, CC0 — see README, Assets).
 * Scenes never play them directly: they emit `EVENTS.UI_SOUND` with one of
 * these kinds and the Audio scene plays it at the effects volume.
 */
export const UI_SOUND_KINDS = ['navigate', 'select', 'confirm', 'back'] as const;
export type UiSoundKind = (typeof UI_SOUND_KINDS)[number];

/** Event payload schema — the Audio scene validates what it receives. */
export const uiSoundSchema = z.enum(UI_SOUND_KINDS);

/** Files in public/assets/sfx, each shipped as .ogg and .m4a (Safari doesn't play Ogg). */
const FILES: Readonly<Record<UiSoundKind, string>> = {
    navigate: 'ui-navigate',
    select: 'ui-select',
    confirm: 'ui-confirm',
    back: 'ui-back',
};

/** Per-sound level relative to the effects volume — the frequent focus tick sits a little lower. */
const RELATIVE_GAIN: Readonly<Record<UiSoundKind, number>> = {
    navigate: 0.7,
    select: 1,
    confirm: 1,
    back: 0.9,
};

/** The same sound is not started again within this window (ms), e.g. a D-pad held down. */
export const UI_SOUND_MIN_REPEAT_MS = 35;

export function getUiSoundKey(kind: UiSoundKind): string {
    return `ui-sound-${kind}`;
}

/** Candidate URLs in preference order — Phaser loads the first one the browser can play. */
export function getUiSoundUrls(kind: UiSoundKind): string[] {
    return [`assets/sfx/${FILES[kind]}.ogg`, `assets/sfx/${FILES[kind]}.m4a`];
}

export function getRelativeGain(kind: UiSoundKind): number {
    return RELATIVE_GAIN[kind];
}

/** Queues every UI sound on a loader, independent of the loader's current path. */
export function queueUiSounds(loader: Loader.LoaderPlugin): void {
    const previousPath = loader.path;

    loader.setPath('');
    for (const kind of UI_SOUND_KINDS) {
        loader.audio(getUiSoundKey(kind), getUiSoundUrls(kind));
    }
    loader.setPath(previousPath);
}
