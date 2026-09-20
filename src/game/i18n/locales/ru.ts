import type { Translation } from './en';

export const ru: Translation = {
    common: {
        back: 'Назад',
        open: 'Открыть',
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
        sections: {
            display: 'Экран',
            language: 'Язык',
            audio: 'Аудио',
            controls: 'Управление',
        },
        display: {
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
            tester: 'Проверка геймпада',
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
