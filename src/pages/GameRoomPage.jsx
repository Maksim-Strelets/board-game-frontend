import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import './../styles/gameroom.css';
import './../styles/chat.css';

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

  // Refs for chat scrolling and input
  const chatMessagesRef = useRef(null);
  const chatInputRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Effect to handle auto-scrolling
  useEffect(() => {
    const chatContainer = chatMessagesRef.current;
    if (!chatContainer) return;

    // Only scroll to bottom if not user scrolling and there are messages
    if (!isUserScrolling && chatMessages.length > 0) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages, isUserScrolling]);

  // Effect to handle scroll tracking
  useEffect(() => {
    const chatContainer = chatMessagesRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      // Check if user has scrolled up from the bottom
      const isNearBottom =
        chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 50;

      setIsUserScrolling(!isNearBottom);
    };

    chatContainer.addEventListener('scroll', handleScroll);

    return () => {
      chatContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

    // Fetch initial room data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8000/board-games/${gameId}/rooms/${roomId}`);
        const roomData = await response.json();

        const chatResponse = await fetch(`http://localhost:8000/chat/room/${roomId}`);
        const chatData = await chatResponse.json();

        // Set initial room status and users
        setRoomName(roomData.name || '');
        setRoomMaxPlayers(roomData.max_players || 0);
        setRoomStatus(roomData.status || 'waiting');
        setRoomUsers(roomData.players || []);

        // Set initial chat messages
        setChatMessages(chatData.map(msg => ({
          id: msg.id,
          user_id: msg.user_id,
          username: msg.user.username,
          message: msg.content,
          timestamp: msg.timestamp
        })));
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
          // Ensure we don't add duplicate messages
          setChatMessages(prev => {
            // Check if message already exists (by comparing content and timestamp)
            const isDuplicate = prev.some(
              msg => msg.message === data.message.content &&
                     msg.timestamp === data.message.timestamp
            );

            if (isDuplicate) return prev;

            return [...prev, {
              id: data.message.id,
              user_id: data.message.user_id,
              username: data.user.username,
              message: data.message.content,
              timestamp: data.message.timestamp
            }];
          });
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

      // Focus back on input after sending
      chatInputRef.current?.focus();
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
          </div>
          <div className="game-chat-section col-span-3">
            {/* Chat Section */}
              <div className="chat-section">
                <div
                  ref={chatMessagesRef}
                  className="chat-messages"
                  style={{
                    overflowY: 'auto',
                    maxHeight: '400px'
                  }}
                >
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`chat-message ${
                        msg.user_id === user.id
                          ? 'chat-message-self'
                          : 'chat-message-user'
                      }`}
                    >
                      <div className="chat-message-header">
                        <span className="chat-message-username">
                          {msg.username || 'Unknown'}
                        </span>
                        <span className="chat-message-timestamp">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute:'2-digit'
                          })}
                        </span>
                      </div>
                      <div className="chat-message-content">
                        {msg.message}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="chat-input-container">
                  <input
                    ref={chatInputRef}
                    type="text"
                    className="chat-input"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type a message..."
                  />
                  <button
                    className="chat-send-button"
                    onClick={sendChatMessage}
                    disabled={!inputMessage.trim()}
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