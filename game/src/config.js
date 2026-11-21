// Layout and tuning constants for Lantern Row, a spot-the-difference hunt.
//
// The stage is one fixed logical canvas of 1280x800, scaled by CSS to fit
// the window. Two picture panels sit side by side under the header; each
// panel is painted in its own local 580x480 space by the scene painters
// in scenes.js, and every difference below is a point in that same space.

export const VIEW = { width: 1280, height: 800 };

export const PANEL = { width: 580, height: 480, y: 100, gap: 44, leftX: 36 };
PANEL.rightX = PANEL.leftX + PANEL.width + PANEL.gap;

// Clickable canvas buttons, in logical stage coordinates.
export const BUTTONS = {
  hint: { x: 692, y: 712, w: 164, h: 54 },
  restart: { x: 872, y: 712, w: 164, h: 54 },
  next: { x: 1052, y: 712, w: 192, h: 54 },
  mute: { x: 1216, y: 18, w: 46, h: 46 },
  play: { x: 490, y: 516, w: 300, h: 58 },
};

// The screens the game can be on.
export const SCREENS = {
  TITLE: 'title',
  PLAY: 'play',
  CLEAR: 'clear',
  WON: 'won',
  TIMEOUT: 'timeout',
};

export const HINTS_PER_SCENE = 3;
export const FIND_POINTS = 100;
export const TIME_BONUS_PER_SECOND = 2;
export const HINT_COST = 50;
export const MISTAKE_SECONDS = 5;
export const MISTAKE_POINTS = 25;

// The three hand-built scenes. Each difference names the spot a player
// clicks (panel-local x, y and a generous radius) and the label the
// found list shows once it is spotted.
export const SCENES = [
  {
    id: 'lantern-row',
    name: 'Scene 1 · Lantern Row',
    subtitle: 'A night market under paper lanterns',
    time: 120,
    diffs: [
      { id: 'moon-crater', x: 472, y: 66, r: 30, label: 'Moon crater' },
      { id: 'lucky-star', x: 150, y: 58, r: 16, label: 'Lucky star' },
      { id: 'lantern-color', x: 428, y: 182, r: 24, label: 'Paper lantern' },
      { id: 'vendor-hat', x: 430, y: 272, r: 24, label: "Vendor's hat" },
      { id: 'fruit-basket', x: 92, y: 392, r: 26, label: 'Fruit basket' },
      { id: 'sleepy-cat', x: 300, y: 424, r: 30, label: 'Sleepy cat' },
      { id: 'lit-window', x: 522, y: 316, r: 20, label: 'Lit window' },
    ],
  },
  {
    id: 'koi-pond',
    name: 'Scene 2 · Koi Pond Garden',
    subtitle: 'A quiet garden at midday',
    time: 110,
    diffs: [
      { id: 'pagoda-window', x: 122, y: 214, r: 18, label: 'Pagoda window' },
      { id: 'blossom-cluster', x: 498, y: 116, r: 24, label: 'Blossom cluster' },
      { id: 'dragonfly', x: 352, y: 146, r: 20, label: 'Dragonfly' },
      { id: 'lantern-flame', x: 232, y: 280, r: 18, label: 'Stone lantern' },
      { id: 'bridge-plank', x: 310, y: 282, r: 20, label: 'Bridge plank' },
      { id: 'koi-color', x: 300, y: 424, r: 26, label: 'Orange koi' },
      { id: 'lily-flower', x: 420, y: 440, r: 20, label: 'Lily flower' },
    ],
  },
  {
    id: 'harbor-dusk',
    name: 'Scene 3 · Harbor at Dusk',
    subtitle: 'Fishing boats coming home',
    time: 100,
    diffs: [
      { id: 'gull', x: 352, y: 86, r: 18, label: 'Seagull' },
      { id: 'beam', x: 208, y: 146, r: 32, label: 'Lighthouse beam' },
      { id: 'boat-flag', x: 408, y: 177, r: 16, label: 'Boat flag' },
      { id: 'sail-stripes', x: 416, y: 262, r: 28, label: 'Striped sail' },
      { id: 'buoy-color', x: 250, y: 398, r: 20, label: 'Red buoy' },
      { id: 'top-crate', x: 514, y: 300, r: 24, label: 'Top crate' },
      { id: 'rope-coil', x: 182, y: 446, r: 24, label: 'Rope coil' },
    ],
  },
];

export const FONT_TITLE = 'bold 62px Georgia, "Times New Roman", serif';
export const FONT_HEADING = 'bold 28px Georgia, "Times New Roman", serif';
export const FONT_BODY = '16px Verdana, Geneva, sans-serif';
export const FONT_SMALL = '13px Verdana, Geneva, sans-serif';
export const FONT_COUNTER = 'bold 54px Georgia, "Times New Roman", serif';
