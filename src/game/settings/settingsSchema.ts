import { z } from 'zod';
import { DEFAULT_MUSIC_TRACK, MUSIC_TRACK_IDS } from '../audio/musicTracks';
import { DEFAULT_GLOW_QUALITY, GLOW_QUALITIES } from '../config/glowQuality';
import { RENDER_QUALITIES } from '../config/pixelRatio';
import { LANGUAGES, detectSystemLanguage } from '../i18n/languages';

export const displaySettingsSchema = z.object({
    renderQuality: z.enum(RENDER_QUALITIES).default('auto'),
    glowQuality: z.enum(GLOW_QUALITIES).default(DEFAULT_GLOW_QUALITY),
});
export type DisplaySettings = z.infer<typeof displaySettingsSchema>;

export const languageSettingsSchema = z.object({
    // Nothing saved yet → follow the system language (English if unsupported).
    locale: z.enum(LANGUAGES).default(detectSystemLanguage),
});
export type LanguageSettings = z.infer<typeof languageSettingsSchema>;

export const audioSettingsSchema = z.object({
    musicTrack: z.enum(MUSIC_TRACK_IDS).default(DEFAULT_MUSIC_TRACK),
});
export type AudioSettings = z.infer<typeof audioSettingsSchema>;

/**
 * Full persisted settings shape. Extend this (and the matching Settings
 * scene tab) as controls/language/audio settings are implemented — every
 * field needs a default so old, partially-shaped saved data still parses.
 */
export const settingsSchema = z.object({
    display: displaySettingsSchema.default({}),
    language: languageSettingsSchema.default({}),
    audio: audioSettingsSchema.default({}),
});
export type Settings = z.infer<typeof settingsSchema>;
