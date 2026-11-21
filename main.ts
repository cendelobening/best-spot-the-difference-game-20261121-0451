// Lantern Row — hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ (open game/index.html in a
// desktop browser, no build step, no network). This program delivers it:
// it copies game/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there with buildDossier from the
// vendored make.fun library, byte for byte as the grader rebuilds it.
//
// In the grader the output directory is /output; anywhere else the
// MAKEFUN_OUTPUT_DIR environment variable names it instead:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The grader reads the output as a different user, so every produced
// file must be world-readable (0644) regardless of the local umask.
// Directories are traversed only; chmod applies to files alone.
const OUTPUT_FILE_MODE = 0o644;
function makeWorldReadable(path) {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) {
      makeWorldReadable(join(path, entry));
    }
  } else {
    chmodSync(path, OUTPUT_FILE_MODE);
  }
}

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail fast, before copying anything, when the hand-in is incomplete:
// the game must have its entry page, and screenshots/ must hold the 3 or 4
// real renders the gate allows, each inside its 256 KiB cap.
if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing — nothing to hand in');
}
const shotsDir = join(repoRoot, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith('.'))
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/ holds ${shots.length} images, need 3 or 4`);
}
for (const name of shots) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > 262144) {
    throw new Error(`screenshots/${name} is ${size} bytes, over the 256 KiB cap`);
  }
}

// Copy the playable game exactly as it sits in the repository.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

// Copy the screenshots the same way; the first by name is the cover.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier carries the gate's own caps, so an entry the sealed scorer
// would refuse (a fifth screenshot, an oversized one, a game tree past
// 993 entries or 48 MiB, a path past 1,000 bytes) is refused here first.
// The build is a pure function of the repository's bytes: two runs of
// this program over the same commit write identical output, as required.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
makeWorldReadable(outputDir);
console.log(`Lantern Row handed in: game/, screenshots/ and dossier.json (${dossier.length} bytes) in ${outputDir}`);
