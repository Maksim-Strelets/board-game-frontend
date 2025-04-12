import React, { useState } from 'react';

const BlackPepperDecision = ({
  players,
  currentPlayerId,
  firstFinisher,
  onSelect,
  onCancel,
  hidePopup,
}) => {
  const [effectChoice, setEffectChoice] = useState(null);
  const [selectedCards, setSelectedCards] = useState({});

  // Filter out current player and first finisher (if any)
  const targetPlayers = Object.entries(players || {}).filter(([playerId, _]) => {
    return parseInt(playerId) !== currentPlayerId && parseInt(playerId) !== firstFinisher.user_id;
  });

  const handleCardSelect = (playerId, cardUid) => {
    setSelectedCards(prev => {
      const newSelection = { ...prev };
      newSelection[parseInt(playerId)] = cardUid;
      return newSelection;
    });
  };

  const handleConfirm = () => {
    if (effectChoice === 'discard') {
      // For discard effect, we need to have selected one card from each player's borsht
      if (Object.keys(selectedCards).length !== targetPlayers.length) {
        alert('Please select one card from each player\'s borsht');
        return;
      }
      onSelect(effectChoice, selectedCards);
    } else if (effectChoice === 'steal') {
      // For take effect, we don't need to select specific cards (random are taken)
      onSelect(effectChoice);
    }
  };

  return (
    <div className="borsht-decision-popup-overlay">
      <div className="borsht-decision-popup">
        <div className="borsht-decision-popup-header">
          <div className="borsht-decision-popup-title">Black Pepper Effect</div>
          <div className="borsht-decision-popup-message">
            Choose which effect to apply
          </div>
        </div>

        {!effectChoice ? (
          <div className="borsht-decision-options">
            <button
              className="borsht-decision-action"
              onClick={() => setEffectChoice('discard')}
              data-tooltip="Forces each opponent to discard one ingredient card from their borsht"
            >
              Discard From Borsht
            </button>

            <button
              className="borsht-decision-action"
              onClick={() => setEffectChoice('steal')}
              data-tooltip="Take one random card from each opponent's hand"
            >
              Take From Hand
            </button>

            <button
              className="borsht-decision-action cancel"
              onClick={onCancel}
              data-tooltip="Cancel and keep the Black Pepper card in your hand"
            >
              Cancel
            </button>
          </div>
        ) : effectChoice === 'discard' ? (
          <>
            <div className="borsht-decision-subtitle">
              Select one card from each player's borsht to discard
            </div>
            {targetPlayers.length === 0 ? (
              <div className="borsht-selection-message">No eligible players to target</div>
            ) : (
              <div className="borsht-player-borshts">
                {targetPlayers.map(([playerId, playerData]) => (
                  <div key={playerId} className="borsht-player-borsht-selection">
                    <div className="borsht-player-name">Player {playerId}</div>
                    <div className="borsht-borsht-container">
                      {playerData.borsht && playerData.borsht.length > 0 ? (
                        playerData.borsht.map((card) => (
                          <div
                            key={card.uid}
                            className={`borsht-card ${selectedCards[playerId] === card.uid ? 'selected' : ''}`}
                            style={{backgroundImage: `url('/games/borscht/cards/${card.id}.png')`}}
                            onClick={() => handleCardSelect(playerId, card.uid)}
                          >
                            <div className="borsht-card-tooltip">
                              <strong>{card.name || card.id}</strong>
                              {card.effect_description && <p>{card.effect_description}</p>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="borsht-empty-pot">No ingredients</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="borsht-decision-actions">
              <button
                className={`borsht-decision-action ${targetPlayers.length === 0 || Object.keys(selectedCards).length !== targetPlayers.length ? 'disabled' : ''}`}
                onClick={handleConfirm}
                disabled={targetPlayers.length === 0 || Object.keys(selectedCards).length !== targetPlayers.length}
              >
                Confirm Selection
              </button>
              <button
                className="borsht-decision-action cancel"
                onClick={() => setEffectChoice(null)}
              >
                Back
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="borsht-decision-subtitle">
              Take one random card from each opponent's hand
            </div>
            <div className="borsht-players-summary">
              {targetPlayers.map(([playerId, playerData]) => (
                <div key={playerId} className="borsht-player-summary">
                  <div className="borsht-player-name">Player {playerId}</div>
                  <div className="borsht-player-stat">Cards in hand: {playerData.hand_size || 0}</div>
                </div>
              ))}
            </div>

            <div className="borsht-decision-actions">
              <button
                className={`borsht-decision-action ${targetPlayers.length === 0 ? 'disabled' : ''}`}
                onClick={handleConfirm}
                disabled={targetPlayers.length === 0}
              >
                Confirm
              </button>
              <button
                className="borsht-decision-action cancel"
                onClick={() => setEffectChoice(null)}
              >
                Back
              </button>
            </div>
          </>
        )}

        <button
          className="borsht-button borsht-action-button"
          onClick={hidePopup}
        >
          Hide Popup
        </button>
      </div>
    </div>
  );
};

export default BlackPepperDecision;