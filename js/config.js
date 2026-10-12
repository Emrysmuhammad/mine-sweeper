(function (root) {
  'use strict';

  /** Settings that never change while the game runs. */
  const Config = Object.freeze({
    DIFFICULTIES: Object.freeze({
      beginner:     Object.freeze({ label: 'Beginner',     rows: 9,  cols: 9,  mines: 10 }),
      intermediate: Object.freeze({ label: 'Intermediate', rows: 16, cols: 16, mines: 40 }),
      expert:       Object.freeze({ label: 'Expert',       rows: 16, cols: 30, mines: 99 })
    }),

    DEFAULT_DIFFICULTY: 'beginner',

    STORAGE_KEYS: Object.freeze({
      BEST: 'minesweeper.best',
      DIFFICULTY: 'minesweeper.difficulty'
    }),

    LONG_PRESS_MS: 450,   // how long a finger must press to place a flag
    MAX_DISPLAY: 999,     // the timer display stops at 999

    isValidDifficulty(name) {
      return Object.prototype.hasOwnProperty.call(this.DIFFICULTIES, name);
    }
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;               // Node (unit tests)
  } else {
    root.Mines = root.Mines || {};
    root.Mines.Config = Config;            // Browser
  }
})(typeof window !== 'undefined' ? window : globalThis);