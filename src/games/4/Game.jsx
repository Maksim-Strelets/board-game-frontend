import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AbstractBoardGame } from './../AbstractGame'
import { useAuth } from './../../hooks/useAuth';
import config from '../../config';
import './styles.css'

// TicTacToe game implementation
class TicTacToeGame extends AbstractBoardGame {
  constructor(socket, gameId, roomId, userId) {
    super(socket, gameId, roomId, userId);
    this.board = Array(9).fill(null);
    this.currentPlayer = null;
    this.winner = null;
    this.players = {};
    this.mySymbol = null;
    this.isMyTurn = false;
  }

  initialize(initialState = null) {
    if (initialState) {
      this.board = initialState.board;
      this.currentPlayer = initialState.current_player;
      this.winner = initialState.winner;
      this.players = initialState.players;

      // Determine player's symbol
      Object.entries(this.players).forEach(([playerId, symbol]) => {
        if (playerId === this.userId.toString()) {
          this.mySymbol = symbol;
        }
      });

      this.isMyTurn = this.currentPlayer === this.userId.toString();
    }
  }

  makeMove(position) {
    if (!this.isMyTurn || this.board[position] || this.winner) {
      return false;
    }

    // Send move to server via WebSocket
    this.socket.send(JSON.stringify({
      type: 'game_move',
      game: 'tic_tac_toe',
      move: {
        position: position
      }
    }));

    return true;
  }

  handleGameUpdate(gameData) {
    this.board = gameData.board;
    this.currentPlayer = gameData.current_player;
    this.winner = gameData.winner;
    this.players = gameData.players;

    // Update if it's the player's turn
    this.isMyTurn = this.currentPlayer === this.userId.toString();

    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      winner: this.winner,
      isMyTurn: this.isMyTurn,
      mySymbol: this.mySymbol,
      players: this.players
    };
  }
}

const TicTacToeBoard = ({ gameInstance, onMakeMove }) => {
  if (!gameInstance) return <div>Loading game...</div>;

  const { board, winner, isMyTurn, mySymbol } = gameInstance;

  const renderSquare = (i) => {
    return (
      <button
        className={`ttt-square ${board[i] ? 'filled' : ''} ${isMyTurn && !board[i] && !winner ? 'active' : ''}`}
        onClick={() => onMakeMove(i)}
        disabled={board[i] || winner || !isMyTurn}
      >
        {board[i]}
      </button>
    );
  };

  return (
    <div className="ttt-board">
      <div className="ttt-status">
        {winner ? (
          <div className="game-winner">
            {winner === 'draw' ? 'Game ended in a draw!' : `Player ${winner} wins!`}
          </div>
        ) : (
          <div className="game-status">
            {isMyTurn ?
              <span className="your-turn">Your turn ({mySymbol})</span> :
              <span className="waiting">Waiting for opponent...</span>
            }
          </div>
        )}
      </div>
      <div className="ttt-grid">
        <div className="ttt-row">
          {renderSquare(0)}
          {renderSquare(1)}
          {renderSquare(2)}
        </div>
        <div className="ttt-row">
          {renderSquare(3)}
          {renderSquare(4)}
          {renderSquare(5)}
        </div>
        <div className="ttt-row">
          {renderSquare(6)}
          {renderSquare(7)}
          {renderSquare(8)}
        </div>
      </div>
    </div>
  );
};

// Main Game Component
const GameBoard = () => {
  const { gameId, roomId } = useParams();
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const gameRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?.id) return;

    const ws = new WebSocket(`${config.wsUrl}/game/${gameId}/room/${roomId}?user_id=${user.id}`);

    ws.onopen = () => {
      console.log('Game WebSocket Connected');
      setSocket(ws);

      // Request current game state
      ws.send(JSON.stringify({
        type: 'get_game_state'
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch(data.type) {
          case 'game_state':
            if (gameRef.current) {
              gameRef.current.initialize(data.state);
              setGameState({...gameRef.current});
            } else if (data.state.game === 'tic_tac_toe') {
              // Initialize game if not already done
              const gameInstance = new TicTacToeGame(ws, gameId, roomId, user.id);
              gameInstance.initialize(data.state);
              gameRef.current = gameInstance;
              setGameState({...gameInstance});
            }
            setIsLoading(false);
            break;

          case 'game_update':
            if (gameRef.current) {
              const updatedState = gameRef.current.handleGameUpdate(data.state);
              setGameState({...updatedState});
            }
            break;

          case 'game_error':
            setError(data.message);
            break;
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
        setError('An error occurred while processing game data');
      }
    };

    ws.onclose = () => {
      console.log('Game WebSocket Disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      setError('Connection error. Please try again later.');
    };

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [gameId, roomId, user?.id]);

  const handleMakeMove = (position) => {
    if (gameRef.current) {
      gameRef.current.makeMove(position);
    }
  };

  if (isLoading) {
    return <div className="game-loading">Loading game...</div>;
  }

  if (error) {
    return <div className="game-error">Error: {error}</div>;
  }

  return (
    <div className="game-container">
      <div className="game-board-container">
        <h2 className="game-title">Tic Tac Toe</h2>
        <TicTacToeBoard
          gameInstance={gameState}
          onMakeMove={handleMakeMove}
        />
      </div>
    </div>
  );
};

export default GameBoard;