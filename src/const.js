// const.js

// [GAME SPECIFIC CODE]

Sprite = {
  PLAYER: 0,
  BLOCK: 1,
  COLLECTIBLE: 2,
  YAY: 3,
};

Tile = {
  NONE: 0,
  BLOCK: 1,
  COLLECTIBLE: 2,
  
  isObstacle: function (c) { return (c < 0 || c == Tile.BLOCK); },
  isCollectible: function (c) { return (c == Tile.COLLECTIBLE); },
};
