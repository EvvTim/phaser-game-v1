import { Boot } from './scenes/Boot';
import { GameOver } from './scenes/GameOver';
import { Game as MainGame } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { AUTO, Core, Game, Scale } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { createValidatedGameConfig } from './config/gameConfig';
import { getPixelRatio, toDevicePixels } from './config/pixelRatio';

const StartGame = (parent: string): Game => {
    const { parent: validatedParent, width, height, backgroundColor } = createValidatedGameConfig(parent);
    const pixelRatio = getPixelRatio();

    // Scale.RESIZE would fight us here: on every window resize it resets the
    // canvas backing buffer straight back to CSS-pixel size, ignoring zoom.
    // Scale.NONE + a manual `scale.resize()` call (below) is the supported
    // way to keep the canvas rendering at device-pixel resolution — see
    // config/pixelRatio.ts for why that matters.
    const config: Phaser.Types.Core.GameConfig = {
        type: AUTO,
        parent: validatedParent,
        backgroundColor,
        scale: {
            mode: Scale.NONE,
            width: toDevicePixels(width),
            height: toDevicePixels(height),
            zoom: 1 / pixelRatio,
            autoCenter: Scale.CENTER_BOTH,
        },
        scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
    };

    const game = new Game(config);

    const onWindowResize = (): void => {
        game.scale.resize(toDevicePixels(window.innerWidth), toDevicePixels(window.innerHeight));
    };

    window.addEventListener('resize', onWindowResize);
    game.events.once(Core.Events.DESTROY, () => {
        window.removeEventListener('resize', onWindowResize);
    });

    return game;
};

export default StartGame;
