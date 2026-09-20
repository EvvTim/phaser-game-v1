// Renders the selected Gamepad Prompt Asset Pack SVGs into one texture atlas
// (public/assets/gamepad/prompts-atlas.{png,json}). Run from this folder:
//
//   bun add sharp --no-save
//   bun build-atlas.mjs
//
// Every source SVG carries three style layers (Transparent / White outline /
// Black outline) in one file; we switch on just the one named by STYLE and
// hide the others before rasterizing.
import sharp from 'sharp';
import fs from 'node:fs';

// Two styles per icon: idle = black fill / white outline (reads on both blue
// and wood), pressed = the inverse (white fill), stored as "<name>_on" and
// tinted yellow in-game.
const STYLES = [
    { suffix: '', labels: ['Style - Outline (Black)'] },
    // shared-X.svg spells its layer "Outline - (White)".
    { suffix: '_on', labels: ['Style - Outline (White)', 'Style - Outline - (White)'] },
];
const HEIGHT = 96; // px — displayed at ~30 CSS px, so 2-3x headroom for HiDPI
const OUT_DIR = '../../public/assets/gamepad';
const ATLAS_MAX_WIDTH = 1400;

// frame name -> source svg. Names are referenced from src/game/ui/gamepadPrompts.ts.
// Note the pack's own typos in two D-pad file names ("sharerd", "D-PA Down").
const ICONS = {
    shared_l1: 'shared-L1.svg',
    shared_r1: 'shared-R1.svg',
    shared_l2: 'shared-L2.svg',
    shared_r2: 'shared-R2.svg',
    shared_a: 'shared-A.svg',
    shared_b: 'shared-B.svg',
    shared_x: 'shared-X.svg',
    shared_y: 'shared-Y.svg',
    shared_select: 'shared-Select.svg',
    shared_start: 'shared-Start.svg',
    shared_dpad: 'sharerd-D-PAD.svg',
    shared_dpad_up: 'shared-D-PAD Up.svg',
    shared_dpad_down: 'shared-D-PA Down.svg',
    shared_dpad_left: 'shared-D-PAD Left.svg',
    shared_dpad_right: 'shared-D-PAD Right.svg',
    nintendo_l: 'nintendo-L.svg',
    nintendo_r: 'nintendo-R.svg',
    nintendo_zl: 'nintendo-ZL.svg',
    nintendo_zr: 'nintendo-ZR.svg',
    nintendo_minus: 'nintendo-Minus.svg',
    nintendo_plus: 'nintendo-Plus.svg',
    ps_cross: 'ps-Cross.svg',
    ps_circle: 'ps-Circle.svg',
    ps_square: 'ps-Square.svg',
    ps_triangle: 'ps-Triangle.svg',
    ps_create: 'ps5-Create.svg',
    ps_options: 'ps4-Option.svg',
    xbox_view: 'xbox-View.svg',
    xbox_menu: 'xbox-Menu.svg',
};

// Shows only the style layer whose label is in `labels`, hiding the other
// "Style - ..." layers. Works per <g> tag because Inkscape doesn't keep
// attributes in a fixed order (style may come before or after the label).
function selectStyle(svg, labels, file) {
    let found = false;
    const out = svg.replace(/<g\b[^>]*>/g, (tag) => {
        const label = /inkscape:label="([^"]*)"/.exec(tag)?.[1];
        if (!label?.startsWith('Style - ')) {
            return tag;
        }

        const show = labels.includes(label);
        found ||= show;
        const display = show ? 'inline' : 'none';

        if (/\sstyle="/.test(tag)) {
            return tag.replace(/\sstyle="([^"]*)"/, (_, style) => {
                const rest = style.replace(/display:[^;]*;?/, '');
                return ` style="${rest}${rest && !rest.endsWith(';') ? ';' : ''}display:${display}"`;
            });
        }
        return tag.replace(/^<g\b/, `<g style="display:${display}"`);
    });

    if (!found) {
        throw new Error(`${file}: none of the style layers ${JSON.stringify(labels)} found`);
    }
    return out;
}

const PADDING = 4;
const items = [];
for (const [name, file] of Object.entries(ICONS)) {
    const source = fs.readFileSync(`svg/${file}`, 'utf8');
    for (const { suffix, labels } of STYLES) {
        const { data, info } = await sharp(Buffer.from(selectStyle(source, labels, file)), { density: 400 })
            .resize({ height: HEIGHT })
            .png()
            .toBuffer({ resolveWithObject: true });
        items.push({ name: name + suffix, data, w: info.width, h: info.height });
    }
}

// Shelf packing: fill rows left to right, wrap at ATLAS_MAX_WIDTH.
let cursorX = PADDING;
let cursorY = PADDING;
let atlasW = 0;
for (const item of items) {
    if (cursorX + item.w + PADDING > ATLAS_MAX_WIDTH) {
        cursorX = PADDING;
        cursorY += HEIGHT + PADDING;
    }
    item.x = cursorX;
    item.y = cursorY;
    cursorX += item.w + PADDING;
    atlasW = Math.max(atlasW, cursorX);
}
const atlasH = cursorY + HEIGHT + PADDING;

fs.mkdirSync(OUT_DIR, { recursive: true });
await sharp({ create: { width: atlasW, height: atlasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(items.map((i) => ({ input: i.data, left: i.x, top: i.y })))
    .png({ compressionLevel: 9 })
    .toFile(`${OUT_DIR}/prompts-atlas.png`);

const frames = {};
for (const i of items) {
    frames[i.name] = {
        frame: { x: i.x, y: i.y, w: i.w, h: i.h },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: i.w, h: i.h },
        sourceSize: { w: i.w, h: i.h },
    };
}
fs.writeFileSync(
    `${OUT_DIR}/prompts-atlas.json`,
    JSON.stringify({ frames, meta: { image: 'prompts-atlas.png', size: { w: atlasW, h: atlasH }, scale: '1' } }, null, 2),
);
console.log(`wrote ${items.length} frames, ${atlasW}x${atlasH}`);
