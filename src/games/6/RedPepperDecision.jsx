import React from 'react';

const RedPepperDecision = ({
  targetPlayer,
  targetCard,
  playerRecipe,
  playerBorsht,
  onSelect,
  onCancel
}) => {
  // Check if card can be stolen (in recipe but not already in borsht)
  const canSteal = () => {
    // If no recipe or no ingredients data, can't steal
    if (!playerRecipe || !playerRecipe.ingredients) return false;

    // If the card is already in player's borsht, can't steal
    if (playerBorsht && playerBorsht.some(card => card.id === targetCard.id)) {
      return false;
    }

    // can steal extras
    if ( targetCard.type === "extra" ) { return true; }

    // Check if card is in recipe ingredients
    return playerRecipe.ingredients.some(ingredient =>
      ingredient.toLowerCase() === targetCard.id.toLowerCase()
    );
  };

  const isStealable = canSteal();

  return (
    <div className="borsht-decision-popup-overlay">
      <div className="borsht-decision-popup">
        <div className="borsht-decision-popup-header">
          <div className="borsht-decision-popup-title">Red Pepper Effect</div>
          <div className="borsht-decision-popup-message">
            Choose action for the selected card from Player {targetPlayer}
          </div>
        </div>

        <div className="borsht-target-card-preview">
          <div
            className="borsht-card"
            style={{backgroundImage: `url('/games/borscht/cards/${targetCard.id}.png')`}}
          />
        </div>

        <div className="borsht-decision-options">
          <button
            className={`borsht-decision-action ${!isStealable ? 'disabled' : ''}`}
            onClick={() => isStealable && onSelect('steal')}
            disabled={!isStealable}
            data-tooltip={!isStealable ?
              playerBorsht && playerBorsht.some(card => card.id === targetCard.id) ?
                "You already have this ingredient in your borsht" :
                "This ingredient is not in your recipe" :
              "Steal this card and add it to your borsht"
            }
          >
            Steal Card
          </button>

          <button
            className="borsht-decision-action"
            onClick={() => onSelect('discard')}
            data-tooltip="Remove this card from the opponent's borsht"
          >
            Discard Card
          </button>

          <button
            className="borsht-decision-action cancel"
            onClick={onCancel}
            data-tooltip="Cancel and keep the Red Pepper card in your hand"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedPepperDecision;