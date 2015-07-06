// const.js

// [GAME SPECIFIC CODE]

S = {
  PLAYER: 0,
  SHADOW: 1,
  THINGY: 2,
  YAY: 3,
};

T = {
  NONE: 0,
  BLOCK: 1,
  COLLECTIBLE: 2,
  FLOOR: 3,
  WALL: 4,
  
  isWall: function (c) { return (c < 0 || c == T.WALL); },
  isObstacle: function (c) { return (c < 0 || c == T.FLOOR || c == T.WALL); },
};
