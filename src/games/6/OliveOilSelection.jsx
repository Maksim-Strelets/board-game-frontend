import React, { useState, useEffect } from 'react';

const OliveOilSelection = ({ cards, selectCount, onSubmit, onCancel, expiresAt }) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [timerInterval, setTimerInterval] = useState(null);

  // Setup timer
  useEffect(() => {
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeleft = expiresAt - now;
      setTimeRemaining(timeleft > 0 ? timeleft : 30); // Default to 30 seconds if no expiration

      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Auto submit on timeout
            onCancel();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerInterval(interval);

      return () => clearInterval(interval);
    }
  }, [expiresAt, onCancel]);

  const toggleCardSelection = (card) => {
    if (selectedCards.find(c => c.uid === card.uid)) {
      setSelectedCards(prev => prev.filter(c => c.uid !== card.uid));
    } else {
      if (selectedCards.length < selectCount) {
        setSelectedCards(prev => [...prev, card]);
      }
    }
  };

  const handleSubmit = () => {
    if (selectedCards.length === selectCount) {
      onSubmit(selectedCards.map(card => card.uid));
      if (timerInterval) clearInterval(timerInterval);
    }
  };

  const handleCancel = () => {
    onCancel();
    if (timerInterval) clearInterval(timerInterval);
  };

  return (
    <div className="borsht-decision-popup-overlay">
      <div className="borsht-decision-popup borsht-discard-popup">
        <div className="borsht-decision-popup-header">
          <h2 className="borsht-decision-popup-title">Olive Oil Effect</h2>
          <p className="borsht-decision-popup-message">
            Look at the top {cards.length} cards of the deck and select {selectCount} to keep.
          </p>
          <div className="borsht-discard-timer">Time remaining: {timeRemaining}s</div>
        </div>

        <div className="borsht-decision-popup-content">
          <div className="borsht-discard-counter">
            Selected: {selectedCards.length} / {selectCount}
          </div>

          <div className="borsht-discard-selection-cards">
            {cards.map((card) => (
              <div
                key={card.uid}
                className={`borsht-card ${selectedCards.find(c => c.uid === card.uid) ? 'selected' : ''}`}
                style={{backgroundImage: `url('/games/borscht/cards/${card.id}.png')`}}
                onClick={() => toggleCardSelection(card)}
              />
            ))}
          </div>

          <div className="borsht-selection-message">
            The remaining cards will be placed back on top of the deck.
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
              onClick={handleCancel}
            >
              Random Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OliveOilSelection;