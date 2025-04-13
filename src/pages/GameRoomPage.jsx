import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import api from '../utils/api'

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
  const [isRoomInitialized, setIsRoomInitialized] = useState(false);

  // Refs for chat scrolling and input
  const chatMessagesRef = useRef(null);
  const chatInputRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Add this state for the dynamically loaded game component
  const [GameComponent, setGameComponent] = useState(null);
  const [GameMessagesComponent, setGameMessagesComponent] = useState(null);
  const [gameLoadError, setGameLoadError] = useState(null);

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

      // Add this effect to dynamically import the game component based on gameId
    useEffect(() => {
      if (roomStatus === 'in_progress' && gameId) {
        const loadGameComponent = async () => {
          try {
            // Dynamic import of the game component based on gameId
            const GameModule = await import(`./../games/${gameId}/Game.jsx`);
            const GameMessagesModule = await import(`./../games/${gameId}/GameMessages.jsx`);
            setGameComponent(() => GameModule.default);
            setGameMessagesComponent(() => GameMessagesModule.default);
            setGameLoadError(null);
          } catch (err) {
            console.error('Failed to load game component:', err);
            setGameLoadError(`Failed to load game for ${gameId}`);
          }
        };

        loadGameComponent();
      }
    }, [gameId, roomStatus]);

    // Fetch initial room data
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        setIsLoading(true);
        console.log('room loading started');
        const roomData = await api.get(`/board-games/${gameId}/rooms/${roomId}`);
        const chatData = await api.get(`/chat/room/${roomId}`);

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

        setIsRoomInitialized(true);
        console.log('room loaded');
      } catch (err) {
        console.error('Room data fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoomData();
  }, [gameId, roomId]);

  useEffect(() => {
    // Only establish the WebSocket connection if the room is initialized
    if (!isRoomInitialized || !user?.id) {
      return;
    }

    const connectAndSetupGame = async () => {
      try {
        api.getWs().on('chat', (data) => {
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
        });

        api.getWs().on('user_joined', (data) => {
          setRoomUsers(prev => [...prev, data.player]);
        });

        api.getWs().on('player_status_changed', (data) => {
          setRoomUsers(prev =>
            prev.map(player =>
              player.user_id === data.user_id
                ? { ...player, status: data.status }
                : player
            )
          );
        });

        api.getWs().on('user_left', (data) => {
          setRoomUsers(prev => prev.filter(player => player.user_id !== data.user_id));
        });

        api.getWs().on('room_status_changed', (data) => {
          setRoomStatus(data.status);
        });

        if (!api.getWs().socket) {
          await api.getWs().connect(`/game/${gameId}/room/${roomId}`, {
                  params: { user_id: user.id }
                });
        }

      } catch (error) {
        console.error('Error connecting to game:', error);
//         setError('Failed to connect to the game server.');
        setIsLoading(false);
      }
    };

    connectAndSetupGame();

    // Cleanup on component unmount
    return () => {
      if (api.getWs()) {
        api.getWs().disconnect();
      };
    };
  }, [gameId, roomId, isRoomInitialized]);

  const sendChatMessage = () => {
    if (api.getWs().socket && inputMessage.trim()) {
      api.getWs().send(JSON.stringify({
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
    if (api.getWs().socket) {
      api.getWs().send(JSON.stringify({
        type: 'room_status',
        status: status
      }));
    }
  };

  const changePlayerStatus = (status: 'ready' | 'not_ready') => {
    if (api.getWs().socket && user?.id) {
      api.getWs().send(JSON.stringify({
        type: 'player_status',
        player_id: user.id,
        status: status
      }));
    }
  };

  const startGame = () => {
    if (api.getWs().socket) {
      api.getWs().send(JSON.stringify({
        type: 'room_status',
        status: 'in_progress'
      }));
    }
  };


  return (
      <div className="container">
        <div className={`room-page grid gap-4 ${roomStatus === 'in_progress' ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {/* Players List */}
          {roomStatus !== 'in_progress' && (
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
                      {roomStatus === 'waiting' && (
                        <div className={`player-status player-status-${player.status}`}>
                          {player.status ? player.status.replace('_', ' ') : 'Waiting'}
                        </div>
                      )}
                      <div className="player-badges">
                        {roomStatus === 'waiting' && player.user_id === roomUsers[0]?.user_id && (
                          <span className="player-host-badge">Host</span>
                        )}
                        {user?.id === player.user_id && (
                          <span className="player-current-user-badge">You</span>
                        )}
                      </div>
                    </div>
                    {user?.id === player.user_id && roomStatus === 'waiting' && (
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
          )}

          {/* Game and Chat Section */}
          <div className={`game-chat-section ${roomStatus === 'in_progress' ? 'col-span-2' : 'col-span-3'}`}>
            <div className="room-info bg-white border rounded-lg shadow-md p-4 mb-4">
              {roomStatus !== 'in_progress' && (
                  <div className="flex justify-between items-center mb-3">
                    <button
                      className="btn btn-secondary back-btn mb-4"
                      onClick={() => navigate(`/games/${gameId}`)}
                    >
                      <ArrowLeft className="w-5 h-5" /> Back
                    </button>
                    <h1 className="page-heading mb-0">Game Room {roomName}</h1>
                    <div className="flex items-center">
                      <span className={`room-status room-status-${roomStatus}`}>
                        {roomStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
              )}

              {roomStatus === 'waiting' ? (
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
              ) : (
                <div className="game-board-wrapper">
                  {roomStatus === 'in_progress' && (
                      <div className="game-board-wrapper">
                        {gameLoadError ? (
                          <div className="game-load-error p-4 text-red-600 bg-red-50 rounded border border-red-200">
                            {gameLoadError}
                          </div>
                        ) : GameComponent ? (
                          <Suspense fallback={<div className="text-center py-4">Loading game board...</div>}>
                            <GameComponent
                              roomId={roomId}
                              user={user}
                            />
                          </Suspense>
                        ) : (
                          <div className="text-center py-4">Loading game board...</div>
                        )}
                      </div>
                    )}
                </div>
              )}
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
                          {new Date(msg.timestamp + "Z").toLocaleTimeString([], {
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
              {/* Game messages log */}
              {(GameMessagesComponent && <GameMessagesComponent
                websocket={api.getWs()}
                players={{...Object.fromEntries(roomUsers.map(roomUser => [roomUser.user_id, roomUser])), currentUserId: user.id}}
              />)}
          </div>
        </div>
      </div>
    );
};

export default RoomPage;