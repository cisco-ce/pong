/**
 * Frame of reference:
 * - all positions are given as x,y,w,h, where x and y is top left pos (not center of object)
 * - x,y is zero at top left and positive right and downwards
 */

function absMax(value, max) {
  if (value > max) return max;
  if (value < -max) return -max;
  return value;
}

function randElement(list) {
  return list[parseInt(Math.random() * list.length)];
}

function random(min, max) {
  return min + (max-min) * Math.random();
}

function randSign() { return Math.random() < 0.5 ? 1 : -1 }

const state = {
  field: {
    width: 0,
    height: 0,
  },
  isPlaying: false,
  gameOver: false,
  demo: true,
  balls: [],
  ballSpawnTimer: 0,
  colors: {
    color1: config.colors[0],
    color2: config.colors[0],
  },
  lastScore: null, // player1, player2
  scores: {
    score1: 0,
    score2: 0,
  },
  bars: {
    bar1: [], // [{ id, points: [{x,y}], color, length }], oldest first
    bar2: [],
  },
  splats: [],
  confetti: [],
};

function reset(state) {
  const { initYSpeed, startSpeed } = config;
  const vx = startSpeed * randSign();
  const vy = random(initYSpeed.min, initYSpeed.max) * randSign();
  state.isPlaying = false;
  state.bars.bar1 = [];
  state.bars.bar2 = [];
  state.balls = [makeBall(state.field, vx, vy)];
  state.ballSpawnTimer = nextSpawnInterval();
}

function selectColor(state, color1, color2) {
  if (color1) state.colors.color1 = color1;
  if (color2) state.colors.color2 = color2;
}

function startBar(state, id, x, y) {
  const player1 = x < state.field.width / 2;
  const color = player1 ? state.colors.color1 : state.colors.color2;
  const list = player1 ? state.bars.bar1 : state.bars.bar2;
  list.push({ id, points: [{ x, y }], color, length: 0 });
  while (list.length > config.maxBarsPerPlayer) list.shift();
}

function setDemo(state, isDemo) {
  state.demo = isDemo;
  state.isPlaying = isDemo;
  state.gameOver = false;
  if (isDemo) {
    state.splats = [];
    state.confetti = [];
    if (state.balls.length > 0) {
      state.balls[0].vx = Math.sign(state.balls[0].vx || 1) * (config.startSpeed + 2);
    }
  }
}

// Touch ids get reused by browsers after a finger lifts, so release them
function endBar(state, id) {
  for (const bar of [...state.bars.bar1, ...state.bars.bar2]) {
    if (bar.id === id) bar.id = null;
  }
}

function drawBar(state, id, x, y) {
  const bar = [...state.bars.bar1, ...state.bars.bar2].find(b => b.id === id);
  if (!bar || bar.length >= config.maxBarHeight) return;
  const last = bar.points[bar.points.length - 1];
  const segLen = Math.hypot(x - last.x, y - last.y);
  if (segLen < 2) return;
  bar.points.push({ x, y });
  bar.length += segLen;
}

function onGoal(state) {
  reset(state);
  const win = config.winScore;
  state.gameOver = state.scores.score1 === win || state.scores.score2 === win;
  if (state.gameOver) spawnConfetti(state, state.scores.score1 > state.scores.score2);
}

function spawnConfetti(state, leftSide) {
  const { width, height } = state.field;
  const x0 = leftSide ? 0 : width / 2;
  state.confetti = [];
  for (let i = 0; i < config.confettiCount; i++) {
    state.confetti.push({
      x: x0 + random(0, width / 2),
      y: height + 10,
      vx: random(-6, 6),
      vy: -random(14, 30),
      rotation: random(0, Math.PI * 2),
      vr: random(-0.3, 0.3),
      phase: random(0, Math.PI * 2),
      w: random(8, 16),
      h: random(14, 26),
      color: randElement(config.colors),
      delay: random(0, 40), // frames; staggers the burst
      age: 0,
      life: random(150, 260),
    });
  }
}

// dt is in 60fps frames
function stepConfetti(state, dt) {
  state.confetti = state.confetti.filter(p => {
    if (p.delay > 0) { p.delay -= dt; return true; }
    p.vy += 0.35 * dt;
    p.vx *= Math.pow(0.99, dt);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rotation += p.vr * dt;
    p.age += dt;
    return p.age < p.life && p.y < state.field.height + 40;
  });
}

function newGame(state) {
  reset(state);
  state.gameOver = false;
  state.scores = { score1: 0, score2: 0 };
  state.splats = [];
  state.confetti = [];
}

// Clamp ball velocity so it never travels more than maxAngle degrees from horizontal
function clampBallAngle(vx, vy) {
  const maxTan = Math.tan(config.maxReflectionAngle * Math.PI / 180);
  const speed = Math.hypot(vx, vy);
  if (speed === 0) return { vx, vy };
  const maxVyAbs = Math.abs(vx) * maxTan;
  if (Math.abs(vy) > maxVyAbs) {
    vy = Math.sign(vy) * maxVyAbs;
    const clamped = Math.hypot(vx, vy);
    vx = vx * speed / clamped;
    vy = vy * speed / clamped;
  }
  return { vx, vy };
}

function makeBall(field, vx, vy) {
  return {
    x: field.width / 2 - config.ballSize.w / 2,
    y: field.height / 2 - config.ballSize.h / 2,
    w: config.ballSize.w,
    h: config.ballSize.h,
    vx,
    vy,
    color: randElement(config.colors),
    introFrame: 0,
  };
}

function nextSpawnInterval() {
  const base = config.ballSpawnInterval * 60; // frames at 60fps
  return Math.round(base * (0.7 + Math.random() * 0.6)); // 70%–130% of base
}

function spawnBall(state) {
  if (state.balls.length >= config.maxBalls) return;
  const { initYSpeed, startSpeed } = config;
  state.balls.push(makeBall(
    state.field,
    startSpeed * randSign(),
    random(initYSpeed.min, initYSpeed.max) * randSign(),
  ));
}

function createSplat(x, y, color, side) {
  const rotation = Math.random() * Math.PI * 2;
  const size = 70 + Math.random() * 30;
  return { x, y, color, side, rotation, size };
}

// Returns 'goal1', 'goal2', or null
function stepBall(state, ball) {
  if (ball.introFrame < config.introDuration) {
    ball.introFrame++;
    return null;
  }
  const { bars, field, demo } = state;

  let hitNormal = null;
  let hitList = null;
  let hitBar = null;
  for (const list of [bars.bar1, bars.bar2]) {
    for (const bar of list) {
      if (bar.color !== ball.color) continue;
      hitNormal = pathHitNormal(bar, ball);
      if (hitNormal) { hitList = list; hitBar = bar; break; }
    }
    if (hitNormal) break;
  }

  const nextX = ball.x + ball.vx;
  const nextY = ball.y + ball.vy;

  if (hitNormal) {
    const { nx, ny } = hitNormal;
    const dot = ball.vx * nx + ball.vy * ny;
    if (dot < 0) {
      ball.vx -= 2 * dot * nx;
      ball.vy -= 2 * dot * ny;
      const clamped = clampBallAngle(ball.vx, ball.vy);
      ball.vx = clamped.vx;
      ball.vy = clamped.vy;
      if (!demo) playSound('hitLine');
    }
    ball.color = randElement(config.colors);
    hitList.splice(hitList.indexOf(hitBar), 1);
  }
  else if ((nextX < 0 || nextX + ball.w + 20 > field.width) && demo) {
    ball.vx = -ball.vx;
    ball.color = randElement(config.colors);
  }
  else if (nextY < 0 || nextY + ball.h > field.height) {
    ball.vy = -ball.vy;
    if (!demo) playSound('hitWall');
  }
  else if (nextX < 0) {
    if (!demo) playSound('miss');
    if (config.showSplats) state.splats.push(createSplat(0, ball.y + ball.h / 2, ball.color, 'left'));
    return 'goal2';
  }
  else if (nextX + ball.w > field.width) {
    if (!demo) playSound('miss');
    if (config.showSplats) state.splats.push(createSplat(field.width, ball.y + ball.h / 2, ball.color, 'right'));
    return 'goal1';
  }
  else {
    ball.x += ball.vx;
    ball.y += ball.vy;
  }
  return null;
}

function nextStep(state) {
  const { demo } = state;

  if (!demo) {
    state.ballSpawnTimer--;
    if (state.ballSpawnTimer <= 0) {
      spawnBall(state);
      state.ballSpawnTimer = nextSpawnInterval();
    }
  }

  for (const ball of state.balls) {
    const result = stepBall(state, ball);
    if (result === 'goal2') {
      state.scores.score2 += 1;
      state.lastScore = 'player2';
      onGoal(state);
      return;
    }
    if (result === 'goal1') {
      state.scores.score1 += 1;
      state.lastScore = 'player1';
      onGoal(state);
      return;
    }
  }
}
