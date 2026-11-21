// The staged states behind ?shot=<name>, used to take the screenshots.
//
// Each scene plays the real rules forward — differences are "clicked"
// through world.checkPoint at their true coordinates — and then freezes
// the clock, so a screenshot is an honest frame of the game mid-hunt:
// markers on the differences found, several still unfound, and the
// counter showing how many remain.

import { SCENES, SCREENS } from './config.js';
import { checkPoint, nextScene, startGame, startScene } from './world.js';

/** Click the first `count` differences of the current scene, for real. */
function findFirst(world, count) {
  const scene = SCENES[world.sceneIndex];
  for (let index = 0; index < count; index += 1) {
    const diff = scene.diffs[index];
    checkPoint(world, diff.x, diff.y);
  }
}

/** Click every difference of the current scene, clearing it. */
function clearScene(world) {
  findFirst(world, SCENES[world.sceneIndex].diffs.length);
}

/**
 * Stage the named shot on `world`:
 * - start:  the title screen over the first scene
 * - play:   scene 1 mid-hunt, 3 found and 4 to find (the cover)
 * - pond:   scene 2 mid-hunt, 2 found and 5 to find
 * - harbor: scene 3 mid-hunt, 4 found and 3 to find
 * - end:    the victory screen after all three scenes
 * Any other name stages the title screen.
 */
export function stageShot(world, name) {
  startGame(world);
  if (name === 'play') {
    findFirst(world, 3);
    world.timeLeft = 74;
    world.message = 'Found: Paper lantern. 4 to go.';
  } else if (name === 'pond') {
    clearScene(world);
    nextScene(world);
    findFirst(world, 2);
    world.timeLeft = 63;
    world.message = 'Found: Blossom cluster. 5 to go.';
  } else if (name === 'harbor') {
    clearScene(world);
    nextScene(world);
    clearScene(world);
    nextScene(world);
    findFirst(world, 4);
    world.timeLeft = 41;
    world.message = 'Found: Striped sail. 3 to go.';
  } else if (name === 'end') {
    clearScene(world);
    nextScene(world);
    clearScene(world);
    nextScene(world);
    clearScene(world);
  } else {
    world.screen = SCREENS.TITLE;
    startScene(world, 0);
    world.screen = SCREENS.TITLE;
  }
  world.frozen = true;
  world.elapsed = 2;
  return world;
}
