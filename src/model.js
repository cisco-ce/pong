/**
 * Frame of reference:
 * - all positions are given as x,y,w,h, where x and y is top left pos (not center of object)
 * - x,y is zero at top left and positive right and downwards
 */

const BarW = 20;

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
  scores: {
    score1: 0,
    score2: 0,
  },
  bars: {
    bar1: false, // { x, y, color },
    bar2: false,
  },
};

function reset(state) {
  const { field, ball } = state;
  const { initYSpeed, startSpeed, colors } = config;
  ball.x = field.width / 2 - ball.w / 2;
  ball.y = field.height / 2 - ball.h / 2;
  ball.vx = startSpeed * randSign();
  ball.vy = random(initYSpeed.min, initYSpeed.max) * randSign();
  state.isPlaying = false;
  ball.color = randElement(colors);
  state.bars.bar1 = false;
  state.bars.bar2 = false;
}

function selectColor(state, color1, color2) {
  if (color1) state.colors.color1 = color1;
  if (color2) state.colors.color2 = color2;
}

function startBar(state, x, y) {
  const player1 = x < state.field.width / 2;
  const color = player1 ? state.colors.color1 : state.colors.color2;
  const bar = { x, y, height: 0, color, yInit: y };
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
  const MaxHeight = config.maxBarHeight;
  const player1 = x < state.field.width / 2;
  const bar = player1 ? state.bars.bar1 : state.bars.bar2;
  if (bar.height >= MaxHeight) return;
  const yMin = Math.min(y, bar.y);
  const yMax = Math.max(y, bar.y + bar.height);
  bar.y = yMin;
  bar.height = yMax - yMin;
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

function barAboutToBeHit(bar, ball, color) {
  if (!bar) return false;

  const x = ball.x + ball.vx;
  const y = ball.y + ball.vy;
  const ballR = { x: x, y: y, w: ball.w, h: ball.h };
  const barR = { x: bar.x, y: bar.y, w: BarW, h: bar.height };
  const hit = bar.color === ball.color && collides(ballR, barR);
  return hit;
}

function nextStep(state) {
  const { ball, bars, field, colors, demo } = state;
  const hitPlayer1 = barAboutToBeHit(bars.bar1, ball, colors.color1);
  const hitPlayer2 = barAboutToBeHit(bars.bar2, ball, colors.color2);

  const nextX = ball.x + ball.vx;
  const nextY = ball.y + ball.vy;

  let vyChange = 0;
  if (hitPlayer1 || hitPlayer2) {
    const newSpeed = -ball.vx - (Math.sign(ball.vx) * config.speedIncreasePerHit);
    ball.vx = absMax(newSpeed, config.maxSpeed);
    ball.color = randElement(config.colors);

    const vyFactor = 1;
    const minLength = 100; // need to be longer to influence angle
    if (hitPlayer1) {
      vyChange = bars.bar1.y < bars.bar1.yInit ? -vyFactor : vyFactor;
      if (bars.bar1.height < minLength) vyChange = 0;
      bars.bar1 = false;
    }
    else {
      vyChange = bars.bar2.y < bars.bar2.yInit ?  -vyFactor : vyFactor;
      if (bars.bar2.height < minLength) vyChange = 0;
      bars.bar2 = false;
    }
    ball.vy += vyChange;
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
    onGoal(state);
  }
  else if (nextX + ball.w > field.width) {
    state.scores.score1 += 1;
    onGoal(state);
  }
  // "normal" ball update
  else {
    ball.x += ball.vx;
    ball.y += ball.vy;
  }
}
