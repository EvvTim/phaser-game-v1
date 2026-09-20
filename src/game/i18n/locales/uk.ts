import type { Translation } from './en';

export const uk: Translation = {
    common: {
        back: 'Назад',
        open: 'Відкрити',
    },
    hints: {
        confirm: 'Вибрати',
        back: 'Назад',
    },
    mainMenu: {
        play: 'Грати',
        settings: 'Налаштування',
    },
    settings: {
        title: 'Налаштування',
        sections: {
            display: 'Екран',
            language: 'Мова',
            audio: 'Аудіо',
            controls: 'Керування',
        },
        display: {
            renderQuality: 'Якість рендеру',
            quality: {
                auto: 'Авто',
                high: 'Висока',
                medium: 'Середня',
                low: 'Низька',
            },
        },
        language: {
            heading: 'Мова',
        },
        controls: {
            tester: 'Перевірка геймпада',
            noGamepad: 'Підключіть геймпад і натисніть будь-яку кнопку',
            rawButtons: 'Кнопки й осі як є',
            rawLayout: 'Кнопки й осі як є (розкладку не розпізнано)',
        },
        audio: {
            musicTrack: 'Музичний трек',
            masterVolume: 'Загальна гучність',
            musicVolume: 'Гучність музики',
            sfxVolume: 'Гучність ефектів',
            track: 'Трек {{number}}',
        },
    },
    game: {
        placeholder: 'Гра',
    },
    gameOver: {
        title: 'Гру завершено',
    },
};
