import type { Translation } from './en';

export const uk: Translation = {
    common: {
        back: '< Назад',
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
        tabs: {
            display: 'Екран',
            controls: 'Керування',
            language: 'Мова',
            audio: 'Аудіо',
        },
        display: {
            glowQuality: 'Якість світіння',
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
            noGamepad: 'Підключіть геймпад і натисніть будь-яку кнопку',
            rawButtons: 'Кнопки й осі як є',
            rawLayout: 'Кнопки й осі як є (розкладку не розпізнано)',
        },
        audio: {
            music: 'Музика',
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
