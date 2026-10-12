
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const { UI, App, Input, Config } = window.Mines;

    const ui = new UI(document);
    const app = new App(ui);

    // Board: mouse, touch and keyboard
    Input.bind(
      ui.el.board,
      {
        onPrimary: (r, c) => app.primary(r, c),
        onFlag: (r, c) => app.flag(r, c),
        onMove: (r, c) => app.focusMove(r, c),
        onFocusCell: (r, c) => app.markActive(r, c),
        onNewGame: () => app.newGame(),
        onPress: () => app.pressFace(),
        onRelease: () => app.releaseFace()
      },
      Config
    );

    // Face button restarts the game
    ui.el.face.addEventListener('click', () => app.newGame());

    // Difficulty buttons
    ui.difficultyButtons.forEach((button) => {
      button.addEventListener('click', () => app.newGame(button.dataset.difficulty));
    });

    // Flag mode toggle (handy on touch screens)
    ui.el.flagMode.addEventListener('click', () => app.toggleFlagMode());

    // Keep the cell size right when the window is resized or rotated
    window.addEventListener('resize', () => ui.fitBoard());

    window.minesweeper = app; // handy for debugging in the console
  });
})();