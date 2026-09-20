import type { Translation } from './en';

export const ru: Translation = {
    common: {
        back: '< Назад',
    },
    hints: {
        confirm: 'Выбрать',
        back: 'Назад',
    },
    mainMenu: {
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
        controls: {
            noGamepad: 'Подключите геймпад и нажмите любую кнопку',
            rawButtons: 'Кнопки и оси как есть',
            rawLayout: 'Кнопки и оси как есть (раскладка не распознана)',
        },
        audio: {
            musicTrack: 'Музыкальный трек',
            masterVolume: 'Общая громкость',
            musicVolume: 'Громкость музыки',
            sfxVolume: 'Громкость эффектов',
            track: 'Трек {{number}}',
        },
    },
    game: {
        placeholder: 'Игра',
    },
    gameOver: {
        title: 'Игра окончена',
    },
};
