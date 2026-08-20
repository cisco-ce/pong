const config = {
  colors: ['black', '#ffb300', '#ff1a1b', '#e900d8', '#00c4e8', '#00e258'],
  ballSize: {
    w: 70,
    h: 70,
  },
  startSpeed: 6,
  initYSpeed: {
    min: 1.5,
    max: 3,
  },
  maxBarHeight: 450,
  winScore: 5,
  standbyTime: 30,
  twoColorPickers: true,
  maxReflectionAngle: 60,  // degrees from horizontal; prevents near-vertical bouncing
  pathLineWidth: 14,       // drawn line width in pixels
  ballSpawnInterval: 12,   // seconds between additional ball spawns
  maxBalls: 4,
  introDuration: 40,        // physics frames for ball grow-in animation
  showDebugRefresh: true,
};
