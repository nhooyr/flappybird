"use strict";

init();

function init() {
  const highScoreBoard = document.getElementById("high-score-board-n");
  let highScore = restoreHighScoreBoard(highScoreBoard);

  const help = document.getElementById("help");
  const helpButton = help.children[0];

  // Register Escape to close help if open.
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (help.open) {
        helpButton.click();
      }
    }
  });

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

    if (game) {
      if (game.ok) {
        game.flap();
        return;
      }

      highScore = restoreHighScoreBoard(highScoreBoard);
    }

    game = new Game();
    const stepCB = now => {
      const ok = game.stepTo(now);
      if (!ok) {
        return;
      }
      game.render();
      if (highScore < game.score) {
        localStorage.setItem("flappy-bird-high-score", game.score);
      }
      requestAnimationFrame(stepCB);
    };
    requestAnimationFrame(stepCB);
  });
}

function restoreHighScoreBoard(highScoreBoard) {
  let highScore = localStorage.getItem("flappy-bird-high-score");
  if (highScore) {
    highScoreBoard.textContent = `${highScore}`;
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

    this.birdTop = this.sky.offsetHeight / 2 - this.bird.offsetHeight / 2 - 30;
    this.bird.style.top = `${this.birdTop}px`;
    this.birdTopVelocity = 0;

    this.pipeTopHeight = 100;
    this.pipeBotHeight = 150;
    this.pipeTop.style.height = `${this.pipeTopHeight}px`;
    this.pipeBot.style.height = `${this.pipeBotHeight}px`;
    this.pipeLeft = this.sky.offsetWidth - this.pipeTop.offsetWidth - 5;
    this.pipeTop.style.left = `${this.pipeLeft}px`;
    this.pipeBot.style.left = `${this.pipeLeft}px`;

    this.gapSize = 150;
    // Path of the parabola -0.075*x^2.
    this.birdGravity = 0.15;
    this.birdVelocityMax = 6;
    // Path of the parabola 2*x^2.
    this.birdFlapForce = -4;
    this.pipeLeftVelocity = 2;

    this.pipeScored = false;
    this.score = 0;
    this.scoreBoard.textContent = `${this.score}`;
    this.ok = true;
    // Sets lastStepTime to immediately render the next frame on the stepTo(now).
    this.lastStepTime = performance.now() - Game.stepVelocity;
  }

  static stepVelocity = Math.floor(1000 / 60);

  stepTo(now) {
    const stepDur = now - this.lastStepTime;
    const stepFrac = stepDur / Game.stepVelocity;
    if (stepFrac === 0) {
      // More time needs to pass.
      return true;
    }
    const ok = this.stepByFrac(stepFrac);
    if (!ok) {
      this.displayGameOverPrompt();
      return false;
    }
    this.lastStepTime = now;
    return true;
  }

  stepByFrac(frac) {
    for (; frac > 0; frac--) {
      let fracDelta = 1;
      if (frac < 1) {
        fracDelta = frac;
      }
      let birdTopVelocityDelta = this.birdGravity * fracDelta;
      let birdTopVelocityFinal = this.birdTopVelocity + birdTopVelocityDelta;
      if (birdTopVelocityFinal > this.birdVelocityMax) {
        birdTopVelocityFinal = this.birdVelocityMax;
        birdTopVelocityDelta = this.birdVelocityMax - this.birdTopVelocity;
      }
      this.birdTop +=
        this.birdTopVelocity * fracDelta + 0.5 * birdTopVelocityDelta * fracDelta;
      this.birdTopVelocity = birdTopVelocityFinal;

      this.pipeLeft -= this.pipeLeftVelocity * fracDelta;
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
        this.ok = false;
        return false;
      }
    }
    return true;
  }

  render() {
    this.bird.style.top = `${this.birdTop}px`;
    this.pipeTop.style.height = `${this.pipeTopHeight}px`;
    this.pipeBot.style.height = `${this.pipeBotHeight}px`;
    this.pipeTop.style.left = `${this.pipeLeft}px`;
    this.pipeBot.style.left = `${this.pipeLeft}px`;
    this.scoreBoard.textContent = `${this.score}`;
  }

  flap() {
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
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
