import React, { useState, useEffect } from 'react';

const RedPepperDecision = ({
  players,
  playerRecipe,
  playerBorsht,
  currentPlayer,
  firstFinisher,
  discardCount,
  onSelect,
  onCancel,
  hidePopup,
}) => {
  // Create a filtered list of opponent player IDs
  const opponentIds = Object.keys(players || {}).filter(playerId => {
    return parseInt(playerId) !== currentPlayer && parseInt(playerId) !== firstFinisher;
  });

  // State for selected opponent, cards and current step of selection
  const [selectedOpponentId, setSelectedOpponentId] = useState(opponentIds.length === 1 ? opponentIds[0] : null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [currentStep, setCurrentStep] = useState(opponentIds.length > 1 ? 'selectOpponent' : 'selectCards');

  // Get the number of cards to select
  const [cardsToSelect, setCardsToSelect] = useState(Math.min(discardCount, players[opponentIds[0]].borsht.length) || 1);

  // Get the current selected opponent's data
  const [selectedOpponent, setSelectedOpponent] = useState(opponentIds[0]);
  const [selectedOpponentBorsht, setSelectedOpponentBorsht] = useState(players[opponentIds[0]].borsht);

  // Function to check if a card can be stolen
  const canSteal = (card) => {
    // If no recipe or no ingredients data, can't steal
    if (!playerRecipe || !playerRecipe.ingredients) return false;

    // If the card is already in player's borsht, can't steal
    if (playerBorsht && playerBorsht.some(playerCard => playerCard.id === card.id)) {
      return false;
    }

    // can steal extras
    if (card.type === "extra") { return true; }

    // Check if card is in recipe ingredients
    return playerRecipe.ingredients.some(ingredient =>
      ingredient.toLowerCase() === card.id.toLowerCase()
    );
  };

  // Function to handle opponent selection
  const handleOpponentSelect = (opponentId) => {
    if (!opponentId) { return; }
    setSelectedOpponentId(opponentId);
    setSelectedOpponent(players[opponentId]);
    setSelectedOpponentBorsht(players[opponentId].borsht);
    setCardsToSelect(Math.min(discardCount, players[opponentId].borsht.length) || 1);
    setCurrentStep('selectCards');
  };

  // Function to handle card selection/deselection
  const handleCardSelect = (card) => {
    // If card is already selected, remove it
    if (selectedCards.some(selectedCard => selectedCard.id === card.id)) {
      setSelectedCards(selectedCards.filter(selectedCard => selectedCard.id !== card.id));
    }
    // If we haven't reached the limit, add the card
    else if (selectedCards.length < cardsToSelect) {
      setSelectedCards([...selectedCards, card]);
    }
    // If we're at the limit and trying to select a new card, deselect the first card and add the new one
    else if (cardsToSelect > 0) {
      const newSelectedCards = [...selectedCards];
      newSelectedCards.shift(); // Remove the first card
      newSelectedCards.push(card); // Add the new card
      setSelectedCards(newSelectedCards);
    }
  };

  // Function to handle action selection
  const handleActionSelect = (action) => {
    onSelect(action, selectedOpponentId, selectedCards);
  };

  // Function to go back to previous step
  const handleBack = () => {
    if (currentStep === 'confirmation') {
      setCurrentStep('selectAction');
    } else if (currentStep === 'selectAction') {
      setCurrentStep('selectCards');
    } else if (currentStep === 'selectCards' && opponentIds.length > 1) {
      setCurrentStep('selectOpponent');
      setSelectedOpponentId(null);
      setSelectedCards([]);
    }
  };

  // Determine if we have selected enough cards to proceed
  const canProceedToAction = selectedCards.length === cardsToSelect;

  // Helper function to get opponent name
  const getOpponentName = (playerId) => {
    return players[playerId]?.username || `Player ${playerId}`;
  };

  // Render appropriate content based on current step
  const renderContent = () => {
    switch (currentStep) {
      case 'selectOpponent':
        return (
          <>
            <div className="borsht-decision-popup-header">
              <div className="borsht-decision-popup-title">Red Pepper Effect</div>
              <div className="borsht-decision-popup-message">
                Select an opponent to target
              </div>
              <div className="borsht-decision-subtitle">
                The Red Pepper lets you steal or discard cards from an opponent's borsht.
              </div>
            </div>

            <div className="borsht-opponents-list">
              {opponentIds.map(opponentId => (
                <button
                  key={opponentId}
                  className={`borsht-opponent-button ${selectedOpponentId === opponentId ? 'selected' : ''}`}
                  onClick={() => handleOpponentSelect(opponentId)}
                >
                  {getOpponentName(opponentId)}
                </button>
              ))}
            </div>
          </>
        );

      case 'selectCards':
        return (
          <>
            <div className="borsht-decision-popup-header">
              <div className="borsht-decision-popup-title">Red Pepper Effect</div>
              <div className="borsht-decision-popup-message">
                Select {cardsToSelect} card{cardsToSelect > 1 ? 's' : ''} from {getOpponentName(selectedOpponentId)}
              </div>
              <div className="borsht-discard-counter">
                {selectedCards.length}/{cardsToSelect} cards selected
              </div>
            </div>

            <div className="borsht-target-cards-container borsht-discard-selection-cards">
              {selectedOpponentBorsht.map(card => (
                <div
                  key={card.id}
                  className={`borsht-card ${selectedCards.some(selectedCard => selectedCard.id === card.id) ? 'selected' : ''}`}
                  style={{backgroundImage: `url('/games/borscht/cards/${card.id}.png')`}}
                  onClick={() => handleCardSelect(card)}
                >
                  <div className="borsht-selection-card-tooltip">
                    <strong>{card.name || card.id}</strong>
                    {card.effect_description ? (
                      <p>{card.effect_description}</p>
                    ) : card.effect ? (
                      <p>Effect: {card.effect}</p>
                    ) : null}
                  </div>
                </div>
              ))}

              {selectedOpponentBorsht.length === 0 && (
                <div className="borsht-empty-pot">
                  This player has no cards in their borsht.
                </div>
              )}
            </div>

            <div className="borsht-decision-controls borsht-decision-actions">
              {opponentIds.length > 1 && (
                <button className="borsht-decision-action" onClick={handleBack}>
                  Back
                </button>
              )}
              <button
                className={`borsht-decision-action ${!canProceedToAction ? 'disabled' : ''}`}
                onClick={() => canProceedToAction && setCurrentStep('selectAction')}
                disabled={!canProceedToAction}
                data-tooltip={`Select ${cardsToSelect} cards to continue`}
              >
                Next
              </button>
              <button className="borsht-decision-action cancel" onClick={onCancel}
                data-tooltip="Cancel and keep the Red Pepper card in your hand">
                Cancel
              </button>
            </div>
          </>
        );

      case 'selectAction':
        return (
          <>
            <div className="borsht-decision-popup-header">
              <div className="borsht-decision-popup-title">Red Pepper Effect</div>
              <div className="borsht-decision-popup-message">
                Choose action for the selected card{selectedCards.length > 1 ? 's' : ''} from {getOpponentName(selectedOpponentId)}
              </div>
            </div>

            <div className="borsht-target-cards-preview borsht-target-cards">
              {selectedCards.map(card => (
                <div
                  key={card.id}
                  className="borsht-card"
                  style={{backgroundImage: `url('/games/borscht/cards/${card.id}.png')`}}
                >
                  <div className="borsht-selection-card-tooltip">
                    <strong>{card.name || card.id}</strong>
                    {card.effect_description ? (
                      <p>{card.effect_description}</p>
                    ) : card.effect ? (
                      <p>Effect: {card.effect}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="borsht-decision-options">
              <button
                className={`borsht-decision-action ${selectedCards.some(card => !canSteal(card)) ? 'disabled' : ''}`}
                onClick={() => !selectedCards.some(card => !canSteal(card)) && handleActionSelect('steal')}
                disabled={selectedCards.some(card => !canSteal(card))}
                data-tooltip={selectedCards.some(card => !canSteal(card)) ?
                  "One or more selected cards cannot be stolen" :
                  `Steal ${selectedCards.length > 1 ? 'these cards' : 'this card'} and add to your borsht`
                }
              >
                Steal Card{selectedCards.length > 1 ? 's' : ''}
              </button>

              <button
                className="borsht-decision-action"
                onClick={() => handleActionSelect('discard')}
                data-tooltip={`Remove ${selectedCards.length > 1 ? 'these cards' : 'this card'} from the opponent's borsht`}
              >
                Discard Card{selectedCards.length > 1 ? 's' : ''}
              </button>

              <button className="borsht-decision-action" onClick={handleBack}>
                Back
              </button>

              <button className="borsht-decision-action cancel" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="borsht-decision-popup-overlay">
      <div className="borsht-decision-popup borsht-discard-popup">
        {renderContent()}

        <button
          className="borsht-button borsht-action-button close-button"
          onClick={hidePopup}
          data-tooltip="Hide this popup temporarily"
        >
          Hide Popup
        </button>
      </div>
    </div>
  );
};

export default RedPepperDecision;