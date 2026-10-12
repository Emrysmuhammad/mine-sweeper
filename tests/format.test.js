const test = require('node:test');
const assert = require('node:assert/strict');
const { formatCounter, formatSeconds } = require('../js/format.js');

test('formatCounter pads to three digits', () => {
  assert.equal(formatCounter(0), '000');
  assert.equal(formatCounter(7), '007');
  assert.equal(formatCounter(99), '099');
  assert.equal(formatCounter(999), '999');
});

test('formatCounter caps large values at 999', () => {
  assert.equal(formatCounter(1234), '999');
});

test('formatCounter shows negative numbers with a minus sign', () => {
  assert.equal(formatCounter(-1), '-01');
  assert.equal(formatCounter(-9), '-09');
  assert.equal(formatCounter(-45), '-45');
  assert.equal(formatCounter(-150), '-99');
});

test('formatCounter treats bad input as zero', () => {
  assert.equal(formatCounter(NaN), '000');
  assert.equal(formatCounter(undefined), '000');
});

test('formatSeconds shows seconds, then minutes and seconds', () => {
  assert.equal(formatSeconds(0), '0s');
  assert.equal(formatSeconds(45), '45s');
  assert.equal(formatSeconds(60), '1m 0s');
  assert.equal(formatSeconds(125), '2m 5s');
});