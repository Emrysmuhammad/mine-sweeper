(function (root) {
  'use strict';

  const { Config, formatCounter, formatSeconds } = root.Mines;

  const FACES = {
    ready: '\uD83D\uDE42',     // slightly smiling
    pressed: '\uD83D\uDE2E',   // surprised (while a cell is pressed)
    won: '\uD83D\uDE0E',       // cool
    lost: '\uD83D\uDE35'       // dizzy
  };

  /**
   * Everything that touches the page lives here. It only displays what it
   * is told to display. It never decides what the game should do.
   */
  class UI {
    constructor(doc) {
      this.doc = doc;
      const $ = (id) => doc.getElementById(id);

      this.el = {
        board: $('board'),
        mines: $('mine-counter'),
        timer: $('timer'),
        face: $('face-btn'),
        status: $('status'),
        best: $('best-time'),
        flagMode: $('flag-mode')
      };
      this.difficultyButtons = Array.from(doc.querySelectorAll('.difficulty__btn'));

      this.cells = [];
      this.rows = 0;
      this.cols = 0;
      this.active = { r: 0, c: 0 };   // the one cell reachable with the Tab key
    }

    // ---------- board ----------

    /** Create the grid of buttons for a new game. */
    buildBoard(rows, cols) {
      const board = this.el.board;
      board.textContent = '';
      board.className = 'board';
      board.style.setProperty('--cols', String(cols));

      this.rows = rows;
      this.cols = cols;
      this.cells = [];

      const fragment = this.doc.createDocumentFragment();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const button = this.doc.createElement('button');
          button.type = 'button';
          button.className = 'cell';
          button.dataset.r = String(r);
          button.dataset.c = String(c);
          button.tabIndex = -1;
          this.cells.push(button);
          fragment.appendChild(button);
        }
      }
      board.appendChild(fragment);

      this.active = { r: 0, c: 0 };
      this.cells[0].tabIndex = 0;
      this.fitBoard();
    }

    /** Pick a cell size that fits the screen width (never too small to tap). */
    fitBoard() {
      if (!this.cols) return;
      const available = (this.doc.defaultView ? this.doc.defaultView.innerWidth : 800) - 56;
      const size = Math.max(20, Math.min(34, Math.floor(available / this.cols)));
      this.el.board.style.setProperty('--cell', size + 'px');
    }

    cellElement(r, c) {
      return this.cells[r * this.cols + c];
    }

    /** Draw one cell from the information the game gives about it. */
    renderCell(r, c, info) {
      const el = this.cellElement(r, c);
      let classes = 'cell';
      let text = '';
      let label;

      if (info.revealed) {
        classes += ' is-revealed';
        if (info.mine) {
          classes += ' is-mine' + (info.exploded ? ' is-exploded' : '');
          text = '\uD83D\uDCA3';
          label = info.exploded ? 'mine, exploded' : 'mine';
        } else if (info.adjacent > 0) {
          classes += ' n' + info.adjacent;
          text = String(info.adjacent);
          label = info.adjacent + (info.adjacent === 1 ? ' adjacent mine' : ' adjacent mines');
        } else {
          label = 'empty';
        }
      } else if (info.flagged) {
        classes += ' is-flagged' + (info.wrongFlag ? ' is-wrong' : '');
        text = '\uD83D\uDEA9';
        label = info.wrongFlag ? 'flagged, but not a mine' : 'flagged';
      } else {
        label = 'hidden';
      }

      el.className = classes;
      el.textContent = text;
      el.setAttribute('aria-label', 'Row ' + (r + 1) + ', column ' + (c + 1) + ', ' + label);
    }

    renderCells(game, coords) {
      coords.forEach(({ r, c }) => this.renderCell(r, c, game.cellInfo(r, c)));
    }

    renderAll(game) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) this.renderCell(r, c, game.cellInfo(r, c));
      }
    }

    // ---------- keyboard focus ----------

    /** Remember which cell is the Tab stop (used when focus changes). */
    markActive(r, c) {
      const previous = this.cellElement(this.active.r, this.active.c);
      if (previous) previous.tabIndex = -1;
      this.active = { r: r, c: c };
      this.cellElement(r, c).tabIndex = 0;
    }

    /** Move keyboard focus to a cell (clamped to the board). */
    focusCell(r, c) {
      const row = Math.min(this.rows - 1, Math.max(0, r));
      const col = Math.min(this.cols - 1, Math.max(0, c));
      this.markActive(row, col);
      this.cellElement(row, col).focus();
    }

    // ---------- HUD and messages ----------

    setMineCounter(value) {
      this.el.mines.textContent = formatCounter(value);
      this.el.mines.setAttribute('aria-label', 'Mines left: ' + value);
    }

    setTimer(seconds) {
      this.el.timer.textContent = formatCounter(Math.min(seconds, Config.MAX_DISPLAY));
      this.el.timer.setAttribute('aria-label', 'Time: ' + seconds + ' seconds');
    }

    setFace(name) {
      this.el.face.textContent = FACES[name] || FACES.ready;
    }

    setStatus(text, kind) {
      this.el.status.textContent = text;
      this.el.status.className = 'status status--' + (kind || 'info');
    }

    /** 'won' or 'lost' play a short animation on the board. */
    setBoardState(state) {
      this.el.board.classList.toggle('is-won', state === 'won');
      this.el.board.classList.toggle('is-lost', state === 'lost');
    }

    setBest(seconds) {
      this.el.best.textContent = 'Best: ' + (seconds === null ? '--' : formatSeconds(seconds));
    }

    setDifficulty(name) {
      this.difficultyButtons.forEach((button) => {
        const active = button.dataset.difficulty === name;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-checked', String(active));
      });
    }

    setFlagMode(on) {
      this.el.flagMode.textContent = '\uD83D\uDEA9 Flag mode: ' + (on ? 'on' : 'off');
      this.el.flagMode.setAttribute('aria-pressed', String(on));
      this.el.flagMode.classList.toggle('is-on', on);
    }
  }

  root.Mines.UI = UI;
})(typeof window !== 'undefined' ? window : globalThis);