// Drawing for Lantern Row: the stage, the header, both panels with their
// markers, the counter bar and the screen overlays. All state lives in
// world.js; this file only reads it and paints.

import {
  BUTTONS,
  FONT_BODY,
  FONT_COUNTER,
  FONT_HEADING,
  FONT_SMALL,
  FONT_TITLE,
  PANEL,
  SCENES,
  SCREENS,
  VIEW,
} from './config.js';
import { PAINTERS, alterSetFor } from './scenes.js';
import { currentScene, remaining } from './world.js';
import { isMuted } from './audio.js';

const INK = '#f2ecd4';
const DIM = '#a8adcc';
const GOLD = '#ffca6a';
const PAPER = '#232946';

/** Centred text helper. */
function centred(ctx, text, x, y, font, colour) {
  ctx.font = font;
  ctx.fillStyle = colour;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

/** Left-aligned text helper. */
function leftText(ctx, text, x, y, font, colour) {
  ctx.font = font;
  ctx.fillStyle = colour;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

/** A pill button with a label; `enabled` dims it when false. */
function drawButton(ctx, box, label, enabled) {
  ctx.fillStyle = enabled ? '#3d4a7a' : '#2a3050';
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 10);
  ctx.fill();
  ctx.strokeStyle = enabled ? GOLD : '#4a5484';
  ctx.lineWidth = 2;
  ctx.stroke();
  centred(ctx, label, box.x + box.w / 2, box.y + box.h / 2 + 1, FONT_BODY, enabled ? INK : DIM);
}

/** One panel: the scene picture, clipped and framed, at stage x `originX`. */
function drawPanel(ctx, world, originX, altered) {
  const scene = currentScene(world);
  ctx.save();
  ctx.translate(originX, PANEL.y);
  ctx.beginPath();
  ctx.rect(0, 0, PANEL.width, PANEL.height);
  ctx.clip();
  PAINTERS[scene.id](ctx, altered);
  ctx.restore();
  ctx.strokeStyle = '#0d1330';
  ctx.lineWidth = 6;
  ctx.strokeRect(originX - 3, PANEL.y - 3, PANEL.width + 6, PANEL.height + 6);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(originX - 3, PANEL.y - 3, PANEL.width + 6, PANEL.height + 6);
}

/** A found marker: a gold ring with a check, gently pulsing after a find. */
function drawMarker(ctx, x, y, age) {
  const pulse = age < 0.6 ? 1 + 0.25 * Math.sin(age * 16) : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.strokeStyle = '#ffd94d';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(20,16,0,0.55)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-2.5, 6);
  ctx.lineTo(9, -6);
  ctx.stroke();
  ctx.strokeStyle = '#fff3b0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-2.5, 6);
  ctx.lineTo(9, -6);
  ctx.stroke();
  ctx.restore();
}

/** Markers for every found difference, on both panels at once. */
function drawMarkers(ctx, world) {
  const scene = currentScene(world);
  for (const diff of scene.diffs) {
    if (!world.found.has(diff.id)) continue;
    const age = world.elapsed - (world.foundAt.get(diff.id) ?? 0);
    drawMarker(ctx, PANEL.leftX + diff.x, PANEL.y + diff.y, age);
    drawMarker(ctx, PANEL.rightX + diff.x, PANEL.y + diff.y, age);
  }
}

/** The fading red crosses a miss leaves behind, on both panels. */
function drawWrongMarks(ctx, world) {
  for (const mark of world.wrongMarks) {
    const alpha = Math.max(0, 1 - (world.elapsed - mark.at) / 0.9);
    ctx.strokeStyle = `rgba(255,84,84,${alpha})`;
    ctx.lineWidth = 5;
    for (const originX of [PANEL.leftX, PANEL.rightX]) {
      const x = originX + mark.x;
      const y = PANEL.y + mark.y;
      ctx.beginPath();
      ctx.moveTo(x - 11, y - 11);
      ctx.lineTo(x + 11, y + 11);
      ctx.moveTo(x + 11, y - 11);
      ctx.lineTo(x - 11, y + 11);
      ctx.stroke();
    }
  }
}

/** The pulsing ring a hint draws around its difference, on both panels. */
function drawHintRing(ctx, world) {
  if (world.hintId === null) return;
  const diff = currentScene(world).diffs.find((candidate) => candidate.id === world.hintId);
  if (!diff) return;
  const radius = diff.r + 8 + 5 * Math.sin(world.elapsed * 10);
  ctx.strokeStyle = '#7ae0ff';
  ctx.lineWidth = 4;
  for (const originX of [PANEL.leftX, PANEL.rightX]) {
    ctx.beginPath();
    ctx.arc(originX + diff.x, PANEL.y + diff.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** The keyboard crosshair, once the player steers with the keys. */
function drawCursor(ctx, world) {
  if (!world.cursor.visible || world.screen !== SCREENS.PLAY) return;
  const originX = world.cursor.panel === 0 ? PANEL.leftX : PANEL.rightX;
  const x = originX + world.cursor.x;
  const y = PANEL.y + world.cursor.y;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.moveTo(x - 20, y);
  ctx.lineTo(x - 6, y);
  ctx.moveTo(x + 6, y);
  ctx.lineTo(x + 20, y);
  ctx.moveTo(x, y - 20);
  ctx.lineTo(x, y - 6);
  ctx.moveTo(x, y + 6);
  ctx.lineTo(x, y + 20);
  ctx.stroke();
}

/** The header: title, scene name, the clock and the score. */
function drawHeader(ctx, world) {
  const scene = currentScene(world);
  leftText(ctx, 'LANTERN ROW', 36, 34, FONT_HEADING, GOLD);
  leftText(ctx, scene.name, 36, 68, FONT_BODY, INK);
  // The clock: a draining bar plus the seconds left, reddening when low.
  const fraction = Math.max(0, world.timeLeft / scene.time);
  ctx.fillStyle = '#2a3050';
  ctx.beginPath();
  ctx.roundRect(430, 24, 380, 20, 10);
  ctx.fill();
  ctx.fillStyle = world.timeLeft <= 15 ? '#ff5454' : GOLD;
  ctx.beginPath();
  ctx.roundRect(430, 24, Math.max(20, 380 * fraction), 20, 10);
  ctx.fill();
  centred(ctx, `${Math.ceil(world.timeLeft)}s`, 620, 66, FONT_BODY, world.timeLeft <= 15 ? '#ff5454' : INK);
  leftText(ctx, `Score ${world.score}`, 880, 34, FONT_HEADING, INK);
  leftText(ctx, `Mistakes ${world.mistakes}`, 880, 68, FONT_BODY, DIM);
  // The mute button.
  const mute = BUTTONS.mute;
  ctx.fillStyle = '#2a3050';
  ctx.beginPath();
  ctx.roundRect(mute.x, mute.y, mute.w, mute.h, 9);
  ctx.fill();
  centred(ctx, isMuted() ? '✕♪' : '♪', mute.x + mute.w / 2, mute.y + mute.h / 2 + 1, FONT_BODY, INK);
}

/** The bottom bar: the great counter, the found list and the buttons. */
function drawCounterBar(ctx, world) {
  const scene = currentScene(world);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 596, VIEW.width, 204);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 596, VIEW.width, 3);
  const left = remaining(world);
  centred(ctx, `${left}`, 118, 664, FONT_COUNTER, left === 0 ? '#7ae08a' : GOLD);
  centred(ctx, left === 1 ? 'difference to find' : 'differences to find', 118, 716, FONT_SMALL, DIM);
  // A dot per difference, filled gold with a check as each is found.
  scene.diffs.forEach((diff, index) => {
    const x = 240 + index * 36;
    ctx.fillStyle = world.found.has(diff.id) ? GOLD : '#3d4a7a';
    ctx.beginPath();
    ctx.arc(x, 636, 12, 0, Math.PI * 2);
    ctx.fill();
    if (world.found.has(diff.id)) {
      ctx.strokeStyle = '#232946';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 5, 636);
      ctx.lineTo(x - 1, 641);
      ctx.lineTo(x + 6, 631);
      ctx.stroke();
    }
  });
  // The found labels, in the order the scene lists them.
  const foundLabels = scene.diffs.filter((diff) => world.found.has(diff.id)).map((diff) => diff.label);
  leftText(ctx, foundLabels.length > 0 ? `Found: ${foundLabels.join(' · ')}` : 'Nothing found yet — study both pictures.', 240, 672, FONT_SMALL, DIM);
  leftText(ctx, world.message, 240, 704, FONT_BODY, INK);
  drawButton(ctx, BUTTONS.hint, `Hint (${world.hintsLeft})`, world.screen === SCREENS.PLAY && world.hintsLeft > 0);
  drawButton(ctx, BUTTONS.restart, 'Restart scene', true);
  drawButton(ctx, BUTTONS.next, world.sceneIndex === SCENES.length - 1 ? 'Finish' : 'Next scene', world.screen === SCREENS.CLEAR || world.screen === SCREENS.WON);
}

/** A dim veil and a centred card, the base of every overlay screen. */
function overlayCard(ctx, width, height) {
  ctx.fillStyle = 'rgba(10,12,28,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const x = (VIEW.width - width) / 2;
  const y = (VIEW.height - height) / 2;
  ctx.fillStyle = '#1b2138';
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 18);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();
  return { x, y };
}

/** The overlay for the current screen, if any. */
function drawOverlay(ctx, world) {
  if (world.screen === SCREENS.PLAY) return;
  if (world.screen === SCREENS.TITLE) {
    const { y } = overlayCard(ctx, 720, 380);
    centred(ctx, 'LANTERN ROW', VIEW.width / 2, y + 74, FONT_TITLE, GOLD);
    centred(ctx, 'Spot the Difference', VIEW.width / 2, y + 128, FONT_HEADING, INK);
    centred(ctx, 'Three scenes. Seven differences in each picture pair.', VIEW.width / 2, y + 188, FONT_BODY, DIM);
    centred(ctx, 'Click a difference in either picture — a miss costs 5 seconds.', VIEW.width / 2, y + 218, FONT_BODY, DIM);
    centred(ctx, 'Arrow keys move the ring, Enter checks it, H asks for a hint.', VIEW.width / 2, y + 248, FONT_BODY, DIM);
    drawButton(ctx, BUTTONS.play, 'Start hunting', true);
    return;
  }
  if (world.screen === SCREENS.CLEAR) {
    const { y } = overlayCard(ctx, 620, 300);
    centred(ctx, 'Scene cleared!', VIEW.width / 2, y + 84, FONT_TITLE, '#7ae08a');
    centred(ctx, world.message, VIEW.width / 2, y + 150, FONT_BODY, INK);
    centred(ctx, `Score so far: ${world.score}`, VIEW.width / 2, y + 192, FONT_BODY, DIM);
    centred(ctx, 'Press N or the Next scene button to go on.', VIEW.width / 2, y + 246, FONT_SMALL, DIM);
    return;
  }
  if (world.screen === SCREENS.WON) {
    const { y } = overlayCard(ctx, 680, 330);
    centred(ctx, 'Every difference found!', VIEW.width / 2, y + 84, FONT_TITLE, GOLD);
    centred(ctx, 'The market, the garden and the harbor are all solved.', VIEW.width / 2, y + 152, FONT_BODY, INK);
    centred(ctx, `Final score: ${world.score} · Mistakes: ${world.mistakes}`, VIEW.width / 2, y + 196, FONT_HEADING, INK);
    centred(ctx, 'Press Enter to hunt again.', VIEW.width / 2, y + 262, FONT_SMALL, DIM);
    return;
  }
  if (world.screen === SCREENS.TIMEOUT) {
    const { y } = overlayCard(ctx, 640, 310);
    centred(ctx, 'Out of time', VIEW.width / 2, y + 84, FONT_TITLE, '#ff5454');
    centred(ctx, world.message, VIEW.width / 2, y + 152, FONT_BODY, INK);
    centred(ctx, `${remaining(world)} differences stayed hidden. Score: ${world.score}`, VIEW.width / 2, y + 196, FONT_BODY, DIM);
    centred(ctx, 'Press Enter to try the scene again.', VIEW.width / 2, y + 252, FONT_SMALL, DIM);
  }
}

/** Paint the whole stage for the world's current state. */
export function drawGame(ctx, world) {
  ctx.fillStyle = '#141a30';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawHeader(ctx, world);
  const scene = currentScene(world);
  drawPanel(ctx, world, PANEL.leftX, new Set());
  drawPanel(ctx, world, PANEL.rightX, alterSetFor(scene));
  centred(ctx, 'ORIGINAL', PANEL.leftX + PANEL.width / 2, PANEL.y - 14, FONT_SMALL, DIM);
  centred(ctx, 'FIND THE CHANGES', PANEL.rightX + PANEL.width / 2, PANEL.y - 14, FONT_SMALL, DIM);
  drawMarkers(ctx, world);
  drawWrongMarks(ctx, world);
  drawHintRing(ctx, world);
  drawCursor(ctx, world);
  drawCounterBar(ctx, world);
  drawOverlay(ctx, world);
}
