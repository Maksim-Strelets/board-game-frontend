import React, { useState, useEffect } from 'react';
import { Game } from './Interfaces';
import { X } from 'lucide-react';
// import './../../../styles/gamelistpage.css';

// Create Room Modal Component
const CreateRoomModal: React.FC<{
  game: Game;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (roomName: string, maxPlayers: number) => void;
}> = ({ game, isOpen, onClose, onCreate }) => {
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMaxPlayers, setNewRoomMaxPlayers] = useState(game.minPlayers);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewRoomName('');
      setNewRoomMaxPlayers(game.minPlayers);
    }
  }, [isOpen, game]);

  const handleCreate = () => {
    if (!newRoomName.trim()) return;

    onCreate(newRoomName.trim(), newRoomMaxPlayers);
    setNewRoomName('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content relative">
        <button
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
          onClick={onClose}
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="page-heading mb-4">Create New Room</h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-gray-700">Room Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`${game.name} Room`}
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700">Max Players</label>
            <select
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={newRoomMaxPlayers}
              onChange={(e) => setNewRoomMaxPlayers(Number(e.target.value))}
            >
              {Array.from(
                { length: game.maxPlayers - game.minPlayers + 1 },
                (_, i) => game.minPlayers + i
              ).map(num => (
                <option key={num} value={num}>
                  {num} Players
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4">
            <button
              className={`btn flex-1 ${
                !newRoomName.trim()
                  ? 'btn-secondary cursor-not-allowed'
                  : 'btn-primary'
              }`}
              onClick={handleCreate}
              disabled={!newRoomName.trim()}
            >
              Create Room
            </button>

            <button
              className="btn btn-secondary flex-1"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;