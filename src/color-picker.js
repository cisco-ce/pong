
function createColorPicker(state, onSelect) {
  const bar = document.createElement('div');
  bar.className = 'colors';
  config.colors.forEach(c => {
    const color = document.createElement('div');
    color.classList.add('color');
    color.style.backgroundColor = c;

    color.ontouchstart = (e) => {
      e.preventDefault();
      onSelect(c);
      const prev = $('.color.selected');
      if (prev) prev.classList.remove('selected');
      color.classList.add('selected');
    }

    if (c === state.currentColor) color.classList.add('selected');
    bar.appendChild(color);
  });
  bar.ontouchstart = (e) => e.stopPropagation(); // not a click to draw on canvas etc

  return bar;
}
