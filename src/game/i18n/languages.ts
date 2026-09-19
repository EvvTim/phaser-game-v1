/**
 * Supported UI languages. Codes are ISO 639-1 (Ukrainian is `uk`, shown to
 * players as "UA" per the country-code convention they know from menus).
 */
export const LANGUAGES = ['ru', 'uk', 'en', 'pl'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'ru';

/**
 * Each language's name in that language — deliberately NOT translated, so a
 * player who ends up in a language they can't read can still find theirs.
 */
export const LANGUAGE_NATIVE_NAMES: Record<Language, string> = {
    ru: 'Русский',
    uk: 'Українська',
    en: 'English',
    pl: 'Polski',
};
