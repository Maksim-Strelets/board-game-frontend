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

  const [totalSelected, setTotalSelected] = useState(0);

  useEffect(() => {
    // Calculate total selected tokens
    setTotalSelected(Object.values(selectedTokens).reduce((a, b) => a + b, 0));
  }, [selectedTokens]);

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

  return (
    <div className="splendor-popup-overlay">
      <div className="splendor-popup">
        <div className="splendor-popup-title">Return Tokens</div>
        <div className="splendor-popup-content">
          <p>You have too many tokens. Please return {tokensToReturn} tokens.</p>

          <div className="splendor-token-selection">
            {Object.entries(yourGems).map(([color, count]) => (
              count > 0 && (
                <div key={color} className="splendor-token-select-item">
                  <div className={`splendor-gem-token ${color}`}>
                    {count}
                  </div>
                  <div className="splendor-token-count">
                    <button
                      className="splendor-token-btn"
                      onClick={() => handleTokenDeselect(color)}
                      disabled={selectedTokens[color] <= 0}
                    >
                      -
                    </button>
                    <span className="splendor-selected-count">
                      {selectedTokens[color]}
                    </span>
                    <button
                      className="splendor-token-btn"
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

          <div className="splendor-token-summary">
            <p>Selected: {totalSelected} / {tokensToReturn}</p>
          </div>
        </div>

        <div className="splendor-popup-buttons">
          <button
            className="splendor-popup-button"
            onClick={handleSubmit}
            disabled={totalSelected !== tokensToReturn}
          >
            Return Tokens
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenReturnPopup;