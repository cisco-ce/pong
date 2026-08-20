
function $(sel) { return document.querySelector(sel); }

let canvas, ctx;
let keepAliveTimer = 0;
let animFrameId = null;
let lastTime = 0;
let accumulator = 0;

// Physics always steps at 60 fps regardless of display refresh rate
const STEP_MS = 1000 / 60;

function scheduleFrame() {
  if (animFrameId === null) {
    animFrameId = requestAnimationFrame(gameLoop);
  }
}

function togglePlay() {
  state.isPlaying = !state.isPlaying;
  if (state.isPlaying) {
    lastTime = 0;
    accumulator = 0;
    scheduleFrame();
  } else {
    render(state);
  }
}

function gameLoop(timestamp) {
  animFrameId = null;

  if (state.isPlaying) {
    if (lastTime === 0) lastTime = timestamp;
    // Cap delta to avoid spiral of death after tab switch / long pause
    const delta = Math.min(timestamp - lastTime, 100);
    lastTime = timestamp;
    accumulator += delta;

    while (accumulator >= STEP_MS && state.isPlaying) {
      nextStep(state);
      accumulator -= STEP_MS;
    }

    if (state.isPlaying) scheduleFrame();
  } else {
    lastTime = 0;
    accumulator = 0;
  }

  render(state);

  if (state.gameOver) {
    const winner = state.scores.score1 > state.scores.score2 ? 'Player 1' : 'Player 2';
    message(`${winner} won!`);
  }
}

// --- Canvas rendering --------------------------------------------------------

function render(state) {
  const { ball, bars, scores, field } = state;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawDivider(field);
  drawScores(scores, field);
  if (bars.bar1) renderBar(bars.bar1);
  if (bars.bar2) renderBar(bars.bar2);
  drawBall(ball);
}

function drawDivider(field) {
  ctx.fillStyle = '#eee';
  ctx.fillRect(field.width / 2 - 3, 0, 6, field.height);
}

function drawBall(ball) {
  const { x, y, w, h, vx, vy, color } = ball;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = w / 2;

  // Motion shadow
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx - vx * 1.5, cy - vy * 1.5, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function renderBar(bar) {
  const { x, y, height, color } = bar;
  if (height <= 0) return;
  const r = BarW / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, BarW, height, r);
  ctx.fill();
}

function drawScores(scores, field) {
  ctx.save();
  ctx.font = '250px "CiscoSansTT Regular", sans-serif';
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(scores.score1, field.width / 4, field.height / 2);
  ctx.fillText(scores.score2, (field.width * 3) / 4, field.height / 2);
  ctx.restore();
}

// --- Input helpers -----------------------------------------------------------

function isBallTouched(touch) {
  const { ball } = state;
  const cx = ball.x + ball.w / 2;
  const cy = ball.y + ball.h / 2;
  const r = ball.w / 2;
  const dx = touch.clientX - cx;
  const dy = touch.clientY - cy;
  return dx * dx + dy * dy <= r * r;
}

// --- Misc --------------------------------------------------------------------

function debug(msg) {
  $('.debug').innerText = JSON.stringify(msg);
}

function keypress(e) {
  if (e.key === ' ') togglePlay();
}

function keepAlive() {
  clearTimeout(keepAliveTimer);
  keepAliveTimer = setTimeout(startDemo, config.standbyTime * 1000);
}

function setupColors() {
  const { color1, color2 } = state.colors;
  const picker1 = createColorPicker((c) => selectColor(state, c, null), color1);
  $('.footer').appendChild(picker1);

  if (!config.twoColorPickers) return;
  const picker2 = createColorPicker((c) => selectColor(state, null, c), color2);
  $('.footer').appendChild(picker2);
}

function message(text) {
  const msg = $('.pill');
  msg.innerText = text;
  $('.message').style.display = !!text ? 'flex' : 'none';
}

function startDemo() {
  $('.intro').style.display = 'flex';
  $('.o-marker').style.backgroundColor = randElement(config.colors);
  message(false);
  setDemo(state, true);
  $('.footer').style.display = 'none';
  lastTime = 0;
  accumulator = 0;
  scheduleFrame();
}

function onResize() {
  state.field.width = window.innerWidth;
  state.field.height = window.innerHeight;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (!state.isPlaying) render(state);
}

function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  onResize();
  reset(state);

  ontouchstart = (e) => {
    const touch = e.touches[0];
    if (!state.isPlaying && isBallTouched(touch)) {
      togglePlay();
    } else {
      startBar(state, touch.clientX, touch.clientY);
      if (!state.isPlaying) render(state);
    }
  };

  ontouchmove = (e) => {
    const touch = e.touches[0];
    drawBar(state, touch.clientX, touch.clientY);
    if (!state.isPlaying) render(state);
  };

  $('.message').ontouchstart = (e) => {
    $('.message').style.display = 'none';
    newGame(state);
    render(state);
    e.stopPropagation();
  };

  $('.intro').ontouchstart = (e) => {
    $('.intro').style.display = 'none';
    $('.footer').style.display = 'flex';
    newGame(state);
    setDemo(state, false);
    keepAlive();
    render(state);
    e.stopPropagation();
  };

  window.addEventListener('touchstart', keepAlive, true);
  window.onresize = onResize;
  window.onkeydown = keypress;
  window.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  window.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  window.addEventListener('touchend', e => e.preventDefault(), { passive: false });
  setupColors();
  render(state);
  startDemo();
}

window.onload = init;
