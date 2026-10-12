(function (root) {
  'use strict';

  /**
   * Turns mouse, touch and keyboard actions into game callbacks:
   *
   *   onPrimary(r, c)    click, tap or Enter/Space on a cell
   *   onFlag(r, c)       right-click, long-press or the F key
   *   onMove(r, c)       arrow keys (the target cell)
   *   onFocusCell(r, c)  a cell received focus
   *   onNewGame()        the R key
   *   onPress()/onRelease()  a mouse button goes down/up (for the surprised face)
   *
   * Events are attached once to the board element (event delegation), so
   * rebuilding the board for a new game never needs new listeners.
   */
  const Input = {
    bind(boardEl, handlers, config) {
      let suppressClick = false;    // swallow the click that follows a long-press
      let pressTimer = null;
      let lastLongPress = 0;
      let startPos = null;

      function cellOf(target) {
        const el = target && target.closest ? target.closest('.cell') : null;
        if (!el || !boardEl.contains(el)) return null;
        return { r: Number(el.dataset.r), c: Number(el.dataset.c) };
      }

      function cancelPress() {
        clearTimeout(pressTimer);
        pressTimer = null;
      }

      // ----- pointer: long-press to flag on touch screens -----
      boardEl.addEventListener('pointerdown', (event) => {
        suppressClick = false;
        const cell = cellOf(event.target);
        if (!cell) return;

        if (event.pointerType === 'mouse') {
          if (event.button === 0 && handlers.onPress) handlers.onPress();
          return;
        }

        startPos = { x: event.clientX, y: event.clientY };
        cancelPress();
        pressTimer = setTimeout(() => {
          pressTimer = null;
          suppressClick = true;
          lastLongPress = Date.now();
          if (navigator.vibrate) navigator.vibrate(15);
          handlers.onFlag(cell.r, cell.c);
        }, config.LONG_PRESS_MS);
      });

      // Moving the finger more than a few pixels means scrolling, not pressing
      boardEl.addEventListener('pointermove', (event) => {
        if (pressTimer && startPos &&
            Math.hypot(event.clientX - startPos.x, event.clientY - startPos.y) > 10) {
          cancelPress();
        }
      });

      ['pointerup', 'pointercancel'].forEach((type) => {
        document.addEventListener(type, () => {
          cancelPress();
          if (handlers.onRelease) handlers.onRelease();
        });
      });

      // ----- click: reveal (or chord, or flag in flag mode: the app decides) -----
      boardEl.addEventListener('click', (event) => {
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        const cell = cellOf(event.target);
        if (cell) handlers.onPrimary(cell.r, cell.c);
      });

      // ----- right-click: flag -----
      boardEl.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        // Some phones also send "contextmenu" after a long-press: don't flag twice
        if (Date.now() - lastLongPress < 900) return;
        const cell = cellOf(event.target);
        if (cell) handlers.onFlag(cell.r, cell.c);
      });

      // ----- keyboard -----
      const MOVES = {
        ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1]
      };

      boardEl.addEventListener('keydown', (event) => {
        const cell = cellOf(event.target);
        if (!cell) return;

        if (MOVES[event.key]) {
          event.preventDefault();
          handlers.onMove(cell.r + MOVES[event.key][0], cell.c + MOVES[event.key][1]);
        } else if (event.key === 'f' || event.key === 'F') {
          event.preventDefault();
          handlers.onFlag(cell.r, cell.c);
        }
      });

      boardEl.addEventListener('focusin', (event) => {
        const cell = cellOf(event.target);
        if (cell && handlers.onFocusCell) handlers.onFocusCell(cell.r, cell.c);
      });

      document.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key === 'r' || event.key === 'R') handlers.onNewGame();
      });
    }
  };

  root.Mines.Input = Input;
})(typeof window !== 'undefined' ? window : globalThis);