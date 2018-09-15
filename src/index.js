
function $(sel) { return document.querySelector(sel) }

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
    $('.score1').style.display = 'none';
    $('.score2').style.display = 'none';
    window.requestAnimationFrame(update);
  }
  else {
    $('.score1').style.display = 'flex';
    $('.score2').style.display = 'flex';
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
  const { x, y, color } = b;
  const ball = $('.ball');
  ball.style.backgroundColor = color;
  setPos(ball, x, y);
}

function debug(msg) {
  $('.debug').innerText = JSON.stringify(msg);
}

function keypress(e) {
  if (e.key === ' ') togglePlay();
}

function setupColors() {
  const picker = createColorPicker(state, (c) => selectColor(state, c));
  $('.footer').appendChild(picker);
}

function message(text) {
  const msg = $('.message');
  msg.innerText = text;
  $('.center').style.display = !!text ? 'flex' : 'none';
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
      startBar(state, touch.clientX, touch.clientY, state.currentColor);
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

  $('.center').ontouchstart = (e) => {
    $('.center').style.display = 'none';
    newGame(state);
    update();
    e.stopPropagation();
  }
  window.onkeydown = keypress;
  window.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  setupColors();
  update();
}

window.onload = init;
