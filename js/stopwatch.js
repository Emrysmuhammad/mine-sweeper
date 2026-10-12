(function (root) {
  'use strict';

  /**
   * A stopwatch based on timestamps. Every method receives `now` in
   * milliseconds instead of reading the clock itself, which keeps it
   * accurate (even if the screen refreshes slowly) and easy to test.
   */
  class Stopwatch {
    constructor() {
      this.reset();
    }

    reset() {
      this.running = false;
      this.startedAt = null;
      this.accumulatedMs = 0;
    }

    start(now) {
      if (this.running) return;
      this.running = true;
      this.startedAt = now;
    }

    stop(now) {
      if (!this.running) return;
      this.accumulatedMs += now - this.startedAt;
      this.running = false;
      this.startedAt = null;
    }

    elapsedMs(now) {
      return this.accumulatedMs + (this.running ? now - this.startedAt : 0);
    }

    /** Whole seconds elapsed, capped (the LCD only has three digits). */
    seconds(now, cap) {
      const limit = cap === undefined ? 999 : cap;
      return Math.min(limit, Math.floor(this.elapsedMs(now) / 1000));
    }
  }

  const api = { Stopwatch };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Mines = root.Mines || {};
    Object.assign(root.Mines, api);
  }
})(typeof window !== 'undefined' ? window : globalThis);