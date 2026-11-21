// The rules of Lantern Row, with no drawing and no DOM in them.
//
// A world holds the whole hunt: which screen, which scene, what has been
// found, the clock, the score, the hints left and the fleeting marks a
// click leaves behind. render.js draws what this holds; input.js feeds
// it points; main.js ticks it.

import {
  FIND_POINTS,
  HINTS_PER_SCENE,
  HINT_COST,
  MISTAKE_POINTS,
  MISTAKE_SECONDS,
  SCENES,
  SCREENS,
  TIME_BONUS_PER_SECOND,
} from './config.js';

/** A fresh world, sitting on the title screen over the first scene. */
export function createWorld() {
  const world = {
    screen: SCREENS.TITLE,
    sceneIndex: 0,
    found: new Set(),
    foundAt: new Map(),
    score: 0,
    mistakes: 0,
    hintsLeft: HINTS_PER_SCENE,
    timeLeft: SCENES[0].time,
    elapsed: 0,
    message: 'Find every difference between the two pictures.',
    hintId: null,
    hintUntil: 0,
    wrongMarks: [],
    frozen: false,
    cursor: { x: 290, y: 240, panel: 0, visible: false },
  };
  return world;
}

/** The scene the world is currently showing. */
export function currentScene(world) {
  return SCENES[world.sceneIndex];
}

/** How many differences of the current scene are still unfound. */
export function remaining(world) {
  return currentScene(world).diffs.length - world.found.size;
}

/** Start (or restart) the hunt from the first scene, score wiped. */
export function startGame(world) {
  world.score = 0;
  world.mistakes = 0;
  startScene(world, 0);
}

/** Begin a scene: nothing found, a full clock, fresh hints. */
export function startScene(world, index) {
  world.sceneIndex = index;
  world.found = new Set();
  world.foundAt = new Map();
  world.hintsLeft = HINTS_PER_SCENE;
  world.timeLeft = SCENES[index].time;
  world.hintId = null;
  world.wrongMarks = [];
  world.screen = SCREENS.PLAY;
  world.message = SCENES[index].subtitle + '.';
}

/**
 * Judge a click given in panel-local coordinates. Returns 'found' for a
 * new difference, 'already' for one found before, and 'wrong' for a miss,
 * which costs time and points. Finding the last difference clears the
 * scene and banks a time bonus.
 */
export function checkPoint(world, x, y) {
  if (world.screen !== SCREENS.PLAY) return 'ignored';
  const scene = currentScene(world);
  for (const diff of scene.diffs) {
    const dx = x - diff.x;
    const dy = y - diff.y;
    if (dx * dx + dy * dy <= diff.r * diff.r) {
      if (world.found.has(diff.id)) return 'already';
      world.found.add(diff.id);
      world.foundAt.set(diff.id, world.elapsed);
      world.score += FIND_POINTS;
      if (remaining(world) === 0) {
        const bonus = Math.ceil(world.timeLeft) * TIME_BONUS_PER_SECOND;
        world.score += bonus;
        world.screen = world.sceneIndex === SCENES.length - 1 ? SCREENS.WON : SCREENS.CLEAR;
        world.message = `Scene cleared! Time bonus +${bonus}.`;
      } else {
        world.message = `Found: ${diff.label}. ${remaining(world)} to go.`;
      }
      return 'found';
    }
  }
  world.mistakes += 1;
  world.score = Math.max(0, world.score - MISTAKE_POINTS);
  world.timeLeft = Math.max(0, world.timeLeft - MISTAKE_SECONDS);
  world.hintId = null;
  world.wrongMarks.push({ x, y, at: world.elapsed });
  world.message = `Not a difference — ${MISTAKE_SECONDS} seconds lost.`;
  return 'wrong';
}

/**
 * Spend a hint: ring the subtlest unfound difference (the one with the
 * smallest click radius) for a moment and charge the hint cost. Returns
 * the difference id, or null when no hint is left or nothing remains.
 */
export function useHint(world) {
  if (world.screen !== SCREENS.PLAY || world.hintsLeft <= 0) return null;
  let diff = null;
  for (const candidate of currentScene(world).diffs) {
    if (world.found.has(candidate.id)) continue;
    if (diff === null || candidate.r < diff.r) diff = candidate;
  }
  if (diff === null) return null;
  world.hintsLeft -= 1;
  world.score = Math.max(0, world.score - HINT_COST);
  world.hintId = diff.id;
  world.hintUntil = world.elapsed + 1.6;
  world.message = `A hint glimmers… ${world.hintsLeft} hints left.`;
  return diff.id;
}

/** Move on from a cleared scene to the next one. */
export function nextScene(world) {
  if (world.screen !== SCREENS.CLEAR) return;
  startScene(world, world.sceneIndex + 1);
}

/** Advance the clock and fade the fleeting marks. */
export function tick(world, dt) {
  if (world.frozen) return;
  world.elapsed += dt;
  if (world.screen !== SCREENS.PLAY) return;
  world.timeLeft -= dt;
  if (world.hintId !== null && world.elapsed > world.hintUntil) world.hintId = null;
  world.wrongMarks = world.wrongMarks.filter((mark) => world.elapsed - mark.at < 0.9);
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    world.screen = SCREENS.TIMEOUT;
    world.message = 'Time is up! The last differences stay hidden… this time.';
  }
}
