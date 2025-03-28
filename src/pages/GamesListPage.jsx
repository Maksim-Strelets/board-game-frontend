import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import CreateRoomModal from './../components/games/gamelist/CreateRoomModal';
import { useAuth } from './../hooks/useAuth'
import './../styles/gamelistpage.css';

const importAllLogos = (r) => {
  const images = {};
  r.keys().forEach((key) => {
    const gameName = key.split('/')[1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    images[gameName] = r(key);
  });
  return images;
};

const GAME_IMAGES = importAllLogos(
  require.context('./../assets/games/', true, /logo\.png$/)
);

const GameListPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameRooms, setGameRooms] = useState([]);
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);

  const getGameImage = (gameName) => {
    return GAME_IMAGES[gameName] || '/api/placeholder/300/200';
  };

  // Fetch games from endpoint
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:8000/board-games/');

        if (!response.ok) {
          throw new Error('Failed to fetch games');
        }

        const data = await response.json();
        setGames(data);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  // Fetch game rooms when a game is selected
  useEffect(() => {
    const fetchGameRooms = async () => {
      if (!selectedGame) return;

      try {
        const response = await fetch(`http://localhost:8000/board-games/${selectedGame.id}/rooms`);

        if (!response.ok) {
          throw new Error('Failed to fetch game rooms');
        }

        const data = await response.json();

        // Transform rooms to match the existing UI structure
        const transformedRooms = data.map(room => ({
          id: room.id.toString(),
          gameId: room.game_id.toString(),
          name: room.name,
          creator: 'Unknown', // Backend doesn't provide creator info
          currentPlayers: room.players ? room.players.length : 0,
          maxPlayers: room.max_players, // Using game's max players
          status: room.status // Assuming default status
        }));

        setGameRooms(transformedRooms);
      } catch (err) {
        console.error('Error fetching game rooms:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    };

    if (selectedGame) {
      fetchGameRooms();
    }
  }, [selectedGame]);

  // Create Room Handler
  const handleCreateRoom = async (roomName: string, maxPlayers: number) => {
    if (!selectedGame) return;

    try {
      const response = await fetch(`http://localhost:8000/board-games/${selectedGame.id}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName || `${selectedGame.name} Room`,
          game_id: selectedGame.id,
          max_players: maxPlayers
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const newRoom = await response.json();

      // Transform room to match existing UI structure
      const transformedRoom = {
        id: newRoom.id.toString(),
        gameId: newRoom.game_id.toString(),
        name: newRoom.name,
        creator: 'CurrentUser', // Would come from auth context
        currentPlayers: newRoom.players ? newRoom.players.length : 0,
        maxPlayers: newRoom.max_players,
        status: newRoom.status
      };

      // Add room and close dialog
      setGameRooms(prev => [...prev, transformedRoom]);
      setIsCreateRoomDialogOpen(false);
    } catch (err) {
      console.error('Error creating room:', err);
      alert(err instanceof Error ? err.message : 'Failed to create room');
    }
  };

  // Handle Room Join
  const handleJoinRoom = async (roomId: string) => {
    if (!selectedGame) return;

    try {
      // Assuming you have a user ID from authentication
      const userId = user.id; // Replace with actual user ID

      const response = await fetch(`http://localhost:8000/board-games/${selectedGame.id}/rooms/${roomId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_id: parseInt(roomId),
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to join room');
      }

      // Redirect to the room page
      navigate(`/game/${selectedGame.id}/room/${roomId}`);
    } catch (err) {
      console.error('Error joining room:', err);
      alert(err instanceof Error ? err.message : 'Failed to join room');
    }
  };

  // Loading and Error States
  if (isLoading) {
    return <div className="container">Loading games...</div>;
  }

  if (error) {
    return <div className="container error">{error}</div>;
  }

  return (
    <div className="container">
      {!selectedGame ? (
        // Game Selection Grid
        <div>
          <h1 className="page-heading">Select a Game</h1>
          <div className="game-grid">
            {games.map(game => (
              <div
                key={game.name}
                className="game-card"
                onClick={() => setSelectedGame(game)}
              >
                <img
                  src={getGameImage(game.name)}
                  alt={`${game.name} logo`}
                  className="game-card-image"
                />
                <div className="game-card-content">
                  <h2 className="game-card-title">{game.name}</h2>
                  <p className="game-card-description">
                    {game.description || 'No description available'}
                  </p>
                  <p className="game-card-players">
                    {game.min_players}-{game.max_players} players
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // Game Rooms View
        <div>
          <button
            className="btn btn-secondary back-btn"
            onClick={() => setSelectedGame(null)}
          >
            <ArrowLeft className="w-5 h-5" /> Back to Game List
          </button>

          <h1 className="page-heading">
            {selectedGame.name} - Game Rooms
          </h1>

          {/* Create Room Button */}
          <div className="mb-4 flex justify-end">
            <button
              className="btn btn-primary"
              onClick={() => setIsCreateRoomDialogOpen(true)}
            >
              <Plus className="mr-2 w-4 h-4" /> Create Room
            </button>
          </div>

          {/* Create Room Modal */}
          <CreateRoomModal
            game={{
              id: selectedGame.id,
              name: selectedGame.name,
              description: selectedGame.description || '',
              minPlayers: selectedGame.min_players,
              maxPlayers: selectedGame.max_players,
              thumbnailUrl: '/api/placeholder/300/200'
            }}
            isOpen={isCreateRoomDialogOpen}
            onClose={() => setIsCreateRoomDialogOpen(false)}
            onCreate={handleCreateRoom}
          />

          {/* Game Rooms List */}
          <div className="game-grid">
            {gameRooms.map(room => (
              <div key={room.id} className="game-room-card">
                <div className="game-room-header">
                  <h3 className="game-room-name">{room.name}</h3>
                  <span className="game-room-status">{room.status}</span>
                </div>
                <div className="game-room-players">
                  Players: {room.currentPlayers}/{room.maxPlayers}
                </div>
                <button
                  className={`btn ${room.currentPlayers >= room.maxPlayers ? 'btn-secondary cursor-not-allowed' : 'btn-primary'}`}
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={room.currentPlayers >= room.maxPlayers}
                >
                  Join Room
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameListPage;