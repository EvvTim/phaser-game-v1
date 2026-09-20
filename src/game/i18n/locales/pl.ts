import type { Translation } from './en';

export const pl: Translation = {
    common: {
        back: '< Wstecz',
    },
    hints: {
        confirm: 'Wybierz',
        back: 'Wstecz',
    },
    mainMenu: {
        play: 'Graj',
        settings: 'Ustawienia',
    },
    settings: {
        title: 'Ustawienia',
        tabs: {
            display: 'Ekran',
            controls: 'Sterowanie',
            language: 'Język',
            audio: 'Dźwięk',
        },
        display: {
            glowQuality: 'Jakość poświaty',
            renderQuality: 'Jakość renderowania',
            quality: {
                auto: 'Auto',
                high: 'Wysoka',
                medium: 'Średnia',
                low: 'Niska',
            },
        },
        language: {
            heading: 'Język',
        },
        controls: {
            noGamepad: 'Podłącz kontroler i naciśnij dowolny przycisk',
            rawButtons: 'Surowe przyciski i osie',
            rawLayout: 'Surowe przyciski i osie (nierozpoznany układ)',
        },
        comingSoon: 'Wkrótce...',
    },
    game: {
        placeholder: 'Gra',
    },
    gameOver: {
        title: 'Koniec gry',
    },
};
