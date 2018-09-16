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
    color2: config.colors[1],
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
  const bar = { x, y, height: 0, color };
  if (player1) state.bars.bar1 = bar;
  else state.bars.bar2 = bar;
}

function setDemo(state, isDemo) {
  state.demo = isDemo;
  state.isPlaying = isDemo;
  if (isDemo) state.ball.vx = (config.maxSpeed + config.startSpeed) / 2;
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

// For direct set bar
// function setBar(state, player1, values) {
//   // cant set it more than once
//   if (player1 && state.bars.bar1) return;
//   if (!player1 && state.bars.bar2) return;
//   if (!state.isPlaying) return;
//
//   if (!state.bars) state.bars = {};
//   if (player1) state.bars.bar1 = values;
//   else state.bars.bar2 = values;
// }

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

function nextStep(state) {
  const { ball, bars, field } = state;

  let x = ball.x + ball.vx;
  let y = ball.y + ball.vy;
  const ballR = { x: x, y: y, w: ball.w, h: ball.h };
  const bar1 = { x: bars.bar1.x, y: bars.bar1.y, w: BarW, h: bars.bar1.height };
  const bar2 = { x: bars.bar2.x, y: bars.bar2.y, w: BarW, h: bars.bar2.height };
  const hitPlayer1 = bars.bar1 && bars.bar1.color === ball.color && collides(ballR, bar1);
  const hitPlayer2 = bars.bar2 && bars.bar2.color === ball.color && collides(ballR, bar2);
  if (hitPlayer1 || hitPlayer2) {
    const newSpeed = -ball.vx - (Math.sign(ball.vx) * config.speedIncreasePerHit);
    ball.vx = absMax(newSpeed, config.maxSpeed);
    ball.color = randElement(config.colors);
    x = ball.x;
    y = ball.y;
    if (hitPlayer1) bars.bar1 = false;
    if (hitPlayer2) bars.bar2 = false;
  }
  if (y < 0 || y + ball.h > field.height) {
    ball.vy = -ball.vy;
    y = ball.y;
    x = ball.x;
  }

  ball.x = x;
  ball.y = y;

  if ((x < 0 || x + ball.w + 30> field.width) && state.demo) {
    ball.vx = -ball.vx;
    ball.color = randElement(config.colors);
  }
  else if (x < 0) {
    state.scores.score2 += 1;
    onGoal(state);
  }
  else if (x + ball.w > field.width) {
    state.scores.score1 += 1;
    onGoal(state);
  }

}
