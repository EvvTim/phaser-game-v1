import type { Translation } from './en';

export const pl: Translation = {
    common: {
        back: 'Wstecz',
        open: 'Otwórz',
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
        sections: {
            display: 'Ekran',
            language: 'Język',
            audio: 'Dźwięk',
            controls: 'Sterowanie',
        },
        display: {
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
            tester: 'Test kontrolera',
            noGamepad: 'Podłącz kontroler i naciśnij dowolny przycisk',
            rawButtons: 'Surowe przyciski i osie',
            rawLayout: 'Surowe przyciski i osie (nierozpoznany układ)',
        },
        audio: {
            musicTrack: 'Wybór muzyki',
            masterVolume: 'Głośność ogólna',
            musicVolume: 'Głośność muzyki',
            sfxVolume: 'Głośność efektów',
            track: 'Utwór {{number}}',
        },
    },
    game: {
        placeholder: 'Gra',
    },
    gameOver: {
        title: 'Koniec gry',
    },
};
