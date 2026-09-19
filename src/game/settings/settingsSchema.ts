import { z } from 'zod';
import { GLOW_QUALITIES } from '../config/glowQuality';
import { RENDER_QUALITIES } from '../config/pixelRatio';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../i18n/languages';

export const displaySettingsSchema = z.object({
    renderQuality: z.enum(RENDER_QUALITIES).default('auto'),
    glowQuality: z.enum(GLOW_QUALITIES).default('high'),
});
export type DisplaySettings = z.infer<typeof displaySettingsSchema>;

export const languageSettingsSchema = z.object({
    locale: z.enum(LANGUAGES).default(DEFAULT_LANGUAGE),
});
export type LanguageSettings = z.infer<typeof languageSettingsSchema>;

/**
 * Full persisted settings shape. Extend this (and the matching Settings
 * scene tab) as controls/language/audio settings are implemented — every
 * field needs a default so old, partially-shaped saved data still parses.
 */
export const settingsSchema = z.object({
    display: displaySettingsSchema.default({}),
    language: languageSettingsSchema.default({}),
});
export type Settings = z.infer<typeof settingsSchema>;
