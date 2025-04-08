import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

const MarketDiscardSelection = ({ market, discardCount, expiresAt, onSubmit, onCancel }) => {
  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = expiresAt - now || 30; // Default

  const [selectedCards, setSelectedCards] = useState([]);
  const [timer, setTimer] = useState(timeRemaining || 30);
  const [timerInterval, setTimerInterval] = useState(null);

  // Set up timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-submit when time runs out
          onCancel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerInterval(interval);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [onCancel]);

  // Handle card selection
  const handleCardSelect = (card) => {
    if (selectedCards.some(c => c.uid === card.uid)) {
      setSelectedCards(prev => prev.filter(c => c.uid !== card.uid));
    } else {
      if (selectedCards.length < discardCount) {
        setSelectedCards(prev => [...prev, card]);
      }
    }
  };

  // Handle confirm button click
  const handleConfirm = () => {
    if (selectedCards.length === discardCount) {
      onSubmit(selectedCards.map(card => card.uid));
    }
  };

  return (
    <div className="borsht-decision-popup-overlay">
      <div className="borsht-decision-popup borsht-discard-popup">
        <div className="borsht-decision-popup-header">
          <div className="borsht-decision-popup-title">
            <AlertTriangle size={20} className="inline mr-2" />
            Market Limit Reached
          </div>
          <div className="borsht-decision-popup-message">
            Select {discardCount} card{discardCount !== 1 ? 's' : ''} to discard from the market
          </div>
        </div>

        <div className="borsht-decision-timer">
          Time remaining: {timer} seconds
        </div>

        <div className="borsht-discard-selection-cards">
          {market.map((card) => (
            <div
              key={card.uid}
              className={`borsht-card ${selectedCards.some(c => c.uid === card.uid) ? 'selected' : ''}`}
              onClick={() => handleCardSelect(card)}
              style={{ backgroundImage: `url('/games/borscht/cards/${card.id}.png')` }}
            >
              <div className="borsht-card-tooltip">
                <strong>{card.name || card.id}</strong>
                {card.type === 'special' && <p>{card.effect_description || card.effect}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="borsht-discard-counter">
          Selected: {selectedCards.length} / {discardCount}
        </div>

        <div className="borsht-selection-message">
          {selectedCards.length < discardCount
            ? `Please select ${discardCount - selectedCards.length} more card${discardCount - selectedCards.length !== 1 ? 's' : ''}`
            : 'Ready to discard selected cards'}
        </div>

        <div className="borsht-decision-actions">
          <button
            className={`borsht-button borsht-button-confirm ${selectedCards.length !== discardCount ? 'disabled' : ''}`}
            onClick={handleConfirm}
            disabled={selectedCards.length !== discardCount}
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

export default MarketDiscardSelection;