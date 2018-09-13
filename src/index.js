
function $(sel) { return document.querySelector(sel) }

function togglePlay() {
  state.isPlaying = !state.isPlaying;
}

function setPos(el, x, y) {
  el.style.transform = `translate(${x}px, ${y}px)`;
}

function update() {
  updateBall(state.ball);
  updateBars(state);
  updateScores(state);
  if (state.isPlaying) nextStep(state);
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
    element.style.height = BarH + 'px';
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

function click(x, y) {
  if (!state.isPlaying) {
    togglePlay();
    return;
  }
  const isPlayer1  = x < state.field.width / 2;
  const yOffset = y - BarH / 2;
  setBar(state, isPlayer1, { x, y: yOffset, color: state.currentColor });
}

function keypress(e) {
  if (e.key === ' ') togglePlay();
}

function setupColors() {
  const bar = $('.colors');
  config.colors.forEach(c => {
    const color = document.createElement('div');
    color.classList.add('color');
    color.style.backgroundColor = c;
    const select = () => {
      selectColor(state, c);
      const prev = $('.color.selected');
      if (prev) prev.classList.remove('selected');
      color.classList.add('selected');
    }
    color.onmousedown = select;
    color.ontouchstart = (e) => { select(); e.preventDefault(); }

    if (c === state.currentColor) color.classList.add('selected');
    bar.appendChild(color);
  });
}

function init() {
  state.field.width = window.innerWidth;
  state.field.height = window.innerHeight;
  const field = $('.field');
  field.style.width = state.field.width + 'px';
  field.style.height = state.field.height + 'px';

  reset(state);
  field.onmousedown = (e) => click(e.offsetX, e.offsetY);

  field.ontouchstart = (e) => {
    e.preventDefault();
    click(e.touches[0].clientX, e.touches[0].clientY);
  };
  field.onclick = e => e.stopPropagation();
  const ball = $('.ball');
  ball.style.width = state.ball.w + 'px';
  ball.style.height = state.ball.h + 'px';

  update();
  window.onkeydown = keypress;
  setupColors();
  setInterval(update, config.frameRate);
}

window.onload = init;
