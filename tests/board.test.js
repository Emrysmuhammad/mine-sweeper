const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createBoard, neighbors, placeMines, computeCounts, cellAt
} = require('../js/board.js');
const { createRng } = require('../js/rng.js');

const countMines = (board) => board.cells.filter((cell) => cell.mine).length;

test('createBoard builds a hidden, empty grid', () => {
  const board = createBoard(5, 7, 4);
  assert.equal(board.rows, 5);
  assert.equal(board.cols, 7);
  assert.equal(board.cells.length, 35);
  assert.ok(board.cells.every((c) => !c.mine && !c.revealed && !c.flagged && c.adjacent === 0));
});

test('createBoard rejects impossible sizes and mine counts', () => {
  assert.throws(() => createBoard(0, 5, 1), RangeError);
  assert.throws(() => createBoard(2.5, 3, 1), RangeError);
  assert.throws(() => createBoard(3, 3, 0), RangeError);
  assert.throws(() => createBoard(3, 3, 9), RangeError);
});

test('neighbors returns 3 for a corner, 5 for an edge and 8 for the middle', () => {
  const board = createBoard(4, 4, 1);
  assert.equal(neighbors(board, 0, 0).length, 3);
  assert.equal(neighbors(board, 0, 2).length, 5);
  assert.equal(neighbors(board, 1, 1).length, 8);
});

test('neighbors never includes the cell itself or cells outside the grid', () => {
  const board = createBoard(3, 3, 1);
  neighbors(board, 2, 2).forEach(([r, c]) => {
    assert.ok(r >= 0 && r < 3 && c >= 0 && c < 3);
    assert.ok(!(r === 2 && c === 2));
  });
});

test('computeCounts counts neighbouring mines', () => {
  const board = createBoard(3, 3, 2);
  cellAt(board, 0, 0).mine = true;
  cellAt(board, 0, 2).mine = true;
  computeCounts(board);
  assert.equal(cellAt(board, 0, 1).adjacent, 2);
  assert.equal(cellAt(board, 1, 1).adjacent, 2);
  assert.equal(cellAt(board, 1, 0).adjacent, 1);
  assert.equal(cellAt(board, 1, 2).adjacent, 1);
  assert.equal(cellAt(board, 2, 1).adjacent, 0);
});

test('placeMines places exactly the requested number of mines', () => {
  const board = createBoard(9, 9, 10);
  placeMines(board, 4, 4, createRng(1));
  assert.equal(countMines(board), 10);
  assert.equal(board.minesPlaced, true);
});

test('the clicked cell and its neighbours never get a mine', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const board = createBoard(9, 9, 10);
    placeMines(board, 4, 4, createRng(seed));
    assert.equal(cellAt(board, 4, 4).mine, false);
    neighbors(board, 4, 4).forEach(([r, c]) => assert.equal(cellAt(board, r, c).mine, false));
  }
});

test('adjacent counts match a brute-force count', () => {
  const board = createBoard(16, 16, 40);
  placeMines(board, 8, 8, createRng(99));
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      const expected = neighbors(board, r, c).filter(([nr, nc]) => cellAt(board, nr, nc).mine).length;
      assert.equal(cellAt(board, r, c).adjacent, expected);
    }
  }
});

test('the same seed gives the same layout, a different seed gives another', () => {
  const layout = (seed) => {
    const board = createBoard(9, 9, 10);
    placeMines(board, 0, 0, createRng(seed));
    return board.cells.map((c) => c.mine);
  };
  assert.deepEqual(layout(5), layout(5));
  assert.notDeepEqual(layout(5), layout(6));
});

test('a crowded board still protects the clicked cell', () => {
  const board = createBoard(3, 3, 8);
  placeMines(board, 1, 1, createRng(3));
  assert.equal(countMines(board), 8);
  assert.equal(cellAt(board, 1, 1).mine, false);
});