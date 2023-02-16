"use strict";

init();

function init() {
  const help = document.getElementById("help");
  const helpButton = help.children[0];

  // Register Escape to close help if open.
  // Register Enter to substitute for clicking.
  // Register Space to substitute for clicking.
  // Register ArrowUp to substitute for clicking.
  document.addEventListener("keydown", e => {
    switch (e.key) {
      case "Escape":
        if (help.open) {
          helpButton.click();
        }
        break;
      case " ":
      case "ArrowUp":
      case "Enter":
        e.preventDefault();
        processInput();
        break;
    }
  });

  const highScoreBoard = document.getElementById("high-score-board");
  let highScore = restoreHighScoreBoard(highScoreBoard);

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

    processInput();
  });

  let game;
  const processInput = () => {
    if (game) {
      game.birdFlapWings();
      return;
    }

    highScore = restoreHighScoreBoard(highScoreBoard);
    game = new Game();
    const stepCB = now => {
      const gameOver = game.step(now);
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
    // We do not call stepCB directly here with performance.now() as we need now to be
    // guaranteed to be moving forward. requestAnimationFrame caches now for the frame and
    // so if you call stepCB here directly then the requestAnimationFrame in stepCB will
    // almost immediately get called back with an older now.
    requestAnimationFrame(stepCB);
  };
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
    this.scoreBoard = document.getElementById("score-board");
    this.fpsMeter = document.getElementById("fps-meter");

    // Kept in sync with the CSS.
    this.birdTop = this.sky.offsetHeight / 2 - this.bird.offsetHeight / 2 - 30;
    this.birdTopVelocity = 0;

    this.pipeTopHeight = 100;
    this.pipeBotHeight = 150;
    // Kept in sync with the CSS.
    this.pipeLeft = this.sky.offsetWidth - this.pipeTop.offsetWidth + 2;

    // These two are adjusted in our 3 levels.
    this.pipeLeftVelocity = 2;
    this.gapSize = 150;

    // These next four fields could all be static but I made them regular fields so that
    // students can adjust them for their own levels.

    // 60 time units a second.
    // note: This doesn't mean we render at 60 FPS. Game.step() supports rendering in
    // between full time units for high refresh rate displays.
    this.timeUnitVelocity = Math.floor(1000 / 60);
    // Path of the parabola -0.075*x^2.
    this.birdGravity = 0.15;
    this.birdVelocityMax = 6;
    this.birdFlapForce = -4;

    this.birdFlapInputs = [];
    this.pipeScored = false;
    this.score = 0;
    this.scoreBoard.textContent = `${this.score}`.padStart(3, "0");
    this.lastStepTime;
    // fpsa tracks the timestamp of every frame in the last 4 seconds.
    this.fpsa = [];

    this.render();
  }

  step(now) {
    const gameOver = this._step(now);
    if (gameOver) {
      this.displayGameOverPrompt();
      return true;
    }
    while (this.fpsa.length && now - this.fpsa[0].ts > 4000) {
      this.fpsa.shift();
    }
    this.fpsa.push({ts: now});
    return false;
  }

  _step(now) {
    if (!this.lastStepTime) {
      this.lastStepTime = now;
      return this.stepOne(now, 1);
    }

    if (now == this.lastStepTime) {
      // A millisecond has not yet elapsed.
      return false;
    }
    if (now < this.lastStepTime) {
      // Time overflowed.
      throw new Error(
        `time overflowed, now: ${now} < lastStepTime: ${this.lastStepTime}`
      );
    }

    let interpol = 1;
    for (
      let i = this.lastStepTime + this.timeUnitVelocity;
      i < now + this.timeUnitVelocity;
      i += this.timeUnitVelocity
    ) {
      if (i > now) {
        // interpolate the next render into a fraction of the time unit.
        // e.g.if now = this.timeUnitVelocity*1.5 then we will step one time unit and then
        // interpolate 0.5 of the next time unit.
        //
        // The lowest this can ever be is 1/16 which is 0.0625. The lowest number we
        // multiply interpol by is 0.15 i.e gravity. 0.15*0.0625 = 0.009375 which is well
        // within the range of 64 bit floats and so we will never be in a situation where
        // time is lost due to interpol being truncated or otherwise not representable
        // due to the imprecise nature of floats.
        //
        // See https://en.wikipedia.org/wiki/Floating-point_arithmetic#Representable_numbers,_conversion_and_rounding
        interpol = (now - (i - this.timeUnitVelocity)) / this.timeUnitVelocity;
        i = now;
      }
      const gameOver = this.stepOne(i, interpol);
      if (gameOver) {
        return gameOver;
      }
    }

    this.lastStepTime = now;
    return false;
  }

  stepOne(now, interpol) {
    while (this.birdFlapInputs.length && this.birdFlapInputs[0].ts <= now) {
      this.birdFlapInputs.shift();
      if (this.birdTopVelocity > 0) {
        this.birdTopVelocity = this.birdFlapForce;
      } else {
        this.birdTopVelocity += this.birdFlapForce;
      }
      if (this.birdTopVelocity < -this.birdVelocityMax) {
        this.birdTopVelocity = -this.birdVelocityMax;
      }
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

    return this.detectBirdCollision();
  }

  render() {
    this.bird.style.top = `${this.birdTop}px`;
    this.pipeTop.style.height = `${this.pipeTopHeight}px`;
    this.pipeBot.style.height = `${this.pipeBotHeight}px`;
    this.pipeTop.style.left = `${this.pipeLeft}px`;
    this.pipeBot.style.left = `${this.pipeLeft}px`;
    this.scoreBoard.textContent = `${this.score}`.padStart(3, "0");
    this.fpsMeter.textContent = `${this.fps()}`.padStart(3, "0");
  }

  birdFlapWings() {
    this.birdFlapInputs.push({ts: performance.now()});
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
    this.prompt.textContent = "Game Over! Click, enter or tap to play again.";
  }

  fps() {
    let fpsAcc = 0;
    for (let i = 1; i < this.fpsa.length; i++) {
      fpsAcc += 1000 / (this.fpsa[i].ts - this.fpsa[i - 1].ts);
    }
    return Math.round(fpsAcc / (this.fpsa.length - 1));
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
