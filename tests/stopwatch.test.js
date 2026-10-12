const test = require('node:test');
const assert = require('node:assert/strict');
const { Stopwatch } = require('../js/stopwatch.js');

test('a new stopwatch has not started', () => {
  const sw = new Stopwatch();
  assert.equal(sw.running, false);
  assert.equal(sw.elapsedMs(5000), 0);
  assert.equal(sw.seconds(5000), 0);
});

test('time counts up while running', () => {
  const sw = new Stopwatch();
  sw.start(1000);
  assert.equal(sw.elapsedMs(4500), 3500);
  assert.equal(sw.seconds(4500), 3);
});

test('stopping freezes the time', () => {
  const sw = new Stopwatch();
  sw.start(0);
  sw.stop(12000);
  assert.equal(sw.running, false);
  assert.equal(sw.elapsedMs(99999), 12000);
});

test('starting twice does not restart the count', () => {
  const sw = new Stopwatch();
  sw.start(0);
  sw.start(5000);
  assert.equal(sw.elapsedMs(10000), 10000);
});

test('start, stop and start again adds up the time', () => {
  const sw = new Stopwatch();
  sw.start(0);
  sw.stop(2000);
  sw.start(10000);
  assert.equal(sw.elapsedMs(13000), 5000);
});

test('seconds are whole numbers and are capped', () => {
  const sw = new Stopwatch();
  sw.start(0);
  assert.equal(sw.seconds(1999), 1);
  assert.equal(sw.seconds(5000000), 999);
  assert.equal(sw.seconds(5000000, 120), 120);
});

test('reset clears everything', () => {
  const sw = new Stopwatch();
  sw.start(0);
  sw.stop(3000);
  sw.reset();
  assert.equal(sw.running, false);
  assert.equal(sw.elapsedMs(9000), 0);
});