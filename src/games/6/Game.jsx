import React, { useState, useEffect, useRef } from 'react';
import { CircleUser, Settings, Info, Heart, Search, RefreshCw } from 'lucide-react';

import ShkvarkaPopup from './ShkvarkaPopup';
import DecisionPopup from './DecisionPopup';
import PlayerDecision from './PlayerDecision';
import GingerSelection from './GingerSelection';
import RecipeSelection from './RecipeSelection';
import SourCreamDefense from './SourCreamDefense';
import DiscardSelection from './DiscardSelection';
import OliveOilSelection from './OliveOilSelection';
import CinnamonSelection from './CinnamonSelection';
import RedPepperDecision from './RedPepperDecision';
import BlackPepperDecision from './BlackPepperDecision';
import MarketDiscardSelection from './MarketDiscardSelection';
import ShkvarkaSelectionPopup from './ShkvarkaSelectionPopup';

import GameStats from './GameStats';
import './GameStats.css';

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
  const [viewingOpponentRecipe, setViewingOpponentRecipe] = useState(null);

  //  decision
  const [shkvarkaData, setShkvarkaData] = useState(null);
  const [shkvarkaSelectionData, setShkvarkaSelectionData] = useState(null);

  const [pendingRequest, setPendingRequest] = useState(null);
  const [recipeOptions, setRecipeOptions] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [discardData, setDiscardData] = useState(null);
  const [marketDiscardData, setMarketDiscardData] = useState(null);
  const [oliveOilData, setOliveOilData] = useState(null);
  const [cinnamonData, setCinnamonData] = useState(null);
  const [gingerData, setGingerData] = useState(null);
  const [redPepperData, setRedPepperData] = useState(null);
  const [blackPepperData, setBlackPepperData] = useState(null);
  const [defenseData, setDefenseData] = useState(null);
  const [showActionPanel, setShowActionPanel] = useState(true);

  const [gameStats, setGameStats] = useState(null);
  const [showGameStats, setShowGameStats] = useState(false);

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
            hand: data.cards,
            discard_count: data.select_count,
            request_id: data.request_id,
            expires_at: data.expires_at,
            recipe: data.your_recipe,
          });

        } else if (data.type === 'discard_selection' && data.reason === 'market_limit') {
          // Store the market discard request data
          setMarketDiscardData({
            market: data.cards,
            discard_count: data.select_count,
            request_id: data.request_id,
            expires_at: data.expires_at,
          });

        } else if (data.type === 'defense_request') {
          // Store the defense request data
          setDefenseData({
            attacker: data.attacker,
            attackCard: data.card,
            targetCards: data.target_cards,
            defendCards: data.defense_cards,
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
            discard_pile: data.cards,
            select_count: data.select_count,
            request_id: data.request_id,
            expires_at: data.expires_at,
          });

        } else if (data.type === 'ginger_selection') {
          // Store the ginger selection data
          setGingerData({
            market: data.cards,
            select_count: data.select_count,
            request_id: data.request_id,
            expires_at: data.expires_at,
          });

        } else if (data.type === 'shkvarka_drawn') {
          // Store the shkvarka notification data
          setShkvarkaData({
            card: data.card,
            player: data.player,
            showPopup: data.show_popup,
          });

        } else if (data.type === 'shkvarka_effect_selection') {
          // Store the shkvarka selection request data
          setShkvarkaSelectionData({
            cards: data.cards,
            select_count: data.select_count,
            reason: data.reason,
            request_id: data.request_id,
            expires_at: data.expires_at,
            selector_id: data.selector_id,
            owner_player: data.owner_player,
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
        const newSelectedMarketCards = selectedMarketCards.filter(c => c.uid !== card.uid);
        if (newSelectedMarketCards.length === 0 && selectedHandCards.length === 1) {
          setSelectedCard(selectedHandCards[0]);
          if (selectedHandCards[0].type === 'special') {
            setSelectedAction('play_special');
          } else {
            setSelectedAction('add_ingredient');
          }
        }
        setSelectedMarketCards(newSelectedMarketCards);
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

  const toggleActionPanel = () => {
      setShowActionPanel(!showActionPanel);
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

  const handleRedPepperDecision = (action, selectedOpponentId, selectedCards) => {
      if (!redPepperData) return;

      const moveData = {
        action: 'play_special',
        card_id: selectedCard.uid,
        target_player: selectedOpponentId,
        target_cards: selectedCards,
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

  const handleCloseShkvarkaPopup = () => {
      setShkvarkaData(null);
    };

  const handleShkvarkaSelection = (selectedCardIds) => {
      if (!shkvarkaSelectionData || !shkvarkaSelectionData.request_id) return;

      // Send the selection to the server
      api.getWs().send(JSON.stringify({
        type: 'request_response',
        request_id: shkvarkaSelectionData.request_id,
        selected_cards: selectedCardIds,
      }));

      // Clear the shkvarka selection data
      setShkvarkaSelectionData(null);
    };

  const handleCancelShkvarkaSelection = () => {
      if (!shkvarkaSelectionData || !shkvarkaSelectionData.request_id) return;

      // Send empty selection with random_select flag
      api.getWs().send(JSON.stringify({
        type: 'request_response',
        request_id: shkvarkaSelectionData.request_id,
        selected_cards: [],
        random_select: true,
      }));

      // Clear the shkvarka selection data
      setShkvarkaSelectionData(null);
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

    // Handle Black Pepper special card effect choices
    const handleBlackPepperEffect = (effectChoice, selectedTargets) => {
      if (!selectedCard || selectedCard.id !== 'black_pepper') return;

      if (effectChoice === 'discard' && selectedTargets) {
        // For discard effect, we need the selected cards from each opponent's borsht
        makeMove({
          action: 'play_special',
          card_id: selectedCard.uid,
          action_type: effectChoice,
          target_cards: selectedTargets
        });
      } else {
        // For take effect or when no targets selected
        makeMove({
          action: 'play_special',
          card_id: selectedCard.uid,
          action_type: effectChoice
        });
      }

      setPendingRequest(null);
      setBlackPepperData(null);
    };

  // Handle playing a special card
  const handlePlaySpecial = () => {
    if (!isCurrentPlayerTurn || !selectedCard || !selectedCard.effect) {
      alert('Please select a special card first');
      return;
    }

    // For Black Pepper, show decision popup
    if (selectedCard.id === 'black_pepper') {
      setBlackPepperData({
        players: gameState.players,
        currentPlayerId: user.id,
        firstFinisher: gameState.first_finisher || null
      });
      return;
    }
      // For Red Pepper, check if a target card is selected
      if (selectedCard.id === 'chili_pepper') {
        // Set the red pepper data for the popup
        setRedPepperData({
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

    const handleSkipTurn = () => {
    if (!isCurrentPlayerTurn) return;

    makeMove({
      action: 'skip'
    });
  };

  const isExchangeValid = () => {
      if (selectedMarketCards.length === 0) return false;
      if (selectedHandCards.length === 0) return false;
      if (selectedMarketCards.length !== 1 && selectedHandCards.length !== 1) return false;

      const marketCardsCost = calculateCardsCost(selectedMarketCards);
      const handCardsCost = calculateCardsCost(selectedHandCards);
      const exchangeFee = gameState.market_exchange_fee || 0

      return handCardsCost >= marketCardsCost + exchangeFee;
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

  const calculateTotalPoints = (borsht) => {
  // Use reduce to sum up all the points from the cards
  const totalPoints = borsht.reduce((sum, card) => {
    // Add the card's points to the sum if it exists
    return sum + (card.points || 0);
  }, 0);

  return totalPoints;
}

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
  const handCardsLimit = gameState.hand_cards_limit;
  const borshtCards = gameState.your_borsht || [];
  const recipe = gameState.your_recipe || {};
  const market = gameState.market || [];
  const marketLimit = gameState.market_limit || 8;
  const marketBaseLimit = gameState.market_base_limit || 8;
  const discardTop = gameState.discard_pile_top;
  const otherPlayers = gameState.players || {};

  return (
    <div className="borsht-game-container">
      {/* Game header */}
      <div className="borsht-header">
        <h2>{isCurrentPlayerTurn ? "Your turn" : `${gameState.players[gameState.current_player].username}'s turn`}</h2>
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
                  <span>{playerData.username}</span>
                </div>
                <div className="borsht-player-stats">
                  <span>Cards: {playerData.hand_size || 0}</span>
                  <span> Points: {calculateTotalPoints(playerData?.borsht)} </span>
                  {gameState.recipes_revealed && playerData.recipe && (
                    <button
                      className="borsht-button borsht-recipe-button"
                      onClick={() => {
                        setViewingOpponentRecipe(playerData.recipe);
                        setShowRecipePopup(true);
                      }}
                      title="View this player's recipe"
                    >
                      Show recipe
                    </button>
                  )}
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
            </div>
          ))}
        </div>

        {/* Market section */}
        <div className="borsht-market-section">
          <div className="borsht-market-header-vertical">
            <div className="borsht-market-title">Market</div>
            {marketLimit < marketBaseLimit && (
              <div className="borsht-market-limit">
                Limited
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
                      {card.effect_description && <p>{card.effect_description || card.effect}</p>}
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
                  <h3 className="borsht-section-title">Your Borsht (Points: {calculateTotalPoints(borshtCards)})</h3>
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
                  <div className="borsht-hand-title">Your Hand {handCardsLimit && `(${handCards.length}/${handCardsLimit})`}</div>
                  {handCardsLimit && handCards.length > handCardsLimit && <div className="borsht-hand-warning">Too many cards!</div>}
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
              {showActionPanel ? (
                <div className="borsht-actions-panel">
                  <div className="borsht-actions-title">Actions</div>
                  <div className="borsht-action-buttons">
                    <button
                      className="borsht-action-button"
                      onClick={handleAddIngredient}
                      disabled={
                        !isCurrentPlayerTurn ||
                        gameState?.turn_state !== "normal_turn" ||
                        !selectedCard ||
                        (selectedCard.type === 'extra' && gameState.extra_cards_not_allowed) ||
                        selectedCard.type === 'special' ||
                        selectedMarketCards.length > 0 ||
                        selectedHandCards.length !== 1 ||
                        !canAddCardToBorsht(selectedCard)
                      }
                      data-tooltip={
                        !isCurrentPlayerTurn
                          ? "Not your turn"
                          : gameState?.turn_state !== "normal_turn"
                            ? "Can't make move right now"
                          : selectedMarketCards.length > 0
                            ? "Can't add ingredients while exchanging with market"
                          : selectedHandCards.length !== 1
                            ? "Select exactly one card"
                          : !selectedCard
                            ? "Select a card first"
                          : (selectedCard.type === 'extra' && gameState.extra_cards_not_allowed)
                            ? "Extra cards not allowed"
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
                      disabled={
                        !isCurrentPlayerTurn ||
                        gameState?.turn_state !== "normal_turn"
                      }
                      data-tooltip={
                        !isCurrentPlayerTurn
                          ? "Not your turn"
                          : gameState?.turn_state !== "normal_turn"
                            ? "Can't make move right now"
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
                        gameState?.turn_state !== "normal_turn" ||
                        !selectedCard ||
                        selectedCard.type !== 'special' ||
                        selectedCard.id === 'sour_cream' ||
                        selectedMarketCards.length > 0 ||
                        selectedHandCards.length !== 1 ||
                        (selectedCard && selectedCard.id === 'cinnamon' && (!gameState.discard_pile_size || gameState.discard_pile_size === 0)) ||
                        (gameState?.first_finisher && targetPlayer === gameState?.first_finisher?.user_id)
                      }
                      data-tooltip={
                        !isCurrentPlayerTurn
                          ? "Not your turn"
                          : gameState?.turn_state !== "normal_turn"
                            ? "Can't make move right now"
                          : selectedMarketCards.length > 0
                            ? "Can't play special cards while exchanging with market"
                          : selectedHandCards.length !== 1
                            ? "Select exactly one special card"
                          : !selectedCard
                            ? "Select a special card first"
                          : selectedCard.type !== 'special'
                            ? "Selected card is not a special card"
                          : selectedCard.id === 'sour_cream'
                            ? "Can't play this card"
                          : gameState?.first_finisher && targetPlayer === gameState?.first_finisher?.user_id
                            ? "Cannot use special cards against first finisher"
                          : (selectedCard.id === 'cinnamon' && (!gameState.discard_pile_size || gameState.discard_pile_size === 0))
                            ? "Cannot play Cinnamon when the discard pile is empty"
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
                        (gameState?.turn_state !== "normal_turn" && gameState?.turn_state !== "waiting_for_exchange") ||
                        (selectedMarketCards.length === 0 || selectedHandCards.length === 0) ||
                        (selectedMarketCards.length > 0 && !isExchangeValid())
                      }
                      data-tooltip={
                        !isCurrentPlayerTurn
                          ? "Not your turn"
                          : (gameState?.turn_state !== "normal_turn" && gameState?.turn_state !== "waiting_for_exchange")
                            ? "Can't make move right now"
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
                    {(gameState?.turn_state === "waiting_for_exchange") && (
                      <button
                        className="borsht-action-button"
                        onClick={handleSkipTurn}
                        data-tooltip="Skip ingredients exchange"
                      >
                        Skip exchange
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Show Popup button when panel is hidden */
                <button
                  className="borsht-button borsht-action-button borsht-show-popup-button"
                  onClick={toggleActionPanel}
                  title="Show action panel"
                >
                  <span>Show Popup</span>
                </button>
              )}
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
        {showRecipePopup && (viewingOpponentRecipe || recipe) && (
          <div className="borsht-recipe-popup-overlay" onClick={() => {
            setShowRecipePopup(false);
            setViewingOpponentRecipe(null);
          }}>
            <div className="borsht-recipe-popup" onClick={(e) => e.stopPropagation()}>
              <button
                className="borsht-recipe-popup-close"
                onClick={() => {
                  setShowRecipePopup(false);
                  setViewingOpponentRecipe(null);
                }}
              >
                ×
              </button>
              <div
                className="borsht-recipe-popup-image"
                style={{
                  backgroundImage: `url('/games/borscht/recipes/${(viewingOpponentRecipe || recipe).id || 'default'}_full.png')`
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

        {showActionPanel && defenseData && (
          <SourCreamDefense
            attacker={defenseData.attacker}
            attackCard={defenseData.attackCard}
            targetCards={defenseData.targetCards}
            defendCards={defenseData.defendCards}
            expiresAt={defenseData.expires_at}
            onDefend={handleDefend}
            onDecline={handleDeclineDefense}
            hidePopup={toggleActionPanel}
          />
        )}

      {showActionPanel && cinnamonData && (
        <CinnamonSelection
          discard_pile={cinnamonData.discard_pile}
          selectCount={cinnamonData.select_count}
          expiresAt={cinnamonData.expires_at}
          onSubmit={handleCinnamonSelection}
          hidePopup={toggleActionPanel}
          onCancel={() => {
            // Send an empty selection to the server to trigger random selection
            api.getWs().send(JSON.stringify({
              type: 'request_response',
              request_id: cinnamonData.request_id,
              selected_cards: [],
              random_select: true,
            }));
            setCinnamonData(null);
          }}
        />
      )}

      {showActionPanel && discardData && (
          <DiscardSelection
            hand={discardData.hand}
            discardCount={discardData.discard_count}
            expiresAt={discardData.expires_at}
            recipe={discardData.recipe}
            onSubmit={handleDiscardSelection}
            hidePopup={toggleActionPanel}
            onCancel={() => {
              // Send an empty selection to the server to trigger random selection
              api.getWs().send(JSON.stringify({
                type: 'request_response',
                request_id: discardData.request_id,
                selected_cards: [],
                random_select: true,
              }));
              setDiscardData(null);
            }}
          />
        )}

      {showActionPanel && marketDiscardData && (
          <MarketDiscardSelection
            market={marketDiscardData.market}
            discardCount={marketDiscardData.discard_count}
            expiresAt={marketDiscardData.expires_at}
            onSubmit={handleMarketDiscardSelection}
            hidePopup={toggleActionPanel}
            onCancel={() => {
              // Send an empty selection to the server to trigger random selection
              api.getWs().send(JSON.stringify({
                type: 'request_response',
                request_id: marketDiscardData.request_id,
                selected_cards: [],
                random_select: true,
              }));
              setMarketDiscardData(null);
            }}
          />
        )}

      {showActionPanel && oliveOilData && (
          <OliveOilSelection
            cards={oliveOilData.cards}
            selectCount={oliveOilData.select_count}
            expiresAt={oliveOilData.expires_at}
            onSubmit={handleOliveOilSelection}
            hidePopup={toggleActionPanel}
            onCancel={() => {
              // Send an empty selection to the server to trigger random selection
              api.getWs().send(JSON.stringify({
                type: 'request_response',
                request_id: oliveOilData.request_id,
                selected_cards: [],
                random_select: true,
              }));
              setOliveOilData(null);
            }}
          />
        )}

      {showActionPanel && gingerData && (
          <GingerSelection
            market={gingerData.market}
            selectCount={gingerData.select_count}
            expiresAt={gingerData.expires_at}
            onSubmit={handleGingerSelection}
            hidePopup={toggleActionPanel}
            onCancel={() => {
              // Send an empty selection to the server to trigger random selection
              api.getWs().send(JSON.stringify({
                type: 'request_response',
                request_id: gingerData.request_id,
                selected_cards: [],
                random_select: true,
              }));
              setGingerData(null);
            }}
          />
        )}

      {showActionPanel && redPepperData && (
          <RedPepperDecision
            players={gameState.players}
            playerRecipe={redPepperData.playerRecipe}
            playerBorsht={redPepperData.playerBorsht}
            hidePopup={toggleActionPanel}
            currentPlayer={gameState.current_player}
            firstFinisher={gameState.first_finisher}
            discardCount={gameState.chili_pepper_discard_count}
            onSelect={handleRedPepperDecision}
            onCancel={() => {
              setRedPepperData(null);
              setTargetPlayer(null);
              setTargetCard(null);
            }}
          />
        )}

      {showActionPanel && blackPepperData && (
          <BlackPepperDecision
            players={blackPepperData.players}
            currentPlayerId={blackPepperData.currentPlayerId}
            firstFinisher={blackPepperData.firstFinisher}
            onSelect={handleBlackPepperEffect}
            onCancel={() => {
              setBlackPepperData(null);
            }}
            hidePopup={toggleActionPanel}
          />
        )}

      {showActionPanel && shkvarkaSelectionData && (
          <ShkvarkaSelectionPopup
            playerId={user.id}
            ownerPlayer={shkvarkaSelectionData.owner_player}
            cards={shkvarkaSelectionData.cards}
            selectCount={shkvarkaSelectionData.select_count}
            reason={shkvarkaSelectionData.reason}
            expiresAt={shkvarkaSelectionData.expires_at}
            requestId={shkvarkaSelectionData.request_id}
            onSubmit={handleShkvarkaSelection}
            onCancel={handleCancelShkvarkaSelection}
            hidePopup={toggleActionPanel}
          />
        )}

            {/* Shkvarka handling */}
      {shkvarkaData && shkvarkaData.showPopup && (
          <ShkvarkaPopup
            card={shkvarkaData.card}
            player={shkvarkaData.player}
            onClose={handleCloseShkvarkaPopup}
          />
        )}

      {/* First finisher notification */}
      {gameState.first_finisher && !gameState.is_game_over && (
        <div className={`borsht-finisher-notification ${gameState.first_finisher.user_id === user.id ? 'you' : ''}`}>
          {gameState.first_finisher.user_id === user.id ? 'You completed your recipe first!' : `${gameState.first_finisher.user_data.username} completed their recipe!`}
          <div className="borsht-finisher-subtitle">Final round in progress</div>
        </div>
      )}

      {/* Paprika exchange notification */}
      {gameState.turn_state === "waiting_for_exchange" && (
        <div className={`borsht-game-message`}>
          Make an exchange with market or skip
        </div>
      )}

      {/* Defense waiting notification */}
      {gameState.turn_state === "waiting_for_defense" && (
        <div className={`borsht-game-message`}>
          Waiting for target player(s) defense decision
        </div>
      )}

      {/* Game over popup */}
      {showActionPanel && showGameStats && gameStats && (
          <GameStats
            gameStats={gameStats}
            onHide={toggleActionPanel}
            onLeaveGame={() => window.location.href = '/games/6'}
          />
        )}
    </div>
  );
};

export default Game;