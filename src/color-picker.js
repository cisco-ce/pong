
function darkenColor(hex) {
  if (hex === 'black') hex = '#000000';
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.floor(((n >> 16) & 0xff) * 0.65);
  const g = Math.floor(((n >> 8)  & 0xff) * 0.65);
  const b = Math.floor(( n        & 0xff) * 0.65);
  return `rgb(${r},${g},${b})`;
}

function createColorPicker(onSelect, selected) {
  const bar = document.createElement('div');
  bar.className = 'colors';
  config.colors.forEach(c => {
    const box = document.createElement('div');
    box.classList.add('color-box');
    const color = document.createElement('div');
    color.classList.add('color');
    color.style.backgroundColor = c;
    color.style.borderColor = darkenColor(c);
    color.dataset.color = c;
    box.appendChild(color);
    box.ontouchstart = (e) => {
      e.preventDefault();
      onSelect(c);
      const prev = bar.querySelector('.color.selected');
      if (prev) {
        prev.classList.remove('selected');
        prev.style.borderColor = darkenColor(prev.dataset.color);
      }
      color.classList.add('selected');
      color.style.borderColor = darkenColor(c);
    }

    if (c === selected) color.classList.add('selected');
    bar.appendChild(box);
  });
  bar.ontouchstart = (e) => e.stopPropagation(); // not a click to draw on canvas etc

  return bar;
}
