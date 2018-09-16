
function $(sel) { return document.querySelector(sel) }

let keepAliveTimer = 0;

function togglePlay() {
  state.isPlaying = !state.isPlaying;
  update();
}

function setPos(el, x, y) {
  el.style.transform = `translate(${x}px, ${y}px)`;
}

function update() {
  const { ball, scores, isPlaying, gameOver } = state;
  updateBall(ball);
  updateBars(state);
  updateScores(state);
  if (isPlaying) {
    nextStep(state);
    $('.scores').style.display = 'none';
    window.requestAnimationFrame(update);
  }
  else {
    $('.scores').style.display = 'block';
  }
  if (gameOver) {
    const { scores } = state;
    const winner = scores.score1 > scores.score2 ? 'Player 1' : 'Player 2';
    message(`${winner} won!`);
  }
}

function updateScores(state) {
  $('.score1').innerText = state.scores.score1;
  $('.score2').innerText = state.scores.score2;
}

function updateBar(element, bar) {
  element.style.display = bar ? 'block' : 'none';
  if (bar) {
    setPos(element, bar.x, bar.y);
    element.style.backgroundColor = bar.color;
    element.style.height = bar.height + 'px';
  }
}

function updateBars(state) {
  const { bar1, bar2 } = state.bars;
  const player1 = $('.player1');
  const player2 = $('.player2');
  updateBar(player1, bar1);
  updateBar(player2, bar2);
}

function updateBall(b) {
  const { x, y, vx, vy, color } = b;
  const ball = $('.ball');
  const shadow = $('.ball-shadow');
  ball.style.backgroundColor = color;
  shadow.style.left = (-1.5 * vx) + 'px';
  shadow.style.top = (-1.5 * vy) + 'px';
  setPos(ball, x, y);
}

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
  const picker1 = createColorPicker(state, (c) => selectColor(state, c, null));
  $('.footer').appendChild(picker1);

  if (!config.twoColorPickers) return;
  const picker2 = createColorPicker(state, (c) => selectColor(state, null, c));
  $('.footer').appendChild(picker2);
}

function message(text) {
  const msg = $('.pill');
  msg.innerText = text;
  $('.message').style.display = !!text ? 'flex' : 'none';
}

function startDemo() {
  $('.intro').style.display = 'flex';
  setDemo(state, true);
  update();
}

function init() {
  state.field.width = window.innerWidth;
  state.field.height = window.innerHeight;
  const field = $('.field');
  field.style.width = state.field.width + 'px';
  field.style.height = state.field.height + 'px';

  reset(state);

  ontouchstart = (e) => {
    if (!state.isPlaying) togglePlay();
    else {
      const touch = event.touches[0];
      startBar(state, touch.clientX, touch.clientY);
      updateBars(state);
    }
  }
  ontouchmove = (e) => {
    const touch = event.touches[0];
    drawBar(state, touch.clientX, touch.clientY);
    updateBars(state);
  }

  // field.ontouchstart = (e) => {
  //   e.preventDefault();
  //   touch(e.touches[0].clientX, e.touches[0].clientY);
  // };

  const ball = $('.ball');
  ball.style.width = state.ball.w + 'px';
  ball.style.height = state.ball.h + 'px';

  $('.message').ontouchstart = (e) => {
    $('.message').style.display = 'none';
    newGame(state);
    update();
    e.stopPropagation();
  }

  $('.intro').ontouchstart = (e) => {
    $('.intro').style.display = 'none';
    newGame(state);
    setDemo(state, false);
    keepAlive();
    update();
    e.stopPropagation();
  }

  window.addEventListener('touchstart', keepAlive, true);
  window.onkeydown = keypress;
  window.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  setupColors();
  update();
  startDemo();
}

window.onload = init;
