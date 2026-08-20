// https://stackoverflow.com/questions/306316/determine-if-two-rectangles-overlap-each-other
// (y part negated since this is not cartesian coordinate system)
function _collides(r1, r2) {
  return (r1.x1 < r2.x2 ) && (r1.x2 > r2.x1) && (r1.y1 < r2.y2) && (r1.y2 > r2.y1);
}

// expect rectangle to be { x, y, w, h }
function collides(r1, r2) {
  return _collides(
    { x1: r1.x, x2: r1.x + r1.w, y1: r1.y, y2: r1.y + r1.h },
    { x1: r2.x, x2: r2.x + r2.w, y1: r2.y, y2: r2.y + r2.h }
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

// Returns shortest distance from point (px,py) to segment (ax,ay)→(bx,by)
function distPointSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Returns unit normal of segment pointing toward (px,py)
function segmentNormal(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  const cx = ax + t * dx, cy = ay + t * dy;
  const nx = px - cx, ny = py - cy;
  const len = Math.hypot(nx, ny) || 1;
  return { nx: nx / len, ny: ny / len };
}

// Returns collision normal if ball's next position hits path, otherwise null
function pathHitNormal(path, ball) {
  if (!path || path.points.length < 2) return null;
  const cx = ball.x + ball.w / 2 + ball.vx;
  const cy = ball.y + ball.h / 2 + ball.vy;
  const r = ball.w / 2;
  const pts = path.points;
  let minDist = Infinity;
  let result = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distPointSegment(cx, cy, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    if (d < r && d < minDist) {
      minDist = d;
      result = segmentNormal(cx, cy, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    }
  }
  return result;
}
