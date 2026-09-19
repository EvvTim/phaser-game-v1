import type { Translation } from './en';

export const uk: Translation = {
    common: {
        back: '< Назад',
    },
    mainMenu: {
        title: 'Головне меню',
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
        comingSoon: 'Незабаром...',
    },
    game: {
        placeholder: 'Гра',
    },
    gameOver: {
        title: 'Гру завершено',
    },
};
