// Deterministic pseudo-random generator (Mulberry32).
// Produces stable noise for a given 32-bit seed.
(function () {
  function createPRNG (seed) {
    let state = seed >>> 0;
    return function next () {
      state |= 0;
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  globalThis.fpCreatePRNG = createPRNG;
})();
