import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api'
import '../styles/gamelistpage.css';

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

const GameListPage = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getGameImage = (gameName) => {
    return GAME_IMAGES[gameName] || '/api/placeholder/300/200';
  };

  // Fetch games from endpoint
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        const data = await api.get('/board-games/');
        setGames(data);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    };

    fetchGames();
  }, []);

  const handleGameSelect = (game) => {
    navigate(`/games/${game.id}`);
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
      <h1 className="page-heading">Select a Game</h1>
      <div className="game-grid">
        {games.map(game => (
          <div
            key={game.name}
            className="game-card"
            onClick={() => handleGameSelect(game)}
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
  );
};

export default GameListPage;