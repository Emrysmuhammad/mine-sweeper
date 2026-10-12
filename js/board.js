(function (root) {
  'use strict';

  /**
   * Pure board helpers: no DOM, no game rules, just the grid.
   * Cells are stored in one flat array: index = row * cols + col.
   * A cell is { mine, adjacent, revealed, flagged }.
   */

  function createBoard(rows, cols, mines) {
    if (!Number.isInteger(rows) || rows < 1 || !Number.isInteger(cols) || cols < 1) {
      throw new RangeError('The board needs at least 1 row and 1 column');
    }
    if (!Number.isInteger(mines) || mines < 1 || mines > rows * cols - 1) {
      throw new RangeError('The mine count must be between 1 and ' + (rows * cols - 1));
    }

    const cells = [];
    for (let i = 0; i < rows * cols; i++) {
      cells.push({ mine: false, adjacent: 0, revealed: false, flagged: false });
    }
    return { rows: rows, cols: cols, mines: mines, cells: cells, minesPlaced: false };
  }

  function indexOf(board, r, c) {
    return r * board.cols + c;
  }

  function inBounds(board, r, c) {
    return r >= 0 && r < board.rows && c >= 0 && c < board.cols;
  }

  function cellAt(board, r, c) {
    return board.cells[indexOf(board, r, c)];
  }

  /** The up-to-eight cells around (r, c) as [row, col] pairs. */
  function neighbors(board, r, c) {
    const result = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (inBounds(board, r + dr, c + dc)) result.push([r + dr, c + dc]);
      }
    }
    return result;
  }

  /** Fill in every cell's count of neighbouring mines. */
  function computeCounts(board) {
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        let count = 0;
        neighbors(board, r, c).forEach(([nr, nc]) => {
          if (cellAt(board, nr, nc).mine) count++;
        });
        cellAt(board, r, c).adjacent = count;
      }
    }
  }

  /**
   * Place the mines AFTER the first click so the first click can never lose.
   *
   * The clicked cell and its neighbours are kept mine-free, which guarantees
   * the first click opens an empty area. If the board is too crowded for
   * that, only the clicked cell itself is protected.
   *
   * Mines are chosen with a partial Fisher-Yates shuffle, so every allowed
   * cell is equally likely and no cell is picked twice.
   */
  function placeMines(board, safeR, safeC, rng) {
    const random = rng || Math.random;
    const total = board.rows * board.cols;

    const protectedCells = new Set([indexOf(board, safeR, safeC)]);
    neighbors(board, safeR, safeC).forEach(([r, c]) => protectedCells.add(indexOf(board, r, c)));

    if (total - protectedCells.size < board.mines) {
      protectedCells.clear();
      protectedCells.add(indexOf(board, safeR, safeC));
    }

    const candidates = [];
    for (let i = 0; i < total; i++) {
      if (!protectedCells.has(i)) candidates.push(i);
    }

    for (let i = 0; i < board.mines; i++) {
      const j = i + Math.floor(random() * (candidates.length - i));
      const picked = candidates[j];
      candidates[j] = candidates[i];
      candidates[i] = picked;
      board.cells[picked].mine = true;
    }

    computeCounts(board);
    board.minesPlaced = true;
  }

  const api = { createBoard, indexOf, inBounds, cellAt, neighbors, computeCounts, placeMines };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Mines = root.Mines || {};
    Object.assign(root.Mines, api);
  }
})(typeof window !== 'undefined' ? window : globalThis);