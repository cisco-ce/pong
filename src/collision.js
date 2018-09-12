// https://stackoverflow.com/questions/306316/determine-if-two-rectangles-overlap-each-other
// (y part negated since this is not cartesian coordinate system)
function _collides(r1, r2) {
  return (r1.x1 < r2.x2 ) && (r1.x2 > r2.x1) && (r1.y1 < r2.y2) && (r1.y2 > r2.y1);
}

// expect rectangle to be { x, y, w, h }
function collides(r1, r2) {
  return _collides(
    { x1: r1.x, x2: r1.x + r1.w, y1: r1.y, y2: r1.y + r1.h },
    { x1: r2.x, x2: r2.x + r2.w, y1: r2.y, y2: r2.y + r2.h },
  );
}

function test() {
  function assert(r1, r2, expect) {
    if (_collides(r1, r2) === expect) console.log('OK');
    else console.error('FAIL!');
  }

  // encapsulated
  assert(
    {x1: 1, y1: 1, x2: 10, y2: 10},
    {x1: 0, y1: 0, x2: 30, y2: 30},
    true
  );
  // no collision
  assert(
    {x1: 1, y1: 1, x2: 10, y2: 10},
    {x1: 11, y1: 11, x2: 30, y2: 30},
    false
  );
  // partial overlap
  assert(
    {x1: 1, y1: 1, x2: 10, y2: 10},
    {x1: 5, y1: 5, x2: 9, y2: 30},
    true
  );
}
