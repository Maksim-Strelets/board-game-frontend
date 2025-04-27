import React, { useState, useEffect } from 'react';
import './ShkvarkaSelectionPopup.css';

// Mapping of reasons to their descriptions
// Use {playerName} as a placeholder that will be replaced with the owner's username
const reasonDescriptions = {
  'u_komori_myshi': 'Select cards from {playerName}\'s hand to discard.',
  'zazdrisni_susidy': 'Select rare ingredient to discard from {playerName}\'s borsht',
  'yarmarok': 'Select card from Your hand to pass it to {playerName}',
  'vtratyv_niuh': 'Select extra card from {playerName}\'s borsht to discard',
  'den_vrozhaiu': 'Select card from Your borsht to discard',
  'zagubyly_spysok': 'Select card from Your borsht to discard',
  'mityng_zahysnykiv': 'Select any meat card to discard from {playerName} borsht',
  'default': 'Select the required number of cards from {playerName}.',
  // ... etc.
};

const ShkvarkaSelectionPopup = ({
  cards,
  selectCount,
  reason,
  expiresAt,
  requestId,
  onSubmit,
  onCancel,
  hidePopup,
  playerId,
  ownerPlayer, // Add ownerPlayer prop to receive the cards owner data
}) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [timer, setTimer] = useState(30);

  // Initialize timer when component mounts
  useEffect(() => {
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeRemaining = expiresAt - now || 30;
      setTimer(timeRemaining > 0 ? timeRemaining : 30);
    }
  }, [expiresAt]);

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          // Auto-submit when timer reaches zero
          handleSubmit();
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedCards]);

  // Get the description based on the reason and replace playerName placeholder
  const getDescription = () => {
    const template = reasonDescriptions[reason] || reasonDescriptions['default'];
    const playerName = playerId === ownerPlayer?.user_id ? 'Your' : ownerPlayer?.user_data?.username || 'opponent';
    return template.replace('{playerName}', playerName);
  };

  // Handle card selection/deselection
  const toggleCardSelection = (card) => {
    if (selectedCards.includes(card.uid)) {
      setSelectedCards(prev => prev.filter(uid => uid !== card.uid));
    } else {
      // Only allow selecting up to selectCount cards
      if (selectedCards.length < selectCount) {
        setSelectedCards(prev => [...prev, card.uid]);
      }
    }
  };

  // Handle submission of selected cards
  const handleSubmit = () => {
    if (selectedCards.length === selectCount) {
      onSubmit(selectedCards);
    } else if (timer <= 0) {
      // If time ran out, submit whatever is selected
      onSubmit(selectedCards);
    }
  };

  // Handle random selection if user decides not to choose
  const handleRandomSelection = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="borsht-decision-popup-overlay">
      <div className="borsht-decision-popup shkvarka-selection-popup">
        <div className="borsht-decision-popup-header">
          <div className="borsht-decision-popup-title">Shkvarka Effect</div>
          <div className="borsht-decision-popup-message">
            {getDescription()}
          </div>
          <div className="borsht-decision-timer">
            Time remaining: {timer} seconds
          </div>
        </div>

        <div className="borsht-decision-popup-content">
          {/* Display the card that triggered this effect */}
          <div className="shkvarka-trigger-card-container">
            <div
              className="shkvarka-trigger-card"
              style={{backgroundImage: `url('/games/borscht/shkvarka/${reason}.png')`}}
            />
          </div>

          <div className="borsht-discard-selection-cards">
            {cards.map((card) => (
              <div
                key={card.uid}
                className={`borsht-card ${selectedCards.includes(card.uid) ? 'selected' : ''}`}
                style={{backgroundImage: `url('/games/borscht/cards/${card.id}.png')`}}
                onClick={() => toggleCardSelection(card)}
              >
                <div className="borsht-card-tooltip">
                  <strong>{card.name || card.id}</strong>
                  {card.type === 'special' && <p>{card.effect_description || card.effect}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="shkvarka-selection-counter">
            Selected: {selectedCards.length}/{selectCount}
          </div>

          <div className="borsht-decision-actions">
            <button
              className={`borsht-button borsht-button-confirm ${selectedCards.length !== selectCount ? 'disabled' : ''}`}
              onClick={handleSubmit}
              disabled={selectedCards.length !== selectCount}
            >
              Confirm Selection
            </button>
            <button
              className="borsht-button borsht-button-cancel"
              onClick={handleRandomSelection}
            >
              Random Selection
            </button>
            {hidePopup && (
              <button
                className="borsht-button borsht-action-button"
                onClick={hidePopup}
              >
                Hide Popup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShkvarkaSelectionPopup;