import { Scene, GameObjects } from 'phaser';

export interface PoolOptions<T extends GameObjects.GameObject> {
    classType: new (...args: never[]) => T;
    maxSize: number;
    runChildUpdate?: boolean;
}

/**
 * Creates a `Phaser.GameObjects.Group` pre-configured for object pooling.
 * Use this for any frequently spawned object (bullets, enemies, floating
 * text, UI items) instead of calling `.destroy()` / `new` in the game loop:
 *
 *   const bullets = createPool(scene, { classType: Bullet, maxSize: 50 });
 *   const bullet = bullets.get(x, y) as Bullet | null; // null when pool is exhausted
 *   bullet?.setActive(true).setVisible(true);
 *   // ...later, to recycle:
 *   bullet.setActive(false).setVisible(false);
 */
export function createPool<T extends GameObjects.GameObject>(
    scene: Scene,
    options: PoolOptions<T>,
): GameObjects.Group {
    return scene.add.group({
        classType: options.classType,
        maxSize: options.maxSize,
        runChildUpdate: options.runChildUpdate ?? true,
        active: false,
        visible: false,
    });
}
