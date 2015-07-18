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

  // isObstacle: Blocks moving and cannot be overlapped. e.g. brick.
  isObstacle: function (c) { return (c < 0 || c == T.BLOCK); },
  // isStoppable: Stops falling but can move onto it if forced. e.g. hay, ladder.
  isStoppable: function (c) { return (c < 0 || c == T.BLOCK || c == T.LADDER); },
  // isGrabbable: Allows climing by holding it. e.g. ladder.
  isGrabbable: function (c) { return (c == T.LADDER); },
  // isCollectible: Something to score.
  isCollectible: function (c) { return (c == T.COLLECTIBLE); },
};
