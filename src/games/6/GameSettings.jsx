import React from 'react';

const GameSettings = ({ settings = {}, onSettingsChange }) => {
  // Define default values
  const defaultSettings = {
    disposable_shkvarka_count: 0,
    permanent_shkvarka_count: 0,
    general_player_select_timeout: 300,
    player_hand_limit: 8,
    borscht_recipes_select_count: 8,
    market_capacity: 8,
  };

  // Merge provided settings with defaults
  const mergedSettings = {
    ...defaultSettings,
    ...settings
  };

  // Helper function to handle slider changes
  const handleSliderChange = (field, value) => {
    onSettingsChange({ [field]: value });
  };

  // Helper function to handle numeric input changes
  const handleNumberChange = (field, value) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      onSettingsChange({ [field]: numValue });
    }
  };

  // Function to handle hand limit special case (can be "inf")
  const getplayer_hand_limitLabel = (value) => {
    return value === Infinity ? "∞" : value.toString();
  };

  // Convert "inf" display value to actual Infinity value
  const handleplayer_hand_limitChange = (value) => {
    const numValue = parseInt(value, 10);
    onSettingsChange({ player_hand_limit: numValue });
  };

  return (
    <div className="game-settings">
      <div className="settings-grid">
        {/* Disposable Shkvarka Slider */}
        <div className="setting-item">
          <label>
            Disposable Shkvarka's
            <span className="value-display">{mergedSettings.disposable_shkvarka_count}</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px', fontSize: '12px' }}>0</span>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={mergedSettings.disposable_shkvarka_count}
              onChange={(e) => handleSliderChange('disposable_shkvarka_count', parseInt(e.target.value, 10))}
            />
            <span style={{ marginLeft: '8px', fontSize: '12px' }}>10</span>
          </div>
        </div>

        {/* Permanent Shkvarka Slider */}
        <div className="setting-item">
          <label>
            Permanent Shkvarka's
            <span className="value-display">{mergedSettings.permanent_shkvarka_count}</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px', fontSize: '12px' }}>0</span>
            <input
              type="range"
              min="0"
              max="6"
              step="1"
              value={mergedSettings.permanent_shkvarka_count}
              onChange={(e) => handleSliderChange('permanent_shkvarka_count', parseInt(e.target.value, 10))}
            />
            <span style={{ marginLeft: '8px', fontSize: '12px' }}>6</span>
          </div>
        </div>

        {/* Waiting Timeout Input */}
        <div className="setting-item">
          <label>
            Waiting Timeout (seconds)
            <span className="value-display">{mergedSettings.general_player_select_timeout}</span>
          </label>
          <input
            type="number"
            min="30"
            max="900"
            value={mergedSettings.general_player_select_timeout}
            onChange={(e) => handleNumberChange('general_player_select_timeout', e.target.value)}
          />
        </div>

        {/* Recipes count Slider */}
        <div className="setting-item">
          <label>
            Recipe Select Count
            <span className="value-display">{mergedSettings.player_hand_limit === Infinity ? "∞" : mergedSettings.player_hand_limit}</span>
          </label>
          <select
            value={mergedSettings.player_hand_limit}
            onChange={(e) => {
              const val = e.target.value === "inf" ? Infinity : parseInt(e.target.value, 10);
              handleSliderChange('player_hand_limit', val);
            }}
          >
            {[3, 4, 5, 6, 7, 8, 9, 10, 12].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
            <option value="inf">∞</option>
          </select>
        </div>

        {/* Hand Limit Slider */}
        <div className="setting-item">
          <label>
            Hand Limit
            <span className="value-display">{mergedSettings.player_hand_limit === Infinity ? "∞" : mergedSettings.player_hand_limit}</span>
          </label>
          <select
            value={mergedSettings.player_hand_limit}
            onChange={(e) => {
              const val = e.target.value === "inf" ? Infinity : parseInt(e.target.value, 10);
              handleSliderChange('player_hand_limit', val);
            }}
          >
            {[3, 4, 5, 6, 7, 8, 9, 10, 12].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
            <option value="inf">∞</option>
          </select>
        </div>

        {/* Market Limit Slider */}
        <div className="setting-item">
          <label>
            Market Limit
            <span className="value-display">{mergedSettings.market_capacity}</span>
          </label>
          <select
            value={mergedSettings.market_capacity}
            onChange={(e) => handleSliderChange('market_capacity', parseInt(e.target.value, 10))}
          >
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default GameSettings;