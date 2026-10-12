(function (root) {
  'use strict';

  const {
    Config, Game, Stopwatch, formatSeconds,
    loadDifficulty, saveDifficulty, loadBest, saveBest, recordBest
  } = root.Mines;

  /**
   * The controller: it listens to the player (through input.js), asks the
   * Game to apply the rules, then tells the UI what to draw.
   */
  class App {
    constructor(ui) {
      this.ui = ui;
      this.difficulty = loadDifficulty();
      this.best = loadBest();
      this.stopwatch = new Stopwatch();
      this.timerStarted = false;
      this.ticker = null;
      this.flagMode = false;
      this.game = null;
      this.newGame();
    }

    // ---------- starting a game ----------

    /** Start a fresh game, optionally switching difficulty. */
    newGame(difficulty) {
      if (difficulty !== undefined && Config.isValidDifficulty(difficulty)) {
        this.difficulty = difficulty;
        saveDifficulty(difficulty);
      }

      this.stopTicking();
      this.stopwatch.reset();
      this.timerStarted = false;

      const d = Config.DIFFICULTIES[this.difficulty];
      this.game = new Game(d.rows, d.cols, d.mines);

      this.ui.buildBoard(d.rows, d.cols);
      this.ui.setDifficulty(this.difficulty);
      this.ui.setFlagMode(this.flagMode);
      this.ui.setFace('ready');
      this.ui.setBoardState('');
      this.ui.setStatus('Click any square to begin. Your first click is always safe.', 'info');
      this.refreshHud();
      this.ui.renderAll(this.game);
    }

    // ---------- player actions ----------

    /** Click, tap or Enter: reveal, chord on a number, or flag in flag mode. */
    primary(r, c) {
      if (this.game.isOver()) return;

      const info = this.game.cellInfo(r, c);
      let changed;
      if (info.revealed) {
        changed = this.game.chord(r, c);
      } else if (this.flagMode) {
        changed = this.game.toggleFlag(r, c);
      } else {
        changed = this.game.reveal(r, c);
      }
      this.afterMove(changed);
    }

    /** Right-click, long-press or the F key. */
    flag(r, c) {
      if (this.game.isOver()) return;
      this.afterMove(this.game.toggleFlag(r, c));
    }

    toggleFlagMode() {
      this.flagMode = !this.flagMode;
      this.ui.setFlagMode(this.flagMode);
    }

    afterMove(changed) {
      const game = this.game;

      // The timer starts with the first reveal
      if (game.status !== 'ready' && !this.timerStarted) {
        this.timerStarted = true;
        this.stopwatch.start(Date.now());
        this.startTicking();
      }

      if (game.status === 'won') this.handleWin();
      else if (game.status === 'lost') this.handleLose();

      this.ui.renderCells(game, changed);
      this.refreshHud();
    }

    // ---------- the end of a game ----------

    handleWin() {
      const now = Date.now();
      this.stopwatch.stop(now);
      this.stopTicking();

      const seconds = Math.max(1, this.stopwatch.seconds(now));
      const result = recordBest(this.best, this.difficulty, seconds);
      this.best = result.best;
      if (result.isRecord) saveBest(this.best);

      this.ui.setFace('won');
      this.ui.setBoardState('won');
      this.ui.setStatus(
        'You won in ' + formatSeconds(seconds) + '!' + (result.isRecord ? ' New best time! \uD83C\uDFC6' : ''),
        'win'
      );
    }

    handleLose() {
      this.stopwatch.stop(Date.now());
      this.stopTicking();

      this.ui.setFace('lost');
      this.ui.setBoardState('lost');
      this.ui.setStatus('Boom! You hit a mine. Press the face or R to try again.', 'lose');
    }

    // ---------- timer display ----------

    startTicking() {
      this.stopTicking();
      this.ticker = setInterval(() => {
        this.ui.setTimer(this.stopwatch.seconds(Date.now()));
      }, 250);
    }

    stopTicking() {
      if (this.ticker !== null) {
        clearInterval(this.ticker);
        this.ticker = null;
      }
    }

    refreshHud() {
      this.ui.setMineCounter(this.game.minesLeft());
      this.ui.setTimer(this.stopwatch.seconds(Date.now()));
      this.ui.setBest(this.best[this.difficulty]);
    }

    // ---------- keyboard focus and face ----------

    focusMove(r, c) {
      this.ui.focusCell(r, c);
    }

    markActive(r, c) {
      this.ui.markActive(r, c);
    }

    /** A mouse button is held down on the board: surprised face. */
    pressFace() {
      if (!this.game.isOver()) this.ui.setFace('pressed');
    }

    releaseFace() {
      if (!this.game.isOver()) this.ui.setFace('ready');
    }
  }

  root.Mines.App = App;
})(typeof window !== 'undefined' ? window : globalThis);