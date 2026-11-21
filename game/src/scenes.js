// The three scenes of Lantern Row, drawn entirely in code on canvas.
//
// Every painter works in panel-local coordinates (580x480) and receives
// `alt`, the set of difference ids whose altered version it should draw.
// The left panel is painted with an empty set (the original picture) and
// the right panel with the scene's full difference list, so the two are
// identical everywhere except at the planted differences. Decorative
// scatter comes from a seeded generator restarted per panel, which keeps
// both panels in perfect step.

import { makeRng, scatter } from './random.js';

const W = 580;
const H = 480;

/** Fill a circle. */
function disc(ctx, x, y, r, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Fill a polygon from [x, y] points. */
function poly(ctx, points, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) ctx.lineTo(points[index][0], points[index][1]);
  ctx.closePath();
  ctx.fill();
}

/** Fill a rounded rectangle. */
function roundRect(ctx, x, y, w, h, r, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** A vertical linear gradient fill over the whole panel. */
function skyGradient(ctx, stops) {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  for (const [at, colour] of stops) gradient.addColorStop(at, colour);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

/** A soft radial glow, used for lantern light and the lighthouse lamp. */
function glow(ctx, x, y, r, colour) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, colour);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** A four-point sparkle star, the lucky star of the night market. */
function sparkle(ctx, x, y, r, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

/** One paper lantern centred at (x, y): caps, ribbed body and a tassel. */
function paperLantern(ctx, x, y, colour) {
  glow(ctx, x, y, 44, 'rgba(255,170,60,0.20)');
  ctx.strokeStyle = 'rgba(230,220,190,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - 44);
  ctx.lineTo(x, y - 20);
  ctx.stroke();
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x, y, 21, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (const dx of [-12, -6, 0, 6, 12]) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.abs(dx) + 3, 17, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  roundRect(ctx, x - 8, y - 21, 16, 5, 2, '#5b4326');
  roundRect(ctx, x - 8, y + 16, 16, 5, 2, '#5b4326');
  ctx.strokeStyle = '#d9b23c';
  ctx.beginPath();
  ctx.moveTo(x, y + 21);
  ctx.lineTo(x, y + 30);
  ctx.stroke();
  disc(ctx, x, y, 5, 'rgba(255,230,160,0.9)');
}

/** A market stall: posts, a striped awning and a wooden counter. */
function marketStall(ctx, x, awningTop, awningA, awningB) {
  ctx.fillStyle = '#4a3421';
  ctx.fillRect(x + 6, awningTop + 34, 10, 150);
  ctx.fillRect(x + 204, awningTop + 34, 10, 150);
  for (let stripe = 0; stripe < 8; stripe += 1) {
    ctx.fillStyle = stripe % 2 === 0 ? awningA : awningB;
    ctx.beginPath();
    ctx.moveTo(x + stripe * 27.5, awningTop + 34);
    ctx.lineTo(x + (stripe + 1) * 27.5, awningTop + 34);
    ctx.lineTo(x + (stripe + 1) * 27.5 - 6, awningTop);
    ctx.lineTo(x + stripe * 27.5 - 6, awningTop);
    ctx.closePath();
    ctx.fill();
  }
  roundRect(ctx, x, awningTop + 118, 220, 16, 4, '#6b4a2a');
  roundRect(ctx, x - 4, awningTop + 134, 228, 58, 4, '#54382a');
  ctx.fillStyle = 'rgba(255,210,130,0.10)';
  ctx.fillRect(x - 4, awningTop + 134, 228, 8);
}

/** A grid of small windows on a building face; `special` overrides one. */
function windowGrid(ctx, cols, rows, lit, special) {
  for (const cx of cols) {
    for (const cy of rows) {
      let colour = lit.has(`${cx},${cy}`) ? '#ffca6a' : '#39406b';
      if (special && special.x === cx && special.y === cy) colour = special.colour;
      roundRect(ctx, cx - 10, cy - 13, 20, 26, 3, colour);
      ctx.strokeStyle = 'rgba(10,12,30,0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 10, cy - 13, 20, 26);
      ctx.beginPath();
      ctx.moveTo(cx, cy - 13);
      ctx.lineTo(cx, cy + 13);
      ctx.stroke();
    }
  }
}

/** Scene 1: a night market strung with paper lanterns. */
function drawLanternRow(ctx, alt) {
  skyGradient(ctx, [[0, '#131c40'], [0.55, '#2c3a6e'], [1, '#1a2347']]);
  const stars = scatter(makeRng(101), 80, 8, 6, W - 16, 170);
  for (const [x, y] of stars) disc(ctx, x, y, 1.3, 'rgba(255,255,240,0.75)');
  if (!alt.has('lucky-star')) sparkle(ctx, 150, 58, 15, '#ffe9a3');

  // The moon, with an extra crater on the altered panel.
  glow(ctx, 472, 66, 62, 'rgba(240,235,200,0.25)');
  disc(ctx, 472, 66, 30, '#f2ecd4');
  disc(ctx, 462, 56, 6, 'rgba(190,182,150,0.8)');
  disc(ctx, 484, 76, 4.5, 'rgba(190,182,150,0.8)');
  if (alt.has('moon-crater')) disc(ctx, 458, 80, 7, 'rgba(178,168,138,0.9)');
  disc(ctx, 452, 48, 22, 'rgba(19,28,64,0.35)');

  // Rooftop silhouettes behind the stalls.
  poly(ctx, [[0, 196], [60, 160], [130, 196], [210, 168], [300, 198], [392, 164], [470, 196], [540, 170], [580, 196], [580, 480], [0, 480]], '#0d1330');

  // Two building faces with lit windows.
  ctx.fillStyle = '#232c52';
  ctx.fillRect(16, 196, 188, 196);
  ctx.fillStyle = '#27305a';
  ctx.fillRect(376, 188, 188, 204);
  const litLeft = new Set(['56,266', '136,226', '176,306', '96,346']);
  windowGrid(ctx, [56, 96, 136, 176], [226, 266, 306, 346], litLeft, null);
  const litRight = new Set(['402,236', '482,276', '442,356']);
  const special = { x: 522, y: 316, colour: alt.has('lit-window') ? '#39406b' : '#ffca6a' };
  windowGrid(ctx, [402, 442, 482, 522], [236, 276, 316, 356], litRight, special);

  // Cobblestone ground, laid before the stalls so they stand on it.
  ctx.fillStyle = '#171f3d';
  ctx.fillRect(0, 392, W, 88);
  const cobbles = scatter(makeRng(202), 46, 6, 402, W - 12, 66);
  ctx.fillStyle = 'rgba(120,135,190,0.20)';
  for (const [x, y] of cobbles) {
    ctx.beginPath();
    ctx.ellipse(x, y, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // The lantern wire and its seven paper lanterns.
  ctx.strokeStyle = 'rgba(220,210,180,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, 118);
  ctx.quadraticCurveTo(290, 168, 570, 108);
  ctx.stroke();
  const lanterns = [[70, 168], [140, 184], [215, 192], [290, 196], [360, 192], [428, 182], [500, 162]];
  for (const [x, y] of lanterns) {
    const isDiff = x === 428;
    const colour = isDiff && alt.has('lantern-color') ? '#2bb3a3' : '#e2483d';
    paperLantern(ctx, x, y, colour);
  }

  // Hanging sign boards with painted strokes.
  roundRect(ctx, 226, 226, 44, 64, 4, '#7a2e22');
  ctx.strokeStyle = '#f4d58a';
  ctx.lineWidth = 3;
  for (const dy of [242, 258, 274]) {
    ctx.beginPath();
    ctx.moveTo(236, dy);
    ctx.lineTo(260, dy);
    ctx.stroke();
  }

  marketStall(ctx, 24, 300, '#b8452f', '#e8dcc0');
  marketStall(ctx, 336, 292, '#2e6f79', '#e8dcc0');

  // Fruit basket on the left counter: oranges, or green apples when altered.
  const fruit = alt.has('fruit-basket') ? '#7ac74f' : '#f59e0b';
  poly(ctx, [[64, 392], [120, 392], [112, 420], [72, 420]], '#8a5a2b');
  for (const [fx, fy] of [[78, 386], [94, 382], [108, 387], [86, 394], [102, 395]]) disc(ctx, fx, fy, 8, fruit);
  // Jars and a pile of melons dress the rest of the left counter.
  roundRect(ctx, 150, 392, 18, 26, 4, '#c96f2e');
  roundRect(ctx, 176, 398, 14, 20, 4, '#a33b32');
  disc(ctx, 210, 406, 12, '#5d8a4a');
  disc(ctx, 228, 408, 10, '#6f9c58');

  // The vendor behind the right counter; the hat goes missing when altered.
  disc(ctx, 430, 306, 17, '#e8b48c');
  poly(ctx, [[404, 410], [456, 410], [446, 330], [414, 330]], '#31572c');
  ctx.strokeStyle = '#e8b48c';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(414, 344);
  ctx.lineTo(392, 370);
  ctx.moveTo(446, 344);
  ctx.lineTo(468, 366);
  ctx.stroke();
  if (!alt.has('vendor-hat')) {
    poly(ctx, [[430, 254], [404, 286], [456, 286]], '#d9a441');
    ctx.fillStyle = '#b9832f';
    ctx.fillRect(402, 284, 56, 5);
  }
  // Teapot and cups on the right counter.
  disc(ctx, 500, 396, 13, '#cfd6dd');
  ctx.fillStyle = '#9aa5ad';
  ctx.fillRect(512, 390, 12, 5);
  disc(ctx, 366, 402, 7, '#e8dcc0');
  disc(ctx, 384, 402, 7, '#e8dcc0');

  // The sleepy cat between the stalls, gone on the altered panel.
  if (!alt.has('sleepy-cat')) {
    ctx.fillStyle = '#4a5484';
    ctx.beginPath();
    ctx.ellipse(300, 436, 30, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    disc(ctx, 282, 414, 14, '#4a5484');
    poly(ctx, [[271, 406], [267, 392], [279, 400]], '#4a5484');
    poly(ctx, [[293, 406], [297, 392], [285, 400]], '#4a5484');
    ctx.strokeStyle = '#4a5484';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(328, 442);
    ctx.quadraticCurveTo(352, 436, 350, 418);
    ctx.stroke();
    ctx.strokeStyle = '#ffd98a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(275, 414);
    ctx.lineTo(280, 414);
    ctx.moveTo(284, 414);
    ctx.lineTo(289, 414);
    ctx.stroke();
  }
}

/** A koi: an oval body, a tail fan and a soft fin, rotated to `angle`. */
function koi(ctx, x, y, angle, body, patch) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 26, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  poly(ctx, [[-24, 0], [-40, -10], [-40, 10]], body);
  disc(ctx, 8, -3, 6, patch);
  disc(ctx, 20, 2, 2, '#263238');
  ctx.restore();
}

/** Scene 2: a koi pond garden with a pagoda and a cherry tree. */
function drawKoiPond(ctx, alt) {
  skyGradient(ctx, [[0, '#a8d4e6'], [0.5, '#dff2e4'], [1, '#cfe8cf']]);
  // Distant hills.
  ctx.fillStyle = '#9dc08f';
  ctx.beginPath();
  ctx.ellipse(120, 316, 190, 60, 0, Math.PI, Math.PI * 2);
  ctx.ellipse(470, 322, 220, 70, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // The pagoda: three roofed tiers on the left bank.
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(88, 250, 68, 56);
  ctx.fillRect(94, 196, 56, 40);
  ctx.fillRect(100, 148, 44, 32);
  poly(ctx, [[122, 92], [76, 126], [168, 126]], '#8a3b2e');
  poly(ctx, [[122, 138], [70, 174], [174, 174]], '#8a3b2e');
  poly(ctx, [[122, 190], [64, 228], [180, 228]], '#8a3b2e');
  poly(ctx, [[122, 244], [58, 282], [186, 282]], '#8a3b2e');
  ctx.fillStyle = '#6e2f24';
  ctx.fillRect(119, 78, 6, 16);
  disc(ctx, 122, 74, 5, '#d9a441');
  // Its middle window glows on the original, dark when altered.
  roundRect(ctx, 110, 200, 24, 28, 3, alt.has('pagoda-window') ? '#4c4438' : '#ffca6a');
  roundRect(ctx, 108, 262, 28, 44, 3, '#7a4a2b');
  roundRect(ctx, 104, 156, 16, 20, 3, '#4c4438');

  // Cherry tree on the right bank, heavy with blossom.
  ctx.strokeStyle = '#6b4a2a';
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(512, 308);
  ctx.quadraticCurveTo(496, 220, 462, 168);
  ctx.stroke();
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(478, 208);
  ctx.quadraticCurveTo(520, 168, 540, 128);
  ctx.stroke();
  const canopy = makeRng(303);
  for (let index = 0; index < 26; index += 1) {
    const cx = 400 + canopy() * 160;
    const cy = 62 + canopy() * 110;
    disc(ctx, cx, cy, 20 + canopy() * 16, index % 3 === 0 ? '#f6c6d8' : '#ef9fbc');
  }
  const petals = scatter(makeRng(404), 60, 380, 50, 190, 150);
  for (const [x, y] of petals) disc(ctx, x, y, 2.4, 'rgba(255,240,246,0.9)');
  // One proud cluster hangs lower than the rest — and vanishes when altered.
  if (!alt.has('blossom-cluster')) {
    for (const [dx, dy] of [[0, 0], [14, 6], [-13, 8], [6, 14], [-6, 16]]) {
      disc(ctx, 498 + dx, 116 + dy, 9, '#f8d7e4');
      disc(ctx, 498 + dx, 116 + dy, 4, '#ef9fbc');
    }
  }

  // The dragonfly hovering over the bank, gone when altered.
  if (!alt.has('dragonfly')) {
    ctx.strokeStyle = '#2e6f79';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(340, 152);
    ctx.lineTo(366, 140);
    ctx.stroke();
    ctx.fillStyle = 'rgba(220,240,250,0.75)';
    for (const [dx, dy, rot] of [[-8, -8, -0.5], [10, -12, 0.4], [-6, 6, 0.5], [12, 2, -0.4]]) {
      ctx.save();
      ctx.translate(352 + dx, 146 + dy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    disc(ctx, 366, 140, 4, '#20424a');
  }

  // Bamboo fence along the bank.
  ctx.fillStyle = '#b9a45e';
  for (let x = 206; x < 566; x += 18) ctx.fillRect(x, 282, 9, 34);
  ctx.fillStyle = '#9c8a4c';
  ctx.fillRect(200, 290, 372, 5);

  // The pond.
  const pond = ctx.createLinearGradient(0, 306, 0, H);
  pond.addColorStop(0, '#4aa184');
  pond.addColorStop(1, '#2c6e63');
  ctx.fillStyle = pond;
  ctx.fillRect(0, 306, W, 174);
  ctx.strokeStyle = 'rgba(230,250,240,0.35)';
  ctx.lineWidth = 2;
  const ripples = scatter(makeRng(505), 22, 16, 330, W - 32, 130);
  for (const [x, y] of ripples) {
    ctx.beginPath();
    ctx.ellipse(x, y, 14, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // The arched bridge, its deck planked; one plank is missing when altered.
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(310, 402, 122, Math.PI * 1.18, Math.PI * 1.82);
  ctx.stroke();
  ctx.strokeStyle = '#a06a35';
  ctx.lineWidth = 3;
  for (let px = 216; px <= 404; px += 16) {
    const py = 402 - Math.sqrt(Math.max(0, 122 * 122 - (px - 310) * (px - 310)));
    ctx.beginPath();
    ctx.moveTo(px, py - 10);
    ctx.lineTo(px, py + 10);
    ctx.stroke();
  }
  if (alt.has('bridge-plank')) {
    ctx.fillStyle = '#2c6e63';
    ctx.fillRect(297, 269, 26, 24);
  }
  ctx.fillStyle = '#7a4a2b';
  ctx.fillRect(196, 356, 12, 34);
  ctx.fillRect(412, 356, 12, 34);

  // The stone lantern on the bank; its flame is out when altered.
  ctx.fillStyle = '#8d9299';
  ctx.fillRect(226, 292, 12, 26);
  roundRect(ctx, 214, 262, 36, 32, 4, '#9aa0a6');
  ctx.fillStyle = '#7c8288';
  ctx.fillRect(208, 254, 48, 9);
  poly(ctx, [[232, 232], [206, 254], [258, 254]], '#7c8288');
  if (alt.has('lantern-flame')) {
    ctx.fillStyle = '#3c4043';
    ctx.fillRect(224, 270, 16, 16);
  } else {
    glow(ctx, 232, 278, 26, 'rgba(255,180,70,0.5)');
    disc(ctx, 232, 278, 7, '#ffca6a');
  }

  // Stepping stones and grass tufts on the near bank.
  ctx.fillStyle = '#7f8c74';
  for (const [x, y] of [[60, 330], [104, 352], [70, 384]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#4e7a3a';
  ctx.lineWidth = 2;
  for (const gx of [30, 540, 556, 470]) {
    for (const lean of [-6, 0, 6]) {
      ctx.beginPath();
      ctx.moveTo(gx, 316);
      ctx.quadraticCurveTo(gx + lean, 300, gx + lean * 2, 292);
      ctx.stroke();
    }
  }

  // Lily pads, one carrying a lotus flower that vanishes when altered.
  for (const [x, y, r] of [[120, 430, 24], [420, 440, 26], [520, 452, 20]]) {
    ctx.fillStyle = '#3e7d44';
    ctx.beginPath();
    ctx.arc(x, y, r, 0.3, Math.PI * 1.9);
    ctx.lineTo(x, y);
    ctx.fill();
  }
  if (!alt.has('lily-flower')) {
    ctx.fillStyle = '#f2a7c3';
    for (const rot of [-0.6, 0, 0.6]) {
      ctx.save();
      ctx.translate(420, 436);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, -8, 6, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    disc(ctx, 420, 434, 4, '#ffca6a');
  }

  // Three koi; the orange one turns white when altered.
  koi(ctx, 180, 398, 0.4, '#f2ede2', '#d94f30');
  koi(ctx, 300, 424, -0.25, alt.has('koi-color') ? '#f2ede2' : '#f07f2e', '#ffffff');
  koi(ctx, 452, 402, 2.8, '#e8e2d2', '#d94f30');
}

/** A gull in flight: two arcs over a small body. */
function gull(ctx, x, y, size) {
  ctx.strokeStyle = '#f4f1e6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x - size * 0.55, y, size * 0.55, Math.PI * 1.15, Math.PI * 1.85);
  ctx.arc(x + size * 0.55, y, size * 0.55, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
}

/** One wooden crate with a cross brace, top-left corner at (x, y). */
function crate(ctx, x, y, size) {
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#5f3d1c';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 3);
  ctx.lineTo(x + size - 3, y + size - 3);
  ctx.moveTo(x + size - 3, y + 3);
  ctx.lineTo(x + 3, y + size - 3);
  ctx.stroke();
}

/** Scene 3: a fishing harbor at dusk, lighthouse lit. */
function drawHarborDusk(ctx, alt) {
  skyGradient(ctx, [[0, '#2e2a55'], [0.45, '#8a4460'], [0.72, '#e8906f'], [1, '#f2a56b']]);
  const clouds = scatter(makeRng(606), 9, 30, 30, W - 60, 130);
  ctx.fillStyle = 'rgba(70,50,90,0.45)';
  for (const [x, y] of clouds) {
    ctx.beginPath();
    ctx.ellipse(x, y, 42, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  gull(ctx, 250, 66, 22);
  if (!alt.has('gull')) gull(ctx, 352, 86, 20);
  gull(ctx, 438, 56, 17);

  // The low sun and its shimmer path on the water.
  disc(ctx, 470, 292, 26, '#ffd98a');
  glow(ctx, 470, 292, 60, 'rgba(255,180,90,0.35)');

  // The sea.
  const sea = ctx.createLinearGradient(0, 300, 0, H);
  sea.addColorStop(0, '#4a4468');
  sea.addColorStop(1, '#232c52');
  ctx.fillStyle = sea;
  ctx.fillRect(0, 300, W, 180);
  ctx.fillStyle = 'rgba(255,190,110,0.35)';
  const shimmer = makeRng(707);
  for (let index = 0; index < 16; index += 1) {
    const y = 308 + index * 10;
    const w = 8 + shimmer() * 26;
    ctx.fillRect(470 - w / 2 + (shimmer() - 0.5) * 14, y, w, 3);
  }
  ctx.strokeStyle = 'rgba(220,225,250,0.30)';
  ctx.lineWidth = 2;
  const waves = scatter(makeRng(808), 20, 14, 330, W - 28, 120);
  for (const [x, y] of waves) {
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.quadraticCurveTo(x, y - 5, x + 10, y);
    ctx.stroke();
  }

  // The lighthouse on its rocks, beam sweeping right when lit.
  poly(ctx, [[52, 430], [84, 386], [150, 386], [182, 430]], '#3a3f5c');
  poly(ctx, [[76, 402], [104, 372], [140, 372], [162, 402]], '#484e6e');
  poly(ctx, [[96, 386], [102, 168], [132, 168], [138, 386]], '#e8e2d2');
  ctx.fillStyle = '#c23b2e';
  ctx.fillRect(99, 300, 36, 26);
  ctx.fillRect(103, 224, 30, 24);
  ctx.fillStyle = '#39406b';
  ctx.fillRect(94, 150, 48, 18);
  roundRect(ctx, 104, 122, 28, 30, 4, '#2c3350');
  if (alt.has('beam')) {
    disc(ctx, 118, 137, 7, '#8a8464');
  } else {
    glow(ctx, 118, 137, 34, 'rgba(255,220,130,0.55)');
    disc(ctx, 118, 137, 8, '#ffe9a3');
    ctx.fillStyle = 'rgba(255,224,140,0.20)';
    ctx.beginPath();
    ctx.moveTo(126, 128);
    ctx.lineTo(330, 96);
    ctx.lineTo(330, 196);
    ctx.lineTo(126, 146);
    ctx.closePath();
    ctx.fill();
  }
  poly(ctx, [[118, 104], [96, 122], [140, 122]], '#c23b2e');

  // The sailboat: hull, mast, a striped main sail and a jib.
  poly(ctx, [[330, 322], [474, 322], [452, 352], [352, 352]], '#7a4a2b');
  ctx.fillStyle = '#5f3d1c';
  ctx.fillRect(330, 318, 144, 7);
  ctx.fillStyle = '#4a3421';
  ctx.fillRect(394, 196, 5, 126);
  // Main sail: red-striped on the original, plain when altered.
  ctx.fillStyle = '#f4efe2';
  poly(ctx, [[404, 204], [404, 316], [468, 316]], '#f4efe2');
  if (!alt.has('sail-stripes')) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(404, 204);
    ctx.lineTo(404, 316);
    ctx.lineTo(468, 316);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = '#c23b2e';
    for (const sy of [232, 258, 284]) ctx.fillRect(404, sy, 64, 9);
    ctx.restore();
  }
  poly(ctx, [[394, 212], [394, 316], [344, 316]], '#e8dcc0');
  // The little red flag at the masthead, gone when altered.
  if (!alt.has('boat-flag')) poly(ctx, [[399, 168], [426, 176], [399, 186]], '#c23b2e');
  disc(ctx, 430, 336, 8, '#31456e');
  disc(ctx, 380, 336, 8, '#31456e');

  // A small rowboat tied up on the right.
  poly(ctx, [[478, 366], [566, 366], [548, 388], [494, 388]], '#5f7a8a');
  ctx.fillStyle = '#48606e';
  ctx.fillRect(478, 362, 88, 6);
  ctx.fillStyle = '#31456e';
  ctx.fillRect(512, 344, 8, 20);

  // The buoy bobbing left of the dock: red, or green when altered.
  poly(ctx, [[250, 372], [240, 398], [260, 398]], alt.has('buoy-color') ? '#3f9e4d' : '#d94f30');
  disc(ctx, 250, 404, 13, alt.has('buoy-color') ? '#3f9e4d' : '#d94f30');
  ctx.fillStyle = '#263238';
  ctx.fillRect(247, 360, 6, 12);

  // The foreground dock: a plank strip with posts.
  ctx.fillStyle = '#3d2c1c';
  ctx.fillRect(0, 420, W, 60);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  for (let x = 30; x < W; x += 46) {
    ctx.beginPath();
    ctx.moveTo(x, 420);
    ctx.lineTo(x, 480);
    ctx.stroke();
  }
  ctx.fillStyle = '#2e2115';
  for (const x of [40, 300, 556]) ctx.fillRect(x, 408, 14, 72);

  // The rope coil on the dock, gone when altered.
  if (!alt.has('rope-coil')) {
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 5;
    for (const r of [16, 10, 5]) {
      ctx.beginPath();
      ctx.ellipse(182, 446, r + 6, r * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // The crate stack on the dock; the top crate is gone when altered.
  crate(ctx, 490, 372, 48);
  crate(ctx, 490, 324, 48);
  if (!alt.has('top-crate')) crate(ctx, 490, 276, 48);
  crate(ctx, 428, 372, 48);
  // A lantern hangs off the dock post.
  paperLantern(ctx, 306, 396, '#e2483d');
}

/** The painters by scene id, as config.js names them. */
export const PAINTERS = {
  'lantern-row': drawLanternRow,
  'koi-pond': drawKoiPond,
  'harbor-dusk': drawHarborDusk,
};

/** Every difference id of a scene, as a set: the right panel's alter set. */
export function alterSetFor(scene) {
  return new Set(scene.diffs.map((diff) => diff.id));
}
