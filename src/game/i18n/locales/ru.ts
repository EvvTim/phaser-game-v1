import type { Translation } from './en';

export const ru: Translation = {
    common: {
        back: '< Назад',
    },
    mainMenu: {
        title: 'Главное меню',
        play: 'Играть',
        settings: 'Настройки',
    },
    settings: {
        title: 'Настройки',
        tabs: {
            display: 'Экран',
            controls: 'Управление',
            language: 'Язык',
            audio: 'Аудио',
        },
        display: {
            glowQuality: 'Качество свечения',
            renderQuality: 'Качество рендера',
            quality: {
                auto: 'Авто',
                high: 'Высокое',
                medium: 'Среднее',
                low: 'Низкое',
            },
        },
        language: {
            heading: 'Язык',
        },
        comingSoon: 'Скоро...',
    },
    game: {
        placeholder: 'Игра',
    },
    gameOver: {
        title: 'Игра окончена',
    },
};
