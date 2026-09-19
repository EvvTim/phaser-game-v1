import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Game, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { createValidatedGameConfig } from './config/gameConfig';

const StartGame = (parent: string): Game => {
    const { parent: validatedParent, width, height, backgroundColor } = createValidatedGameConfig(parent);

    const config: Phaser.Types.Core.GameConfig = {
        type: AUTO,
        parent: validatedParent,
        backgroundColor,
        scale: {
            mode: Scale.RESIZE,
            width,
            height,
            autoCenter: Scale.CENTER_BOTH,
        },
        scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
    };

    return new Game(config);
};

export default StartGame;
