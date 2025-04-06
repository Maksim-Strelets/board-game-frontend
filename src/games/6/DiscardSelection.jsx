import React, { useState, useEffect } from 'react';

const DiscardSelection = ({
  hand,
  discardCount,
  timeRemaining,
  onSubmit,
  onCancel
}) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [timer, setTimer] = useState(timeRemaining || 30);

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          // Auto-submit when timer reaches zero
          onSubmit(selectedCards);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedCards, onSubmit]);

  // Handle card selection/deselection
  const toggleCardSelection = (card) => {
    if (selectedCards.includes(card.id)) {
      setSelectedCards(prev => prev.filter(id => id !== card.id));
    } else {
      // Only allow selecting up to discardCount cards
      if (selectedCards.length < discardCount) {
        setSelectedCards(prev => [...prev, card.id]);
      }
    }
  };

  const handleSubmit = () => {
    // Check if correct number of cards are selected
    if (selectedCards.length === discardCount) {
      onSubmit(selectedCards);
    }
  };

  return (
    <div className="borsht-decision-popup-overlay">
      <div className="borsht-decision-popup">
        <div className="borsht-decision-popup-header">
          <div className="borsht-decision-popup-title">Too Many Cards!</div>
          <div className="borsht-decision-popup-message">
            Select {discardCount} card{discardCount !== 1 ? 's' : ''} to discard from your hand.
          </div>
          <div className="borsht-decision-timer">
            Time remaining: {timer} seconds
          </div>
        </div>

        <div className="borsht-decision-popup-content">
          <div className="borsht-discard-selection-cards">
            {hand.map((card) => (
              <div
                key={card.id}
                className={`borsht-card ${selectedCards.includes(card.id) ? 'selected' : ''}`}
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

          <div className="borsht-decision-actions">
            <button
              className={`borsht-button borsht-button-confirm ${selectedCards.length !== discardCount ? 'disabled' : ''}`}
              onClick={handleSubmit}
              disabled={selectedCards.length !== discardCount}
            >
              Discard Selected ({selectedCards.length}/{discardCount})
            </button>
            {onCancel && (
              <button
                className="borsht-button borsht-button-cancel"
                onClick={onCancel}
              >
                Random Selection
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscardSelection;