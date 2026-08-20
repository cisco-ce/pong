
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
  const { balls, bars, scores, field } = state;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawDivider(field);
  if (!state.isPlaying) drawScores(scores, field);
  state.splats.forEach(drawSplat);
  if (bars.bar1) renderPath(bars.bar1);
  if (bars.bar2) renderPath(bars.bar2);
  balls.forEach(drawBall);
  if (state.demo && balls.length > 0) {
    $('.o-marker').style.backgroundColor = balls[0].color;
  }
  $('#startOverlay').style.display = !state.isPlaying && !state.demo && !state.gameOver ? 'flex' : 'none';
}

function drawSplat(splat) {
  const { x, y, color, side, rays } = splat;
  const baseAngle = side === 'left' ? 0 : Math.PI;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (const { angle, len, width, dropR } of rays) {
    const a = baseAngle + angle;
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ex, ey, dropR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDivider(field) {
  ctx.fillStyle = '#eee';
  ctx.fillRect(field.width / 2 - 3, 0, 6, field.height);
}

function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function drawBall(ball) {
  const { x, y, w, h, vx, vy, color } = ball;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const inIntro = ball.introFrame < config.introDuration;
  const r = (w / 2) * (inIntro ? easeOutBack(ball.introFrame / config.introDuration) : 1);
  if (r <= 0) return;

  if (!inIntro) {
    // Motion shadow
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx - vx * 1.5, cy - vy * 1.5, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function renderPath(path) {
  const { points, color } = path;
  if (points.length === 0) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = config.pathLineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (points.length === 1) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, config.pathLineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
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
  $('#refreshBtn').style.display = config.showDebugRefresh ? 'block' : 'none';

  onResize();
  reset(state);

  ontouchstart = (e) => {
    for (const touch of e.changedTouches) {
      startBar(state, touch.clientX, touch.clientY);
    }
    if (!state.isPlaying) render(state);
  };

  ontouchmove = (e) => {
    for (const touch of e.changedTouches) {
      drawBar(state, touch.clientX, touch.clientY);
    }
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

  $('#startBtn').ontouchstart = (e) => {
    $('#startOverlay').style.display = 'none';
    togglePlay();
    e.stopPropagation();
  };
  $('#startBtn').onclick = () => { if (!state.isPlaying) togglePlay(); };

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
