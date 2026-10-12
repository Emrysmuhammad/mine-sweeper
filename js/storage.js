(function (root) {
  'use strict';

  const Config = (typeof module !== 'undefined' && module.exports)
    ? require('./config.js')
    : root.Mines.Config;

  // ---------- safe localStorage access ----------

  function defaultStorage() {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch (err) {
      return null; // blocked (private mode or strict browser settings)
    }
  }

  function readJson(key, storage) {
    try {
      if (!storage) return null;
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function writeJson(key, value, storage) {
    try {
      if (!storage) return false;
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      return false;
    }
  }

  // ---------- best times ----------

  /** Always returns { beginner, intermediate, expert }, each a whole number or null. */
  function sanitizeBest(raw) {
    const out = {};
    Object.keys(Config.DIFFICULTIES).forEach((key) => {
      const value = raw && typeof raw === 'object' ? Number(raw[key]) : NaN;
      out[key] = Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
    });
    return out;
  }

  function loadBest(storage = defaultStorage()) {
    return sanitizeBest(readJson(Config.STORAGE_KEYS.BEST, storage));
  }

  function saveBest(best, storage = defaultStorage()) {
    return writeJson(Config.STORAGE_KEYS.BEST, sanitizeBest(best), storage);
  }

  /**
   * Compare a finished time with the saved best for that difficulty.
   * Returns a NEW best-times object and whether this was a new record.
   */
  function recordBest(best, difficulty, seconds) {
    const clean = sanitizeBest(best);
    if (!Config.isValidDifficulty(difficulty) || !Number.isFinite(seconds) || seconds <= 0) {
      return { best: clean, isRecord: false };
    }

    const time = Math.max(1, Math.floor(seconds));
    const current = clean[difficulty];
    if (current === null || time < current) {
      clean[difficulty] = time;
      return { best: clean, isRecord: true };
    }
    return { best: clean, isRecord: false };
  }

  // ---------- chosen difficulty ----------

  function loadDifficulty(storage = defaultStorage()) {
    try {
      const saved = storage ? storage.getItem(Config.STORAGE_KEYS.DIFFICULTY) : null;
      return Config.isValidDifficulty(saved) ? saved : Config.DEFAULT_DIFFICULTY;
    } catch (err) {
      return Config.DEFAULT_DIFFICULTY;
    }
  }

  function saveDifficulty(name, storage = defaultStorage()) {
    if (!Config.isValidDifficulty(name)) return false;
    try {
      if (!storage) return false;
      storage.setItem(Config.STORAGE_KEYS.DIFFICULTY, name);
      return true;
    } catch (err) {
      return false;
    }
  }

  const api = { sanitizeBest, loadBest, saveBest, recordBest, loadDifficulty, saveDifficulty };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Mines = root.Mines || {};
    Object.assign(root.Mines, api);
  }
})(typeof window !== 'undefined' ? window : globalThis);