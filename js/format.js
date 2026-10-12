(function (root) {
  'use strict';

  /**
   * Text for the red LCD counters: always 3 characters.
   * Values are clamped to the range -99 to 999.
   */
  function formatCounter(value) {
    const n = Number.isFinite(value) ? Math.trunc(value) : 0;
    const clamped = Math.max(-99, Math.min(999, n));
    if (clamped < 0) return '-' + String(-clamped).padStart(2, '0');
    return String(clamped).padStart(3, '0');
  }

  /** Seconds as "45s" or "2m 5s". */
  function formatSeconds(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds));
    if (safe < 60) return safe + 's';
    return Math.floor(safe / 60) + 'm ' + (safe % 60) + 's';
  }

  const api = { formatCounter, formatSeconds };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Mines = root.Mines || {};
    Object.assign(root.Mines, api);
  }
})(typeof window !== 'undefined' ? window : globalThis);