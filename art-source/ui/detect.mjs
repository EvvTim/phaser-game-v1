import sharp from 'sharp';
import fs from 'node:fs';

const SRC = './menu.jpg';
const DETECT_WIDTH = 1200; // downscale for fast connected-component labeling

async function main() {
    const meta = await sharp(SRC).metadata();
    const scale = DETECT_WIDTH / meta.width;
    const detectHeight = Math.round(meta.height * scale);

    const { data, info } = await sharp(SRC)
        .resize(DETECT_WIDTH, detectHeight)
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    const isBg = new Uint8Array(width * height);
    const THRESHOLD = 238;

    for (let i = 0; i < width * height; i++) {
        const r = data[i * channels];
        const g = data[i * channels + 1];
        const b = data[i * channels + 2];
        isBg[i] = r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD ? 1 : 0;
    }

    const labels = new Int32Array(width * height).fill(-1);
    const boxes = [];
    const stackX = new Int32Array(width * height);
    const stackY = new Int32Array(width * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            if (isBg[idx] || labels[idx] !== -1) continue;

            // BFS flood fill (8-connectivity)
            let sp = 0;
            stackX[sp] = x;
            stackY[sp] = y;
            sp++;
            labels[idx] = boxes.length;

            let minX = x, maxX = x, minY = y, maxY = y, area = 0;

            while (sp > 0) {
                sp--;
                const cx = stackX[sp];
                const cy = stackY[sp];
                area++;
                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = cx + dx;
                        const ny = cy + dy;
                        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
                        const nidx = ny * width + nx;
                        if (isBg[nidx] || labels[nidx] !== -1) continue;
                        labels[nidx] = boxes.length;
                        stackX[sp] = nx;
                        stackY[sp] = ny;
                        sp++;
                    }
                }
            }

            boxes.push({ minX, minY, maxX, maxY, area });
        }
    }

    const MIN_AREA = 40; // at detect resolution; filters JPEG-noise specks
    const filtered = boxes.filter((b) => b.area >= MIN_AREA);

    // Scale back up to full resolution, with a small padding margin.
    const PAD = 3;
    const fullW = meta.width;
    const fullH = meta.height;
    const rects = filtered.map((b) => {
        const x = Math.max(0, Math.round(b.minX / scale) - PAD);
        const y = Math.max(0, Math.round(b.minY / scale) - PAD);
        const x2 = Math.min(fullW, Math.round((b.maxX + 1) / scale) + PAD);
        const y2 = Math.min(fullH, Math.round((b.maxY + 1) / scale) + PAD);
        return { x, y, w: x2 - x, h: y2 - y };
    });

    // Sort into reading order: group into rows by y-center proximity, then left-to-right.
    rects.sort((a, b) => a.y - b.y);
    const rows = [];
    const ROW_TOLERANCE = 40; // full-res px
    for (const r of rects) {
        const cy = r.y + r.h / 2;
        let row = rows.find((row) => Math.abs(row.cy - cy) < ROW_TOLERANCE);
        if (!row) {
            row = { cy, items: [] };
            rows.push(row);
        }
        row.items.push(r);
        row.cy = row.items.reduce((s, i) => s + i.y + i.h / 2, 0) / row.items.length;
    }
    rows.sort((a, b) => a.cy - b.cy);
    for (const row of rows) row.items.sort((a, b) => a.x - b.x);

    const ordered = rows.flatMap((row) => row.items);

    console.log(`detected ${ordered.length} components (full image ${fullW}x${fullH})`);
    fs.writeFileSync('./rects.json', JSON.stringify({ fullW, fullH, rows: rows.map(r => r.items), ordered }, null, 2));

    rows.forEach((row, ri) => {
        console.log(`row ${ri}: ${row.items.length} items`, row.items.map(it => `${it.w}x${it.h}@(${it.x},${it.y})`).join('  '));
    });
}

main();
