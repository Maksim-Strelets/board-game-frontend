import React from 'react';
import { Award, Clock, User, CreditCard, Diamond } from 'lucide-react';
import './GameStats.css';

const GameStats = ({ gameStats, currentPlayerId, onClose, onLeaveGame }) => {
  if (!gameStats) return null;

  const { winner, scores, player_stats, duration_seconds, total_rounds } = gameStats;

  // Format time duration
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get players sorted by score (descending)
  const playerRanking = Object.entries(scores || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="splendor-popup-overlay">
      <div className="splendor-game-stats">
        <div className="splendor-stats-header">
          <h2>Game Over!</h2>
          <div className="splendor-winner-info">
            <Award size={24} className="splendor-winner-icon" />
            <span>
              {winner.user_id === currentPlayerId ? 'You won!' : `${player_stats[winner.user_id]?.player?.user_data?.username} won!`}
            </span>
          </div>
        </div>

        <div className="splendor-stats-summary">
          <div className="splendor-stats-item">
            <Clock size={20} />
            <span>Duration: {formatTime(duration_seconds)}</span>
          </div>
          <div className="splendor-stats-item">
            <CreditCard size={20} />
            <span>Total Rounds: {total_rounds}</span>
          </div>
        </div>

        <div className="splendor-player-rankings">
          <h3>Final Rankings</h3>
          <div className="splendor-rankings-list">
            {playerRanking.map(([playerId, score], index) => {
              const playerData = player_stats[playerId];
              const isCurrentPlayer = parseInt(playerId) === currentPlayerId;

              return (
                <div
                  key={playerId}
                  className={`splendor-ranking-item ${isCurrentPlayer ? 'current-player' : ''}`}
                >
                  <div className="splendor-rank">{index + 1}</div>
                  <div className="splendor-player-name">
                    <User size={16} />
                    <span>{playerData?.player?.user_data?.username || 'Unknown Player'}</span>
                    {isCurrentPlayer && <span className="splendor-you-label">(You)</span>}
                  </div>
                  <div className="splendor-player-score">
                    <span>{score} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="splendor-detailed-stats">
          <h3>Player Details</h3>
          <div className="splendor-stats-tabs">
            {playerRanking.map(([playerId], index) => {
              const playerData = player_stats[playerId];
              const isCurrentPlayer = parseInt(playerId) === currentPlayerId;

              return (
                <div key={playerId} className="splendor-player-detail-card">
                  <div className="splendor-detail-header">
                    <span className={`splendor-detail-rank rank-${index + 1}`}>#{index + 1}</span>
                    <span className="splendor-detail-name">
                      {playerData?.player?.user_data?.username || 'Unknown Player'}
                      {isCurrentPlayer && <span className="splendor-you-label">(You)</span>}
                    </span>
                    <span className="splendor-detail-score">{scores[playerId]} pts</span>
                  </div>

                  <div className="splendor-detail-body">
                    <div className="splendor-detail-section">
                      <h4>Points Breakdown</h4>
                      <div className="splendor-stats-row">
                        <span>From Cards:</span>
                        <span>{playerData?.points_breakdown?.card_points}</span>
                      </div>
                      <div className="splendor-stats-row">
                        <span>From Nobles:</span>
                        <span>{playerData?.points_breakdown?.noble_points}</span>
                      </div>
                      <div className="splendor-stats-row total">
                        <span>Total:</span>
                        <span>{playerData?.points_breakdown?.total}</span>
                      </div>
                    </div>

                    <div className="splendor-detail-section">
                      <h4>Cards Purchased</h4>
                      <div className="splendor-stats-row">
                        <span>Total:</span>
                        <span>{playerData?.cards_purchased?.total}</span>
                      </div>
                      <div className="splendor-card-distribution">
                        {Object.entries(playerData?.cards_purchased?.by_color || {}).map(([color, count]) => (
                          count > 0 && (
                            <div key={color} className={`splendor-color-count ${color}`}>
                              <span className="splendor-color-dot"></span>
                              <span>{count}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="splendor-stats-buttons">
          <button className="splendor-popup-button" onClick={onClose}>
            Close Stats
          </button>
          <button className="splendor-popup-button" onClick={onLeaveGame}>
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameStats;