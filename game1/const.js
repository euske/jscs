// const.js

// [GAME SPECIFIC CODE]

S = {
  PLAYER: 0,
  SHADOW: 1,
  THINGY: 2,
  YAY: 3,
  ENEMY: 4,
};

T = {
  NONE: 0,
  BLOCK: 1,
  COLLECTIBLE: 2,
  LADDER: 2,
  
  isObstacle: function (c) { return (c < 0 || c == T.BLOCK); },
  isStoppable: function (c) { return (c < 0 || c == T.BLOCK || c == T.LADDER); },
  isGrabbable: function (c) { return (c == T.LADDER); },
  isCollectible: function (c) { return (c == T.COLLECTIBLE); },
};
