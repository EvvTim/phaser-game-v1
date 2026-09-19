import sharp from 'sharp';
import fs from 'node:fs';

const NAMES = [
    'bar_full', 'bar_80', 'bar_60', 'panel_wood', 'bar_40', 'bar_20', 'bar_empty',
    'banner_hex', 'banner_rect', 'banner_arrow',
    'icon_square_menu', 'icon_square_back', 'icon_square_settings', 'icon_square_info',
    'icon_square_home', 'icon_square_sound_on', 'icon_square_sound_off',
    'icon_square_disabled', 'icon_square_blank',
    'icon_round_menu', 'icon_round_back', 'icon_round_settings', 'icon_round_info',
    'icon_round_home', 'icon_round_sound_on', 'icon_round_sound_off',
    'icon_round_disabled', 'icon_round_blank',
    'star_outline', 'star_filled', 'arrow_left', 'arrow_right', 'mark_x', 'mark_check',
    'ribbon_bar_long',
];

const DIR = './crops';
const OUT_DIR = '../../public/assets/ui';

async function main() {
    const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.png')).sort();
    if (files.length !== NAMES.length) {
        throw new Error(`expected ${NAMES.length} names for ${files.length} crops`);
    }

    const items = [];
    for (let i = 0; i < files.length; i++) {
        const meta = await sharp(`${DIR}/${files[i]}`).metadata();
        items.push({ name: NAMES[i], file: `${DIR}/${files[i]}`, w: meta.width, h: meta.height });
    }

    // Simple shelf bin-packing: widest-first, fixed atlas width, wrap into rows.
    const ATLAS_W = 1400;
    const PADDING = 4;
    const sorted = [...items].sort((a, b) => b.h - a.h);

    let cursorX = PADDING;
    let cursorY = PADDING;
    let shelfH = 0;
    let atlasW = 0;

    const placed = [];
    for (const item of sorted) {
        if (cursorX + item.w + PADDING > ATLAS_W) {
            cursorX = PADDING;
            cursorY += shelfH + PADDING;
            shelfH = 0;
        }
        placed.push({ ...item, x: cursorX, y: cursorY });
        cursorX += item.w + PADDING;
        shelfH = Math.max(shelfH, item.h);
        atlasW = Math.max(atlasW, cursorX);
    }
    const atlasH = cursorY + shelfH + PADDING;

    const composites = await Promise.all(
        placed.map(async (p) => ({ input: await sharp(p.file).toBuffer(), left: p.x, top: p.y })),
    );

    await sharp({
        create: { width: atlasW, height: atlasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
        .composite(composites)
        .png({ compressionLevel: 9 })
        .toFile(`${OUT_DIR}/menu-atlas.png`);

    const frames = {};
    for (const p of placed) {
        frames[p.name] = {
            frame: { x: p.x, y: p.y, w: p.w, h: p.h },
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w: p.w, h: p.h },
            sourceSize: { w: p.w, h: p.h },
        };
    }

    const atlasJson = {
        frames,
        meta: {
            app: 'phaser-game-v1 asset pipeline',
            image: 'menu-atlas.png',
            size: { w: atlasW, h: atlasH },
            scale: '1',
        },
    };

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(`${OUT_DIR}/menu-atlas.json`, JSON.stringify(atlasJson, null, 2));
    console.log(`packed ${placed.length} sprites into ${atlasW}x${atlasH} atlas -> ${OUT_DIR}`);
}

main();
