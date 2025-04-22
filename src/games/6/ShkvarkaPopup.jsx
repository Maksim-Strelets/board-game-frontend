import React from 'react';
import './ShkvarkaPopup.css';

const ShkvarkaPopup = ({ card, player, onClose }) => {
  if (!card) return null;

  return (
    <div className="shkvarka-popup-overlay" onClick={onClose}>
      <div className="shkvarka-popup" onClick={(e) => e.stopPropagation()}>
        <div className="shkvarka-popup-header">
          <h3>Shkvarka Card Drawn!</h3>
        </div>
        <button className="shkvarka-popup-close" onClick={onClose}>×</button>

        <div className="shkvarka-popup-content">
          <div className="shkvarka-popup-player">
            {player?.user_data?.username || 'A player'} has drawn:
          </div>
          <div className="shkvarka-popup-card-container">
            <div
              className="shkvarka-popup-card"
              style={{backgroundImage: `url('/games/borscht/shkvarka/${card.id}.png')`}}
            />
            <div className="shkvarka-popup-card-info">
              <h4>{card.name || card.id}</h4>
              <p>{card.description || 'A special card with effects!'}</p>
            </div>
          </div>
        </div>

        <div className="shkvarka-popup-footer">
          <button className="shkvarka-popup-button" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default ShkvarkaPopup;