import { z } from 'zod';

/** Volumes are stored as whole percents (0-100), which keeps saved settings free of float noise. */
export const volumePercentSchema = z.number().int().min(0).max(100);

export const DEFAULT_MASTER_VOLUME = 100;
/** Matches how loud the menu music was before it had a slider. */
export const DEFAULT_MUSIC_VOLUME = 50;
export const DEFAULT_SFX_VOLUME = 70;

/** Step of the -/+ buttons, and the snap of dragging the bar. */
export const VOLUME_BUTTON_STEP = 10;
export const VOLUME_DRAG_STEP = 5;

export interface VolumeSettings {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
}

export function clampPercent(value: number): number {
    return Math.min(100, Math.max(0, Math.round(value)));
}

/** Moves a percent by `delta`, staying within 0-100. */
export function stepPercent(value: number, delta: number): number {
    return clampPercent(value + delta);
}

/** Maps a position along a bar (0-1, clamped) to the nearest `step` percent. */
export function percentFromRatio(ratio: number, step: number = VOLUME_DRAG_STEP): number {
    const percent = Math.min(1, Math.max(0, ratio)) * 100;
    return clampPercent(Math.round(percent / step) * step);
}

/** A 0-100 percent as a 0-1 linear gain. */
export function percentToGain(percent: number): number {
    return clampPercent(percent) / 100;
}

/** Final gain of the menu music: master x music. */
export function getMusicGain(volumes: VolumeSettings): number {
    return percentToGain(volumes.masterVolume) * percentToGain(volumes.musicVolume);
}

/** Final gain of UI sound effects: master x effects. */
export function getSfxGain(volumes: VolumeSettings): number {
    return percentToGain(volumes.masterVolume) * percentToGain(volumes.sfxVolume);
}
