"use strict";

init();
function init() {
  const help = document.getElementById("help");
  const helpButton = help.children[0];
  const fpsMeter = document.getElementById("fps-meter");
  const scoreBoard = document.getElementById("score-board");

  // Register Escape to close help if open.
  // Register Enter to act as the primary input key.
  // Register Space to substitute for Enter.
  // Register ArrowUp to substitute for Enter.
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
        if (help.contains(document.activeElement)) {
          return;
        }
        handleFlapInput();
        break;
    }
  });

  const highScoreBoard = document.getElementById("high-score-board-n");
  let highScore = restoreHighScoreBoard(highScoreBoard);

  // Register click (tap on mobile causes click) to
  document.addEventListener("click", e => {
    if (e.target === document.body) {
      // Normally click is for for the game.
      // But click is to close help if help is open.
      if (help.open) {
        helpButton.click();
        return;
      }
    } else if (helpButton.contains(e.target)) {
      return;
    } else if (fpsMeter.contains(e.target)) {
      return;
    } else if (scoreBoard.contains(e.target)) {
      return;
    }

    handleFlapInput();
  });

  let game;
  const handleFlapInput = () => {
    if (game) {
      game.birdFlapWingsInput();
      return;
    }

    highScore = restoreHighScoreBoard(highScoreBoard);
    game = new Game();
    const stepCB = now => {
      const gameOver = game.step(now);
      game.render();
      if (highScore < game.score) {
        localStorage.setItem("flappybird-high-score", game.score);
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
    // almost immediately get called back with an older cached now.
    requestAnimationFrame(stepCB);
  };
}

function restoreHighScoreBoard(highScoreBoard) {
  let highScore = localStorage.getItem("flappybird-high-score");
  if (highScore) {
    highScoreBoard.textContent = `${highScore}`.padStart(3, "0");
    return highScore;
  } else {
    localStorage.setItem("flappybird-high-score", 0);
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
    this.fpsMeter = document.getElementById("fps-meter-n");

    // Kept in sync with the CSS.
    this.birdTop = this.sky.offsetHeight / 2 - this.bird.offsetHeight / 2 - 30;
    // Remember this is the opposite of math as the origin at the top.
    // So negative velocity is up and positive is down.
    this.birdVelocityY = 0;

    this.pipeTopHeight = 100;
    this.pipeBotHeight = 150;
    // Kept in sync with the CSS.
    this.pipeLeft = this.sky.offsetWidth - this.pipeTop.offsetWidth - 2;

    // These two are adjusted in our 3 levels.
    this.pipeVelocityX = 2;
    this.gapSize = 150;

    // These next four fields could all be static but I made them regular fields so that
    // students can adjust them for their own levels.

    // timeUnitVelocity evalutes to about 16.67 milliseconds. And so about 60 time units
    // fit into a second. A time unit is the maximum duration after which a collision is
    // checked for and the duration over which a whole velocity/acceleration unit is
    // applied.
    //
    // note: This doesn't mean we render at 60 FPS. Game._step() renders in between whole
    // time units for high refresh rate displays. e.g. try setting this to 30 time units a
    // second instead and see what effect it has.
    this.timeUnitVelocity = Math.round(Math.floor(1000 / 60) * 100) / 100;
    // Path of the parabola -0.075*x^2.
    this.birdGravity = 0.15;
    this.birdVelocityYMax = 6;
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

    if (now === this.lastStepTime) {
      // A microsecond has not yet elapsed.
      // performance.now() may be a float with whole milliseconds but has a microsecond
      // the fractional portion too. See
      // https://developer.mozilla.org/en-US/docs/Web/API/Performance/now. Sometimes
      // you'll get floats with digits beyond the microsecond digits but those are just
      // for fuzzing as described in the above docs.
      return false;
    }
    if (now < this.lastStepTime) {
      // Sanity check. Was occuring previously when I was directly calling stepCB.
      // See comment there.
      throw new Error(
        `time flew backwards? lastStepTime: ${this.lastStepTime} > now: ${now}`
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
        // The lowest this can ever be is
        // 0.001/this.timeUnitVelocity = 0.00005998800239952009.
        // The lowest number we multiply interpol by is 0.15 i.e gravity.
        // 0.15*0.00005998800239952009 = .00000899820035992801 whose majority is well
        // within the range of 64 bit floats and so we will never be in a situation where
        // time is lost due to interpol being truncated by the bounded nature of machine
        // floats.
        //
        // See https://en.wikipedia.org/wiki/Floating-point_arithmetic#Representable_numbers,_conversion_and_rounding
        interpol = (now - (i - this.timeUnitVelocity)) / this.timeUnitVelocity;
        if (interpol < 0.00005998800239952009) {
          // Could occur if we go beyond microsecond resolution in the future.
          throw new Error(
            `interpol factor below limit of 0.00005998800239952009: interpol: ${interpol}, last: ${i}, now: ${now}`
          );
        }
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
    const timeUnitInputs = this.birdFlapInputs.filter(v => {
      return v.ts <= now;
    });
    this.birdFlapInputs.splice(0, timeUnitInputs.length);

    // We break up the time unit being stepped through for each input to process
    // each input at the exact time at which it came in.
    // Input is sampled at whatever rate at which it comes in indifferent towards time
    // velocity.
    for (let i = 0; i < timeUnitInputs.length; i++) {
      let durSinceLastStep;
      if (i === 0) {
        durSinceLastStep =
          timeUnitInputs[0].ts - (now - this.timeUnitVelocity * interpol);
      } else {
        durSinceLastStep = timeUnitInputs[i].ts - timeUnitInputs[i - 1].ts;
      }
      const interpol2 = durSinceLastStep / this.timeUnitVelocity;
      interpol -= interpol2;
      const gameOver = this._stepOne(interpol2);
      if (gameOver) {
        return gameOver;
      }
      this.birdFlapWings();
    }

    const gameOver = this._stepOne(interpol);
    if (gameOver) {
      return gameOver;
    }
    return false;
  }

  _stepOne(interpol) {
    let birdVelocityYDelta = this.birdGravity * interpol;
    let birdVelocityYFinal = this.birdVelocityY + birdVelocityYDelta;
    if (birdVelocityYFinal > this.birdVelocityYMax) {
      birdVelocityYFinal = this.birdVelocityYMax;
      birdVelocityYDelta = this.birdVelocityYMax - this.birdVelocityY;
    }
    // https://en.wikipedia.org/wiki/Equations_of_motion#Constant_translational_acceleration_in_a_straight_line
    // Derived from Equation 3:
    //   = 0.5*(v + v0)*t
    //   = 0.5*(v0 + vd + v0)*t
    //   = 0.5*(2*v0 + vd)*t
    //   = (v0 + 0.5*vd)*t
    this.birdTop += (this.birdVelocityY + 0.5 * birdVelocityYDelta) * interpol;
    this.birdVelocityY = birdVelocityYFinal;

    this.pipeLeft -= this.pipeVelocityX * interpol;
    if (this.pipeLeft < -50) {
      const gapSizeDelta = 150 - this.gapSize;
      this.pipeTopHeight = randomInt(10 - gapSizeDelta, 240 + gapSizeDelta);
      this.pipeBotHeight = 400 - this.gapSize - this.pipeTopHeight;
      this.pipeLeft = 400;
      this.pipeScored = false;
    }

    if (!this.pipeScored) {
      if (this.bird.offsetLeft > this.pipeLeft + this.pipeTop.clientWidth) {
        this.score += 1;

        if (this.score === 10) {
          this.pipeVelocityX += 0.5;
        } else if (this.score === 20) {
          this.pipeVelocityX += 0.5;
        } else if (this.score === 30) {
          this.gapSize -= 10;
        }

        this.pipeScored = true;
      }
    }

    return this.detectBirdCollisions();
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

  birdFlapWingsInput() {
    this.birdFlapInputs.push({ts: performance.now()});
  }

  birdFlapWings() {
    if (this.birdVelocityY > 0) {
      this.birdVelocityY = this.birdFlapForce;
    } else {
      this.birdVelocityY += this.birdFlapForce;
    }
    if (this.birdVelocityY < -this.birdVelocityYMax) {
      this.birdVelocityY = -this.birdVelocityYMax;
    }
  }

  detectBirdCollisions() {
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
    this.prompt.textContent = "Game Over! Press enter or tap to play again.";
  }

  fps() {
    if (this.fpsa.length < 2) {
      return 0;
    }
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
