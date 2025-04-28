import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './createRoomModal.css';

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
  require.context('/src/assets/games/', true, /logo\.png$/)
);

const getGameImage = (gameName) => {
  return GAME_IMAGES[gameName] || '/api/placeholder/300/200';
};

const CreateRoomModal = ({ game, isOpen, onClose, onCreate }) => {
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(game?.maxPlayers || 4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset the form when the modal is opened with a new game
  useEffect(() => {
    if (isOpen && game) {
      setRoomName(`${game.name} Room`);
      setMaxPlayers(game.maxPlayers || 4);
      setError('');
    }
  }, [isOpen, game]);

  // Handle modal click outside
  const handleModalContainerClick = (e) => {
    if (e.target.classList.contains('modal-container')) {
      onClose();
    }
  };

  // Handle room creation submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!roomName.trim()) {
      setError('Room name is required');
      return;
    }

    if (maxPlayers < game.minPlayers) {
      setError(`Minimum number of players is ${game.minPlayers}`);
      return;
    }

    if (maxPlayers > game.maxPlayers) {
      setError(`Maximum number of players is ${game.maxPlayers}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Call the onCreate handler passed from parent
      await onCreate(roomName, maxPlayers);

      // Reset form and close on success
      setRoomName('');
      setMaxPlayers(game.maxPlayers || 4);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-container" onClick={handleModalContainerClick}>
      <div className="modal-content create-room-modal">
        <div className="modal-header">
          <h2>Create Game Room</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="game-info">
            <div className="game-image-container">
              <img
                src={getGameImage(game.name)}
                alt={game.name}
                className="game-thumbnail"
              />
            </div>
            <div className="game-details">
              <h3>{game.name}</h3>
              <p className="game-player-count">
                <span className="player-label">Players:</span> {game.minPlayers} - {game.maxPlayers}
              </p>
              <p className="game-description">{game.description}</p>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="create-room-form">
            <div className="form-group">
              <label htmlFor="roomName">Room Name</label>
              <input
                id="roomName"
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxPlayers">Maximum Players</label>
              <div className="player-count-selector">
                <button
                  type="button"
                  className="player-count-btn"
                  onClick={() => setMaxPlayers(prev => Math.max(game.minPlayers, prev - 1))}
                  disabled={maxPlayers <= game.minPlayers}
                >
                  -
                </button>
                <span className="player-count-value">{maxPlayers}</span>
                <button
                  type="button"
                  className="player-count-btn"
                  onClick={() => setMaxPlayers(prev => Math.min(game.maxPlayers, prev + 1))}
                  disabled={maxPlayers >= game.maxPlayers}
                >
                  +
                </button>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;