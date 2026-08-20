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
    bar1: null, // { points: [{x,y}], color, length }
    bar2: null,
  },
};

function reset(state) {
  const { initYSpeed, startSpeed } = config;
  const vx = state.lastScore === 'player1' ? startSpeed : -startSpeed;
  const vy = random(initYSpeed.min, initYSpeed.max) * randSign();
  state.isPlaying = false;
  state.bars.bar1 = null;
  state.bars.bar2 = null;
  state.balls = [makeBall(state.field, vx, vy)];
  state.ballSpawnTimer = nextSpawnInterval();
}

function selectColor(state, color1, color2) {
  if (color1) state.colors.color1 = color1;
  if (color2) state.colors.color2 = color2;
}

function startBar(state, x, y) {
  const player1 = x < state.field.width / 2;
  const color = player1 ? state.colors.color1 : state.colors.color2;
  const bar = { points: [{ x, y }], color, length: 0 };
  if (player1) state.bars.bar1 = bar;
  else state.bars.bar2 = bar;
}

function setDemo(state, isDemo) {
  state.demo = isDemo;
  state.isPlaying = isDemo;
  state.gameOver = false;
  if (isDemo && state.balls.length > 0) {
    state.balls[0].vx = Math.sign(state.balls[0].vx || 1) * (config.startSpeed + 2);
  }
}

function drawBar(state, x, y) {
  const player1 = x < state.field.width / 2;
  const bar = player1 ? state.bars.bar1 : state.bars.bar2;
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
}

function newGame(state) {
  reset(state);
  state.gameOver = false;
  state.scores = { score1: 0, score2: 0 };
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
  };
}

function nextSpawnInterval() {
  const base = config.ballSpawnInterval * 60; // frames at 60fps
  return Math.round(base * (0.7 + Math.random() * 0.6)); // 70%–130% of base
}

function spawnBall(state) {
  const { initYSpeed, startSpeed } = config;
  state.balls.push(makeBall(
    state.field,
    startSpeed * randSign(),
    random(initYSpeed.min, initYSpeed.max) * randSign(),
  ));
}

// Returns 'goal1', 'goal2', or null
function stepBall(state, ball) {
  const { bars, field, demo } = state;

  const hit1 = bars.bar1 && bars.bar1.color === ball.color ? pathHitNormal(bars.bar1, ball) : null;
  const hit2 = bars.bar2 && bars.bar2.color === ball.color ? pathHitNormal(bars.bar2, ball) : null;
  const hitNormal = hit1 || hit2;

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
    }
    ball.color = randElement(config.colors);
    if (hit1) bars.bar1 = null;
    else bars.bar2 = null;
  }
  else if ((nextX < 0 || nextX + ball.w + 20 > field.width) && demo) {
    ball.vx = -ball.vx;
    ball.color = randElement(config.colors);
  }
  else if (nextY < 0 || nextY + ball.h > field.height) {
    ball.vy = -ball.vy;
  }
  else if (nextX < 0) {
    return 'goal2';
  }
  else if (nextX + ball.w > field.width) {
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
