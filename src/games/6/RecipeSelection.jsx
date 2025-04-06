import React, { useState } from 'react';
import DecisionPopup from './DecisionPopup';
import './Game.css';

/**
 * Component for selecting a recipe at the start of the game
 *
 * @param {Object} props
 * @param {Array} props.recipeOptions - Array of recipe objects to choose from
 * @param {Function} props.onSelectRecipe - Callback function when recipe is selected
 * @param {number} props.timeRemaining - Time remaining for selection in seconds
 */
const RecipeSelection = ({ recipeOptions, onSelectRecipe, timeRemaining }) => {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [zoomed, setZoomed] = useState(null);

  const handleRecipeClick = (recipe) => {
    setSelectedRecipe(recipe.id);
  };

  const handleSubmit = () => {
    if (selectedRecipe) {
      onSelectRecipe(selectedRecipe);
    }
  };

  return (
    <DecisionPopup
      title="Choose Your Borsht Recipe"
      message="Select one of the three recipe cards below"
      showClose={false}
      className="borsht-recipe-selection"
    >
      <div className="borsht-recipe-selection-timer">
        Time remaining: {timeRemaining} seconds
      </div>

      <div className="borsht-recipe-options">
        {recipeOptions.map((recipe) => (
          <div
            key={recipe.id}
            className={`borsht-recipe-option ${selectedRecipe === recipe.id ? 'selected' : ''}`}
            onClick={() => handleRecipeClick(recipe)}
            onMouseEnter={() => setZoomed(recipe.id)}
            onMouseLeave={() => setZoomed(null)}
          >
            <div
              className="borsht-recipe-option-card"
              style={{backgroundImage: `url('/games/borscht/recipes/${recipe.id}_full.png')`}}
            >
            </div>
          </div>
        ))}
      </div>

      <div className="borsht-recipe-selection-actions">
        <button
          className="borsht-button"
          onClick={handleSubmit}
          disabled={!selectedRecipe}
        >
          Confirm Selection
        </button>
      </div>
    </DecisionPopup>
  );
};

export default RecipeSelection;