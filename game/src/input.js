// Pointer and keyboard input for Lantern Row.
//
// Clicks arrive in client pixels and are converted to the 1280x800 logical
// stage through the canvas's own box, so the game plays the same at any
// window size. A click inside either panel becomes a panel-local point
// for world.checkPoint; clicks on the canvas buttons and the title's
// start button become actions. The keyboard steers a crosshair over the
// panels: arrows or WASD move it, Tab hops between panels, Enter or Space
// checks the point under it, and H, N, R and M ask for a hint, the next
// scene, a restart and the mute toggle.

import { BUTTONS, PANEL, SCREENS, VIEW } from './config.js';
import { checkPoint, nextScene, startGame, startScene, useHint } from './world.js';
import { playClear, playClick, playFound, playHint, playWrong, toggleMuted } from './audio.js';

/** True when the logical point (x, y) falls inside a button box. */
function inside(box, x, y) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

/** Which panel a logical point falls in: 0 left, 1 right, -1 neither. */
function panelAt(x, y) {
  if (y < PANEL.y || y > PANEL.y + PANEL.height) return -1;
  if (x >= PANEL.leftX && x <= PANEL.leftX + PANEL.width) return 0;
  if (x >= PANEL.rightX && x <= PANEL.rightX + PANEL.width) return 1;
  return -1;
}

/** Convert a panel-stage point to panel-local coordinates. */
function toLocal(panel, x, y) {
  return { x: x - (panel === 0 ? PANEL.leftX : PANEL.rightX), y: y - PANEL.y };
}

/** Judge a check at a panel-local point and play its sound. */
function judge(world, x, y) {
  const result = checkPoint(world, x, y);
  if (result === 'found') {
    if (world.screen === SCREENS.CLEAR || world.screen === SCREENS.WON) playClear();
    else playFound();
  } else if (result === 'wrong') {
    playWrong();
  }
  return result;
}

/** Handle a logical-stage click for every screen. */
export function handleClick(world, x, y) {
  if (inside(BUTTONS.mute, x, y)) {
    toggleMuted();
    return;
  }
  if (world.screen === SCREENS.TITLE) {
    if (inside(BUTTONS.play, x, y)) {
      playClick();
      startGame(world);
    }
    return;
  }
  if (world.screen === SCREENS.TIMEOUT) {
    startScene(world, world.sceneIndex);
    return;
  }
  if (inside(BUTTONS.next, x, y) && (world.screen === SCREENS.CLEAR || world.screen === SCREENS.WON)) {
    playClick();
    if (world.screen === SCREENS.WON) startGame(world);
    else nextScene(world);
    return;
  }
  if (inside(BUTTONS.restart, x, y)) {
    playClick();
    startScene(world, world.sceneIndex);
    return;
  }
  if (inside(BUTTONS.hint, x, y)) {
    if (useHint(world) !== null) playHint();
    return;
  }
  const panel = panelAt(x, y);
  if (panel !== -1 && world.screen === SCREENS.PLAY) {
    const local = toLocal(panel, x, y);
    judge(world, local.x, local.y);
  }
}

/** Handle one key for every screen. */
export function handleKey(world, key) {
  const lower = key.toLowerCase();
  if (lower === 'm') {
    toggleMuted();
    return;
  }
  if (world.screen === SCREENS.TITLE) {
    if (key === 'Enter' || key === ' ') startGame(world);
    return;
  }
  if (world.screen === SCREENS.WON || world.screen === SCREENS.TIMEOUT) {
    if (key === 'Enter' || key === ' ') {
      if (world.screen === SCREENS.WON) startGame(world);
      else startScene(world, world.sceneIndex);
    }
    return;
  }
  if (world.screen === SCREENS.CLEAR) {
    if (lower === 'n' || key === 'Enter') nextScene(world);
    return;
  }
  if (world.screen !== SCREENS.PLAY) return;
  if (lower === 'h') {
    if (useHint(world) !== null) playHint();
    return;
  }
  if (lower === 'r') {
    startScene(world, world.sceneIndex);
    return;
  }
  const cursor = world.cursor;
  const step = 14;
  if (key === 'Tab') {
    cursor.panel = cursor.panel === 0 ? 1 : 0;
    cursor.visible = true;
    return;
  }
  const moves = {
    ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    a: [-step, 0], d: [step, 0], w: [0, -step], s: [0, step],
  };
  const move = moves[key] ?? moves[lower];
  if (move) {
    cursor.visible = true;
    cursor.x = Math.min(PANEL.width - 4, Math.max(4, cursor.x + move[0]));
    cursor.y = Math.min(PANEL.height - 4, Math.max(4, cursor.y + move[1]));
    return;
  }
  if (key === 'Enter' || key === ' ') {
    cursor.visible = true;
    judge(world, cursor.x, cursor.y);
  }
}

/** Attach pointer and keyboard listeners to the canvas and window. */
export function attachInput(canvas, world) {
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (VIEW.width / rect.width);
    const y = (event.clientY - rect.top) * (VIEW.height / rect.height);
    world.cursor.visible = false;
    handleClick(world, x, y);
  });
  window.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', ' '].includes(event.key)) {
      event.preventDefault();
    }
    handleKey(world, event.key);
  });
}
