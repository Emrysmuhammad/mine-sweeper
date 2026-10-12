const test = require('node:test');
const assert = require('node:assert/strict');
const { createRng } = require('../js/rng.js');

test('the same seed gives the same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
});

test('different seeds give different sequences', () => {
  const a = createRng(1);
  const b = createRng(2);
  assert.notEqual(a(), b());
});

test('values stay in the range [0, 1)', () => {
  const rng = createRng(7);
  for (let i = 0; i < 1000; i++) {
    const value = rng();
    assert.ok(value >= 0 && value < 1);
  }
});

test('values are spread out evenly', () => {
  const rng = createRng(123);
  let sum = 0;
  for (let i = 0; i < 5000; i++) sum += rng();
  const mean = sum / 5000;
  assert.ok(mean > 0.45 && mean < 0.55, 'mean was ' + mean);
});