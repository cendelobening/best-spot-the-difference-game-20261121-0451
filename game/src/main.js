// Lantern Row bootstrap: size the canvas, wire the input, run the loop.
//
// The canvas backing store is the fixed 1280x800 logical stage; CSS scales
// it to fit the window while input.js converts clicks back through the
// canvas box. With ?shot=start|play|pond|harbor|end the game stages that
// screenshot state instead of the live title screen, frozen on its clock.
// A small handle is left on window for headless play-tests.

import { VIEW } from './config.js';
import { createWorld, tick } from './world.js';
import { drawGame } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('stage');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');

const world = createWorld();
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot !== null) stageShot(world, shot);

attachInput(canvas, world);
window.__lanternRow = { world };

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  tick(world, dt);
  drawGame(ctx, world);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
