// Abstract game interface that can be extended for different games
class AbstractBoardGame {
  constructor(socket, gameId, roomId, userId) {
    this.socket = socket;
    this.gameId = gameId;
    this.roomId = roomId;
    this.userId = userId;
    this.gameState = null;
  }

  initialize() {
    throw new Error("Method 'initialize' must be implemented");
  }

  makeMove() {
    throw new Error("Method 'makeMove' must be implemented");
  }

  handleGameUpdate() {
    throw new Error("Method 'handleGameUpdate' must be implemented");
  }

  renderBoard() {
    throw new Error("Method 'renderBoard' must be implemented");
  }
};

export { AbstractBoardGame };