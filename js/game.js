(function (root) {
  'use strict';

  const Board = (typeof module !== 'undefined' && module.exports)
    ? require('./board.js')
    : root.Mines;
  const { createBoard, cellAt, inBounds, neighbors, placeMines, computeCounts } = Board;

  /**
   * The rules of Minesweeper, with no DOM code.
   *
   * status: 'ready'   nothing revealed yet (mines are not placed)
   *         'playing' the first cell was revealed
   *         'won' | 'lost'
   *
   * Every action returns the list of { r, c } cells that changed, so the
   * screen only has to redraw those. At the end of a game, all cells are returned.
   */
  class Game {
    constructor(rows, cols, mines, rng) {
      this.rows = rows;
      this.cols = cols;
      this.mines = mines;
      this.rng = rng || Math.random;
      this.reset();
    }

    /** Build a game with mines at known positions (used by tests). */
    static fromLayout(rows, cols, mineCoords, rng) {
      const game = new Game(rows, cols, mineCoords.length, rng);
      mineCoords.forEach(([r, c]) => { cellAt(game.board, r, c).mine = true; });
      computeCounts(game.board);
      game.board.minesPlaced = true;
      game.status = 'playing';
      return game;
    }

    reset() {
      this.board = createBoard(this.rows, this.cols, this.mines);
      this.status = 'ready';
      this.flags = 0;
      this.revealedCount = 0;
      this.exploded = null;
    }

    // ---------- simple queries ----------

    get safeCells() {
      return this.rows * this.cols - this.mines;
    }

    /** Mines minus flags. It can go negative if too many flags are placed. */
    minesLeft() {
      return this.mines - this.flags;
    }

    isOver() {
      return this.status === 'won' || this.status === 'lost';
    }

    allCoords() {
      const coords = [];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) coords.push({ r: r, c: c });
      }
      return coords;
    }

    /**
     * What the screen is allowed to know about a cell. A mine is only
     * reported once it has been revealed, so hidden mines stay secret.
     */
    cellInfo(r, c) {
      const cell = cellAt(this.board, r, c);
      const lost = this.status === 'lost';
      return {
        revealed: cell.revealed,
        flagged: cell.flagged,
        mine: cell.revealed && cell.mine,
        adjacent: cell.revealed && !cell.mine ? cell.adjacent : 0,
        exploded: lost && !!this.exploded && this.exploded.r === r && this.exploded.c === c,
        wrongFlag: lost && cell.flagged && !cell.mine
      };
    }

    // ---------- actions ----------

    /** Reveal a cell. The very first reveal places the mines. */
    reveal(r, c) {
      if (this.isOver() || !inBounds(this.board, r, c)) return [];

      const cell = cellAt(this.board, r, c);
      if (cell.revealed || cell.flagged) return [];

      if (this.status === 'ready') {
        placeMines(this.board, r, c, this.rng);
        this.status = 'playing';
      }

      if (cell.mine) return this.lose(r, c);

      const changed = this.floodReveal(r, c);
      if (this.revealedCount === this.safeCells) return this.win();
      return changed;
    }

    /** Place or remove a flag on a hidden cell. */
    toggleFlag(r, c) {
      if (this.isOver() || !inBounds(this.board, r, c)) return [];

      const cell = cellAt(this.board, r, c);
      if (cell.revealed) return [];

      cell.flagged = !cell.flagged;
      this.flags += cell.flagged ? 1 : -1;
      return [{ r: r, c: c }];
    }

    /**
     * "Chording": on a revealed number whose flag count matches the number,
     * reveal all of its other hidden neighbours at once. If one of the
     * flags was wrong, a mine gets revealed and the game is lost.
     */
    chord(r, c) {
      if (this.isOver() || this.status === 'ready' || !inBounds(this.board, r, c)) return [];

      const cell = cellAt(this.board, r, c);
      if (!cell.revealed || cell.adjacent === 0) return [];

      const around = neighbors(this.board, r, c);
      const flagged = around.filter(([nr, nc]) => cellAt(this.board, nr, nc).flagged).length;
      if (flagged !== cell.adjacent) return [];

      let changed = [];
      for (const [nr, nc] of around) {
        const neighbor = cellAt(this.board, nr, nc);
        if (neighbor.revealed || neighbor.flagged) continue;
        if (neighbor.mine) return this.lose(nr, nc);
        changed = changed.concat(this.floodReveal(nr, nc));
      }

      if (this.revealedCount === this.safeCells) return this.win();
      return changed;
    }

    // ---------- internals ----------

    /**
     * Reveal a cell and, when it has no neighbouring mines, keep opening the
     * area around it. Uses a stack instead of recursion so a big empty
     * board can never overflow the call stack. Flagged cells are skipped.
     */
    floodReveal(startR, startC) {
      const changed = [];
      const stack = [[startR, startC]];

      while (stack.length > 0) {
        const [r, c] = stack.pop();
        const cell = cellAt(this.board, r, c);
        if (cell.revealed || cell.flagged) continue;

        cell.revealed = true;
        this.revealedCount++;
        changed.push({ r: r, c: c });

        if (cell.adjacent === 0) {
          neighbors(this.board, r, c).forEach(([nr, nc]) => {
            const next = cellAt(this.board, nr, nc);
            if (!next.revealed && !next.flagged) stack.push([nr, nc]);
          });
        }
      }
      return changed;
    }

    lose(r, c) {
      this.status = 'lost';
      this.exploded = { r: r, c: c };
      // Show every mine that was not correctly flagged
      this.board.cells.forEach((cell) => {
        if (cell.mine && !cell.flagged) cell.revealed = true;
      });
      return this.allCoords();
    }

    win() {
      this.status = 'won';
      // Flag every remaining mine, like the classic game
      this.board.cells.forEach((cell) => {
        if (cell.mine && !cell.flagged) {
          cell.flagged = true;
          this.flags++;
        }
      });
      return this.allCoords();
    }
  }

  const api = { Game };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.Mines = root.Mines || {};
    Object.assign(root.Mines, api);
  }
})(typeof window !== 'undefined' ? window : globalThis);