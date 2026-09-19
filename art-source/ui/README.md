# UI sprite sheet -> atlas

`menu.jpg` is a raw, unsliced UI kit sheet (wood/green cartoon style — bars,
a panel, buttons, icon buttons, decorative marks) on a plain white
background. It's kept here (outside `public/`) as source art — it's 4MB and
never loaded by the game.

`detect.mjs` / `crop.mjs` / `pack.mjs` turn it into the atlas the game
actually loads (`public/assets/ui/menu-atlas.png` + `.json`):

1. `detect.mjs` — finds each element's bounding box via connected-component
   labeling (flood fill on non-white pixels), sorted into reading order.
   Writes `rects.json`.
2. `crop.mjs` — crops each box from the full-res source, keys the white
   background out to alpha (JPEG has no alpha channel), and downscales
   (source elements are up to ~2000px — far more than any in-game button
   needs). Writes numbered PNGs to `./crops/`.
3. `pack.mjs` — maps each crop (by detection order) to a name in its
   `NAMES` list, packs them into one atlas via simple shelf bin-packing, and
   writes `menu-atlas.png` + a TexturePacker-hash-format `menu-atlas.json`
   straight into `public/assets/ui/`.

To regenerate (e.g. after re-exporting the source art):

```sh
cd art-source/ui
npm install sharp --no-save
node detect.mjs && node crop.mjs && node pack.mjs
```

If the element count or layout changes, re-check `NAMES` in `pack.mjs`
against the crop order (`node crop.mjs` then look at `./crops/00.png`, `01.png`, ...).
