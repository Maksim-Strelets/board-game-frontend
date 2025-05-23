import React, { useState, useEffect } from 'react';

const SourCreamDefense = ({
  attacker,
  attackCard,
  targetCards,
  defendCards,
  expiresAt,
  onDefend,
  onDecline,
  hidePopup,
}) => {
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
            onDecline()
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  return (
    <div className="borsht-decision-popup-overlay">
      <div className="borsht-decision-popup">
        <div className="borsht-decision-popup-header">
          <div className="borsht-decision-popup-title">Defense Opportunity</div>
          <div className="borsht-decision-popup-message">
            Player {attacker} is attacking you with {attackCard?.name || 'a special card'}!
            Do you want to use your Sour Cream to defend?
          </div>
        </div>

        {timeRemaining > 0 && (
          <div className="borsht-decision-timer">
            Time remaining: {timeRemaining} seconds
          </div>
        )}

        <div className="borsht-defense-display">
          <div className="borsht-attack-flow">
            <div className="borsht-attacker-section">
              <div className="borsht-card-label">Attack Card:</div>
              <div
                className="borsht-card borsht-attack-card"
                style={{backgroundImage: `url('/games/borscht/cards/${attackCard?.id || 'red_pepper'}.png')`}}
              >
                <div className="borsht-selection-card-tooltip">
                  <strong>{attackCard?.name || 'Special Card'}</strong>
                  {attackCard?.effect_description ? (
                    <p>{attackCard.effect_description}</p>
                  ) : attackCard?.effect ? (
                    <p>Effect: {attackCard.effect}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="borsht-defense-arrow">→</div>

            <div className="borsht-target-cards-section">
              <div className="borsht-card-label">Target Cards:</div>
              <div className="borsht-target-cards">
                {targetCards && targetCards.length > 0 ? (
                  targetCards.map((card, index) => (
                    <div
                      key={index}
                      className="borsht-card"
                      style={{backgroundImage: `url('/games/borscht/cards/${card.id}.png')`}}
                    >
                      <div className="borsht-selection-card-tooltip">
                        <strong>{card.name || card.id}</strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="borsht-target-cards-empty">No specific cards targeted</div>
                )}
              </div>
            </div>
          </div>

          <div className="borsht-defense-section">
            <div className="borsht-card-label">Defense Card:</div>
            <div className="borsht-target-cards">
              {defendCards && defendCards.length > 0 ? (
                defendCards.map((card, index) => (
                  <div
                    key={index}
                    className="borsht-card borsht-defense-card"
                    style={{backgroundImage: `url('/games/borscht/cards/${card.id}.png')`}}
                  >
                    <div className="borsht-selection-card-tooltip">
                      <strong>{card.name || card.id}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <div className="borsht-target-cards-empty">No specific cards</div>
              )}
            </div>
          </div>
        </div>

        <div className="borsht-decision-actions">
          <button
            className="borsht-decision-action"
            onClick={onDefend}
            data-tooltip="Use your Sour Cream card to block this attack"
          >
            Use Sour Cream
          </button>

          <button
            className="borsht-decision-action cancel"
            onClick={onDecline}
            data-tooltip="Allow the attack to proceed"
          >
            Don't Defend
          </button>
          <button
           className="borsht-button borsht-action-button"
           onClick={hidePopup}
          >
            Hide Popup
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourCreamDefense;