# Gamepad button prompts -> atlas

Controller-button icons (shoulders, triggers, face buttons, Select/Start,
D-pad) shown by `src/game/ui/GamepadHint.ts` next to the tab bar and in the
Settings footer, and by the Controls-tab gamepad tester
(`src/game/ui/GamepadTester.ts`), picked per controller brand
(`src/game/ui/gamepadPrompts.ts`).

They come from **[Gamepad Prompt Asset Pack](https://github.com/AL2009man/Gamepad-Prompt-Asset-Pack)
by AL2009man** (MIT — `LICENSE` here, and shipped next to the atlas as
`public/assets/gamepad/LICENSE-Gamepad-Prompt-Asset-Pack.txt`). That pack is
the one its author designates as usable in commercial games (the sibling
"Gamepad Asset Pack" is not — many of its images are traced from official
platform art). The only exception the author names is platform *Guide*
buttons, which we don't use.

`svg/` holds the handful of source SVGs we use (copied unmodified). Each one
has three style layers (Transparent / White outline / Black outline);
`build-atlas.mjs` renders each icon twice — the Black-outline layer as the
idle frame (`name`) and the White-outline layer as the pressed frame
(`name_on`) — at 96px high, and packs them into
`public/assets/gamepad/prompts-atlas.{png,json}`:

```sh
cd art-source/gamepad
bun add sharp --no-save
bun build-atlas.mjs
```

To use another icon, copy its SVG from the pack into `svg/`, add it to
`ICONS` in `build-atlas.mjs`, re-run, and add the frame name to
`GAMEPAD_FRAMES` in `src/game/ui/gamepadPrompts.ts` (a test checks that every
referenced frame exists in the atlas).
