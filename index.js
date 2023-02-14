const highScoreBoard = document.getElementById('high-score-board-n')
let highScore = 0
let game
document.getElementById('game').addEventListener('click', () => {
  if (game) {
    game.click()
    return
  }

  highScoreBoard.textContent = `${highScore}`
  game = new Game()
  let lastFrame
  const fpsInterval = Math.floor(1000 / 60)
  const stepCB = (now) => {
    if (!lastFrame || now - lastFrame >= fpsInterval) {
      game.step()
      if (game.over()) {
        if (highScore < game.score) {
          highScore = game.score
        }
        game.showOverPopup()
        game = undefined
        return
      }
      lastFrame = now
    }
    requestAnimationFrame(stepCB)
  }
  requestAnimationFrame(stepCB)
})

class Game {
  constructor() {
    this.popup = document.getElementById('popup')
    this.popup.style.display = 'none'
    this.sky = document.getElementById('sky')
    this.bird = document.getElementById('bird')
    this.pipeTop = document.getElementById('pipe-top')
    this.pipeBot = document.getElementById('pipe-bot')
    this.scoreBoard = document.getElementById('score-board-n')

    this.birdTop = this.sky.offsetHeight / 2 - this.bird.offsetHeight / 2 - 30
    this.bird.style.top = `${this.birdTop}px`
    this.birdTopAccel = 0

    this.pipeTopHeight = 100
    this.pipeBotHeight = 150
    this.pipeTop.style.height = `${this.pipeTopHeight}px`
    this.pipeBot.style.height = `${this.pipeBotHeight}px`
    this.pipeLeft = this.sky.offsetWidth - this.pipeTop.offsetWidth - 5
    this.pipeTop.style.left = `${this.pipeLeft}px`
    this.pipeBot.style.left = `${this.pipeLeft}px`

    this.gapSize = 150
    // Path of the parabola 0.075*x^2.
    this.birdGravity = 0.15
    this.pipeVelocity = 2

    this.pipeScored = false
    this.score = 0
    this.scoreBoard.textContent = `${this.score}`
  }

  step() {
    this.birdTopAccel -= this.birdGravity
    if (this.birdTopAccel < -6) {
      this.birdTopAccel = -6
    }
    this.birdTop -= this.birdTopAccel
    this.bird.style.top = `${this.birdTop}px`

    this.pipeLeft -= this.pipeVelocity
    if (this.pipeLeft < -50) {
      const gapSizeDelta = 150 - this.gapSize
      this.pipeTopHeight = randomInt(25 - gapSizeDelta, 225 + gapSizeDelta)
      this.pipeBotHeight = 400 - this.gapSize - this.pipeTopHeight
      this.pipeTop.style.height = `${this.pipeTopHeight}px`
      this.pipeBot.style.height = `${this.pipeBotHeight}px`
      this.pipeLeft = 400
      this.pipeScored = false
    }
    this.pipeTop.style.left = `${this.pipeLeft}px`
    this.pipeBot.style.left = `${this.pipeLeft}px`

    if (!this.pipeScored) {
      if (this.bird.offsetLeft > this.pipeLeft + this.pipeTop.clientWidth) {
        this.score += 1
        this.scoreBoard.textContent = `${this.score}`

        if (this.score === 10) {
          this.pipeVelocity += 0.5
        } else if (this.score === 20) {
          this.pipeVelocity += 0.5
        } else if (this.score === 30) {
          this.gapSize -= 10
        }

        this.pipeScored = true
      }
    }
  }

  click() {
    if (this.birdTopAccel < 0) {
      // Path of the parabola 2*x^2.
      this.birdTopAccel = 4
    } else {
      this.birdTopAccel += 4
    }
    if (this.birdTopAccel > 6) {
      this.birdTopAccel = 6
    }
  }

  over() {
    if (this.bird.offsetHeight + this.bird.offsetTop > this.sky.offsetHeight) {
      // ground collision
      return true
    }
    if (
      !(
        this.bird.offsetTop >= this.pipeTop.offsetTop + this.pipeTop.offsetHeight ||
        this.bird.offsetLeft + this.bird.offsetWidth <= this.pipeTop.offsetLeft ||
        this.bird.offsetLeft >= this.pipeTop.offsetLeft + this.pipeTop.offsetWidth
      )
    ) {
      // pipeTop collision
      return true
    }
    if (
      !(
        this.bird.offsetTop + this.bird.offsetHeight <= this.pipeBot.offsetTop ||
        this.bird.offsetLeft + this.bird.offsetWidth <= this.pipeBot.offsetLeft ||
        this.bird.offsetLeft >= this.pipeBot.offsetLeft + this.pipeBot.offsetWidth
      )
    ) {
      // pipeBot collision
      return true
    }
    return false
  }

  showOverPopup() {
    this.popup.style.display = 'block'
    this.popup.textContent = 'Game Over! Click to play again.'
  }
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
