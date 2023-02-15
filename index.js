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
        game.click();
        return;
      }

      highScore = restoreHighScoreBoard(highScoreBoard);
    }

    game = new Game();
    let lastFrame;
    const fpsInterval = Math.floor(1000 / 60);
    const stepCB = now => {
      if (!lastFrame || now - lastFrame >= fpsInterval) {
        const ok = game.step();
        if (!ok) {
          game.showGameOverPrompt();
          return;
        }
        lastFrame = now;
        if (highScore < game.score) {
          localStorage.setItem("flappy-bird-high-score", game.score);
        }
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
    this.birdTopAccel = 0;

    this.pipeTopHeight = 100;
    this.pipeBotHeight = 150;
    this.pipeTop.style.height = `${this.pipeTopHeight}px`;
    this.pipeBot.style.height = `${this.pipeBotHeight}px`;
    this.pipeLeft = this.sky.offsetWidth - this.pipeTop.offsetWidth - 5;
    this.pipeTop.style.left = `${this.pipeLeft}px`;
    this.pipeBot.style.left = `${this.pipeLeft}px`;

    this.gapSize = 150;
    // Path of the parabola 0.075*x^2.
    this.birdGravity = 0.15;
    this.pipeVelocity = 2;

    this.pipeScored = false;
    this.score = 0;
    this.scoreBoard.textContent = `${this.score}`;
  }

  step() {
    this.birdTopAccel -= this.birdGravity;
    if (this.birdTopAccel < -6) {
      this.birdTopAccel = -6;
    }
    this.birdTop -= this.birdTopAccel;
    this.bird.style.top = `${this.birdTop}px`;

    this.pipeLeft -= this.pipeVelocity;
    if (this.pipeLeft < -50) {
      const gapSizeDelta = 150 - this.gapSize;
      this.pipeTopHeight = randomInt(25 - gapSizeDelta, 225 + gapSizeDelta);
      this.pipeBotHeight = 400 - this.gapSize - this.pipeTopHeight;
      this.pipeTop.style.height = `${this.pipeTopHeight}px`;
      this.pipeBot.style.height = `${this.pipeBotHeight}px`;
      this.pipeLeft = 400;
      this.pipeScored = false;
    }
    this.pipeTop.style.left = `${this.pipeLeft}px`;
    this.pipeBot.style.left = `${this.pipeLeft}px`;

    if (!this.pipeScored) {
      if (this.bird.offsetLeft > this.pipeLeft + this.pipeTop.clientWidth) {
        this.score += 1;
        this.scoreBoard.textContent = `${this.score}`;

        if (this.score === 10) {
          this.pipeVelocity += 0.5;
        } else if (this.score === 20) {
          this.pipeVelocity += 0.5;
        } else if (this.score === 30) {
          this.gapSize -= 10;
        }

        this.pipeScored = true;
      }
    }

    this.ok = !this.detectBirdCollision();
    return this.ok;
  }

  click() {
    if (this.birdTopAccel < 0) {
      // Path of the parabola 2*x^2.
      this.birdTopAccel = 4;
    } else {
      this.birdTopAccel += 4;
    }
    if (this.birdTopAccel > 6) {
      this.birdTopAccel = 6;
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

  showGameOverPrompt() {
    this.prompt.style.display = "block";
    this.prompt.textContent = "Game Over! Click or tap to play again.";
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
