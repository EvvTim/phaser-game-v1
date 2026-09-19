/**
 * Supported UI languages. Codes are ISO 639-1 (Ukrainian is `uk`, shown to
 * players as "UA" per the country-code convention they know from menus).
 */
export const LANGUAGES = ['ru', 'uk', 'en', 'pl'] as const;
export type Language = (typeof LANGUAGES)[number];

/** Used when the system language isn't one of ours, and as i18next's fallback for any missing string. */
export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * Picks the first supported language from a preference list of BCP 47 tags
 * (e.g. `navigator.languages`, most preferred first), matching on the
 * primary subtag — "uk-UA" and "pl-PL" match `uk` and `pl`. Ukrainian's
 * legacy country-style code "ua" is accepted too. Falls back to
 * {@link DEFAULT_LANGUAGE} if none match.
 */
export function pickSupportedLanguage(preferred: readonly string[]): Language {
    for (const tag of preferred) {
        const primary = tag.trim().toLowerCase().split(/[-_]/)[0];
        const code = primary === 'ua' ? 'uk' : primary;
        const match = LANGUAGES.find((language) => language === code);

        if (match) {
            return match;
        }
    }

    return DEFAULT_LANGUAGE;
}

/** The player's system/browser language if we support it, otherwise English. */
export function detectSystemLanguage(): Language {
    if (typeof navigator === 'undefined') {
        return DEFAULT_LANGUAGE;
    }

    const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
    return pickSupportedLanguage(preferred.filter(Boolean));
}

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
