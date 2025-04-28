import React, { useState, useEffect, useRef } from 'react';
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

  // Use a ref for the websocket to persist across renders
  const websocketRef = useRef(null);

  // Fetch game details
  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        setIsLoading(true);
        const data = await api.get(`/board-games/${gameId}/`);
        setSelectedGame(data);
        setIsLoading(false);
      } catch (err) {
        handleApiError(err);
      }
    };

    fetchGameDetails();
  }, [gameId]);

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
        maxPlayers: room.max_players,
        status: room.status
      }));

      setGameRooms(transformedRooms);
    } catch (err) {
      handleApiError(err);
    }
  };

  // Handle API errors including 401 Unauthorized
  const handleApiError = (err) => {
    console.error('API Error:', err);

    // Check if the error is an unauthorized error (401)
    if (err.response && err.response.status === 401) {
      setError('You are not authorized. Please log in.');
      // Redirect to login page after a short delay
      setTimeout(() => navigate('/login', { state: { from: window.location.pathname } }), 2000);
    } else {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    }

    setIsLoading(false);
  };

  // Fetch initial game rooms
  useEffect(() => {
    if (selectedGame) {
      fetchGameRooms();
    }
  }, [selectedGame]);

  // WebSocket connection and cleanup
  useEffect(() => {
    if (!selectedGame || !user?.id) return;

    // Only create a new WebSocket if we don't have one yet
    if (!websocketRef.current) {
      console.log('Creating new WebSocket connection');
      websocketRef.current = api.newWs();
    }

    const ws = websocketRef.current;

    // Function to handle room updates
    const handleRoomUpdate = (data) => {
      console.log('Room list update received:', data);
      const transformedRooms = data.rooms.map(room => ({
        id: room.id.toString(),
        gameId: room.game_id.toString(),
        name: room.name,
        creator: 'Unknown',
        currentPlayers: room.players ? room.players.length : 0,
        maxPlayers: room.max_players,
        status: room.status
      }));

      setGameRooms(transformedRooms);
    };

    // Add event listener
    ws.on('room_list_update', handleRoomUpdate);

    // Connect to the WebSocket
    const connectWebSocket = async () => {
      try {
        console.log('Connecting to WebSocket...');
        await ws.connect(`/game/${gameId}/`);
        console.log('WebSocket connected successfully');
      } catch (err) {
        console.error('WebSocket connection error:', err);
        handleApiError(err);
      }
    };

    connectWebSocket();

    // Cleanup function
    return () => {
      console.log('Cleaning up WebSocket connection');
      // Remove the event listener to prevent duplicates
      ws.off('room_list_update', handleRoomUpdate);

      // Disconnect the WebSocket
      if (ws.socket && ws.socket.readyState === WebSocket.OPEN) {
        ws.disconnect();
      }

      // Clear the ref on unmount
      websocketRef.current = null;
    };
  }, [selectedGame, gameId, user?.id]);

  // Create Room Handler
  const handleCreateRoom = async (roomName, maxPlayers) => {
    if (!selectedGame) return;

    try {
      const newRoom = await api.post(`/board-games/${selectedGame.id}/rooms`, {
        name: roomName || `${selectedGame.name} Room`,
        game_id: selectedGame.id,
        max_players: maxPlayers
      });

      // The room list will be updated automatically via WebSocket
      // but we can also add it optimistically
      const transformedRoom = {
        id: newRoom.id.toString(),
        gameId: newRoom.game_id.toString(),
        name: newRoom.name,
        creator: 'CurrentUser',
        currentPlayers: newRoom.players ? newRoom.players.length : 0,
        maxPlayers: newRoom.max_players,
        status: newRoom.status
      };

      setIsCreateRoomDialogOpen(false);
    } catch (err) {
      console.error('Error creating room:', err);
      handleApiError(err);
    }
  };

  // Handle Room Join
  const handleJoinRoom = async (roomId) => {
    if (!selectedGame) return;

    try {
      // Clean up the websocket before navigating
      if (websocketRef.current) {
        websocketRef.current.disconnect();
        websocketRef.current = null;
      }

      // Redirect to the room page
      navigate(`/game/${selectedGame.id}/room/${roomId}`);
    } catch (err) {
      console.error('Error joining room:', err);
      handleApiError(err);
    }
  };

  // Loading and Error States
  if (isLoading) {
    return <div className="container">Loading game rooms...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-container bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/login')}
        >
          Go to Login
        </button>
      </div>
    );
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
          className="btn btn-primary create-room-button"
          onClick={() => setIsCreateRoomDialogOpen(true)}
        >
          <Plus className="mr-2 w-4 h-4" /> Create New Room
        </button>
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        game={{
          id: selectedGame.id,
          name: selectedGame.name,
          description: selectedGame.description || 'No description available.',
          minPlayers: selectedGame.min_players || 2,
          maxPlayers: selectedGame.max_players || 4,
          thumbnailUrl: selectedGame.image_url || '/api/placeholder/300/200'
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