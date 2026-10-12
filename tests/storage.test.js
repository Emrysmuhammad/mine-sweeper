const test = require('node:test');
const assert = require('node:assert/strict');
const Config = require('../js/config.js');
const {
  sanitizeBest, loadBest, saveBest, recordBest, loadDifficulty, saveDifficulty
} = require('../js/storage.js');

// A tiny in-memory stand-in for localStorage
function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value))
  };
}

const NONE = { beginner: null, intermediate: null, expert: null };

test('loadBest returns empty records when nothing is saved', () => {
  assert.deepEqual(loadBest(fakeStorage()), NONE);
});

test('best times survive a save and load round trip', () => {
  const storage = fakeStorage();
  const best = { beginner: 42, intermediate: 180, expert: null };
  saveBest(best, storage);
  assert.deepEqual(loadBest(storage), best);
});

test('sanitizeBest drops invalid values and unknown keys', () => {
  const clean = sanitizeBest({ beginner: 'fast', intermediate: -5, expert: 99.9, cheater: 1 });
  assert.deepEqual(clean, { beginner: null, intermediate: null, expert: 99 });
});

test('corrupt saved data is ignored', () => {
  const storage = fakeStorage({ 'minesweeper.best': '{not json' });
  assert.deepEqual(loadBest(storage), NONE);
});

test('missing storage does not crash anything', () => {
  assert.deepEqual(loadBest(null), NONE);
  assert.equal(saveBest(NONE, null), false);
  assert.equal(loadDifficulty(null), Config.DEFAULT_DIFFICULTY);
});

test('the first finished game is always a record', () => {
  const result = recordBest(NONE, 'beginner', 50);
  assert.equal(result.isRecord, true);
  assert.equal(result.best.beginner, 50);
});

test('a faster time replaces the record, a slower time does not', () => {
  const start = { beginner: 50, intermediate: null, expert: null };

  const faster = recordBest(start, 'beginner', 40);
  assert.equal(faster.isRecord, true);
  assert.equal(faster.best.beginner, 40);

  const slower = recordBest(start, 'beginner', 60);
  assert.equal(slower.isRecord, false);
  assert.equal(slower.best.beginner, 50);

  const equal = recordBest(start, 'beginner', 50);
  assert.equal(equal.isRecord, false);
});

test('records are kept separately for every difficulty', () => {
  const result = recordBest({ beginner: 50, intermediate: null, expert: null }, 'expert', 300);
  assert.equal(result.best.beginner, 50);
  assert.equal(result.best.expert, 300);
});

test('recordBest ignores invalid input', () => {
  assert.equal(recordBest(NONE, 'impossible', 10).isRecord, false);
  assert.equal(recordBest(NONE, 'beginner', 0).isRecord, false);
  assert.equal(recordBest(NONE, 'beginner', NaN).isRecord, false);
});

test('recordBest does not change the object it was given', () => {
  const original = { beginner: 50, intermediate: null, expert: null };
  recordBest(original, 'beginner', 10);
  assert.equal(original.beginner, 50);
});

test('the chosen difficulty is saved and restored', () => {
  const storage = fakeStorage();
  assert.equal(saveDifficulty('expert', storage), true);
  assert.equal(loadDifficulty(storage), 'expert');
});

test('an invalid saved difficulty falls back to the default', () => {
  const storage = fakeStorage({ 'minesweeper.difficulty': 'nightmare' });
  assert.equal(loadDifficulty(storage), Config.DEFAULT_DIFFICULTY);
  assert.equal(saveDifficulty('nightmare', storage), false);
});

test('isValidDifficulty only accepts real difficulty names', () => {
  assert.equal(Config.isValidDifficulty('expert'), true);
  assert.equal(Config.isValidDifficulty('toString'), false);
  assert.equal(Config.isValidDifficulty(undefined), false);
});