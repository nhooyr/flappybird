"use strict";

function init() {
  const g = new Game(window.document, window.localStorage);
  g.readInitialState();
  g.addEventListeners();
  // TODO: wrong only animate when g.alive = true
  // We do not call animate directly here with performance.now() as we need now to be
  // guaranteed to be moving forward. requestAnimationFrame caches now for the frame and
  // so if you call animate here directly then the requestAnimationFrame in animate will
  // almost immediately get called back with an older cached now.
  requestAnimationFrame(g.animate.bind(g));
}

class Game {
  // Many of the fields defined here could be static but I kept them as instance fields
  // to allow students to adjust game attributes on different levels.
  constructor(document, localStorage) {
    this.alive = false;
    this.document = document;

    this.helpEl = this.document.getElementById("help");
    this.helpButtonEl = help.children[0];

    this.promptEl = this.document.getElementById("prompt");
    this.skyEl = this.document.getElementById("sky");
    this.birdEl = this.document.getElementById("bird");

    this.scoreBoardEl = this.document.getElementById("score-board");
    this.scoreEl = this.document.getElementById("score-board-n");
    this.highScoreEl = this.document.getElementById("high-score-board-n");
    this.fpsMeterEl = this.document.getElementById("fps-meter");
    this.fpsEl = this.document.getElementById("fps-meter-n");

    this.renderState = {};
    this.prevRenderState = {};

    // See readInitialState for full structure.
    this.initialState = {
      birdVelocityY: 0,
      birdVelocityYMax: 6,
      // Path of the parabola -0.075*x^2.
      birdGravity: 0.15,
      birdFlapForce: -4,
      pipeVelocityX: 2,
    };
    this.state = {};

    const highScore = localStorage.getItem("flappybird-high-score");
    if (highScore) {
      this.state.highScore = highScore;
      this.highScoreEl.textContent = `${highScore}`.padStart(3, "0");
    } else {
      this.state.highScore = 0;
      localStorage.setItem("flappybird-high-score", this.state.highScore);
    }

    this.state.prompt = promptEl.textContent;

    // timeUnitVelocity evalutes to about 16.67 milliseconds. And so about 60 time units
    // fit into a second. A time unit is the maximum duration after which a collision is
    // checked for and the duration over which a whole velocity/acceleration unit is
    // applied.
    //
    // note: This doesn't mean we render at 60 FPS. Game._step() renders in between whole
    // time units for high refresh rate displays. e.g. try setting this to 30 time units a
    // second instead and see what effect it has.
    this.timeUnitVelocity = Math.round(Math.floor(1000 / 60) * 100) / 100;
    this.birdFlapInputs = [];

    // fpsa tracks the timestamp of every frame in the last 4 seconds.
    this.fpsa = [];
    this.fpsaThreshold = 4000;

    this.prevRenderTimeStamp = undefined;
  }

  // TODO: set prevRenderState too.
  readInitialState() {
    const pipeElements = this.document.querySelectorAll(".pipe");

    this.initialState = {
      bird: {
        diameter: this.birdEl.offsetWidth,
        top: this.birdEl.offsetTop,
      },
      pipes: [],
    };
    for (let i = 0; i < pipeElements.length; i += 2) {
      const roofEl = pipeElements[i];
      const floorEl = pipeElements[i + 1];
      this.initialState.pipes.push({
        left: roofEl.offsetLeft,
        roofHeight: roofEl.offsetHeight,
        floorHeight: floorEl.offsetHeight,
        width: roofEl.offsetWidth,
        scored: roofEl.offsetLeft + roofEl.offsetWidth < this.birdEl.offsetLeft,
      });
    }

    this.initialState.pipeGapHeight =
      this.skyEl.scrollHeight -
      pipeElements[0].offsetHeight -
      pipeElements[1].offsetHeight;
    this.initialState.pipeIntervalWidth =
      pipeElements[2].offsetLeft -
      pipeElements[0].offsetLeft -
      pipeElements[0].offsetWidth;
  }

  render() {
    if (this.renderState.birdX !== this.prevRenderState.birdX) {
      this.birdEl.style.top = `${this.renderState.birdX}px`;
    }
    for (p of this.renderState.pipes) {
      if (p.reclaim) {
        // TODO:
        throw new Error("TODO");
      }

      if (p.roofEl) {
        p.roofEl.style.left = `${p.left}px`;
        p.floorEl.style.left = `${p.left}px`;
      } else {
        // TODO: create pipe
      }
    }
    if (this.renderState.score !== this.prevRenderState.score) {
      this.scoreEl.textContent = `${this.renderState.score}`.padStart(3, "0");
    }
    if (this.renderState.fps !== this.prevRenderState.fps) {
      this.fpsEl.textContent = `${this.renderState.fps}`.padStart(3, "0");
    }
    if (this.renderState.prompt !== this.prevRenderState.prompt) {
      if (this.renderState.prompt) {
        this.prompt.style.display = "block";
        this.promptEl.textContent = this.renderState.prompt;
      } else {
        this.prompt.style.display = "none";
      }
    }
    if (this.renderState.highScore !== this.prevRenderState.highScore) {
      this.highScoreEl.textContent = `${this.renderState.highScore}`.padStart(3, "0");
    }
  }

  new() {
    // TODO:
    this.prevRenderState.score = 0;
    this.birdVelocityY = 0;
    this.prevRenderState.prompt = promptEl.textContent;

    this.renderState.prompt = undefined;
    this.prompt.style.display = "none";
    this.scoreEl.textContent = `${this.score}`.padStart(3, "0");
    this.fpsa.length = 0;
  }

  addEventListeners() {
    // Register Escape to close help if open.
    // Register Enter to act as the primary input key.
    // Register Space to substitute for Enter.
    // Register ArrowUp to substitute for Enter.
    this.document.addEventListener("keydown", e => {
      switch (e.key) {
        case " ":
        case "ArrowUp":
        case "Enter":
          if (help.contains(this.document.activeElement)) {
            return;
          }
          this.handleFlapInput();
          break;
        case "?":
          this.helpButtonEl.click();
          break;
        case "f":
          if (this.document.fullscreenElement) {
            this.document.exitFullscreen();
          } else {
            this.document.body.requestFullscreen();
          }
          break;
        case "Escape":
          if (help.open) {
            this.helpButtonEl.click();
          }
          break;
      }
    });
    return;

    // Register click (tap on mobile causes click) to
    this.document.addEventListener("click", e => {
      if (e.target === this.document.body) {
        // Normally click is for for the game.
        // But click is to close help if help is open.
        if (this.helpEl.open) {
          this.helpButtonEl.click();
          return;
        }
      } else if (this.helpEl.contains(e.target)) {
        return;
      } else if (this.fpsMeterEl.contains(e.target)) {
        return;
      } else if (this.scoreBoardEl.contains(e.target)) {
        return;
      }

      this.handleFlapInput();
    });
  }

  handleFlapInput() {
    if (game) {
      game.birdFlapWingsInput();
      return;
    }
  }

  animate() {
    const gameOver = game.step(now);
    game.render();
    if (highScore < game.score) {
      localStorage.setItem("flappybird-high-score", game.score);
    }
    if (gameOver) {
      game = undefined;
      return;
    }
    requestAnimationFrame(this.animate.bind(this));
  }

  step(now) {
    const gameOver = this._step(now);
    if (gameOver) {
      this.displayGameOverPrompt();
      return true;
    }
    while (this.fpsa.length && now - this.fpsa[0].ts > this.fpsaThreshold) {
      this.fpsa.shift();
    }
    this.fpsa.push({ts: now});
    return false;
  }

  _step(now) {
    if (!this.prevRenderTimeStamp) {
      this.prevRenderTimeStamp = now;
      return this.stepOne(now, 1);
    }

    if (now === this.prevRenderTimeStamp) {
      // A microsecond has not yet elapsed.
      // performance.now() may be a float with whole milliseconds but has a microsecond
      // the fractional portion too. See
      // https://developer.mozilla.org/en-US/docs/Web/API/Performance/now. Sometimes
      // you'll get floats with digits beyond the microsecond digits but those are just
      // for fuzzing as described in the above docs.
      return false;
    }
    if (now < this.prevRenderTimeStamp) {
      // Sanity check. Was occuring previously when I was directly calling animate.
      // See comment in init().
      throw new Error(
        `time flew backwards? prevRenderTimeStamp: ${this.prevRenderTimeStamp} > now: ${now}`
      );
    }

    let interpol = 1;
    for (
      let i = this.prevRenderTimeStamp + this.timeUnitVelocity;
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
    this.prevRenderTimeStamp = now;
    return false;
  }

  stepOne(now, interpol) {
    const timeUnitInputs = this.birdFlapInputs.filter(v => {
      return v.ts <= now;
    });
    timeUnitInputs = this.birdFlapInputs.splice(0, timeUnitInputs.length);

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

    this.pipes[0].left -= this.pipeVelocityX * interpol;
    if (this.pipes[0].left < -this.pipes[0].top.offsetWidth) {
      this.pipes[0].topHeight = randomInt(10, 400 - this.pipeGapHeight - 10);
      this.pipes[0].botHeight = 400 - this.pipeGapHeight - this.pipes[0].topHeight;
      this.pipes[0].left = 400;
      this.pipes[0].scored = false;
    }

    if (!this.pipes[0].scored) {
      if (this.bird.offsetLeft > this.pipes[0].left + this.pipes[0].top.scrollWidth) {
        this.score += 1;

        if (this.score === 5) {
          this.pipeVelocityX += 0.5;
        } else if (this.score === 50) {
          this.pipeVelocityX += 0.25;
        } else if (this.score === 100) {
          this.pipeVelocityX += 0.25;
          this.pipeGapHeight -= 10;
        }

        this.pipes[0].scored = true;
      }
    }

    return this.detectBirdCollisions();
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

  // https://stackoverflow.com/a/21096179/4283659
  detectBirdCollisions() {
    if (
      !(
        this.bird.offsetTop >=
          this.pipes[0].top.offsetTop + this.pipes[0].top.offsetHeight ||
        this.bird.offsetLeft + this.bird.offsetWidth <= this.pipes[0].top.offsetLeft ||
        this.bird.offsetLeft >=
          this.pipes[0].top.offsetLeft + this.pipes[0].top.offsetWidth
      )
    ) {
      // top collision
      return true;
    }
    if (
      !(
        this.bird.offsetTop + this.bird.offsetHeight <= this.pipes[0].bot.offsetTop ||
        this.bird.offsetLeft + this.bird.offsetWidth <= this.pipes[0].bot.offsetLeft ||
        this.bird.offsetLeft >=
          this.pipes[0].bot.offsetLeft + this.pipes[0].bot.offsetWidth
      )
    ) {
      // bot collision
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

// Returns a random integer x with min <= x <= max.
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

init();
