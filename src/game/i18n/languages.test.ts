import { describe, expect, it } from 'vitest';
import { DEFAULT_LANGUAGE, pickSupportedLanguage } from './languages';

describe('pickSupportedLanguage', () => {
    it.each([
        ['ru', 'ru'],
        ['ru-RU', 'ru'],
        ['uk-UA', 'uk'],
        ['ua', 'uk'],
        ['pl-PL', 'pl'],
        ['en-GB', 'en'],
        ['PL_pl', 'pl'],
    ])('maps %s to %s', (tag, expected) => {
        expect(pickSupportedLanguage([tag])).toBe(expected);
    });

    it('uses the most preferred supported language, skipping unsupported ones', () => {
        expect(pickSupportedLanguage(['de-DE', 'pl-PL', 'en-US'])).toBe('pl');
    });

    it('falls back to English when nothing matches or the list is empty', () => {
        expect(pickSupportedLanguage(['de-DE', 'fr'])).toBe(DEFAULT_LANGUAGE);
        expect(pickSupportedLanguage([])).toBe('en');
        expect(pickSupportedLanguage([''])).toBe('en');
    });
});
