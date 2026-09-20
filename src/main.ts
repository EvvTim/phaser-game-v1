import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', () => {

    (window as unknown as { __game: unknown }).__game = StartGame('game-container');

});
