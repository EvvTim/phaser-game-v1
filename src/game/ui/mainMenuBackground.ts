import { Geom, type GameObjects, type Scene } from 'phaser';
import { MAIN_MENU_BG_KEY, type DisplayedBackground } from './mainMenuLayout';

export interface MainMenuBackground extends DisplayedBackground {
    image: GameObjects.Image;
}

/**
 * The main menu artwork as a full-screen "cover" background: it fills the
 * window and crops the overflow — centred horizontally but pinned to the top,
 * so on a wide window the crop comes off the bottom and never cuts the
 * characters' heads. Shared by the main menu and the settings screens (which
 * blur and darken it), so both show the same composition.
 */
export function addMainMenuBackground(scene: Scene): MainMenuBackground {
    const { width, height } = scene.scale;
    const image = scene.add.image(width / 2, 0, MAIN_MENU_BG_KEY).setOrigin(0.5, 0);

    const view = new Geom.Rectangle(0, 0, width, height);
    const fitted = Geom.Rectangle.FitOutside(new Geom.Rectangle(0, 0, image.width, image.height), view);
    image.setDisplaySize(fitted.width, fitted.height);

    return { image, x: image.x - image.displayWidth / 2, width: image.displayWidth };
}
