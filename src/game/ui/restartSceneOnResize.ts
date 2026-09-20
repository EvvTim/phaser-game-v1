import { Scale, Scenes, type Scene, type Structs } from 'phaser';

/**
 * Rebuilds a scene when the game canvas is actually resized (the canvas
 * follows the window — see game/main.ts — but a scene's layout is computed
 * once, in `create()`). Phaser also emits the resize event when the size did
 * not change (e.g. re-applying the same zoom), so those are ignored. The
 * listener is removed when the scene shuts down.
 *
 * `getData` supplies the data the restarted scene is given, e.g. its active tab.
 */
export function restartSceneOnResize(scene: Scene, getData?: () => object): void {
    const { width, height } = scene.scale;

    const onResize = (gameSize: Structs.Size): void => {
        if (gameSize.width === width && gameSize.height === height) {
            return;
        }
        scene.scene.restart(getData?.());
    };

    scene.scale.on(Scale.Events.RESIZE, onResize);
    scene.events.once(Scenes.Events.SHUTDOWN, () => {
        scene.scale.off(Scale.Events.RESIZE, onResize);
    });
}
