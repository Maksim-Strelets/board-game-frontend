import React, { useState } from 'react';
import {
  Users,
  Send,
  Trophy,
  Settings
} from 'lucide-react';

import { useAuth } from './../hooks/useAuth'

// Mock interfaces for type safety
interface User {
  id: string;
  username: string;
  avatar?: string;
  isHost: boolean;
  status: 'ready' | 'not-ready' | 'playing';
}

interface GameRoomProps {
  roomId: string;
  gameName: string;
  maxPlayers: number;
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'PlayerOne',
    isHost: true,
    status: 'ready',
    avatar: '/api/placeholder/50/50'
  },
  {
    id: '2',
    username: 'PlayerTwo',
    isHost: false,
    status: 'not-ready',
    avatar: '/api/placeholder/50/50'
  },
  {
    id: '3',
    username: 'PlayerThree',
    isHost: false,
    status: 'playing',
    avatar: '/api/placeholder/50/50'
  }
];

const GameRoomPage: React.FC<GameRoomProps> = ({
  roomId,
  gameName,
  maxPlayers
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useState(MOCK_USERS);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    const newMessage = {
      user: user.username,
      message: chatMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage('');
  };

  const handleUserStatusToggle = (userId: string) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId
          ? {
              ...user,
              status: user.status === 'ready' ? 'not-ready' : 'ready'
            }
          : user
      )
    );
  };

  const renderUserStatus = (status: User['status']) => {
    switch(status) {
      case 'ready':
        return <span className="text-green-500">Ready</span>;
      case 'playing':
        return <span className="text-blue-500">Playing</span>;
      default:
        return <span className="text-gray-500">Not Ready</span>;
    }
  };

  // Check if all players are ready
  const areAllPlayersReady = users.every(user => user.status === 'ready');

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Game Controls */}
        <div className="md:col-span-1 bg-white shadow-md rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{gameName} Room</h2>
            <span className="text-gray-500">Room ID: {roomId}</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="mr-2 text-gray-600" />
                <span>Players: {users.length}/{maxPlayers}</span>
              </div>
              <button className="btn btn-secondary text-sm">
                Invite
              </button>
            </div>

            {/* Game Controls */}
            <div className="bg-white rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Game Controls</h3>
                <div className="flex space-x-2">
                  <button className="btn btn-secondary">
                    <Settings className="w-5 h-5 mr-2" /> Settings
                  </button>
                  <button
                    className={`btn ${
                      areAllPlayersReady
                        ? 'btn-primary'
                        : 'btn-secondary cursor-not-allowed'
                    }`}
                    disabled={!areAllPlayersReady}
                  >
                    <Trophy className="w-5 h-5 mr-2" /> Start Game
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-gray-500">
                  Game-specific controls will appear here based on the selected game.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Players and Chat */}
        <div className="md:col-span-2 grid grid-rows-2 gap-4">
          {/* Players Section */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h3 className="font-semibold mb-4">Players</h3>
            <ul className="space-y-2">
              {users.map(user => (
                <li
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <span className="font-medium">
                        {user.username}
                        {user.isHost && (
                          <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 rounded">
                            Host
                          </span>
                        )}
                      </span>
                      <div>{renderUserStatus(user.status)}</div>
                    </div>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleUserStatusToggle(user.id)}
                  >
                    Toggle Status
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Section */}
          <div className="bg-white shadow-md rounded-lg p-4 flex flex-col">
            <div className="flex-grow overflow-y-auto mb-4">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className="mb-2 p-2 bg-gray-100 rounded"
                >
                  <strong>{msg.user}: </strong>
                  {msg.message}
                </div>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow mr-2 p-2 border rounded"
              />
              <button
                onClick={handleSendMessage}
                className="btn btn-primary"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoomPage;