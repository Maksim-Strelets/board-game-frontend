import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft } from 'lucide-react';
import CreateRoomModal from './../components/games/gamelist/CreateRoomModal';
import { useAuth } from './../hooks/useAuth';
import api from '../utils/api'
import './../styles/gamelistpage.css';

const GameRoomsPage = () => {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameRooms, setGameRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);

  // Fetch game details
  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        setIsLoading(true);
        const data = await api.get(`/board-games/${gameId}/`);
        setSelectedGame(data);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    };

    fetchGameDetails();
  }, [gameId]);

  // Fetch game rooms when the game is loaded
  useEffect(() => {
    const fetchGameRooms = async () => {
      if (!selectedGame) return;

      try {
        const data = await api.get(`/board-games/${selectedGame.id}/rooms`);

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
  const handleCreateRoom = async (roomName, maxPlayers) => {
    if (!selectedGame) return;

    try {
      const newRoom = await api.post(`/board-games/${selectedGame.id}/rooms`, {
          name: roomName || `${selectedGame.name} Room`,
          game_id: selectedGame.id,
          max_players: maxPlayers
        });

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
  const handleJoinRoom = async (roomId) => {
    if (!selectedGame) return;

    try {
      // Redirect to the room page
      navigate(`/game/${selectedGame.id}/room/${roomId}`);
    } catch (err) {
      console.error('Error joining room:', err);
      alert(err instanceof Error ? err.message : 'Failed to join room');
    }
  };

  // Loading and Error States
  if (isLoading) {
    return <div className="container">Loading game rooms...</div>;
  }

  if (error) {
    return <div className="container error">{error}</div>;
  }

  if (!selectedGame) {
    return <div className="container error">Game not found</div>;
  }

  return (
    <div className="container">
      <button
        className="btn btn-secondary back-btn"
        onClick={() => navigate('/games')}
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
        {gameRooms.length > 0 ? (
          gameRooms.map(room => (
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
          ))
        ) : (
          <div className="no-rooms-message">
            No rooms available. Create a new room to get started!
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRoomsPage;