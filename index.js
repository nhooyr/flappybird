"use strict";

init();

function init() {
  const help = document.getElementById("help");
  const helpButton = help.children[0];

  // Register Escape to close help if open.
  // Register Space to substitute for clicking.
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (help.open) {
        helpButton.click();
      }
    } else if (e.key === " ") {
      document.body.click();
    }
  });

  const highScoreBoard = document.getElementById("high-score-board-n");
  let highScore = restoreHighScoreBoard(highScoreBoard);

  let game;
  document.addEventListener("click", e => {
    if (e.target === document.body) {
      // Click is to close help if help is open.
      // Otherwise it's for the game.
      if (help.open) {
        helpButton.click();
        return;
      }
    }
    if (e.target === helpButton) {
      return;
    }

    if (game) {
      game.birdJump();
      return;
    }

    highScore = restoreHighScoreBoard(highScoreBoard);
    game = new Game();
    const stepCB = now => {
      const gameOver = game.stepTo(now);
      game.render();
      if (highScore < game.score) {
        localStorage.setItem("flappy-bird-high-score", game.score);
      }
      if (gameOver) {
        game = undefined;
        return;
      }
      requestAnimationFrame(stepCB);
    };
    stepCB(performance.now());
  });
}

function restoreHighScoreBoard(highScoreBoard) {
  let highScore = localStorage.getItem("flappy-bird-high-score");
  if (highScore) {
    highScoreBoard.textContent = `${highScore}`.padStart(3, "0");
    return highScore;
  } else {
    localStorage.setItem("flappy-bird-high-score", 0);
    return 0;
  }
}

class Game {
  constructor() {
    this.prompt = document.getElementById("prompt");
    this.prompt.style.display = "none";
    this.sky = document.getElementById("sky");
    this.bird = document.getElementById("bird");
    this.pipeTop = document.getElementById("pipe-top");
    this.pipeBot = document.getElementById("pipe-bot");
    this.scoreBoard = document.getElementById("score-board-n");
    this.fpsBoard = document.getElementById("fps-board-n");

    this.birdTop = this.sky.offsetHeight / 2 - this.bird.offsetHeight / 2 - 30;
    this.bird.style.top = `${this.birdTop}px`;
    this.birdTopVelocity = 0;

    this.pipeTopHeight = 100;
    this.pipeBotHeight = 150;
    this.pipeTop.style.height = `${this.pipeTopHeight}px`;
    this.pipeBot.style.height = `${this.pipeBotHeight}px`;
    this.pipeLeft = this.sky.offsetWidth - this.pipeTop.offsetWidth;
    this.pipeTop.style.left = `${this.pipeLeft}px`;
    this.pipeBot.style.left = `${this.pipeLeft}px`;

    this.gapSize = 150;
    // Path of the parabola -0.075*x^2.
    this.birdGravity = 0.15;
    this.birdVelocityMax = 6;
    this.birdFlapForce = -4;
    this.pipeLeftVelocity = 2;

    this.pipeScored = false;
    this.score = 0;
    this.scoreBoard.textContent = `${this.score}`.padStart(3, "0");
    // Sets lastStepTime to immediately render on stepTo(now).
    this.lastStepTime = performance.now() - Game.stepVelocity;
    this.fpsa = [];
  }

  static stepVelocity = Math.floor(1000 / 60);

  stepTo(now) {
    const stepDur = now - this.lastStepTime;
    if (stepDur === 0) {
      // Somehow we got called before a millisecond passed.
      return false;
    }
    if (stepDur < 0) {
      // Time overflowed.
      this.lastStepTime = now;
      return false;
    }
    // The lowest this can ever be is 1/16 which is 0.0625. The lowest number we multiply
    // stepFrac by is 0.15. 0.15*0.0625 = 0.009375 which is well within the range of 64
    // bit floats and so we will never be in a situation where time is lost due to
    // stepFrac being truncated.
    const steps = stepDur / Game.stepVelocity;
    const over = this.step(steps);
    if (over) {
      this.displayGameOverPrompt();
      return true;
    }
    this.fpsa.push({ts: now, fps: 1000 / stepDur});
    while (this.fpsa.length && performance.now() - this.fpsa[0].ts > 3000) {
      this.fpsa.pop();
    }
    this.lastStepTime = now;
    return false;
  }

  // step steps n states.
  //
  // n can be a float in which case step will interpolate the render through a fraction
  // of the state.
  step(n) {
    let interpol = 1;
    for (let i = 0; i < n; i++) {
      if (n - i < 1) {
        // interpolate by the fractional remainder of n. e.g. for n = 1.5 we will step
        // one state and then interpolate 0.5 of the next state.
        interpol = n - i;
      }
      let birdTopVelocityDelta = this.birdGravity * interpol;
      let birdTopVelocityFinal = this.birdTopVelocity + birdTopVelocityDelta;
      if (birdTopVelocityFinal > this.birdVelocityMax) {
        birdTopVelocityFinal = this.birdVelocityMax;
        birdTopVelocityDelta = this.birdVelocityMax - this.birdTopVelocity;
      }
      // https://en.wikipedia.org/wiki/Equations_of_motion#Constant_translational_acceleration_in_a_straight_line
      // Derived from Equation 3:
      //   = 0.5*(v + v0)*t
      //   = 0.5*(v0 + vd + v0)*t
      //   = 0.5*(2*v0 + vd)*t
      //   = (v0 + 0.5*vd)*t
      this.birdTop += (this.birdTopVelocity + 0.5 * birdTopVelocityDelta) * interpol;
      this.birdTopVelocity = birdTopVelocityFinal;

      this.pipeLeft -= this.pipeLeftVelocity * interpol;
      if (this.pipeLeft < -50) {
        const gapSizeDelta = 150 - this.gapSize;
        this.pipeTopHeight = randomInt(25 - gapSizeDelta, 225 + gapSizeDelta);
        this.pipeBotHeight = 400 - this.gapSize - this.pipeTopHeight;
        this.pipeLeft = 400;
        this.pipeScored = false;
      }

      if (!this.pipeScored) {
        if (this.bird.offsetLeft > this.pipeLeft + this.pipeTop.clientWidth) {
          this.score += 1;

          if (this.score === 10) {
            this.pipeLeftVelocity += 0.5;
          } else if (this.score === 20) {
            this.pipeLeftVelocity += 0.5;
          } else if (this.score === 30) {
            this.gapSize -= 10;
          }

          this.pipeScored = true;
        }
      }

      if (this.detectBirdCollision()) {
        return true;
      }
    }
    return false;
  }

  render() {
    this.bird.style.top = `${this.birdTop}px`;
    this.pipeTop.style.height = `${this.pipeTopHeight}px`;
    this.pipeBot.style.height = `${this.pipeBotHeight}px`;
    this.pipeTop.style.left = `${this.pipeLeft}px`;
    this.pipeBot.style.left = `${this.pipeLeft}px`;
    this.scoreBoard.textContent = `${this.score}`.padStart(3, "0");
    this.fpsBoard.textContent = `${this.fps()}`.padStart(3, "0");
  }

  birdJump() {
    if (this.birdTopVelocity > 0) {
      this.birdTopVelocity = this.birdFlapForce;
    } else {
      this.birdTopVelocity += this.birdFlapForce;
    }
    if (this.birdTopVelocity < -this.birdVelocityMax) {
      this.birdTopVelocity = -this.birdVelocityMax;
    }
  }

  detectBirdCollision() {
    if (this.bird.offsetHeight + this.bird.offsetTop > this.sky.offsetHeight) {
      // ground collision
      return true;
    }
    if (
      !(
        this.bird.offsetTop >= this.pipeTop.offsetTop + this.pipeTop.offsetHeight ||
        this.bird.offsetLeft + this.bird.offsetWidth <= this.pipeTop.offsetLeft ||
        this.bird.offsetLeft >= this.pipeTop.offsetLeft + this.pipeTop.offsetWidth
      )
    ) {
      // pipeTop collision
      return true;
    }
    if (
      !(
        this.bird.offsetTop + this.bird.offsetHeight <= this.pipeBot.offsetTop ||
        this.bird.offsetLeft + this.bird.offsetWidth <= this.pipeBot.offsetLeft ||
        this.bird.offsetLeft >= this.pipeBot.offsetLeft + this.pipeBot.offsetWidth
      )
    ) {
      // pipeBot collision
      return true;
    }
    return false;
  }

  displayGameOverPrompt() {
    this.prompt.style.display = "block";
    this.prompt.textContent = "Game Over! Click or tap to play again.";
  }

  fps() {
    if (!this.fpsa.length) {
      return 0;
    }
    const fps =
      this.fpsa.reduce((acc, el) => {
        return acc + el.fps;
      }, 0) / this.fpsa.length;
    return Math.round(fps);
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
