import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { createValidatedGameConfig } from './config/gameConfig';

const StartGame = (parent: string): Game => {
    const validated = createValidatedGameConfig(parent);

    const config: Phaser.Types.Core.GameConfig = {
        type: AUTO,
        ...validated,
        scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
    };

    return new Game(config);
};

export default StartGame;
