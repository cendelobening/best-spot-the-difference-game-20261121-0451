// Deterministic randomness for Lantern Row.
//
// Both picture panels must be identical apart from the planted differences,
// so every decorative scatter (stars, blossoms, ripples, cobbles) is drawn
// from a seeded generator that restarts for each panel. Same seed, same
// scatter, every frame, on both sides.

/** A mulberry32 generator: tiny, fast and stable across browsers. */
export function makeRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A float in [min, max) drawn from the generator. */
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

/** An integer in [min, max] inclusive drawn from the generator. */
export function intRange(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Scatter `count` points inside a rectangle, returned as [x, y] pairs. */
export function scatter(rng, count, x, y, width, height) {
  const points = [];
  for (let index = 0; index < count; index += 1) {
    points.push([x + rng() * width, y + rng() * height]);
  }
  return points;
}
