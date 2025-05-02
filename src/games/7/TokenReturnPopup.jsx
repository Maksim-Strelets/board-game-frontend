import React, { useState, useEffect } from 'react';

const TokenReturnPopup = ({ tokensToReturn, yourGems, onSubmit }) => {
  const [selectedTokens, setSelectedTokens] = useState({
    white: 0,
    blue: 0,
    green: 0,
    red: 0,
    black: 0,
    gold: 0
  });

  // Track remaining tokens after selection
  const [remainingTokens, setRemainingTokens] = useState({...yourGems});
  const [totalSelected, setTotalSelected] = useState(0);

  useEffect(() => {
    // Calculate total selected tokens
    setTotalSelected(Object.values(selectedTokens).reduce((a, b) => a + b, 0));

    // Update remaining tokens
    const newRemaining = {};
    Object.keys(yourGems).forEach(color => {
      newRemaining[color] = yourGems[color] - selectedTokens[color];
    });
    setRemainingTokens(newRemaining);
  }, [selectedTokens, yourGems]);

  // Function to auto-select the required tokens based on a strategy
  const handleAutoSelect = () => {
    // Simple strategy: select the most abundant gems first
    const newSelection = { ...selectedTokens };
    let remaining = tokensToReturn;

    // Sort colors by quantity in descending order
    const colorsByQuantity = Object.entries(yourGems)
      .filter(([_, count]) => count > 0)
      .sort(([_, countA], [__, countB]) => countB - countA);

    // Prioritize regular gems over gold
    const regularColors = colorsByQuantity.filter(([color]) => color !== 'gold');
    const goldEntry = colorsByQuantity.find(([color]) => color === 'gold');

    const sortedColors = [...regularColors];
    if (goldEntry) sortedColors.push(goldEntry);

    // Reset all selections
    for (const color in newSelection) {
      newSelection[color] = 0;
    }

    // Select tokens
    for (const [color, available] of sortedColors) {
      if (remaining <= 0) break;

      const toSelect = Math.min(remaining, available);
      newSelection[color] = toSelect;
      remaining -= toSelect;
    }

    setSelectedTokens(newSelection);
  };

  const handleTokenSelect = (color) => {
    if (selectedTokens[color] < yourGems[color]) {
      if (totalSelected < tokensToReturn) {
        setSelectedTokens({
          ...selectedTokens,
          [color]: selectedTokens[color] + 1
        });
      }
    }
  };

  const handleTokenDeselect = (color) => {
    if (selectedTokens[color] > 0) {
      setSelectedTokens({
        ...selectedTokens,
        [color]: selectedTokens[color] - 1
      });
    }
  };

  const handleSubmit = () => {
    if (totalSelected === tokensToReturn) {
      onSubmit(selectedTokens);
    }
  };

  // Progress percentage for the visual indicator
  const progressPercentage = (totalSelected / tokensToReturn) * 100;

  return (
    <div className="splendor-popup-overlay">
      <div className="splendor-popup token-return-popup">
        <div className="splendor-popup-title">Return Tokens</div>
        <div className="splendor-popup-content">
          <p className="token-return-instruction">
            You have too many tokens. Please return {tokensToReturn} tokens to continue.
          </p>

          <div className="token-return-progress">
            <div className="token-return-progress-bar">
              <div
                className="token-return-progress-fill"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="token-return-progress-text">
              {totalSelected} of {tokensToReturn} selected
            </div>
          </div>

          <div className="token-return-selection">
            {Object.entries(yourGems).map(([color, count]) => (
              count > 0 && (
                <div key={color} className={`token-select-item ${selectedTokens[color] > 0 ? 'selected' : ''}`}>
                  <div className="token-color-info">
                    <div className={`splendor-gem-token ${color}`}>
                      <span className="token-available-count">{remainingTokens[color]}</span>
                    </div>
                    <div className="token-color-name">{color}</div>
                  </div>
                  <div className="token-count-controls">
                    <button
                      className="token-control-btn decrease"
                      onClick={() => handleTokenDeselect(color)}
                      disabled={selectedTokens[color] <= 0}
                    >
                      −
                    </button>
                    <span className="token-selected-count">
                      {selectedTokens[color]}
                    </span>
                    <button
                      className="token-control-btn increase"
                      onClick={() => handleTokenSelect(color)}
                      disabled={selectedTokens[color] >= yourGems[color] || totalSelected >= tokensToReturn}
                    >
                      +
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>

          <div className="token-return-actions">
            <button
              className="token-auto-select-btn"
              onClick={handleAutoSelect}
              disabled={totalSelected === tokensToReturn}
            >
              Auto-Select
            </button>
            <button
              className="token-reset-btn"
              onClick={() => setSelectedTokens({
                white: 0, blue: 0, green: 0, red: 0, black: 0, gold: 0
              })}
              disabled={totalSelected === 0}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="splendor-popup-buttons">
          <button
            className="splendor-popup-button"
            onClick={handleSubmit}
            disabled={totalSelected !== tokensToReturn}
          >
            {totalSelected === tokensToReturn ? 'Return Tokens' : `Select ${tokensToReturn - totalSelected} More`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenReturnPopup;
