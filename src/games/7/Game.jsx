import React, { useState, useEffect } from 'react';
import { CircleUser, Settings, Info, Award, ShoppingBag, RefreshCw } from 'lucide-react';

import api from '../../utils/api';
import './Game.css';

// Sub-components
import TokenReturnPopup from './TokenReturnPopup';
import NobleSelectionPopup from './NobleSelectionPopup';
import GameStats from './GameStats';

const Game = ({ roomId, user }) => {
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedGems, setSelectedGems] = useState([]);
  const [showActionPanel, setShowActionPanel] = useState(true);
  const [isZoomed, setIsZoomed] = useState(null);

  // Decision popups
  const [tokenReturnData, setTokenReturnData] = useState(null);
  const [nobleSelectionData, setNobleSelectionData] = useState(null);

  // Game stats for end game
  const [gameStats, setGameStats] = useState(null);
  const [showGameStats, setShowGameStats] = useState(false);

  // Effect to handle websocket communication and game state updates
  useEffect(() => {
    // Initial game state fetch
    const fetchGameState = async () => {
      try {
        setLoading(true);
        await api.getWs().send(JSON.stringify({
          type: 'get_game_state'
        }));
        await api.getWs().send(JSON.stringify({
          type: 'resend_pending_data'
        }));
      } catch (err) {
        console.error('Error fetching game state:', err);
        setError('Failed to connect to the game');
      } finally {
        setLoading(false);
      }
    };

    // Listen for game state updates from WebSocket
    const handleWebSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'game_state' || data.type === 'game_update') {
          setGameState(data.state);
          setLoading(false);

        } else if (data.type === 'game_error') {
          setError(data.message);

        } else if (data.type === 'token_return_required') {
          // Store the token return data
          setTokenReturnData({
            tokens_to_return: data.tokens_to_return
          });

        } else if (data.type === 'noble_selection_required') {
          // Store the noble selection data
          setNobleSelectionData({
            eligible_nobles: data.eligible_nobles
          });

        } else if (data.type === 'game_ended') {
          setGameStats(data.stats);
          setShowGameStats(true);
        }

      } catch (err) {
        console.error('Error processing websocket message:', err);
      }
    };

    // Set up WebSocket listeners
    const setupWebSocketListeners = () => {
      if (api.getWs().socket) {
        api.getWs().socket.addEventListener('message', handleWebSocketMessage);

        // Request initial game state
        fetchGameState();
      }
    };

    // Set up listeners when component mounts or WebSocket changes
    setupWebSocketListeners();

    // Clean up event listeners on unmount
    return () => {
      if (api.getWs().socket) {
        api.getWs().socket.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, [roomId, user.id]);

  // Make a move in the game
  const makeMove = (moveData) => {
    if (!api.getWs().socket) return;

    api.getWs().send(JSON.stringify({
      type: 'game_move',
      move: moveData
    }));

    // Reset selections after move
    setSelectedCard(null);
    setSelectedAction(null);
    setSelectedGems([]);
  };

  // Handle gem selection for different gems action
  const handleGemSelect = (color) => {
    if (selectedAction !== 'take_different_gems') {
      setSelectedAction('take_different_gems');
      setSelectedGems([color]);
      return;
    }

    // If already selected, remove it
    if (selectedGems.includes(color)) {
      setSelectedGems(selectedGems.filter(gem => gem !== color));
      return;
    }

    // If we already have 3 different gems, replace the last one
    if (selectedGems.length >= 3) {
      const newGems = [...selectedGems.slice(0, 2), color];
      setSelectedGems(newGems);
      return;
    }

    // Add the gem to selection
    setSelectedGems([...selectedGems, color]);
  };

  // Handle taking 2 of the same gem
  const handleTakeSameGem = (color) => {
    setSelectedAction('take_same_gems');
    setSelectedGems([color]);

    // Execute the move immediately
    makeMove({
      action: 'take_same_gems',
      gem_color: color
    });
  };

  // Handle taking different gems
  const handleTakeDifferentGems = () => {
    if (selectedGems.length !== 3) {
      return;
    }

    makeMove({
      action: 'take_different_gems',
      gems: selectedGems
    });
  };

  // Handle card selection from table or reserved
  const handleCardSelect = (card, level, position, fromReserved = false) => {
    setSelectedCard({
      card,
      level,
      position,
      fromReserved
    });

    // Determine if we can purchase or reserve
    const canPurchase = checkCanPurchaseCard(card);
    setSelectedAction(canPurchase ? 'purchase_card' : 'reserve_card');
  };

  // Handle purchasing a card
  const handlePurchaseCard = () => {
    if (!selectedCard) return;

    const moveData = {
      action: 'purchase_card',
      from_reserved: selectedCard.fromReserved
    };

    if (selectedCard.fromReserved) {
      moveData.card_index = selectedCard.position;
    } else {
      moveData.card_level = selectedCard.level;
      moveData.card_position = selectedCard.position;
    }

    makeMove(moveData);
  };

  // Handle reserving a card
  const handleReserveCard = (fromDeck = false) => {
    if (fromDeck) {
      // For reserving from a deck, just need the level
      if (!selectedCard || !selectedCard.level) return;

      makeMove({
        action: 'reserve_card',
        from_deck: true,
        card_level: selectedCard.level
      });
    } else {
      // For reserving a visible card
      if (!selectedCard) return;

      makeMove({
        action: 'reserve_card',
        from_deck: false,
        card_level: selectedCard.level,
        card_position: selectedCard.position
      });
    }
  };

  // Handle token return
  const handleTokenReturn = (tokensToReturn) => {
    if (!tokenReturnData) return;

    makeMove({
      action: 'return_tokens',
      tokens: tokensToReturn
    });

    setTokenReturnData(null);
  };

  // Handle noble selection
  const handleNobleSelection = (nobleId) => {
    if (!nobleSelectionData) return;

    makeMove({
      action: 'select_noble',
      noble_id: nobleId
    });

    setNobleSelectionData(null);
  };

  // Toggle action panel visibility
  const toggleActionPanel = () => {
    setShowActionPanel(!showActionPanel);
  };

  // Check if a player can purchase a card
  const checkCanPurchaseCard = (card) => {
    if (!gameState || !card) return false;

    const playerGems = gameState.your_gems;
    const playerBonuses = gameState.your_bonuses;

    // Check if player has enough gems and bonuses
    let canAfford = true;
    const tempGems = { ...playerGems };

    // Calculate costs after bonuses
    for (const [color, cost] of Object.entries(card.cost)) {
      const bonusAmount = playerBonuses[color] || 0;
      let requiredAmount = Math.max(0, cost - bonusAmount);

      // First use regular gems
      const gemAmount = Math.min(requiredAmount, tempGems[color] || 0);
      tempGems[color] -= gemAmount;
      requiredAmount -= gemAmount;

      // Then use gold gems for the rest
      if (requiredAmount > 0) {
        tempGems.gold -= requiredAmount;
      }

      // Check if we have enough
      if (tempGems.gold < 0) {
        canAfford = false;
        break;
      }
    }

    return canAfford;
  };

  // Render loading state
  if (loading && !gameState) {
    return (
      <div className="splendor-loading">
        <div className="splendor-loading-spinner"></div>
        <p>Loading Splendor game...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="splendor-error">
        <div className="splendor-error-title">Error</div>
        <p>{error}</p>
        <button
          onClick={async () => {
            setError(null);
            setLoading(true);
            await api.getWs().send(JSON.stringify({
              type: 'get_game_state'
            }));
            setLoading(false);
          }}
          className="splendor-button"
        >
          Retry
        </button>
      </div>
    );
  }

  // Render when no game state is available
  if (!gameState) {
    return (
      <div className="splendor-loading">
        <p>Waiting for game to start...</p>
        <p className="text-sm mt-2">Get ready to collect gems and impress nobles!</p>
      </div>
    );
  }

  const isCurrentPlayerTurn = gameState.current_player === user.id;
  const gemTokens = gameState.gem_tokens || {};
  const goldTokens = gameState.gold_tokens || 0;
  const visibleCards = gameState.visible_cards || {};
  const nobleTiles = gameState.noble_tiles || [];
  const yourGems = gameState.your_gems || {};
  const yourReservedCards = gameState.your_reserved_cards || [];
  const yourPurchasedCards = gameState.your_purchased_cards || {};
  const yourNobles = gameState.your_nobles || [];
  const yourPrestige = gameState.your_prestige || 0;
  const cardDeckCounts = gameState.card_deck_counts || {};
  const otherPlayers = gameState.players || {};

  return (
    <div className="splendor-game-container">
      {/* Game header */}
      <div className="splendor-header">
        <h2>{isCurrentPlayerTurn ? "Your turn" : `${otherPlayers[gameState.current_player]?.username}'s turn`}</h2>
        <div className="splendor-actions">
          <button
            className="splendor-button"
            title="Game info"
          >
            <Info size={20} />
          </button>
          <button className="splendor-button" title="Game settings">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Game layout - rearranged with flexbox column */}
      <div className="splendor-game-layout">
        {/* Other players section - now at the top */}
        <div className="splendor-opponents-section">
          {Object.entries(otherPlayers).map(([playerId, playerData]) => (
            <div
              key={playerId}
              className={`splendor-player-card ${gameState.current_player === parseInt(playerId) ? 'current' : ''}`}
            >
              <div className="splendor-player-header">
                <div className="splendor-player-name">
                  <CircleUser className="splendor-player-icon" />
                  <span>{playerData.username}</span>
                </div>
                <div className="splendor-player-gems">
                  {Object.entries(playerData.gems || {}).map(([color, count]) => (
                    count > 0 && (
                      <div key={color} className={`splendor-gem-token ${color}`}>
                        {count}
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Player's purchased cards - now in stacks by color */}
              <div className="splendor-player-cards">
                {Object.entries(playerData.purchased_cards || {}).map(([color, cards]) => (
                  cards.length > 0 && (
                    <div key={color} className="splendor-card-stack">
                      {cards.map((card, idx) => (
                        <div
                          key={`${card.id}-${idx}`}
                          className={`splendor-purchased-card splendor-card-${color}`}
                          style={{
                            position: 'absolute',
                            top: `${idx * 8}px`,
                            zIndex: idx
                          }}
                        >
                        </div>
                      ))}
                      <div className="splendor-card-count">{cards.length}</div>
                    </div>
                  )
                ))}
              </div>

              {/* Player's nobles */}
              <div className="splendor-player-nobles">
                {playerData.nobles && playerData.nobles.map((noble, idx) => (
                  <div
                    key={`${noble.id}-${idx}`}
                    className="splendor-noble-tile"
                    onMouseEnter={() => setIsZoomed(noble.id)}
                    onMouseLeave={() => setIsZoomed(null)}
                  >
                    {noble.points && <div className="splendor-noble-points">{noble.points}</div>}

                    {isZoomed === noble.id && (
                      <div className="splendor-noble-tooltip">
                        <div className="splendor-noble-requirements">
                          {Object.entries(noble.requirements || {}).map(([color, amount]) => (
                            amount > 0 && (
                              <div key={color} className={`splendor-requirement-token ${color}`}>
                                {amount}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="splendor-player-stats">
                <span>Prestige: {playerData.prestige || 0}</span>
                {/* Reserved cards indicator */}
                {playerData.reserved_count > 0 && (
                  <div className="splendor-reserved-indicator">
                    <ShoppingBag size={16} />
                    <span>{playerData.reserved_count} reserved</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Main game board - in the middle */}
        <div className="splendor-game-board">
          <div className="splendor-game-cards">
            {/* Cards area */}
            <div className="splendor-cards-section">
              {[3, 2, 1].map(level => (
                <div key={level} className="splendor-card-level">
                  <div className="splendor-card-deck" onClick={() => isCurrentPlayerTurn && handleCardSelect(null, level, null)}>
                    <div className="splendor-deck-count">{cardDeckCounts[level] || 0}</div>
                    <span className="splendor-level-label">Level {level}</span>
                  </div>

                  <div className="splendor-visible-cards">
                    {visibleCards[level] && visibleCards[level].map((card, idx) => (
                      <div
                        key={`${card.id}-${idx}`}
                        className={`splendor-card splendor-card-${card.gem_color} ${selectedCard && selectedCard.card && selectedCard.card.id === card.id ? 'selected' : ''}`}
                        onClick={() => isCurrentPlayerTurn && handleCardSelect(card, level, idx)}
                        onMouseEnter={() => setIsZoomed(card.id)}
                        onMouseLeave={() => setIsZoomed(null)}
                      >
                        {card.points > 0 && <div className="splendor-card-points">{card.points}</div>}
                        {isZoomed === card.id && (
                          <div className="splendor-card-tooltip">
                            <div className="splendor-card-costs">
                              {Object.entries(card.cost || {}).map(([color, amount]) => (
                                amount > 0 && (
                                  <div key={color} className={`splendor-cost-token ${color}`}>
                                    {amount}
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {(!visibleCards[level] || visibleCards[level].length === 0) && (
                      <div className="splendor-empty-cards">No cards available</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Gems tokens area */}
          <div className="splendor-tokens-section">
            <h3 className="splendor-section-title">Gems</h3>
            <div className="splendor-tokens-container">
              {Object.entries(gemTokens).map(([color, count]) => (
                <div
                  key={color}
                  className={`splendor-gem-stack ${selectedGems.includes(color) ? 'selected' : ''}`}
                  onClick={() => isCurrentPlayerTurn && count > 0 && handleGemSelect(color)}
                  onDoubleClick={() => isCurrentPlayerTurn && count >= 4 && handleTakeSameGem(color)}
                >
                  <div className={`splendor-gem-token ${color}`}>{count}</div>
                </div>
              ))}

              {/* Gold tokens (jokers) */}
              <div className="splendor-gem-stack">
                <div className="splendor-gem-token gold">{goldTokens}</div>
              </div>
            </div>

            {/* Noble tiles */}
            <div className="splendor-nobles-section">
              <h3 className="splendor-section-title">Nobles</h3>
              <div className="splendor-nobles-container">
                {nobleTiles.map((noble, idx) => (
                  <div
                    key={`${noble.id}-${idx}`}
                    className="splendor-noble-tile"
                    onMouseEnter={() => setIsZoomed(noble.id)}
                    onMouseLeave={() => setIsZoomed(null)}
                  >
                    {noble.points && <div className="splendor-noble-points">{noble.points}</div>}

                    {isZoomed === noble.id && (
                      <div className="splendor-noble-tooltip">
                        <div className="splendor-noble-requirements">
                          {Object.entries(noble.requirements || {}).map(([color, amount]) => (
                            amount > 0 && (
                              <div key={color} className={`splendor-requirement-token ${color}`}>
                                {amount}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {nobleTiles.length === 0 && (
                  <div className="splendor-empty-nobles">All nobles have been claimed</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Player's board - now at the bottom */}
        <div className="splendor-player-board">
          <div className="splendor-player-info">
            <div className="splendor-player-name">
              <CircleUser className="splendor-player-icon" />
              <span>You</span>
            </div>

            {/* Player's gems */}
            <div className="splendor-your-gems">
              <h3 className="splendor-section-title">Gems</h3>
              <div className="splendor-gems-container">
                {Object.entries(yourGems).map(([color, count]) => (
                  count > 0 && (
                    <div key={color} className={`splendor-gem-token ${color}`}>
                      {count}
                    </div>
                  )
                ))}
              </div>
            </div>


            <div className="splendor-player-prestige">
              <Award size={20} />
              <span>Prestige: {yourPrestige}</span>
            </div>
          </div>

          <div className="splendor-player-cards-section">
            {/* Player's purchased cards */}
            <div className="splendor-your-cards">
              <h3 className="splendor-section-title">Your Cards</h3>
              <div className="splendor-purchased-cards">
                {Object.entries(yourPurchasedCards).map(([color, cards]) => (
                  cards.length > 0 && (
                    <div key={color} className="splendor-card-stack">
                      {cards.map((card, idx) => (
                        <div
                          key={`${card.id}-${idx}`}
                          className={`splendor-purchased-card splendor-card-${color}`}
                          style={{
                            position: 'absolute',
                            top: `${idx * 8}px`,
                            zIndex: idx
                          }}
                        >
                        </div>
                      ))}
                      <div className="splendor-card-count">{cards.length}</div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Player's reserved cards */}
            <div className="splendor-your-reserved">
              <h3 className="splendor-section-title">Reserved Cards ({yourReservedCards.length}/3)</h3>
              <div className="splendor-reserved-cards">
                {yourReservedCards.map((card, idx) => (
                  <div
                    key={`reserved-${idx}`}
                    className={`splendor-card splendor-card-${card.gem_color} ${selectedCard && selectedCard.fromReserved && selectedCard.position === idx ? 'selected' : ''}`}
                    onClick={() => isCurrentPlayerTurn && handleCardSelect(card, null, idx, true)}
                    onMouseEnter={() => setIsZoomed(`reserved-${card.id}`)}
                    onMouseLeave={() => setIsZoomed(null)}
                  >
                    {card.points > 0 && <div className="splendor-card-points">{card.points}</div>}
                    {isZoomed === `reserved-${card.id}` && (
                      <div className="splendor-card-tooltip">
                        <div className="splendor-card-costs">
                          {Object.entries(card.cost || {}).map(([costColor, amount]) => (
                            amount > 0 && (
                              <div key={costColor} className={`splendor-cost-token ${costColor}`}>
                                {amount}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {yourReservedCards.length === 0 && (
                  <div className="splendor-empty-reserved">No reserved cards</div>
                )}
              </div>
            </div>

            {/* Player's nobles */}
            <div className="splendor-your-nobles">
              <h3 className="splendor-section-title">Your Nobles</h3>
              <div className="splendor-nobles-container">
                {yourNobles.map((noble, idx) => (
                  <div
                    key={`${noble.id}-${idx}`}
                    className="splendor-noble-tile"
                    onMouseEnter={() => setIsZoomed(`your-${noble.id}`)}
                    onMouseLeave={() => setIsZoomed(null)}
                  >
                    {noble.points && <div className="splendor-noble-points">{noble.points}</div>}

                    {isZoomed === `your-${noble.id}` && (
                      <div className="splendor-noble-tooltip">
                        <div className="splendor-noble-requirements">
                          {Object.entries(noble.requirements || {}).map(([color, amount]) => (
                            amount > 0 && (
                              <div key={color} className={`splendor-requirement-token ${color}`}>
                                {amount}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {yourNobles.length === 0 && (
                  <div className="splendor-empty-nobles">No nobles yet</div>
                )}
              </div>
            </div>
          </div>

          {/* Actions panel */}
          {showActionPanel && (
            <div className="splendor-actions-panel">
              <div className="splendor-action-buttons">
                <button
                  className="splendor-action-button"
                  onClick={handleTakeDifferentGems}
                  disabled={
                    !isCurrentPlayerTurn ||
                    selectedGems.length !== 3 ||
                    new Set(selectedGems).size !== 3 ||
                    gameState.turn_state !== "normal_turn"
                  }
                  title={
                    !isCurrentPlayerTurn
                      ? "Not your turn"
                      : selectedGems.length !== 3
                        ? "Select 3 different gems"
                        : new Set(selectedGems).size !== 3
                          ? "Gems must be different"
                          : "Take 3 different gems"
                  }
                >
                  Take 3 Different Gems
                </button>

                <button
                  className="splendor-action-button"
                  onClick={handlePurchaseCard}
                  disabled={
                    !isCurrentPlayerTurn ||
                    !selectedCard ||
                    !checkCanPurchaseCard(selectedCard.card) ||
                    gameState.turn_state !== "normal_turn"
                  }
                  title={
                    !isCurrentPlayerTurn
                      ? "Not your turn"
                      : !selectedCard
                        ? "Select a card first"
                        : !checkCanPurchaseCard(selectedCard.card)
                          ? "You cannot afford this card"
                          : "Purchase selected card"
                  }
                >
                  Purchase Card
                </button>

                <button
                  className="splendor-action-button"
                  onClick={() => handleReserveCard(false)}
                  disabled={
                    !isCurrentPlayerTurn ||
                    !selectedCard ||
                    selectedCard.fromReserved ||
                    yourReservedCards.length >= 3 ||
                    gameState.turn_state !== "normal_turn"
                  }
                  title={
                    !isCurrentPlayerTurn
                      ? "Not your turn"
                      : !selectedCard
                        ? "Select a card first"
                        : selectedCard.fromReserved
                          ? "Cannot reserve an already reserved card"
                          : yourReservedCards.length >= 3
                            ? "You already have 3 reserved cards"
                            : "Reserve selected card"
                  }
                >
                  Reserve Card
                </button>

                <button
                  className="splendor-action-button"
                  onClick={() => handleReserveCard(true)}
                  disabled={
                    !isCurrentPlayerTurn ||
                    !selectedCard ||
                    !selectedCard.level ||
                    yourReservedCards.length >= 3 ||
                    gameState.turn_state !== "normal_turn"
                  }
                  title={
                    !isCurrentPlayerTurn
                      ? "Not your turn"
                      : !selectedCard || !selectedCard.level
                        ? "Select a deck first"
                        : yourReservedCards.length >= 3
                          ? "You already have 3 reserved cards"
                          : `Reserve top card from level ${selectedCard.level} deck`
                  }
                >
                  Reserve from Deck
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Game messages */}
      {isCurrentPlayerTurn && gameState.turn_state === "normal_turn" && (
        <div className="splendor-game-message">
          Your turn! Select gems to collect, or choose a card to purchase or reserve.
        </div>
      )}

      {gameState.turn_state === "waiting_for_token_return" && (
        <div className="splendor-game-message warning">
          You have too many tokens! Select tokens to return.
        </div>
      )}

      {gameState.turn_state === "waiting_for_noble_selection" && (
        <div className="splendor-game-message">
          You have impressed multiple nobles! Select one to visit you.
        </div>
      )}

      {gameState.is_game_over && (
        <div className="splendor-game-message end">
          Game over! {gameState.winner === user.id ? 'You won!' : `${otherPlayers[gameState.winner]?.username} won!`}
        </div>
      )}

      {/* Popup components */}
      {tokenReturnData && (
        <TokenReturnPopup
          tokensToReturn={tokenReturnData.tokens_to_return}
          yourGems={yourGems}
          onSubmit={handleTokenReturn}
        />
      )}

      {nobleSelectionData && (
        <NobleSelectionPopup
          nobles={nobleSelectionData.eligible_nobles}
          onSelect={handleNobleSelection}
        />
      )}

      {showGameStats && gameStats && (
        <GameStats
          gameStats={gameStats}
          currentPlayerId={user.id}
          onClose={() => setShowGameStats(false)}
          onLeaveGame={() => window.location.href = '/games'}
        />
      )}
    </div>
  );
};

export default Game;