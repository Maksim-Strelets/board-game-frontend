import React, { useState, useEffect, useRef } from 'react';
import { CircleUser, Settings, Info, Heart, Search, RefreshCw } from 'lucide-react';

import DecisionPopup from './DecisionPopup';
import PlayerDecision from './PlayerDecision';
import GingerSelection from './GingerSelection';
import RecipeSelection from './RecipeSelection';
import SourCreamDefense from './SourCreamDefense';
import DiscardSelection from './DiscardSelection';
import OliveOilSelection from './OliveOilSelection';
import CinnamonSelection from './CinnamonSelection';
import RedPepperDecision from './RedPepperDecision';
import MarketDiscardSelection from './MarketDiscardSelection';

import api from '../../utils/api';
import './Game.css';

const Game = ({ roomId, user }) => {
  const [gameState, setGameState] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [targetCard, setTargetCard] = useState(null);
  const [isZoomed, setIsZoomed] = useState(null);
  const [showRecipe, setShowRecipe] = useState(false);
  const [showRecipePopup, setShowRecipePopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMarketCards, setSelectedMarketCards] = useState([]);
  const [selectedHandCards, setSelectedHandCards] = useState([]);
  const [cinnamonData, setCinnamonData] = useState(null);

  //  decision
  const [pendingRequest, setPendingRequest] = useState(null);
  const [recipeOptions, setRecipeOptions] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [discardData, setDiscardData] = useState(null);
  const [marketDiscardData, setMarketDiscardData] = useState(null);
  const [oliveOilData, setOliveOilData] = useState(null);
  const [gingerData, setGingerData] = useState(null);
  const [redPepperData, setRedPepperData] = useState(null);
  const [defenseData, setDefenseData] = useState(null);

  // References for card containers
  const handContainerRef = useRef(null);

  // Effect to handle websocket communication and game state updates
  useEffect(() => {
    // Initial game state fetch
    const fetchGameState = async () => {
      try {
        setLoading(true);
        await api.getWs().send(JSON.stringify({
          type: 'get_game_state'
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

        } else if (data.type === 'recipe_selection') {
          // Store the recipe options and request ID
          setRecipeOptions(data.recipe_options);
          setPendingRequest({
            type: data.type,
            request_id: data.request_id
          });

          // Start timer
          const now = Math.floor(Date.now() / 1000);
          const timeleft = data.expires_at - now || 30; // Default
          setTimeRemaining(timeleft);

          // Set up interval to update the timer
          const interval = setInterval(() => {
            setTimeRemaining(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          setTimerInterval(interval);

        } else if (data.type === 'discard_selection' && data.reason === 'hand_limit') {
          // Store the discard request data
          setDiscardData({
            hand: data.hand,
            discard_count: data.discard_count,
            request_id: data.request_id,
            expires_at: data.expires_at,
            recipe: data.your_recipe,
          });

        } else if (data.type === 'discard_selection' && data.reason === 'market_limit') {
          // Store the market discard request data
          setMarketDiscardData({
            market: data.market,
            discard_count: data.discard_count,
            request_id: data.request_id,
            expires_at: data.expires_at,
          });

        } else if (data.type === 'defense_request') {
          // Store the defense request data
          setDefenseData({
            attacker: data.attacker,
            attackCard: data.card,
            targetCards: data.target_cards,
            request_id: data.request_id,
            expires_at: data.expires_at
          });

        } else if (data.type === 'olive_oil_selection') {
          // Store the olive oil selection data
          setOliveOilData({
            cards: data.cards,
            select_count: data.select_count,
            request_id: data.request_id,
            expires_at: data.expires_at,
          });

        } else if (data.type === 'cinnamon_selection') {
          // Store the cinnamon selection data
          setCinnamonData({
            discard_pile: data.discard_pile,
            select_count: data.select_count,
            request_id: data.request_id,
            expires_at: data.expires_at,
          });

        } else if (data.type === 'ginger_selection') {
          // Store the ginger selection data
          setGingerData({
            market: data.market,
            select_count: data.select_count,
            request_id: data.request_id,
            expires_at: data.expires_at,
          });

        } else if (data.type === 'recipe_completed') {
          // Someone completed their recipe
          const message = data.player_id === user.id
            ? "You completed your recipe first!"
            : `Player ${data.player_id} completed their recipe!`;
          alert(message + " Everyone gets one more turn.");
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

  const calculateCardsCost = (cards) => {
      return cards.reduce((total, card) => total + (card.cost || 1), 0);
    };

  const handleMarketCardSelect = (card) => {
      // Clear the single-selection state if this is the first market card selection
      if (selectedMarketCards.length === 0 && selectedCard) {
        setSelectedHandCards([selectedCard])
        setSelectedCard(null);
        setSelectedAction(null);
      }

      // If already selected, remove it from selection
      if (selectedMarketCards.some(c => c.uid === card.uid)) {
        setSelectedMarketCards(prev => prev.filter(c => c.uid !== card.uid));
      } else {
        // Otherwise add it to selection
        setSelectedMarketCards(prev => [...prev, card]);
      }
    };

  const handleDiscardSelection = (selectedCardIds) => {
      if (!discardData || !discardData.request_id) return;

      // Send the selection to the server
      api.getWs().send(JSON.stringify({
        type: 'request_response',
        request_id: discardData.request_id,
        selected_cards: selectedCardIds,
      }));

      // Clear the discard data
      setDiscardData(null);
    };

  const handleMarketDiscardSelection = (selectedCardIds) => {
      if (!marketDiscardData || !marketDiscardData.request_id) return;

      // Send the selection to the server
      api.getWs().send(JSON.stringify({
        type: 'request_response',
        request_id: marketDiscardData.request_id,
        selected_cards: selectedCardIds,
      }));

      // Clear the discard data
      setMarketDiscardData(null);
    };

  // recipe selection
  const handleRecipeSelection = (selectedRecipeId) => {
      if (!pendingRequest || pendingRequest.type !== 'recipe_selection') return;

      // Clear timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }

      // Send selection to server
      api.getWs().send(JSON.stringify({
        type: 'request_response',
        request_id: pendingRequest.request_id,
        selected_recipe: selectedRecipeId
      }));

      // Clear the pending request
      setPendingRequest(null);
      setRecipeOptions([]);
  };

  const canPlayRedPepper = () => {
      // Can only play if a target card is selected from an opponent's borsht
      if (selectedCard && selectedCard.id === 'red_pepper') {
        return targetPlayer !== null && targetCard !== null;
      }
      return true; // For other cards, this check doesn't apply
    };

  const handleRedPepperDecision = (action) => {
      if (!redPepperData) return;

      const moveData = {
        action: 'play_special',
        card_id: selectedCard.uid,
        target_player: redPepperData.targetPlayer,
        target_cards: [redPepperData.targetCard.uid],
        action_type: action  // 'steal' or 'discard'
      };

      makeMove(moveData);
      setRedPepperData(null);
      setTargetPlayer(null);
      setTargetCard(null);
    };

  const handleOliveOilSelection = (selectedCardIds) => {
      if (!oliveOilData || !oliveOilData.request_id) return;

      // Send the selection to the server
      api.getWs().send(JSON.stringify({
        type: 'request_response',
        request_id: oliveOilData.request_id,
        selected_cards: selectedCardIds,
      }));

      // Clear the olive oil data
      setOliveOilData(null);
    };

    const handleCinnamonSelection = (selectedCardIds) => {
        if (!cinnamonData || !cinnamonData.request_id) return;

        // Send the selection to the server
        api.getWs().send(JSON.stringify({
          type: 'request_response',
          request_id: cinnamonData.request_id,
          selected_cards: selectedCardIds,
        }));

        // Clear the cinnamon data
        setCinnamonData(null);
      };

  const handleGingerSelection = (selectedCardIds) => {
      if (!gingerData || !gingerData.request_id) return;

      // Send the selection to the server
      api.getWs().send(JSON.stringify({
        type: 'request_response',
        request_id: gingerData.request_id,
        selected_cards: selectedCardIds,
      }));

      // Clear the ginger data
      setGingerData(null);
    };

  // Add this useEffect for cleanup
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  const handleDefend = () => {
      if (!defenseData || !defenseData.request_id) return;

      // Send the response to use defense
      api.getWs().send(JSON.stringify({
        type: 'request_response',
        request_id: defenseData.request_id,
        use_defense: true
      }));

      // Clear the defense data
      setDefenseData(null);
    };

  const handleDeclineDefense = () => {
      if (!defenseData || !defenseData.request_id) return;

      // Send the response to not use defense
      api.getWs().send(JSON.stringify({
        type: 'request_response',
        request_id: defenseData.request_id,
        use_defense: false
      }));

      // Clear the defense data
      setDefenseData(null);
    };

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
    setTargetPlayer(null);
    setTargetCard(null);
    setSelectedMarketCards([]);
    setSelectedHandCards([]);
  };

  // Handle card selection from hand
  const handleCardSelect = (card) => {
      // If market cards are selected, use the separate state for hand cards
      if (selectedMarketCards.length > 0) {
        if (selectedHandCards.some(c => c.uid === card.uid)) {
          setSelectedHandCards(prev => prev.filter(c => c.uid !== card.uid));
        } else {
          setSelectedHandCards(prev => [...prev, card]);
        }
        return;
      }

      // When no market cards are selected, use selectedCard for single selection
      // and selectedHandCards for multiple selection
      if (selectedCard && selectedCard.uid === card.uid && selectedHandCards.length <= 1) {
        // Deselect if this is the only selected card
        setSelectedCard(null);
        setSelectedHandCards([]);
        setSelectedAction(null);
      } else {
        // Update the hand card selection
        let newSelectedHandCards;
        if (selectedHandCards.some(c => c.uid === card.uid)) {
          // Remove the card if already selected
          newSelectedHandCards = selectedHandCards.filter(c => c.uid !== card.uid);
        } else {
          // Add the card if not selected
          newSelectedHandCards = [...selectedHandCards, card];
        }

        setSelectedHandCards(newSelectedHandCards);

        // Set selectedCard and action only when exactly one card is selected
        if (newSelectedHandCards.length === 1) {
          setSelectedCard(newSelectedHandCards[0]);

          // Determine available actions based on card type
          if (newSelectedHandCards[0].type === 'special') {
            setSelectedAction('play_special');
          } else {
            setSelectedAction('add_ingredient');
          }
        } else {
          // Clear selectedCard and action when multiple or no cards selected
          setSelectedCard(null);
          setSelectedAction(null);
        }
      }
    };


  // Add a function to deselect all cards
  const handleDeselectAll = () => {
      setSelectedMarketCards([]);
      setSelectedHandCards([]);
      setSelectedCard(null);
      setSelectedAction(null);
    };

  // Handle adding an ingredient to the borsht
  const handleAddIngredient = () => {
    if (!isCurrentPlayerTurn || !selectedCard || selectedCard.type === 'special') {
      return;
    }

    makeMove({
      action: 'add_ingredient',
      card_id: selectedCard.uid
    });
  };

  // Add this function to handle special card effect choices
    const handleBlackPepperEffect = (effectChoice) => {
      if (!selectedCard || selectedCard.uid !== 'black_pepper') return;

      makeMove({
        action: 'play_special',
        card_id: selectedCard.uid,
        effect_choice: effectChoice
      });

      setPendingRequest(null);
    };

  // Handle playing a special card
  const handlePlaySpecial = () => {
    if (!isCurrentPlayerTurn || !selectedCard || !selectedCard.effect) {
      alert('Please select a special card first');
      return;
    }

      // For Black Pepper, show decision popup instead of window.confirm
      if (selectedCard.effect === 'discard_or_take') {
        setPendingRequest({
          type: 'black_pepper_decision'
        });
        return;
      }

      // For Red Pepper, check if a target card is selected
      if (selectedCard.id === 'chili_pepper') {
        if (!targetPlayer || !targetCard) {
          alert('Please select a card from an opponent\'s borsht first');
          return;
        }

        // Find the target card details from the opponent's borsht
        const opponent = gameState.players[targetPlayer];
        if (!opponent || !opponent.borsht) {
          alert('Cannot find the selected card');
          return;
        }

        if (targetPlayer === gameState?.first_finisher) {
          alert('Cannot use pepper on this player');
          return;
        }

        const targetCardDetails = opponent.borsht.find(card => card.uid === targetCard);
        if (!targetCardDetails) {
          alert('Cannot find the selected card');
          return;
        }

        // Set the red pepper data for the popup
        setRedPepperData({
          targetPlayer,
          targetCard: targetCardDetails,
          playerRecipe: gameState.your_recipe,
          playerBorsht: gameState.your_borsht
        });

        return;
      }

      // Rest of your handlePlaySpecial function
      let moveData = {
        action: 'play_special',
        card_id: selectedCard.uid
      };

      // Handle other card effects...

      makeMove(moveData);
    };

    // TODO: special card effects

  const handleFreeMarketRefresh = () => {
      if (!api.getWs().socket) return;

      api.getWs().send(JSON.stringify({
        type: 'game_move',
        move: {
          action: 'free_market_refresh'
        }
      }));
    };

  // Handle drawing cards
  const handleDrawCards = () => {
    if (!isCurrentPlayerTurn) return;

    makeMove({
      action: 'draw_cards'
    });
  };

  const isExchangeValid = () => {
      if (selectedMarketCards.length === 0) return false;
      if (selectedHandCards.length === 0) return false;
      if (selectedMarketCards.length !== 1 && selectedHandCards.length !== 1) return false;

      const marketCardsCost = calculateCardsCost(selectedMarketCards);
      const handCardsCost = calculateCardsCost(selectedHandCards);

      return handCardsCost >= marketCardsCost;
    };

  // Handle exchanging ingredients with the market
  const handleExchange = () => {
      if (!isCurrentPlayerTurn) return;

      // When no market cards are selected but hand cards are selected
      if (selectedMarketCards.length === 0 && selectedHandCards.length > 0) {
        alert('Please select cards from the market to exchange for your selected cards');
        return;
      }

      // When market cards are selected but no hand cards
      if (selectedMarketCards.length > 0 && selectedHandCards.length === 0) {
        alert('Please select cards from your hand to exchange for the market cards');
        return;
      }

      // Calculate total costs
      const marketCardsCost = calculateCardsCost(selectedMarketCards);
      const handCardsCost = calculateCardsCost(selectedHandCards);

      // Check if the exchange is valid
      if (handCardsCost < marketCardsCost) {
        alert(`Your selected cards (${handCardsCost}) must be equal to or greater than the market cards' cost (${marketCardsCost})`);
        return;
      }

      // Perform the exchange
      makeMove({
        action: 'exchange_ingredients',
        market_cards: selectedMarketCards.map(card => card.uid),
        hand_cards: selectedHandCards.map(card => card.uid)
      });

      // Reset selections after exchange
      handleDeselectAll();
    };

  // Handle card selection from another player's borsht
  const handleSelectTargetCard = (playerId, cardUid) => {
    if ( targetCard && targetCard ===  cardUid) {
        setTargetPlayer(null);
        setTargetCard(null);
    } else {
        setTargetPlayer(playerId);
        setTargetCard(cardUid);
    }
  };

  const canAddCardToBorsht = (card) => {
      if (!card) return false;

      // Special cards cannot be added to borsht
      if (card.type === 'special') return false;

      // Check if the card is already in the borsht
      if (borshtCards && borshtCards.some(borshtCard => borshtCard.id === card.id)) {
        return false; // Card is already in the borsht, can't add duplicates
      }

      if (card.type === 'extra') {
        return true;
      }

      // If card is rare or regular, check if it's in the recipe ingredients
      if (card.type === 'rare' || card.type === 'regular') {
        // If no recipe or no ingredients, cannot add rare/regular cards
        if (!recipe || !recipe.ingredients || !recipe.ingredients.length) {
          return false;
        }


        // Check if card id is in recipe ingredients (case insensitive)
        return recipe.ingredients.some(ingredient =>
          ingredient.toLowerCase() === card.id.toLowerCase()
        );
      }

      // Default to false for any other card types
      return false;
    };

  // Render loading state
  if (loading && !pendingRequest) {
    return (
      <div className="borsht-loading">
        <div className="borsht-loading-spinner"></div>
        <p>Loading your borsht game...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="borsht-error">
        <div className="borsht-error-title">Error</div>
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
          className="borsht-button"
        >
          Retry
        </button>
      </div>
    );
  }

  // Handle pending requests (like recipe selection) even without a game state
    if (pendingRequest && pendingRequest.type === 'recipe_selection') {
      return (
        <div className="borsht-game-container">
          <RecipeSelection
            recipeOptions={recipeOptions}
            onSelectRecipe={handleRecipeSelection}
            timeRemaining={timeRemaining}
          />
        </div>
      );
    }

  // Render when no game state is available
  if (!gameState && !pendingRequest) {
    return (
      <div className="borsht-loading">
        <p>Waiting for game to start...</p>
        <p className="text-sm mt-2">Get ready to cook the best borsht!</p>
      </div>
    );
  }

  const isCurrentPlayerTurn = gameState.current_player === user.id;
  const handCards = gameState.your_hand || [];
  const borshtCards = gameState.your_borsht || [];
  const recipe = gameState.your_recipe || {};
  const market = gameState.market || [];
  const discardTop = gameState.discard_pile_top;
  const otherPlayers = gameState.players || {};

  return (
    <div className="borsht-game-container">
      {/* Game header */}
      <div className="borsht-header">
        <h2>{isCurrentPlayerTurn ? "Your turn" : `${gameState.players[gameState.current_player].username}'s turn`}</h2>
        <div className="borsht-status">
          <span>Cards in deck: {gameState.cards_in_deck || 0}</span>
          <span>Market: {market.length} / {gameState.market_limit || 8}</span>
          {gameState.game_ending && <span className="borsht-final-round">Final Round!</span>}
          {gameState.is_game_over && <span>Winner: {gameState.winner === user.id ? 'You!' : `Player ${gameState.winner}`}</span>}
        </div>
        <div className="borsht-actions">
          <button
            onClick={() => setShowRecipe(!showRecipe)}
            className="borsht-button"
            title="Show/hide recipe"
          >
            <Info size={20} />
          </button>
          <button className="borsht-button" title="Game settings">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Game layout */}
      <div className="borsht-game-layout">
        {/* Other players section */}
        <div className="borsht-players-section">
          {Object.entries(otherPlayers).map(([playerId, playerData]) => (
            <div
              key={playerId}
              className={`borsht-player-card ${gameState.current_player === parseInt(playerId) ? 'current' : ''}`}
            >
              <div className="borsht-player-header">
                <div className="borsht-player-name">
                  <CircleUser className="borsht-player-icon" />
                  <span>Player {playerId}</span>
                </div>
                <div className="borsht-player-stats">
                  <span>Cards: {playerData.hand_size || 0}</span>
                </div>
              </div>
              <div className="borsht-borsht-container">
                {playerData.borsht && playerData.borsht.map((card) => (
                  <div
                    key={card.uid}
                    className={`borsht-card ${targetCard === card.uid ? 'target-selected' : ''}`}
                    style={{backgroundImage: `url('/games/borscht/cards/${card.id}.png')`}}
                    onClick={() => handleSelectTargetCard(parseInt(playerId), card.uid)}
                    onMouseEnter={() => setIsZoomed(card.uid)}
                    onMouseLeave={() => setIsZoomed(null)}
                  >
                    {isZoomed === card.uid && (
                      <div className="borsht-card-tooltip">
                        <strong>{card.name || card.id}</strong>
                        {card.type === 'special' || card.effect_description && <p>{card.effect_description || card.effect}</p>}
                      </div>
                    )}
                  </div>
                ))}
                {(!playerData.borsht || playerData.borsht.length === 0) && (
                  <div className="borsht-empty-pot">
                    No ingredients yet
                  </div>
                )}
              </div>
              {gameState.recipes_revealed && playerData.recipe && (
                <div className="borsht-recipe-info">
                  Recipe: {playerData.recipe.name}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Market section */}
        <div className="borsht-market-section">
          <div className="borsht-market-header-vertical">
            <div className="borsht-market-title">Market</div>
            {gameState.market_limit < 8 && (
              <div className="borsht-market-limit">
                Limited: {market.length}/{gameState.market_limit}
              </div>
            )}
          </div>

          <div className="borsht-market-layout">
            <div className="borsht-market-cards">
              {market.map((card) => (
                <div
                  key={card.uid}
                  className={`borsht-card ${selectedMarketCards.some(c => c.uid === card.uid) ? 'selected' : ''}`}
                  onClick={() => isCurrentPlayerTurn && handleMarketCardSelect(card)}
                  style={{backgroundImage: `url('/games/borscht/cards/${card.id}.png')`}}
                  onMouseEnter={() => setIsZoomed(card.uid)}
                  onMouseLeave={() => setIsZoomed(null)}
                >
                  {isZoomed === card.uid && (
                    <div className="borsht-card-tooltip">
                      <strong>{card.name || card.id}</strong>
                      {card.type === 'special' || card.effect_description && <p>{card.effect_description || card.effect}</p>}
                    </div>
                  )}
                </div>
              ))}
              {market.length === 0 && (
                <div className="borsht-empty-market">Market is empty</div>
              )}
            </div>
            <div>
                <div className="borsht-decks-area">
                  <div className="borsht-deck-container">
                    <div
                      className="borsht-deck"
                      style={{backgroundImage: `url('/games/borscht/cards/cover.png')`}}
                      title="Ingredient Deck"
                    >
                      <div className="borsht-pile-count">
                        {gameState.cards_in_deck || 0}
                      </div>
                    </div>
                    <div className="borsht-deck-label">Draw Pile</div>
                  </div>

                  {discardTop && (
                    <div className="borsht-deck-container">
                      <div
                        className="borsht-discard"
                        style={{backgroundImage: `url('/games/borscht/cards/${discardTop.id}.png')`}}
                        title="Discard Pile"
                      >
                        <div className="borsht-pile-count">
                          {gameState.discard_pile_size || 0}
                        </div>
                      </div>
                      <div className="borsht-deck-label">Discard Pile</div>
                    </div>
                  )}
                </div>
                {isCurrentPlayerTurn && gameState?.free_refresh && (
                    <button
                        className="borsht-button borsht-refresh-button ${}"
                        onClick={handleFreeMarketRefresh}
                        disabled={!gameState?.free_refresh}
                        title={isCurrentPlayerTurn ? "Refresh the market for free" : "Only the current player can refresh the market"}
                      >
                        <RefreshCw size={16} />
                        <span>Free Market Refresh</span>
                    </button>
                )}
            </div>
          </div>
        </div>

        {/* Player's area with recipe, borsht, hand, and actions */}
        <div className="borsht-player-board-section">
          <div className="borsht-player-board">
            {/* Column 1: Recipe, pot and hand */}
            <div className="borsht-player-column">
              {/* Row 1: Recipe and Pot */}
              <div className="borsht-recipe-pot-row">
                {/* Recipe card area */}
                <div className="borsht-recipe-container">
                  { recipe && (
                    <div
                      className="borsht-recipe-card"
                      style={{
                        backgroundImage: `url('/games/borscht/recipes/${recipe.id || 'default'}.png')`
                      }}
                      onClick={() => setShowRecipePopup(true)}
                    >
                    </div>
                  )}
                </div>

                {/* Player's borsht */}
                <div className="borsht-pot-container">
                  <h3 className="borsht-section-title">Your Borsht</h3>
                  <div className="borsht-pot">
                    {borshtCards.map((card) => (
                      <div
                        key={card.uid}
                        className="borsht-card"
                        style={{backgroundImage: `url('/games/borscht/cards/${card.id}.png')`}}
                        onMouseEnter={() => setIsZoomed(card.uid)}
                        onMouseLeave={() => setIsZoomed(null)}
                      >
                        {isZoomed === card.uid && (
                          <div className="borsht-card-tooltip">
                            <strong>{card.name || card.id}</strong>
                            {card.type === 'special' || card.effect_description && <p>{card.effect_description || card.effect}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                    {borshtCards.length === 0 && (
                      <div className="borsht-empty-pot">
                        Add ingredients here
                      </div>
                    )}
                  </div>

                  {/* Active shkvarkas if any */}
                  {gameState.active_shkvarkas && gameState.active_shkvarkas.length > 0 && (
                    <div className="borsht-active-effects">
                      <h4>Active Effects</h4>
                      <div className="borsht-effect-badges">
                        {gameState.active_shkvarkas.map((shkvarka, idx) => (
                          <div
                            key={idx}
                            className="borsht-effect-badge negative"
                          >
                            {shkvarka.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Hand */}
              <div className="borsht-hand-container">
                <div className="borsht-hand-header">
                  <div className="borsht-hand-title">Your Hand ({handCards.length}/8)</div>
                  {handCards.length > 8 && <div className="borsht-hand-warning">Too many cards!</div>}
                </div>
                <div
                  ref={handContainerRef}
                  className="borsht-hand-cards"
                >
                  {handCards.length === 0 ? (
                    <div className="borsht-empty-hand">Draw cards to start playing</div>
                  ) : (
                    handCards.map((card) => {
                      // Determine if this card is selected in either mode
                      const isSelected = selectedHandCards.some(c => c.uid === card.uid);

                      return (
                        <div
                          key={card.uid}
                          className={`borsht-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleCardSelect(card)}
                          style={{backgroundImage: `url('/games/borscht/cards/${card.id}.png')`}}
                          onMouseEnter={() => setIsZoomed(card.uid)}
                          onMouseLeave={() => setIsZoomed(null)}
                        >
                          {isZoomed === card.uid && (
                            <div className="borsht-card-tooltip">
                              <strong>{card.name || card.id}</strong>
                              {(card.effect_description || card.effect) && <p>{card.effect_description || card.effect}</p>}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Actions */}
            <div className="borsht-actions-container">
              <div className="borsht-actions-panel">
                <div className="borsht-actions-title">Actions</div>
                <div className="borsht-action-buttons">
                  <button
                    className="borsht-action-button"
                    onClick={handleAddIngredient}
                    disabled={!isCurrentPlayerTurn || !selectedCard || selectedCard.type === 'special' || selectedMarketCards.length > 0 || selectedHandCards.length !== 1 || !canAddCardToBorsht(selectedCard)}
                    data-tooltip={
                      !isCurrentPlayerTurn
                        ? "Not your turn"
                        : selectedMarketCards.length > 0
                          ? "Can't add ingredients while exchanging with market"
                        : selectedHandCards.length !== 1
                          ? "Select exactly one card"
                        : !selectedCard
                          ? "Select a card first"
                        : selectedCard.type === 'special'
                          ? "Can't add special cards to borsht"
                        : borshtCards.some(borshtCard => borshtCard.id === selectedCard.id)
                          ? "This ingredient is already in your borsht"
                        : (selectedCard.type === 'rare' || selectedCard.type === 'regular') &&
                          !recipe.ingredients?.some(i => i.toLowerCase() === selectedCard.id.toLowerCase())
                          ? "This ingredient is not in your recipe"
                          : "Add selected ingredient to your borsht"
                    }
                  >
                    Add Ingredient
                  </button>
                  <button
                    className="borsht-action-button"
                    onClick={handleDrawCards}
                    disabled={!isCurrentPlayerTurn || selectedMarketCards.length > 0}
                    data-tooltip={
                      !isCurrentPlayerTurn
                        ? "Not your turn"
                        : selectedMarketCards.length > 0
                          ? "Can't draw cards while exchanging with market"
                          : "Draw 2 cards from the deck"
                    }
                  >
                    Draw 2 Cards
                  </button>
                  <button
                    className="borsht-action-button"
                    onClick={handlePlaySpecial}
                    disabled={
                      !isCurrentPlayerTurn ||
                      !selectedCard ||
                      selectedCard.type !== 'special' ||
                      selectedMarketCards.length > 0 ||
                      selectedHandCards.length !== 1 ||
                      (selectedCard && selectedCard.id === 'cinnamon' && (!gameState.discard_pile_size || gameState.discard_pile_size === 0)) ||
                      (selectedCard && selectedCard.id === 'chili_pepper' && (!targetPlayer || !targetCard)) ||
                      (gameState?.first_finisher && targetPlayer === gameState?.first_finisher)
                    }
                    data-tooltip={
                      !isCurrentPlayerTurn
                        ? "Not your turn"
                        : selectedMarketCards.length > 0
                          ? "Can't play special cards while exchanging with market"
                        : selectedHandCards.length !== 1
                          ? "Select exactly one special card"
                        : !selectedCard
                          ? "Select a special card first"
                        : selectedCard.type !== 'special'
                          ? "Selected card is not a special card"
                        : gameState?.first_finisher && targetPlayer === gameState?.first_finisher
                          ? "Cannot use special cards against first finisher"
                        : (selectedCard.id === 'cinnamon' && (!gameState.discard_pile_size || gameState.discard_pile_size === 0))
                          ? "Cannot play Cinnamon when the discard pile is empty"
                        : (selectedCard.id === 'chili_pepper' && (!targetPlayer || !targetCard))
                          ? "Select a card from an opponent's borsht first"
                          : "Play the selected special card"
                    }
                  >
                    Play Special
                  </button>
                  <button
                    className="borsht-action-button"
                    onClick={handleExchange}
                    disabled={
                      !isCurrentPlayerTurn ||
                      (selectedMarketCards.length === 0 || selectedHandCards.length === 0) ||
                      (selectedMarketCards.length > 0 && !isExchangeValid())
                    }
                    data-tooltip={
                      !isCurrentPlayerTurn
                        ? "Not your turn"
                        : selectedMarketCards.length === 0 || selectedHandCards.length === 0
                          ? "Select cards to exchange"
                        : selectedMarketCards.length > 0 && selectedHandCards.length === 0
                          ? "Select cards from your hand to exchange"
                        : selectedMarketCards.length > 1 && selectedHandCards.length > 1
                          ? "Valid exchanges only many-to-1 or 1-to-many"
                        : selectedMarketCards.length > 0 && !isExchangeValid()
                          ? "Your selected cards must be equal to or greater than the market cards' cost"
                          : "Exchange selected cards"
                    }
                  >
                    Exchange
                  </button>
                  {(selectedMarketCards.length > 0 || selectedHandCards.length > 0 || selectedCard) && (
                  <button
                    className="borsht-button borsht-action-button"
                    onClick={handleDeselectAll}
                    title="Deselect all cards"
                  >
                    <span>Deselect All</span>
                  </button>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game messages */}
      {isCurrentPlayerTurn && (
        <div className="borsht-game-message">
          Your turn! Select a card and choose an action.
        </div>
      )}

      {/* Recipe Popup */}
        {showRecipePopup && recipe && (
          <div className="borsht-recipe-popup-overlay" onClick={() => setShowRecipePopup(false)}>
            <div className="borsht-recipe-popup" onClick={(e) => e.stopPropagation()}>
              <button
                className="borsht-recipe-popup-close"
                onClick={() => setShowRecipePopup(false)}
              >
                ×
              </button>
              <div
                className="borsht-recipe-popup-image"
                style={{
                  backgroundImage: `url('/games/borscht/recipes/${recipe.id || 'default'}_full.png')`
                }}
              >
              </div>
            </div>
          </div>
        )}

      {/* Decision popups */}
        {pendingRequest?.type === 'recipe_selection' && (
          <RecipeSelection
            recipeOptions={recipeOptions}
            onSelectRecipe={handleRecipeSelection}
            timeRemaining={timeRemaining}
          />
        )}

        {defenseData && (
          <SourCreamDefense
            attacker={defenseData.attacker}
            attackCard={defenseData.attackCard}
            targetCards={defenseData.targetCards}
            expiresAt={defenseData.expires_at}
            onDefend={handleDefend}
            onDecline={handleDeclineDefense}
          />
        )}

        {pendingRequest?.type === 'black_pepper_decision' && (
          <PlayerDecision
            title="Black Pepper Effect"
            message="Choose which effect to apply:"
            options={[
              {
                id: 'discard_from_borsht',
                label: "Discard 1 ingredient from each opponent's borsht",
                description: "Forces each opponent to discard one ingredient card from their borsht."
              },
              {
                id: 'take_from_hand',
                label: "Take 1 card from each opponent's hand",
                description: "You get to take one random card from each opponent's hand."
              }
            ]}
            onSelect={handleBlackPepperEffect}
            onCancel={() => setPendingRequest(null)}
            showCancel={true}
            cancelLabel="Cancel"
          />
        )}

      {cinnamonData && (
        <CinnamonSelection
          discard_pile={cinnamonData.discard_pile}
          selectCount={cinnamonData.select_count}
          expiresAt={cinnamonData.expires_at}
          onSubmit={handleCinnamonSelection}
          onCancel={() => {
            // Send an empty selection to the server to trigger random selection
            api.getWs().send(JSON.stringify({
              type: 'request_response',
              request_id: cinnamonData.request_id,
              selected_cards: [],
              random_selection: true,
            }));
            setCinnamonData(null);
          }}
        />
      )}

      {discardData && (
          <DiscardSelection
            hand={discardData.hand}
            discardCount={discardData.discard_count}
            expiresAt={discardData.expires_at}
            recipe={discardData.recipe}
            onSubmit={handleDiscardSelection}
            onCancel={() => {
              // Send an empty selection to the server to trigger random selection
              api.getWs().send(JSON.stringify({
                type: 'request_response',
                request_id: discardData.request_id,
                selected_cards: [],
                random_discard: true,
              }));
              setDiscardData(null);
            }}
          />
        )}

      {marketDiscardData && (
          <MarketDiscardSelection
            market={marketDiscardData.market}
            discardCount={marketDiscardData.discard_count}
            expiresAt={marketDiscardData.expires_at}
            onSubmit={handleMarketDiscardSelection}
            onCancel={() => {
              // Send an empty selection to the server to trigger random selection
              api.getWs().send(JSON.stringify({
                type: 'request_response',
                request_id: marketDiscardData.request_id,
                selected_cards: [],
                random_discard: true,
              }));
              setMarketDiscardData(null);
            }}
          />
        )}

      {oliveOilData && (
          <OliveOilSelection
            cards={oliveOilData.cards}
            selectCount={oliveOilData.select_count}
            expiresAt={oliveOilData.expires_at}
            onSubmit={handleOliveOilSelection}
            onCancel={() => {
              // Send an empty selection to the server to trigger random selection
              api.getWs().send(JSON.stringify({
                type: 'request_response',
                request_id: oliveOilData.request_id,
                selected_cards: [],
                random_selection: true,
              }));
              setOliveOilData(null);
            }}
          />
        )}

      {gingerData && (
          <GingerSelection
            market={gingerData.market}
            selectCount={gingerData.select_count}
            expiresAt={gingerData.expires_at}
            onSubmit={handleGingerSelection}
            onCancel={() => {
              // Send an empty selection to the server to trigger random selection
              api.getWs().send(JSON.stringify({
                type: 'request_response',
                request_id: gingerData.request_id,
                selected_cards: [],
                random_selection: true,
              }));
              setGingerData(null);
            }}
          />
        )}

      {redPepperData && (
          <RedPepperDecision
            targetPlayer={redPepperData.targetPlayer}
            targetCard={redPepperData.targetCard}
            playerRecipe={redPepperData.playerRecipe}
            playerBorsht={redPepperData.playerBorsht}
            onSelect={handleRedPepperDecision}
            onCancel={() => {
              setRedPepperData(null);
              setTargetPlayer(null);
              setTargetCard(null);
            }}
          />
        )}

      {/* Game over popup */}
      {gameState.is_game_over && (
        <div className="borsht-game-over">
          <div className="borsht-game-over-modal">
            <div className="borsht-winner">
              {gameState.winner === user.id ? 'You win!' : `Player ${gameState.winner} wins!`}
            </div>
            <div className="borsht-scores">
              {gameState.scores && Object.entries(gameState.scores).sort((a, b) => b[1] - a[1]).map(([playerId, score]) => (
                <div key={playerId} className={`borsht-score-item ${gameState.winner === parseInt(playerId) ? 'winner' : ''}`}>
                  <div className="borsht-score-player">
                    {parseInt(playerId) === user.id ? 'You' : `Player ${playerId}`}
                  </div>
                  <div className="borsht-score-value">{score} points</div>
                </div>
              ))}
            </div>
            <button
              className="borsht-button"
              onClick={() => window.location.reload()}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* First finisher notification */}
      {gameState.first_finisher && !gameState.is_game_over && (
        <div className={`borsht-finisher-notification ${gameState.first_finisher === user.id ? 'you' : ''}`}>
          {gameState.first_finisher === user.id ? 'You completed your recipe first!' : `Player ${gameState.first_finisher} completed their recipe!`}
          <div className="borsht-finisher-subtitle">Final round in progress</div>
        </div>
      )}
    </div>
  );
};

export default Game;