import sharp from 'sharp';
import fs from 'node:fs';

const SRC = './menu.jpg';
const OUT_DIR = './crops';
const THRESHOLD = 238; // channel value at/above which a pixel is considered "white background"
// Source crops are full-resolution slices of a 4243x4243 sheet (up to ~2000px
// per element) - way more than any in-game UI element needs. Downscale so the
// packed atlas stays a sane size while still being crisp at 2x DPR.
const SCALE = 0.4;

const { ordered } = JSON.parse(fs.readFileSync('./rects.json', 'utf8'));

fs.mkdirSync(OUT_DIR, { recursive: true });

async function keyOutWhite(buffer, w, h, channels) {
    const out = Buffer.alloc(w * h * 4);
    for (let i = 0; i < w * h; i++) {
        const r = buffer[i * channels];
        const g = buffer[i * channels + 1];
        const b = buffer[i * channels + 2];
        const minC = Math.min(r, g, b);
        let alpha;
        if (minC >= 255) alpha = 0;
        else if (minC <= THRESHOLD) alpha = 255;
        else alpha = Math.round(((255 - minC) / (255 - THRESHOLD)) * 255);
        out[i * 4] = r;
        out[i * 4 + 1] = g;
        out[i * 4 + 2] = b;
        out[i * 4 + 3] = alpha;
    }
    return out;
}

async function main() {
    for (let i = 0; i < ordered.length; i++) {
        const { x, y, w, h } = ordered[i];
        const { data, info } = await sharp(SRC)
            .extract({ left: x, top: y, width: w, height: h })
            .raw()
            .toBuffer({ resolveWithObject: true });

        const rgba = await keyOutWhite(data, info.width, info.height, info.channels);
        const targetW = Math.max(1, Math.round(info.width * SCALE));
        const targetH = Math.max(1, Math.round(info.height * SCALE));

        await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
            .resize(targetW, targetH, { kernel: 'lanczos3' })
            .png()
            .toFile(`${OUT_DIR}/${String(i).padStart(2, '0')}.png`);
    }
    console.log(`wrote ${ordered.length} crops to ${OUT_DIR}`);
}

main();
