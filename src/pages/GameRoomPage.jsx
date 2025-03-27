import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import './../styles/gameroom.css';

import { useAuth } from './../hooks/useAuth'


const RoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { gameId, roomId } = useParams();
  const [socket, setSocket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [RoomMaxPlayers, setRoomMaxPlayers] = useState(0);
  const [roomUsers, setRoomUsers] = useState([]);
  const [roomStatus, setRoomStatus] = useState('waiting');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

    // Fetch initial room data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8000/board-games/${gameId}/rooms/${roomId}`);
        const roomData = await response.json();

        // Set initial room status and users
        setRoomName(roomData.name || '');
        setRoomMaxPlayers(roomData.max_players || 0);
        setRoomStatus(roomData.status || 'waiting');
        setRoomUsers(roomData.players || []);
      } catch (err) {
        console.error('Room data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId]);

  useEffect(() => {
    // Establish WebSocket connection
    const userId = user.id; // Replace with actual user ID from auth
    const ws = new WebSocket(`ws://localhost:8000/ws/game/${gameId}/room/${roomId}?user_id=${userId}`);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch(data.type) {
        case 'chat':
          setChatMessages(prev => [...prev, {
            user_id: data.user_id,
            message: data.message,
            timestamp: data.timestamp
          }]);
          break;

        case 'user_joined':
          setRoomUsers(prev => [...prev, data.player]);
          break;

        case 'player_status_changed':
          setRoomUsers(prev =>
            prev.map(player =>
              player.user_id === data.user_id
                ? { ...player, status: data.status }
                : player
            )
          );
          break;

        case 'user_left':
          setRoomUsers(prev => prev.filter(player => player.user_id !== data.user_id));
          break;

        case 'room_status_changed':
          setRoomStatus(data.status);
          break;
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
    };

    // Cleanup on component unmount
    return () => {
      ws.close();
    };
  }, [gameId, roomId]);

  const sendChatMessage = () => {
    if (socket && inputMessage.trim()) {
      socket.send(JSON.stringify({
        type: 'chat',
        message: inputMessage,
        timestamp: new Date().toISOString()
      }));
      setInputMessage('');
    }
  };

  const changeRoomStatus = (status: string) => {
    if (socket) {
      socket.send(JSON.stringify({
        type: 'room_status',
        status: status
      }));
    }
  };

  const changePlayerStatus = (status: 'ready' | 'not_ready') => {
    if (socket && user?.id) {
      socket.send(JSON.stringify({
        type: 'player_status',
        player_id: user.id,
        status: status
      }));
    }
  };

  const startGame = () => {
    if (socket) {
      socket.send(JSON.stringify({
        type: 'room_status',
        status: 'in_progress'
      }));
    }
  };


  return (
      <div className="container">
        <button
          className="btn btn-secondary back-btn mb-4"
          onClick={() => navigate(`/games/${gameId}`)}
        >
          <ArrowLeft className="w-5 h-5" /> Back to Rooms
        </button>

        <div className="room-page grid grid-cols-3 gap-4">
          {/* Players List */}
          <div className="players-section col-span-1 bg-white border rounded-lg shadow-md p-4">
            <h2 className="page-heading mb-4">
              Players ({roomUsers.length}/{RoomMaxPlayers})
            </h2>
            <div className="space-y-3">
              {roomUsers.map((player) => (
              <div
                key={player.user_id}
                className={`player-card flex items-center p-3 rounded-lg border ${
                  player.status === 'ready'
                    ? 'bg-green-50 border-green-200'
                    : player.status === 'in_game'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="player-name-container flex-grow">
                  <div className="player-username">{player.user_data.username}</div>
                  <div className={`player-status player-status-${player.status}`}>
                    {player.status ? player.status.replace('_', ' ') : 'Waiting'}
                  </div>
                  <div className="player-badges">
                    {player.user_id === roomUsers[0]?.user_id && (
                      <span className="player-host-badge">Host</span>
                    )}
                    {user?.id === player.user_id && (
                      <span className="player-current-user-badge">You</span>
                    )}
                  </div>
                </div>
                {user?.id === player.user_id && (
                  <div className="ml-auto">
                    {player.status === 'not_ready' ? (
                      <button
                        onClick={() => changePlayerStatus('ready')}
                        className="btn btn-success btn-sm"
                      >
                        Ready
                      </button>
                    ) : (
                      <button
                        onClick={() => changePlayerStatus('not_ready')}
                        className="btn btn-secondary btn-sm"
                      >
                        Not Ready
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>

          {/* Game and Chat Section */}
          <div className="game-chat-section col-span-2">
            <div className="room-info bg-white border rounded-lg shadow-md p-4 mb-4">
              <h1 className="page-heading mb-3">Game Room {roomName}</h1>
              <div className="text-lg text-gray-700 mb-3">
                Room Status: <span className="font-semibold capitalize">{roomStatus}</span>
              </div>

                <button
                  onClick={startGame}
                  disabled={
                    user?.id !== roomUsers[0]?.user_id ||
                    roomStatus !== 'waiting' ||
                    roomUsers.length < 2 ||
                    roomUsers.some(p => p.status !== 'ready')
                  }
                  className="btn btn-primary"
                >
                  Start Game
                </button>
            </div>

            {/* Chat Section */}
            <div className="chat-section bg-white border rounded-lg shadow-md">
              <div className="chat-messages h-64 overflow-y-auto p-4 border-b">
                {chatMessages.map((msg, index) => {
                  const sender = roomUsers.find(p => p.user_id === msg.user_id);
                  return (
                    <div key={index} className="mb-2 p-2 bg-gray-50 rounded">
                      <span className="font-semibold text-gray-800 mr-2">
                        {sender?.user_data.username || 'Unknown'}:
                      </span>
                      {msg.message}
                    </div>
                  );
                })}
              </div>
              <div className="chat-input p-4 flex">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-grow mr-2 p-2 border rounded-lg"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!inputMessage.trim()}
                  className="btn btn-primary"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default RoomPage;