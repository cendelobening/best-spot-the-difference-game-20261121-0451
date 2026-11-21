# Lantern Row — Spot the Difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/cendelobening/best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/cendelobening/best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

Bounty: https://make.fun/bounty/best-spot-the-difference-game-20261121-0451

**Lantern Row** is an original spot-the-difference game. Two near-identical
pictures sit side by side — the original on the left, the changed copy on
the right — and each pair hides **7 differences**: a moon crater that was
not there before, a lantern that changed colour, a cat that slipped away,
a lighthouse beam switched off. Click a difference in either picture and
it is ringed in gold on **both** panels at once, while the big counter in
the bar below counts down how many remain.

## The scenes

1. **Lantern Row** — a night market under paper lanterns: moon, lucky
   star, lantern colours, a vendor's hat, a fruit basket, a sleepy cat,
   a lit window. 120 seconds.
2. **Koi Pond Garden** — a pagoda, a cherry tree and an arched bridge
   over a koi pond: a dark pagoda window, a vanished blossom cluster, a
   dragonfly, an unlit stone lantern, a missing bridge plank, a koi that
   changed colour, a lily flower. 110 seconds.
3. **Harbor at Dusk** — a lighthouse, a striped sailboat and a crate
   stack on the dock: a missing gull, the beam, a masthead flag, the
   sail's stripes, a buoy's colour, the top crate, a rope coil.
   100 seconds.

Every scene is drawn entirely in code on a canvas — no image files, no
libraries, no network requests — and the decorative scatter (stars,
blossoms, ripples, cobbles) is seeded, so the two panels match perfectly
everywhere except at the planted differences.

## How it plays

- **Finds** score 100 points each; clearing a scene banks a time bonus
  of 2 points per second left on the clock.
- **Mistakes cost**: a wrong click takes 25 points and 5 seconds, and
  leaves a fading red cross on both panels.
- **Hints**: three per scene. A hint rings an unfound difference with a
  pulsing blue circle for a moment and costs 50 points.
- **The counter** always shows how many differences remain, with a dot
  per difference that fills in as you find them and a list of what you
  have found so far.
- Run out of time and the scene ends; clear all three scenes to win.

## Controls

- **Mouse** — click a difference in either picture; the Hint, Restart
  and Next buttons live in the bar below the pictures.
- **Arrow keys / WASD** — move the white crosshair over the pictures.
- **Tab** — hop the crosshair between the two pictures.
- **Enter / Space** — check the point under the crosshair, or start and
  continue on the overlay screens.
- **H** — hint · **N** — next scene · **R** — restart scene · **M** — mute.

All sound is synthesised with WebAudio (a chime per find, a buzz per
miss, an arpeggio per cleared scene); there are no audio files.

## Run it

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Then open http://localhost:8080 in a desktop browser. The game is plain
static files under `game/` — any static server works, and it plays fully
offline.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` into the output directory and writes `dossier.json` there
with `buildDossier` from `vendor/makefun-game.ts`.

## Screenshots

The four screenshots in `screenshots/` are real renders of the game in a
browser, staged deterministically through the game's own shot states
(see `shots.json` and `game/src/shots.js`): the cover is scene 1
mid-hunt with 3 differences found and 4 to find; the others show the
pond and the harbor mid-hunt and the victory screen.

## Layout

- `main.ts` — the hand-in program
- `game/index.html` — the page and its styles
- `game/src/config.js` — stage layout, buttons, scoring and the scene/difference tables
- `game/src/scenes.js` — the three scene painters (all the art)
- `game/src/world.js` — the rules: finds, misses, hints, the clock, the score
- `game/src/render.js` — header, panels, markers, counter bar, overlays
- `game/src/input.js` — mouse and keyboard
- `game/src/audio.js` — WebAudio sound cues
- `game/src/random.js` — the seeded generator that keeps both panels in step
- `game/src/shots.js` — the staged screenshot states
- `vendor/makefun-game.ts` — the make.fun dossier library, unchanged from the kit

SPDX-License-Identifier: MIT
