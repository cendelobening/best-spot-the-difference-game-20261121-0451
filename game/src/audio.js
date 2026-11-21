// Sound for Lantern Row, synthesised with WebAudio — no audio files.
//
// The context is created lazily on the first user gesture so loading the
// page stays silent, and every cue is a couple of shaped oscillator notes:
// a bright two-note chime for a find, a low buzz for a miss, a rising run
// for a cleared scene and a soft click for buttons.

let context = null;
let muted = false;

/** Create the context on first use; returns null where audio is absent. */
function audioContext() {
  if (context === null) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

/** One shaped note: frequency, start offset and length in seconds. */
function note(frequency, delay, length, type, volume) {
  const ctx = audioContext();
  if (ctx === null || muted) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + length + 0.05);
}

/** A found difference: two bright notes, close together. */
export function playFound() {
  note(880, 0, 0.16, 'sine', 0.20);
  note(1318, 0.07, 0.22, 'sine', 0.18);
}

/** A miss: one low square buzz. */
export function playWrong() {
  note(140, 0, 0.22, 'square', 0.10);
}

/** A spent hint: a soft high shimmer. */
export function playHint() {
  note(1568, 0, 0.3, 'sine', 0.10);
  note(2093, 0.05, 0.34, 'sine', 0.07);
}

/** A cleared scene: a little rising arpeggio. */
export function playClear() {
  note(523, 0, 0.18, 'triangle', 0.18);
  note(659, 0.09, 0.18, 'triangle', 0.18);
  note(784, 0.18, 0.18, 'triangle', 0.18);
  note(1047, 0.27, 0.3, 'triangle', 0.2);
}

/** A plain button click. */
export function playClick() {
  note(660, 0, 0.07, 'sine', 0.10);
}

/** Toggle the mute flag; returns the new state. */
export function toggleMuted() {
  muted = !muted;
  return muted;
}

/** Whether sound is currently muted. */
export function isMuted() {
  return muted;
}
