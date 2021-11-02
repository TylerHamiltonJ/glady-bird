// SELECT CVS
const cvs = document.getElementById("bird");
const ctx = cvs.getContext("2d");

// GAME VARS AND CONSTS
let frames = 0;
const DEGREE = Math.PI / 180;

// LOAD SPRITE IMAGE
const sprite = new Image();
sprite.src = "img/sprite_22.png";

// LOAD SOUNDS
const SCORE_S = new Audio();
SCORE_S.src = "audio/sfx_point.wav";

const FLAP = new Audio();
FLAP.src = "audio/sfx_flap.wav";

const HIT = new Audio();
HIT.src = "audio/sfx_hit.wav";

const SWOOSHING = new Audio();
SWOOSHING.src = "audio/sfx_swooshing.wav";

const DIE = new Audio();
DIE.src = "audio/sfx_die.wav";

// GAME STATE
const state = {
  current: 0,
  getReady: 0,
  game: 1,
  over: 2
};

// START BUTTON COORD
const startBtn = {
  x: 120,
  y: 263,
  w: 83,
  h: 29
};

function controlGame() {
  switch (state.current) {
    case state.getReady:
      state.current = state.game;
      SWOOSHING.play();
      break;
    case state.game:
      if (bird.y - bird.radius <= 0) return;
      bird.flap();
      FLAP.play();
      break;
    case state.over:
      virus.reset();
      vaccine.reset();
      bird.speedReset();
      score.reset();
      state.current = state.getReady;
      break;
  }
}

// CONTROL THE GAME
cvs.addEventListener("click", function (evt) {
  controlGame();
});
// event = keyup or keydown
document.addEventListener("keyup", event => {
  if (event.code === "Space") {
    controlGame();
  }
});

// BACKGROUND
const bg = {
  sX: 0,
  sY: 0,
  w: 275,
  h: 226,
  x: 0,
  y: 150,

  draw: function () {
    ctx.drawImage(sprite, this.sX, this.sY, this.w + 1, this.h, this.x, this.y, 320, this.h);
  }
};

// FOREGROUND
const fg = {
  sX: 276,
  sY: 0,
  w: 224,
  h: 112,
  x: 0,
  y: cvs.height - 112,

  dx: 2,

  draw: function () {
    let i = 0;
    while (i <= cvs.width) {
      ctx.drawImage(
        sprite,
        this.sX,
        this.sY,
        this.w,
        this.h,
        this.x + (i - 4),
        this.y,
        this.w,
        this.h
      );
      i += this.w;
    }
  },

  update: function () {
    if (state.current == state.game) {
      this.x = (this.x - this.dx) % (this.w / 2);
    }
  }
};

// BIRD
const bird = {
  normal: {
    sX: 459,
    sY: 115
  },
  jumpFrame: {
    sX: 460,
    sY: 155
  },

  x: 50,
  y: 150,
  w: 19,
  h: 36,
  radius: 12,

  frame: 0,

  gravity: 0.225,
  jump: 4.6,
  speed: 0,
  rotation: 0,

  draw: function () {
    let bird = this.normal;
    if (this.shouldJump === true) {
      bird = this.jumpFrame;
    }
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.drawImage(
      sprite,
      bird.sX,
      bird.sY,
      this.w,
      this.h,
      -this.w / 2,
      -this.h / 2,
      this.w,
      this.h
    );

    ctx.restore();
  },

  flap: function () {
    this.speed = -this.jump;
    this.shouldJump = true;
  },

  update: function () {
    // IF THE GAME STATE IS GET READY STATE, THE BIRD MUST FLAP SLOWLY
    this.period = state.current == state.getReady ? 10 : 5;
    // WE INCREMENT THE FRAME BY 1, EACH PERIOD
    this.frame += frames % this.period == 0 ? 1 : 0;

    if (state.current == state.getReady) {
      this.y = 150; // RESET POSITION OF THE BIRD AFTER GAME OVER
      this.rotation = 0 * DEGREE;
    } else {
      this.speed += this.gravity;
      this.y += this.speed;

      if (this.y + this.h / 2 >= cvs.height - fg.h) {
        this.y = cvs.height - fg.h - this.h / 2;
        if (state.current == state.game) {
          state.current = state.over;
          const gameNumber = parseInt(localStorage.getItem("gameNumber")) || 0;
          sendDataLayerScore(score.value, score.best, gameNumber + 1);
          localStorage.setItem("gameNumber", gameNumber + 1);
          sendScore(score.value);
          DIE.play();
        }
      }

      // IF THE SPEED IS GREATER THAN THE JUMP MEANS THE BIRD IS FALLING DOWN
      if (
        state.current == state.over &&
        this.rotation <= 4.5 &&
        !(this.y + this.h / 2 >= cvs.height - fg.h)
      ) {
        this.rotation += DEGREE * 5;
      }
      if (this.speed <= 0 || state.current == state.over) {
        this.shouldJump = true;
      } else {
        this.shouldJump = false;
      }
      if (this.speed >= this.jump) {
        this.frame = 1;
      } else {
      }
    }
  },
  speedReset: function () {
    this.speed = 0;
  }
};

// GET READY MESSAGE
const getReady = {
  sX: 0,
  sY: 228,
  w: 173,
  h: 240,
  x: cvs.width / 2 - 173 / 2,
  y: 80,

  draw: function () {
    if (state.current == state.getReady) {
      ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
    }
  }
};

// GAME OVER MESSAGE
const gameOver = {
  sX: 175,
  sY: 228,
  w: 225,
  h: 202,
  x: cvs.width / 2 - 225 / 2,
  y: 90,

  draw: function () {
    if (state.current == state.over) {
      ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, this.x, this.y, this.w, this.h);
    }
  }
};

// VIRUS
const virus = {
  position: [],

  sX: 410,
  sY: 115,

  w: 40,
  h: 40,
  maxYPos: 0,
  dx: 2,

  draw: function () {
    for (let i = 0; i < this.position.length; i++) {
      let p = this.position[i];
      ctx.drawImage(sprite, this.sX, this.sY, this.w, this.h, p.x, p.y, this.w, this.h);
    }
  },

  update: function () {
    function randomIntFromInterval(min, max) {
      // min and max included
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
    if (state.current !== state.game) return;
    if (frames % 100 == 0) {
      this.position.push({
        x: cvs.width,
        y: randomIntFromInterval(this.maxYPos, cvs.height - (fg.h + this.h))
      });
    }
    for (let i = 0; i < this.position.length; i++) {
      let p = this.position[i];

      // COLLISION DETECTION
      if (
        bird.x + bird.radius > p.x &&
        bird.x - bird.radius < p.x + this.w &&
        bird.y + bird.radius > p.y &&
        bird.y - bird.radius < p.y + this.h
      ) {
        state.current = state.over;
        const gameNumber = parseInt(localStorage.getItem("gameNumber")) || 0;
        sendDataLayerScore(score.value, score.best, gameNumber + 1);
        localStorage.setItem("gameNumber", gameNumber + 1);
        sendScore(score.value);
        HIT.play();
      }

      // MOVE THE VIRUS TO THE LEFT
      p.x -= this.dx;

      // if the virus go beyond canvas, we delete it from the array
      if (p.x + this.w <= 0) {
        this.position.shift();
      }
    }
  },

  reset: function () {
    this.position = [];
  }
};

// Vaccine
const vaccine = {
  position: [],

  pfizer: {
    sX: 456,
    sY: 203,
    score: 5
  },
  az: {
    sX: 456,
    sY: 252,
    score: 1
  },

  w: 25,
  h: 46,
  maxYPos: 0,
  dx: 2.5,

  draw: function () {
    for (let i = 0; i < this.position.length; i++) {
      let p = this.position[i];
      if (!p.vaxType) {
        const ran = Math.random();
        if (ran > 0.8) {
          p.vaxType = "pfizer";
        } else {
          p.vaxType = "az";
        }
        const vaxType = this[p.vaxType];
        p.score = vaxType.score;
      }
      const vaxType = this[p.vaxType];
      ctx.drawImage(sprite, vaxType.sX, vaxType.sY, this.w, this.h, p.x, p.y, this.w, this.h);
    }
  },

  update: function () {
    function randomIntFromInterval(min, max) {
      // min and max included
      return Math.floor(Math.random() * (max - min + 1) + min);
    }
    if (state.current !== state.game) return;
    if (frames % 100 == 0) {
      this.position.push({
        x: cvs.width,
        y: randomIntFromInterval(this.maxYPos, cvs.height - fg.h - this.h)
      });
    }
    for (let i = 0; i < this.position.length; i++) {
      let p = this.position[i];

      // COLLISION DETECTION
      if (
        bird.x + bird.radius > p.x &&
        bird.x - bird.radius < p.x + this.w &&
        bird.y + bird.radius > p.y &&
        bird.y - bird.radius < p.y + this.h
      ) {
        this.position.shift();
        score.value += p.score;
        SCORE_S.play();
        score.best = Math.max(score.value, score.best);
        localStorage.setItem("best", score.best);
      }

      // MOVE THE VIRUS TO THE LEFT
      p.x -= this.dx;

      // if the virus go beyond canvas, we delete it from the array
      if (p.x + this.w <= 0) {
        this.position.shift();
      }
    }
  },

  reset: function () {
    this.position = [];
  }
};

// SCORE
const score = {
  best: parseInt(localStorage.getItem("best")) || 0,
  value: 825,

  draw: function () {
    ctx.fillStyle = "#FFF";
    ctx.strokeStyle = "#000";

    if (state.current == state.game) {
      //   ctx.lineWidth = 2;
      ctx.font = "35px VT323";
      ctx.fillText(this.value, cvs.width / 2, 50);
      //   ctx.strokeText(this.value, cvs.width / 2, 50);
    } else if (state.current == state.over) {
      // SCORE VALUE
      ctx.fillStyle = "#222";
      ctx.font = "25px VT323";
      ctx.fillText(this.value, 225, 186);
      // BEST SCORE
      ctx.fillText(this.value, 225, 228);
    }
  },

  reset: function () {
    this.value = 0;
  }
};

// DRAW
function draw() {
  ctx.fillStyle = "#70c5ce";
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  bg.draw();
  virus.draw();
  vaccine.draw();
  fg.draw();
  bird.draw();
  getReady.draw();
  gameOver.draw();
  score.draw();
}

// UPDATE
function update() {
  bird.update();
  fg.update();
  virus.update();
  vaccine.update();
}

// LOOP
function loop() {
  update();
  draw();
  frames++;

  requestAnimationFrame(loop);
}
loop();
resizeFooter();

function resizeFooter() {
  cvs.style.height = `${window.innerHeight}px`;
  document.getElementById("footer").style.width = `${cvs.clientWidth}px`;
}

window.addEventListener("resize", resizeFooter);
