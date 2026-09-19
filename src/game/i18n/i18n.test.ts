import { afterEach, describe, expect, it } from 'vitest';
import { getLanguage, setLanguage, t } from './i18n';
import { DEFAULT_LANGUAGE, LANGUAGES } from './languages';
import { en } from './locales/en';
import { pl } from './locales/pl';
import { ru } from './locales/ru';
import { uk } from './locales/uk';

const LOCALES = { en, pl, ru, uk };

function flattenKeys(value: object, prefix = ''): string[] {
    return Object.entries(value).flatMap(([key, child]) =>
        typeof child === 'string' ? [`${prefix}${key}`] : flattenKeys(child as object, `${prefix}${key}.`),
    );
}

describe('i18n', () => {
    afterEach(() => setLanguage(DEFAULT_LANGUAGE));

    it('starts in English, the default language', () => {
        expect(getLanguage()).toBe(DEFAULT_LANGUAGE);
        expect(DEFAULT_LANGUAGE).toBe('en');
        expect(t('mainMenu.play')).toBe('Play');
    });

    it.each([
        ['ru', 'Играть'],
        ['uk', 'Грати'],
        ['en', 'Play'],
        ['pl', 'Graj'],
    ] as const)('translates into %s', (language, expected) => {
        setLanguage(language);
        expect(t('mainMenu.play')).toBe(expected);
    });

    it('supports every language it lists', () => {
        for (const language of LANGUAGES) {
            expect(LOCALES[language]).toBeDefined();
        }
    });

    it('has the same keys and no empty strings in every locale', () => {
        const expectedKeys = flattenKeys(en).sort();

        for (const language of LANGUAGES) {
            expect(flattenKeys(LOCALES[language]).sort(), language).toEqual(expectedKeys);
        }
        for (const key of expectedKeys) {
            for (const language of LANGUAGES) {
                const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], LOCALES[language]);
                expect(value, `${language}:${key}`).not.toBe('');
            }
        }
    });
});
