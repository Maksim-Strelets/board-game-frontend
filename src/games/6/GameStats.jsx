import React, { useState } from 'react';

const GameStats = ({ gameStats, onHide, onLeaveGame }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // Format percentage for recipe completion
  const formatPercentage = (value) => {
    return Math.round(value) + '%';
  };

  // Get player username safely
  const getPlayerName = (player) => {
    if (!player) return 'Unknown Player';
    return player.user_data?.username || `Player ${player.user_id}`;
  };

  // Render player stats in a compact format
  const renderPlayerStats = (playerId, stats) => {
    const isWinner = stats.player?.user_id === gameStats.winner?.user_id;
    const isFirstFinisher = stats.player?.user_id === gameStats.first_finisher?.user_id;

    return (
      <div key={playerId} className="borsht-stats-player">
        <div className="borsht-stats-player-header">
          <div className="borsht-stats-player-name">
            {getPlayerName(stats.player)}
            {isWinner && (
              <span className="borsht-stats-winner-badge">Winner</span>
            )}
            {isFirstFinisher && (
              <span className="borsht-stats-finisher-badge">First Finisher</span>
            )}
          </div>
          <div className="borsht-stats-player-score">
            {stats.points_breakdown.total_score} points
          </div>
        </div>

        <div className="borsht-stats-player-details">
          <div className="borsht-stats-recipe">
            <div className="borsht-stats-recipe-name">
              {stats.recipe_name}
            </div>
            <div className="borsht-stats-recipe-completion">
              Completion: {formatPercentage(stats.recipe_completion)}
              <div className="borsht-stats-progress-bar">
                <div
                  className="borsht-stats-progress-fill"
                  style={{width: `${stats.recipe_completion}%`}}
                ></div>
              </div>
            </div>
          </div>

          <div className="borsht-stats-points">
            <div className="borsht-stats-point-item">
              <span>Ingredients:</span>
              <span>{stats.points_breakdown.ingredient_points}</span>
            </div>
            <div className="borsht-stats-point-item">
              <span>Recipe Bonus:</span>
              <span>{stats.points_breakdown.recipe_bonus}</span>
            </div>
            {stats.points_breakdown.first_finisher_bonus > 0 && (
              <div className="borsht-stats-point-item">
                <span>First Finisher:</span>
                <span>{stats.points_breakdown.first_finisher_bonus}</span>
              </div>
            )}
            <div className="borsht-stats-point-item total">
              <span>Total:</span>
              <span>{stats.points_breakdown.total_score}</span>
            </div>
          </div>

          <div className="borsht-stats-misc">
            <div className="borsht-stats-misc-item">
              <span>Moves:</span>
              <span>{stats.moves_made}</span>
            </div>
            <div className="borsht-stats-misc-item">
              <span>Cards in Hand:</span>
              <span>{stats.final_hand_size}</span>
            </div>
            <div className="borsht-stats-misc-item">
              <span>Total Ingredients:</span>
              <span>{stats.total_ingredients}</span>
            </div>
          </div>

          <div className="borsht-stats-ingredients">
            <div className="borsht-stats-ingredients-title">Ingredient Types:</div>
            <div className="borsht-stats-ingredients-grid">
              <div className="borsht-stats-ingredient-type">
                <span>Regular:</span>
                <span>{stats.ingredient_types.regular}</span>
              </div>
              <div className="borsht-stats-ingredient-type">
                <span>Rare:</span>
                <span>{stats.ingredient_types.rare}</span>
              </div>
              <div className="borsht-stats-ingredient-type">
                <span>Extra:</span>
                <span>{stats.ingredient_types.extra}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="borsht-stats-overlay">
      <div className="borsht-stats-container">
        <div className="borsht-stats-header">
          <h2>Game Statistics</h2>
          <div className="borsht-stats-tabs">
            <button
              className={`borsht-stats-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`borsht-stats-tab ${activeTab === 'players' ? 'active' : ''}`}
              onClick={() => setActiveTab('players')}
            >
              Players
            </button>
          </div>
        </div>

        <div className="borsht-stats-content">
          {activeTab === 'overview' ? (
            <div className="borsht-stats-overview">
              <div className="borsht-stats-winner-section">
                <div className="borsht-stats-winner-title">Winner</div>
                <div className="borsht-stats-winner-name">
                  {getPlayerName(gameStats.winner)}
                </div>
                <div className="borsht-stats-winner-score">
                  {gameStats.winner_score} points
                </div>
              </div>

              <div className="borsht-stats-player-scores">
                <h3>Final Scores</h3>
                <div className="borsht-stats-scores-list">
                  {Object.entries(gameStats.scores || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([playerId, score]) => {
                      const playerStats = gameStats.player_stats[playerId];
                      const isWinner = playerStats?.player?.user_id === gameStats.winner?.user_id;

                      return (
                        <div
                          key={playerId}
                          className={`borsht-stats-score-item ${isWinner ? 'winner' : ''}`}
                        >
                          <div className="borsht-stats-score-player">
                            {getPlayerName(playerStats?.player)}
                          </div>
                          <div className="borsht-stats-score-value">{score}</div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="borsht-stats-game-info">
                <div className="borsht-stats-info-item">
                  <span>Game Duration:</span>
                  <span>{formatDuration(gameStats.duration_seconds)}</span>
                </div>
                <div className="borsht-stats-info-item">
                  <span>Total Rounds:</span>
                  <span>{gameStats.total_rounds}</span>
                </div>
                <div className="borsht-stats-info-item">
                  <span>Players:</span>
                  <span>{gameStats.player_count}</span>
                </div>
                <div className="borsht-stats-info-item">
                  <span>First Finisher:</span>
                  <span>{getPlayerName(gameStats.first_finisher)}</span>
                </div>
                <div className="borsht-stats-info-item">
                  <span>Cards in Deck:</span>
                  <span>{gameStats.cards_remaining_in_deck}</span>
                </div>
                <div className="borsht-stats-info-item">
                  <span>Cards in Discard:</span>
                  <span>{gameStats.cards_in_discard}</span>
                </div>
                {gameStats.active_shkvarkas > 0 && (
                  <div className="borsht-stats-info-item">
                    <span>Active Shkvarkas:</span>
                    <span>{gameStats.active_shkvarkas}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="borsht-stats-players">
              {Object.entries(gameStats.player_stats || {})
                .sort(([aId, aStats], [bId, bStats]) =>
                  bStats.points_breakdown.total_score - aStats.points_breakdown.total_score
                )
                .map(([playerId, stats]) => renderPlayerStats(playerId, stats))}
            </div>
          )}
        </div>

        <div className="borsht-stats-actions">
          <button className="borsht-button" onClick={onHide}>
            Hide Popup
          </button>
          <button className="borsht-button borsht-button-leave" onClick={onLeaveGame}>
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameStats;