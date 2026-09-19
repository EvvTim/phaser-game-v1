import i18next from 'i18next';
import { DEFAULT_LANGUAGE, type Language } from './languages';
import { en } from './locales/en';
import { pl } from './locales/pl';
import { ru } from './locales/ru';
import { uk } from './locales/uk';

const instance = i18next.createInstance();

// Resources are bundled inline (no backend/HTTP), so init and later
// changeLanguage() calls complete synchronously — scenes can call `t()`
// straight away in `create()` with no loading state.
void instance.init({
    lng: DEFAULT_LANGUAGE,
    fallbackLng: 'en',
    initAsync: false,
    resources: {
        ru: { translation: ru },
        uk: { translation: uk },
        en: { translation: en },
        pl: { translation: pl },
    },
    // Phaser Text renders plain strings, not HTML — nothing to escape.
    interpolation: { escapeValue: false },
});

/** Translates a key in the current language, e.g. `t('mainMenu.play')`. */
export const t = instance.t;

export function setLanguage(language: Language): void {
    void instance.changeLanguage(language);
}

export function getLanguage(): string {
    return instance.language;
}
