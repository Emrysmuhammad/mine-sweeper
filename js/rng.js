(function (root) {
  'use strict';

  /**
   * A small seeded random number generator (mulberry32).
   * The same seed always produces the same sequence of numbers in [0, 1),
   * which lets the tests build identical boards again and again.
   */
  function createRng(seed) {
    let state = seed >>> 0;
    return function next() {
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const api = { createRng };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Mines = root.Mines || {};
    Object.assign(root.Mines, api);
  }
})(typeof window !== 'undefined' ? window : globalThis);