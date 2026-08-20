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
  ball: {
    x: 0,
    y: 0,
    h: config.ballSize.h,
    w: config.ballSize.w,
    vx: 0,
    vy: 0,
    color: '',
  },
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
  const { field, ball } = state;
  const { initYSpeed, startSpeed, colors } = config;
  ball.x = field.width / 2 - ball.w / 2;
  ball.y = field.height / 2 - ball.h / 2;
  ball.vx = state.lastScore === 'player1' ? startSpeed : -startSpeed;
  ball.vy = random(initYSpeed.min, initYSpeed.max) * randSign();
  state.isPlaying = false;
  ball.color = randElement(colors);
  state.bars.bar1 = null;
  state.bars.bar2 = null;
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
  if (isDemo) state.ball.vx = config.startSpeed + 2;
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

function nextStep(state) {
  const { ball, bars, field, demo } = state;

  const hit1 = bars.bar1 && bars.bar1.color === ball.color ? pathHitNormal(bars.bar1, ball) : null;
  const hit2 = bars.bar2 && bars.bar2.color === ball.color ? pathHitNormal(bars.bar2, ball) : null;
  const hitNormal = hit1 || hit2;

  const nextX = ball.x + ball.vx;
  const nextY = ball.y + ball.vy;

  if (hitNormal) {
    const { nx, ny } = hitNormal;
    const dot = ball.vx * nx + ball.vy * ny;
    if (dot < 0) {
      const speed = Math.hypot(ball.vx, ball.vy);
      ball.vx -= 2 * dot * nx;
      ball.vy -= 2 * dot * ny;
      const newSpeed = Math.min(speed + config.speedIncreasePerHit, config.maxSpeed);
      const reflectedSpeed = Math.hypot(ball.vx, ball.vy);
      if (reflectedSpeed > 0) {
        ball.vx = ball.vx * newSpeed / reflectedSpeed;
        ball.vy = ball.vy * newSpeed / reflectedSpeed;
      }
      const clamped = clampBallAngle(ball.vx, ball.vy);
      ball.vx = clamped.vx;
      ball.vy = clamped.vy;
    }
    ball.color = randElement(config.colors);
    if (hit1) bars.bar1 = null;
    else bars.bar2 = null;
  }
  // demo bounce
  else if ((nextX < 0 || nextX + ball.w + 20 > field.width) && demo) {
    ball.vx = -ball.vx;
    ball.color = randElement(config.colors);
  }
  // hitting floor/roof:
  else if (nextY < 0 || nextY + ball.h > field.height) {
    ball.vy = -ball.vy;
  }
  else if (nextX < 0) {
    state.scores.score2 += 1;
    state.lastScore = 'player2';
    onGoal(state);
  }
  else if (nextX + ball.w > field.width) {
    state.scores.score1 += 1;
    state.lastScore = 'player1';
    onGoal(state);
  }
  // "normal" ball update
  else {
    ball.x += ball.vx;
    ball.y += ball.vy;
  }
}
