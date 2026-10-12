const test = require('node:test');
const assert = require('node:assert/strict');
const { Game } = require('../js/game.js');
const { createRng } = require('../js/rng.js');

// A 3x3 board with a single mine in the top-left corner
const single = () => Game.fromLayout(3, 3, [[0, 0]]);

test('a new game is ready, with no flags and nothing revealed', () => {
  const game = new Game(9, 9, 10, createRng(1));
  assert.equal(game.status, 'ready');
  assert.equal(game.flags, 0);
  assert.equal(game.revealedCount, 0);
  assert.equal(game.minesLeft(), 10);
  assert.equal(game.safeCells, 71);
});

test('the first click is never a mine, always opens an area and mines are placed', () => {
  const spots = [[0, 0], [0, 8], [8, 0], [8, 8], [4, 4], [0, 4]];
  for (let seed = 1; seed <= 60; seed++) {
    spots.forEach(([r, c]) => {
      const game = new Game(9, 9, 10, createRng(seed));
      game.reveal(r, c);
      assert.notEqual(game.status, 'lost');
      assert.equal(game.cellInfo(r, c).adjacent, 0);
      assert.ok(game.revealedCount > 1);
      assert.equal(game.board.cells.filter((cell) => cell.mine).length, 10);
    });
  }
});

test('revealing the last safe cell wins and flags the remaining mines', () => {
  const game = single();
  const changed = game.reveal(2, 2);   // opens the whole empty region
  assert.equal(game.status, 'won');
  assert.equal(game.revealedCount, 8);
  assert.equal(game.cellInfo(0, 0).flagged, true);
  assert.equal(game.flags, 1);
  assert.equal(game.minesLeft(), 0);
  assert.equal(changed.length, 9);
});

test('revealing a mine loses and shows the mines', () => {
  const game = single();
  const changed = game.reveal(0, 0);
  assert.equal(game.status, 'lost');
  assert.equal(changed.length, 9);
  const info = game.cellInfo(0, 0);
  assert.equal(info.mine, true);
  assert.equal(info.exploded, true);
});

test('hidden mines are never reported to the screen', () => {
  const game = single();
  assert.equal(game.cellInfo(0, 0).mine, false);
  assert.equal(game.cellInfo(1, 1).adjacent, 0);
});

test('a flag on a safe cell is reported as wrong after losing', () => {
  const game = Game.fromLayout(3, 3, [[0, 0], [2, 2]]);
  game.toggleFlag(1, 1);   // wrong flag
  game.toggleFlag(2, 2);   // correct flag
  game.reveal(0, 0);       // boom
  assert.equal(game.cellInfo(1, 1).wrongFlag, true);
  assert.equal(game.cellInfo(2, 2).wrongFlag, false);
  assert.equal(game.cellInfo(2, 2).flagged, true);
});

test('flags can be placed and removed and update the mine counter', () => {
  const game = single();
  game.toggleFlag(1, 1);
  assert.equal(game.flags, 1);
  assert.equal(game.minesLeft(), 0);
  game.toggleFlag(1, 1);
  assert.equal(game.flags, 0);
  assert.equal(game.minesLeft(), 1);
});

test('the counter can go negative when too many flags are placed', () => {
  const game = single();
  game.toggleFlag(1, 1);
  game.toggleFlag(2, 2);
  assert.equal(game.minesLeft(), -1);
});

test('a flagged cell cannot be revealed', () => {
  const game = single();
  game.toggleFlag(2, 2);
  assert.deepEqual(game.reveal(2, 2), []);
  assert.equal(game.cellInfo(2, 2).revealed, false);
});

test('a revealed cell cannot be flagged', () => {
  const game = single();
  game.reveal(1, 1);
  assert.deepEqual(game.toggleFlag(1, 1), []);
  assert.equal(game.flags, 0);
});

test('flood fill does not open flagged cells', () => {
  const game = single();
  game.toggleFlag(2, 0);
  game.reveal(2, 2);
  assert.equal(game.cellInfo(2, 0).revealed, false);
  assert.equal(game.revealedCount, 7);
  assert.equal(game.status, 'playing');
});

test('flood fill stops at numbers', () => {
  const game = Game.fromLayout(3, 3, [[0, 0], [2, 2]]);
  game.reveal(0, 2);
  assert.equal(game.cellInfo(0, 2).adjacent, 0);
  assert.equal(game.cellInfo(1, 1).revealed, true);   // a number, opened but not expanded
  assert.equal(game.revealedCount, 4);
});

test('chording opens the neighbours when the flag count matches', () => {
  const game = single();
  game.reveal(1, 1);
  game.toggleFlag(0, 0);
  game.chord(1, 1);
  assert.equal(game.status, 'won');
});

test('chording with a wrong flag loses the game', () => {
  const game = single();
  game.reveal(1, 1);
  game.toggleFlag(0, 1);   // wrong flag: the mine is at (0, 0)
  game.chord(1, 1);
  assert.equal(game.status, 'lost');
});

test('chording does nothing when the flag count does not match', () => {
  const game = single();
  game.reveal(1, 1);
  assert.deepEqual(game.chord(1, 1), []);
  assert.equal(game.revealedCount, 1);
  assert.equal(game.status, 'playing');
});

test('chording a hidden cell does nothing', () => {
  const game = single();
  assert.deepEqual(game.chord(2, 2), []);
});

test('nothing can be changed after the game is over', () => {
  const game = single();
  game.reveal(0, 0);
  assert.deepEqual(game.reveal(2, 2), []);
  assert.deepEqual(game.toggleFlag(2, 2), []);
  assert.deepEqual(game.chord(1, 1), []);
});

test('flags can be placed before the first click without starting the game', () => {
  const game = new Game(9, 9, 10, createRng(1));
  game.toggleFlag(0, 0);
  assert.equal(game.status, 'ready');
  assert.equal(game.flags, 1);
});

test('reset returns to a fresh, ready game', () => {
  const game = single();
  game.reveal(0, 0);
  game.reset();
  assert.equal(game.status, 'ready');
  assert.equal(game.flags, 0);
  assert.equal(game.revealedCount, 0);
});