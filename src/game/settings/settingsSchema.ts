import { z } from 'zod';
import { RENDER_QUALITIES } from '../config/pixelRatio';

export const displaySettingsSchema = z.object({
    renderQuality: z.enum(RENDER_QUALITIES).default('auto'),
});
export type DisplaySettings = z.infer<typeof displaySettingsSchema>;

/**
 * Full persisted settings shape. Extend this (and the matching Settings
 * scene tab) as controls/language/audio settings are implemented — every
 * field needs a default so old, partially-shaped saved data still parses.
 */
export const settingsSchema = z.object({
    display: displaySettingsSchema.default({}),
});
export type Settings = z.infer<typeof settingsSchema>;
