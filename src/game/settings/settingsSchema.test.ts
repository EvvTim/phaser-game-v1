import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '../i18n/languages';
import { settingsSchema } from './settingsSchema';

describe('settingsSchema', () => {
    it('fills in defaults when given an empty object', () => {
        const result = settingsSchema.parse({});
        expect(result.display.renderQuality).toBe('auto');
    });

    it('accepts a valid render quality', () => {
        const result = settingsSchema.parse({ display: { renderQuality: 'medium' } });
        expect(result.display.renderQuality).toBe('medium');
    });

    it('defaults glow quality to high and validates it', () => {
        expect(settingsSchema.parse({}).display.glowQuality).toBe('high');
        expect(settingsSchema.parse({ display: { glowQuality: 'low' } }).display.glowQuality).toBe('low');
        expect(settingsSchema.safeParse({ display: { glowQuality: 'auto' } }).success).toBe(false);
    });

    it('defaults the language to a supported one (system language, else English)', () => {
        expect(LANGUAGES).toContain(settingsSchema.parse({}).language.locale);
    });

    it.each(['ru', 'uk', 'en', 'pl'])('accepts the %s language', (locale) => {
        expect(settingsSchema.parse({ language: { locale } }).language.locale).toBe(locale);
    });

    it('rejects an unsupported language', () => {
        expect(settingsSchema.safeParse({ language: { locale: 'de' } }).success).toBe(false);
    });

    it('rejects an unknown render quality', () => {
        const result = settingsSchema.safeParse({ display: { renderQuality: 'ultra' } });
        expect(result.success).toBe(false);
    });
});
