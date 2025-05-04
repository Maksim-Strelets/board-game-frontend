import React, { useState } from 'react';

const NobleSelectionPopup = ({ nobles, onSelect }) => {
  const [selectedNoble, setSelectedNoble] = useState(null);
  const [isZoomed, setIsZoomed] = useState(null);

  const handleSelectNoble = (noble) => {
    setSelectedNoble(noble.id);
  };

  const handleSubmit = () => {
    if (selectedNoble) {
      onSelect(selectedNoble);
    }
  };

  return (
    <div className="splendor-popup-overlay">
      <div className="splendor-popup">
        <div className="splendor-popup-title">Select a Noble</div>
        <div className="splendor-popup-content">
          <div className="splendor-noble-selection">
            {nobles.map((noble, idx) => (
              <div
                key={`${noble.id}-${idx}`}
                className={`splendor-noble-tile ${selectedNoble === noble.id ? 'selected' : ''}`}
                onClick={() => handleSelectNoble(noble)}
                onMouseEnter={() => setIsZoomed(noble.id)}
                onMouseLeave={() => setIsZoomed(null)}
                style={{
                  cursor: 'pointer',
                  border: selectedNoble === noble.id ? '2px solid #ffc107' : '1px solid #dee2e6',
                  transform: selectedNoble === noble.id ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s'
                }}
              >
                  {/* Vertical tooltip on the left */}
                  <div className="splendor-noble-tooltip vertical-tooltip">
                    <div className="splendor-noble-requirements vertical">
                      {Object.entries(noble.requirements || {}).map(([color, amount]) => (
                        amount > 0 && (
                          <div key={color} className={`splendor-requirement-token ${color}`}>
                            {amount}
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                {noble.points && <div className="splendor-noble-points">{noble.points}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="splendor-popup-buttons">
          <button
            className="splendor-popup-button"
            onClick={handleSubmit}
            disabled={!selectedNoble}
          >
            Select Noble
          </button>
        </div>
      </div>
    </div>
  );
};

export default NobleSelectionPopup;