import React, { useState, useEffect } from 'react';

// Component for selecting cards from the discard pile when Cinnamon card is played
const CinnamonSelection = ({
  discard_pile,
  selectCount,
  expiresAt,
  onSubmit,
  onCancel
}) => {
  // Ensure discard_pile is always an array
  const discardPile = Array.isArray(discard_pile) ? discard_pile : [];
  const [selectedCards, setSelectedCards] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(30);

  // Set up timer when component mounts
  useEffect(() => {
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeleft = Math.max(0, expiresAt - now);
      setTimeRemaining(timeleft);

      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  // Handle card selection
  const handleCardSelect = (card) => {
    if (selectedCards.some(c => c.uid === card.uid)) {
      // Remove card if already selected
      setSelectedCards(prev => prev.filter(c => c.uid !== card.uid));
    } else {
      // Add card if not selected and we haven't reached the limit
      if (selectedCards.length < selectCount) {
        setSelectedCards(prev => [...prev, card]);
      }
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    onSubmit(selectedCards.map(card => card.uid));
  };

  return (
    <div className="borsht-decision-popup-overlay">
      <div className="borsht-decision-popup borsht-discard-popup">
        <div className="borsht-decision-popup-header">
          <div className="borsht-decision-popup-title">Cinnamon Effect</div>
          <div className="borsht-decision-popup-message">
            Select up to {selectCount} card{selectCount !== 1 ? 's' : ''} from the discard pile
          </div>
        </div>

        {timeRemaining > 0 && (
          <div className="borsht-decision-timer">
            Time remaining: {timeRemaining} seconds
          </div>
        )}

        <div className="borsht-discard-counter">
          Selected: {selectedCards.length} / {selectCount}
        </div>

        <div className="borsht-discard-selection-cards">
          {discardPile && discardPile.length > 0 ? (
            discardPile.map((card) => (
              <div
                key={card.uid}
                className={`borsht-card ${selectedCards.some(c => c.uid === card.uid) ? 'selected' : ''}`}
                onClick={() => handleCardSelect(card)}
                style={{backgroundImage: `url('/games/borscht/cards/${card.id}.png')`}}
              >
                <div className="borsht-card-tooltip">
                  <strong>{card.name || card.id}</strong>
                  {card.type === 'special' && <p>{card.effect_description || card.effect}</p>}
                </div>
              </div>
            ))
          ) : (
            <div className="borsht-empty-pot">Discard pile is empty</div>
          )}
        </div>

        <div className="borsht-decision-actions">
          <button
            className={`borsht-button borsht-button-confirm ${selectedCards.length === 0 ? 'disabled' : ''}`}
            onClick={handleSubmit}
            disabled={selectedCards.length === 0}
          >
            Confirm Selection
          </button>
          <button
            className="borsht-button borsht-button-cancel"
            onClick={onCancel}
          >
            Random Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default CinnamonSelection;